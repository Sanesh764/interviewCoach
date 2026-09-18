import { bedrockClient, AWS_CONFIG, getBedrockModelChain, verifyAwsConfiguration } from '../../config/awsConfig.js';
import { invokeBedrockModel } from './modelAdapters.js';

/**
 * Classifies whether an AWS Bedrock error is eligible for fallback to another model.
 * Eligible: Quota limits, rate limits, throttling, transient service unavailabilities,
 * AND model output failures (malformed JSON, truncated output, schema invalid).
 */
export const isFallbackEligible = (error) => {
  if (!error) return false;
  const name = error.name || '';
  const msg = (error.message || '').toLowerCase();
  const status = error.statusCode || error.$metadata?.httpStatusCode;

  // Model output failures (malformed JSON, truncated output, schema-invalid)
  if (
    error.isModelOutputError ||
    name === 'ModelOutputValidationException' ||
    name === 'JsonParseException' ||
    msg.includes('failed to parse structured json') ||
    msg.includes('malformed') ||
    msg.includes('truncated') ||
    msg.includes('schema-invalid') ||
    msg.includes('schema validation failed')
  ) {
    return true;
  }

  if (
    name === 'ThrottlingException' ||
    name === 'ServiceQuotaExceededException' ||
    name === 'TooManyRequestsException' ||
    name === 'ModelNotReadyException' ||
    name === 'ModelTimeoutException' ||
    name === 'ServiceUnavailableException' ||
    name === 'InternalServerException' ||
    status === 429 ||
    status === 503
  ) {
    return true;
  }

  if (
    msg.includes('too many tokens per day') ||
    msg.includes('throttled') ||
    msg.includes('rate exceeded') ||
    msg.includes('quota exceeded') ||
    msg.includes('capacity exceeded') ||
    msg.includes('service unavailable') ||
    msg.includes('server is busy') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('inference profile') ||
    msg.includes('on-demand throughput')
  ) {
    return true;
  }

  return false;
};

/**
 * Classifies whether an AWS error is a non-fallback error (IAM, bad credentials, invalid model ID, code bug).
 * These must FAIL FAST without masking or silently cycling models.
 */
export const isNonFallbackError = (error) => {
  if (!error) return false;
  const name = error.name || '';
  const msg = (error.message || '').toLowerCase();

  // Model output errors are fallback-eligible, NEVER non-fallback
  if (error.isModelOutputError || name === 'ModelOutputValidationException') {
    return false;
  }

  // Programming errors (TypeError, ReferenceError, RangeError) must FAIL FAST without masking
  if (
    error instanceof TypeError ||
    error instanceof ReferenceError ||
    error instanceof RangeError
  ) {
    return true;
  }

  // If a model is not supported with on-demand throughput in this region, allow fallback to next model!
  if (msg.includes('inference profile') || msg.includes('on-demand throughput')) {
    return false;
  }

  if (
    name === 'AccessDeniedException' ||
    name === 'UnauthorizedException' ||
    name === 'UnrecognizedClientException' ||
    name === 'InvalidSignatureException' ||
    name === 'ValidationException' ||
    name === 'ResourceNotFoundException'
  ) {
    return true;
  }

  if (
    msg.includes('is not authorized') ||
    msg.includes('security token') ||
    msg.includes('credentials') ||
    msg.includes('resourcenotfound') ||
    msg.includes('model identifier is invalid')
  ) {
    return true;
  }

  return false;
};

// Helper for jittered exponential backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust JSON extraction and validation helper.
 * Uses hierarchical extraction strategies:
 * 1. Direct parse (fastest & handles nested markdown fences safely)
 * 2. Outer markdown fence stripping
 * 3. Outermost brace isolation ({ ... })
 * 4. Trailing comma cleanup
 */
export const parseJsonResponse = (text, validatorFn = null) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Received empty or non-string response from AI model.');
  }

  const trimmed = text.trim();
  let parsed = null;

  // Strategy 1: Direct JSON parse
  try {
    parsed = JSON.parse(trimmed);
  } catch (_) {}

  // Strategy 2: Strip outer markdown fences
  if (!parsed) {
    try {
      const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(unfenced);
    } catch (_) {}
  }

  // Strategy 3: Outermost { ... } extraction
  if (!parsed) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const substring = trimmed.substring(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(substring);
      } catch (_) {}

      // Strategy 4: Trailing comma cleanup
      if (!parsed) {
        try {
          const withoutTrailingCommas = substring.replace(/,\s*([}\]])/g, '$1');
          parsed = JSON.parse(withoutTrailingCommas);
        } catch (_) {}
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Failed to parse structured JSON from Bedrock response: ${trimmed.substring(0, 150)}...`);
  }

  if (validatorFn) {
    const vErr = validatorFn(parsed);
    if (vErr) {
      throw new Error(`Schema validation failed: ${vErr}`);
    }
  }

  return parsed;
};

/**
 * Sequential Multi-Model Bedrock Fallback Router
 *
 * Sequence:
 *   Claude 3 Haiku (Primary)
 *         ↓ (if throttled/quota/output failure, after 1 jittered retry)
 *   Amazon Nova Lite (Fallback 1)
 *         ↓ (if throttled/quota/output failure, after 1 jittered retry)
 *   Google Gemma 3 27B (Fallback 2)
 *
 * Enforces:
 *   - Zero parallel calls under normal conditions (single active model).
 *   - Response normalization + JSON parsing + schema validation included in model attempt.
 *   - Model output errors (malformed, truncated, schema-invalid) trigger sequential fallback.
 *   - Immediate fail-fast for IAM / Credential / Validation / Model ID bugs / Programming errors.
 *   - Tracks modelUsed, usage tokens, stopReason, and latency across attempts.
 */
export const callBedrockRouter = async (
  promptOrOptions,
  systemPrompt = '',
  maxTokens = 1000,
  temperature = 0.5,
  customClient = null,
  validatorFn = null
) => {
  verifyAwsConfiguration('Amazon Bedrock');

  let prompt;
  let client;
  let validator;
  let tokens;
  let temp;
  let sysPrompt;

  if (typeof promptOrOptions === 'object' && promptOrOptions !== null && !Array.isArray(promptOrOptions)) {
    prompt = promptOrOptions.prompt;
    sysPrompt = promptOrOptions.systemPrompt ?? systemPrompt ?? '';
    tokens = promptOrOptions.maxTokens ?? maxTokens ?? 1000;
    temp = promptOrOptions.temperature ?? temperature ?? 0.5;
    client = promptOrOptions.client ?? promptOrOptions.customClient ?? customClient ?? bedrockClient;
    validator = promptOrOptions.validatorFn ?? promptOrOptions.validator ?? validatorFn;
  } else {
    prompt = promptOrOptions;
    client = customClient || bedrockClient;
    validator = validatorFn;
    tokens = maxTokens;
    temp = temperature;
    sysPrompt = systemPrompt;
  }

  const modelChain = getBedrockModelChain();
  const attemptHistory = [];

  for (let i = 0; i < modelChain.length; i++) {
    const modelId = modelChain[i];
    const isLastModel = i === modelChain.length - 1;

    // Up to 2 attempts on the same model (initial attempt + 1 short jittered retry for transient/output errors)
    for (let modelAttempt = 1; modelAttempt <= 2; modelAttempt++) {
      const startTime = Date.now();
      try {
        console.log(`[AI Router] Attempting model: ${modelId} (model attempt ${modelAttempt})`);

        const result = await invokeBedrockModel(client, modelId, {
          prompt,
          systemPrompt: sysPrompt,
          maxTokens: tokens,
          temperature: temp,
        });

        // Inspect stopReason to determine if output was truncated
        const isTruncated = result.stopReason === 'max_tokens' || result.stopReason === 'length';
        if (isTruncated) {
          console.warn(
            `[AI Router] Warning: Model ${modelId} reached maxTokens limit (${tokens}). stopReason: "${result.stopReason}". Model output may be truncated.`
          );
        }

        // Response normalization + JSON parsing + schema validation
        let parsed = null;
        if (validator !== null && validator !== false) {
          try {
            parsed = parseJsonResponse(result.text, typeof validator === 'function' ? validator : null);
          } catch (parseError) {
            // Check if validatorFn itself threw a programming error (e.g. TypeError)
            if (
              parseError instanceof TypeError ||
              parseError instanceof ReferenceError ||
              parseError instanceof RangeError
            ) {
              throw parseError; // Re-throw programming error so it fails fast
            }

            const validationErr = new Error(
              `Model ${modelId} produced ${isTruncated ? 'truncated' : 'malformed/schema-invalid'} structured JSON: ${parseError.message}`
            );
            validationErr.name = 'ModelOutputValidationException';
            validationErr.isModelOutputError = true;
            validationErr.modelId = modelId;
            validationErr.stopReason = result.stopReason;
            validationErr.rawText = result.text;
            validationErr.originalError = parseError;
            throw validationErr;
          }
        }

        console.log(
          `[AI Router] Model ${modelId} succeeded (latency: ${result.latencyMs}ms, tokens: ${result.usage?.totalTokens ?? 0})`
        );

        attemptHistory.push({
          modelId,
          success: true,
          latencyMs: result.latencyMs,
          usage: result.usage,
          stopReason: result.stopReason || null,
        });

        return {
          text: result.text,
          parsed,
          modelUsed: modelId,
          usage: result.usage,
          latencyMs: result.latencyMs,
          stopReason: result.stopReason || null,
          attemptHistory,
        };
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error(`[AI Router] Model ${modelId} attempt ${modelAttempt} failed:`, error.name || error.message);

        attemptHistory.push({
          modelId,
          success: false,
          errorName: error.name,
          errorMessage: error.message,
          latencyMs,
          stopReason: error.stopReason || null,
        });

        // 1. Check for non-fallback errors (IAM, credentials, bad model ID, client request validation, programming errors)
        if (isNonFallbackError(error)) {
          console.error(
            `[AI Router] Fatal non-fallback error encountered on ${modelId} (${error.name || error.message}). Aborting routing immediately.`
          );
          if (
            error instanceof TypeError ||
            error instanceof ReferenceError ||
            error instanceof RangeError
          ) {
            throw error; // Preserve original programming error
          }
          const fatalErr = new Error('AI interview service is temporarily unavailable. Please try again later.');
          fatalErr.statusCode = 503;
          fatalErr.name = error.name || 'ServiceUnavailable';
          fatalErr.originalError = error;
          throw fatalErr;
        }

        // 2. Check if error is eligible for fallback (quota, throttling, 503, OR model output validation failure)
        if (!isFallbackEligible(error)) {
          console.error(`[AI Router] Non-eligible error encountered on ${modelId}:`, error);
          throw error;
        }

        // 3. If modelAttempt === 1 and error is eligible, execute 1 short retry with jitter
        if (modelAttempt === 1) {
          const jitterMs = 200 + Math.floor(Math.random() * 150);
          console.log(
            `[AI Router] Retryable error on ${modelId} (${error.name || error.message}). Retrying once in ${jitterMs}ms...`
          );
          await sleep(jitterMs);
          continue;
        }

        // 4. Model failed twice with retryable/fallback error
        if (!isLastModel) {
          const nextModelId = modelChain[i + 1];
          console.warn(
            `[AI Router] Model ${modelId} attempts exhausted (${error.name || error.message}). Transitioning to fallback model: ${nextModelId}`
          );
          break; // Break inner retry loop to proceed to next model in chain
        } else {
          console.error(`[AI Router] All models in the fallback chain have been exhausted.`);
        }
      }
    }
  }

  // All models in the chain failed
  const finalError = new Error(
    'AI interview service is temporarily unavailable because the AI provider has reached its current usage limit or failed validation across all fallback models. Please try again later.'
  );
  finalError.statusCode = 429;
  finalError.name = 'ThrottlingException';
  finalError.attempts = attemptHistory;
  throw finalError;
};

// Aliased helper matching existing call signature
export const callBedrock = async (prompt, systemPrompt = '', maxTokens = 1000, temperature = 0.5) => {
  const result = await callBedrockRouter(prompt, systemPrompt, maxTokens, temperature);
  return result.text;
};

// ==========================================
// 1. Analyze Resume
// ==========================================
export const analyzeResume = async (rawText, customClient = null) => {
  const compactText = (rawText || '').substring(0, 3000);

  const prompt = `You are an expert technical recruiter and resume analyzer.
Analyze the following resume text and extract the key structured information.
Return ONLY a valid JSON object in this exact schema:
{
  "skills": ["Skill 1", "Skill 2"],
  "projects": ["Brief description of Project 1", "Brief description of Project 2"],
  "technologies": ["Tech 1", "Tech 2"],
  "experience": ["Company/Role 1", "Company/Role 2"],
  "education": ["Degree/University"]
}

Resume Text:
${compactText}
`;

  const routerResult = await callBedrockRouter(
    prompt,
    'You are a precise technical resume extractor. Output valid JSON only with no conversational text.',
    1000,
    0.3,
    customClient,
    (data) => {
      if (!Array.isArray(data.skills)) return 'Missing "skills" array';
      return null;
    }
  );

  return {
    ...routerResult.parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
      stopReason: routerResult.stopReason,
    },
  };
};

// ==========================================
// 2. Analyze Job Description
// ==========================================
export const analyzeJobDescription = async (jdText, customClient = null) => {
  const prompt = `You are a technical hiring manager.
Analyze the following Job Description (JD) and extract the core requirements and keywords.
Return ONLY a valid JSON object in this exact schema:
{
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 1"],
  "technologies": ["Tech 1", "Tech 2"],
  "responsibilities": ["Responsibility 1", "Responsibility 2"],
  "experienceRequirements": "Summary of expected years/level"
}

Job Description:
${jdText}
`;

  const routerResult = await callBedrockRouter(
    prompt,
    'You are an expert hiring manager analyzing job descriptions. Output valid JSON only.',
    1000,
    0.3,
    customClient,
    (data) => {
      if (!Array.isArray(data.requiredSkills)) return 'Missing "requiredSkills" array';
      return null;
    }
  );

  return {
    ...routerResult.parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
      stopReason: routerResult.stopReason,
    },
  };
};

// ==========================================
// 3. Generate Interview Question (with optional inline JD analysis)
// ==========================================
export const generateInterviewQuestion = async ({
  role,
  experienceLevel,
  personality = 'professional',
  resumeData = null,
  jobDescription = '',
  jobDescriptionAnalysis = null,
  questionNumber = 1,
  totalQuestions = 5,
  previousQAs = [],
  customClient = null,
}) => {
  const personalityInstructions = {
    friendly: 'Adopt a supportive, warm, and encouraging tone, putting the candidate at ease.',
    professional: 'Maintain a formal, objective, and realistic corporate interviewer tone.',
    strict: 'Adopt a rigorous, skeptical, and challenging interviewer tone, demanding precise technical depth.',
  };

  const hasJD = !!(jobDescription && jobDescription.trim());
  const compactJD = hasJD ? jobDescription.trim().substring(0, 800) : '';

  const prompt = `You are an expert interviewer conducting a job interview.
Interview Context:
- Target Role: ${role}
- Experience Level: ${experienceLevel}
- Interviewer Personality: ${personality} (${personalityInstructions[personality] || personalityInstructions.professional})
- Progress: Question ${questionNumber} of ${totalQuestions}

${
  resumeData
    ? `- Candidate Resume Context:
   Extracted Skills: ${resumeData.skills?.slice(0, 10).join(', ') || 'N/A'}
   Extracted Projects: ${resumeData.projects?.slice(0, 3).join('; ') || 'N/A'}
   Extracted Technologies: ${resumeData.technologies?.slice(0, 10).join(', ') || 'N/A'}`
    : '- No resume provided.'
}

${
  jobDescriptionAnalysis
    ? `- Target Job Description Context:
   Required Skills: ${jobDescriptionAnalysis.requiredSkills?.slice(0, 8).join(', ') || 'N/A'}
   Core Technologies: ${jobDescriptionAnalysis.technologies?.slice(0, 8).join(', ') || 'N/A'}`
    : hasJD
    ? `- Target Job Description Text:
   ${compactJD}`
    : '- No specific Job Description provided.'
}

${
  previousQAs.length > 0
    ? `- Previous Questions and Candidate Answers in this session:
${previousQAs
  .map(
    (qa, idx) =>
      `Q${idx + 1} (${qa.category}): "${qa.question}"\nCandidate Answer: "${qa.answer || qa.transcript || 'No answer'}"`
  )
  .join('\n\n')}`
    : '- This is the first question of the interview.'
}

Instructions:
1. Do NOT repeat or overlap questions already asked.
2. For Question 1, start with an appropriate opening question (e.g. behavioral/introductory or foundational for the role).
3. For middle questions, ask specific technical questions or deep project questions referencing technologies from the resume or JD.
4. Adapt the phrasing according to the selected personality (${personality}).
${hasJD && !jobDescriptionAnalysis ? '5. Also extract the structured JD requirements into "jobDescriptionAnalysis".' : ''}

Return ONLY a valid JSON object in this exact schema:
{
  "question": "The interview question text to ask the candidate",
  "category": "Technical" | "Project" | "Behavioral" | "General"${hasJD && !jobDescriptionAnalysis ? `,
  "jobDescriptionAnalysis": {
    "requiredSkills": ["Skill 1", "Skill 2"],
    "preferredSkills": ["Skill 1"],
    "technologies": ["Tech 1", "Tech 2"],
    "responsibilities": ["Responsibility 1"],
    "experienceRequirements": "Summary"
  }` : ''}
}
`;

  const routerResult = await callBedrockRouter(
    prompt,
    'You are an expert AI interviewer. Output only valid JSON.',
    hasJD && !jobDescriptionAnalysis ? 1000 : 800,
    0.5,
    customClient,
    (data) => {
      if (!data.question || typeof data.question !== 'string') return 'Missing or invalid "question" field';
      return null;
    }
  );

  return {
    ...routerResult.parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
      stopReason: routerResult.stopReason,
    },
  };
};

// ==========================================
// 4. Combined Evaluation & Next Question Generation
// ==========================================
export const processAnswerUnified = async ({
  question,
  answer,
  role,
  experienceLevel,
  personality = 'professional',
  currentQuestionNumber = 1,
  totalQuestions = 5,
  isLastQuestion = false,
  resumeSkills = [],
  jobDescriptionContext = '',
  previousTopics = [],
  difficultyLevel = 'balanced',
  customClient = null,
}) => {
  const personalityInstructions = {
    friendly: 'Supportive, warm, and encouraging tone.',
    professional: 'Formal, balanced corporate interviewer tone.',
    strict: 'Challenging, skeptical interviewer tone demanding depth.',
  };

  const difficultyGuidance = {
    foundational: 'Target core conceptual fundamentals and clear definitions to reinforce basics.',
    balanced: 'Target practical application, real-world implementation, and workflow reasoning.',
    advanced: 'Target complex edge cases, architectural trade-offs, scalability, and deep system design.',
  };

  const prompt = `You are an expert ${role} interviewer with a ${personality} style (${personalityInstructions[personality] || personalityInstructions.professional}).
The candidate is at ${experienceLevel} level.

CURRENT QUESTION: "${question}"
CANDIDATE ANSWER: "${answer}"

${!isLastQuestion ? `CONTEXT FOR NEXT QUESTION:
- Resume key skills: ${resumeSkills.slice(0, 8).join(', ') || 'General role skills'}
- Target Job context: ${jobDescriptionContext.substring(0, 200) || 'Standard requirements'}
- Previous topics covered: ${previousTopics.slice(-3).join('; ') || 'None'}
- Interview Progress: Question ${currentQuestionNumber} of ${totalQuestions}
- Adaptive Difficulty Target: ${difficultyLevel.toUpperCase()} (${difficultyGuidance[difficultyLevel] || difficultyGuidance.balanced})` : 'NOTE: This was the final question of the interview.'}

TASK:
1. Evaluate the candidate's answer objectively with 0-10 criteria and 0-100 category scores.
2. If NOT the final question:
   - If the candidate's answer was incomplete or missed trade-offs, set shouldFollowUp = true and craft an intelligent follow-up question.
   - Otherwise, set shouldFollowUp = false and craft the next logical interview question covering a different topic, aligned to the Adaptive Difficulty Target (${difficultyLevel}).
3. If this IS the final question: set nextQuestion to null and shouldFollowUp to false.

Return ONLY a valid JSON object in this exact schema:
{
  "evaluation": {
    "technicalAccuracy": 8,
    "relevance": 9,
    "depth": 7,
    "clarity": 8,
    "completeness": 7,
    "communication": 8
  },
  "scores": {
    "overall": 78,
    "technical": 80,
    "communication": 80,
    "problemSolving": 75,
    "projectKnowledge": 80,
    "behavioral": 75
  },
  "strengths": ["Identified core concept correctly", "Clear structure in explanation"],
  "missingPoints": ["Omitted error handling and edge cases"],
  "betterAnswer": "Concise model answer demonstrating optimal technical depth...",
  "shouldFollowUp": false,
  "nextQuestion": ${!isLastQuestion ? `{
    "question": "The next question or follow-up question text",
    "category": "Technical"
  }` : `null`}
}
`;

  const routerResult = await callBedrockRouter(
    prompt,
    'You are an expert interviewer and evaluator. Output valid JSON only.',
    1500,
    0.5,
    customClient,
    (data) => {
      if (!data.evaluation || typeof data.evaluation !== 'object') return 'Missing "evaluation" object';
      if (!data.scores || typeof data.scores !== 'object') return 'Missing "scores" object';
      return null;
    }
  );

  return {
    ...routerResult.parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
      stopReason: routerResult.stopReason,
    },
  };
};

// ==========================================
// 5. Generate Final Report & 7-Day Improvement Plan
// ==========================================
export const generateFinalReport = async ({
  role,
  experienceLevel,
  questionAnswers = [],
  customClient = null,
}) => {
  const prompt = `You are the Lead Technical Interview Evaluator.
Synthesize the final interview report and personalized 7-day improvement plan for this candidate.

Candidate Session Data:
- Target Role: ${role}
- Experience Level: ${experienceLevel}
- Questions & Answers Breakdown:
${questionAnswers
  .map(
    (qa, idx) =>
      `Q${idx + 1} (${qa.category}): "${qa.question}"
Candidate Answer: "${qa.answer || qa.transcript || 'No answer'}"
Scores: Overall ${qa.scores?.overall || 0}/100, Tech ${qa.scores?.technical || 0}/100
Strengths: ${qa.strengths?.join('; ') || 'N/A'}
Missing Points: ${qa.missingPoints?.join('; ') || 'N/A'}`
  )
  .join('\n\n')}

Instructions:
1. Calculate overall and category scores (0-100) based on all answers.
2. Compile genuine strengths backed by actual answers.
3. Identify 3 key weak areas with:
   - Topic name
   - What was missing
   - Why it matters in real interviews
   - What to practice
4. Build a personalized 7-Day Improvement Plan with specific daily topics directly addressing the identified weak areas.
5. Provide an executive summary of performance.

Return ONLY a valid JSON object in this exact schema:
{
  "overallScore": 76,
  "categoryScores": {
    "technical": 78,
    "communication": 74,
    "problemSolving": 75,
    "projectKnowledge": 82,
    "behavioral": 70
  },
  "strengths": [
    "Solid understanding of project architecture",
    "Accurately explained database indexing"
  ],
  "weakAreas": [
    {
      "topic": "System Design Trade-offs",
      "whatWasMissing": "Did not address horizontal scaling bottlenecks",
      "whyItMatters": "Interviewers expect senior candidates to think about failure modes",
      "whatToPractice": "Review CAP theorem, caching strategies, and distributed database sharding"
    }
  ],
  "improvementPlan": [
    {
      "day": 1,
      "title": "Topic for Day 1",
      "focus": "Specific focus area",
      "tasks": ["Task 1", "Task 2"]
    },
    { "day": 2, "title": "Topic for Day 2", "focus": "Focus", "tasks": [] },
    { "day": 3, "title": "Topic for Day 3", "focus": "Focus", "tasks": [] },
    { "day": 4, "title": "Topic for Day 4", "focus": "Focus", "tasks": [] },
    { "day": 5, "title": "Topic for Day 5", "focus": "Focus", "tasks": [] },
    { "day": 6, "title": "Topic for Day 6", "focus": "Focus", "tasks": [] },
    { "day": 7, "title": "Topic for Day 7", "focus": "Focus", "tasks": [] }
  ],
  "summary": "2-3 sentence executive summary of candidate readiness and trajectory."
}
`;

  const routerResult = await callBedrockRouter(
    prompt,
    'You are a senior hiring director synthesizing an actionable interview report. Output only valid JSON.',
    2500,
    0.4,
    customClient,
    (data) => {
      if (typeof data.overallScore !== 'number') return 'Missing or non-numeric "overallScore"';
      if (!data.categoryScores || typeof data.categoryScores !== 'object') return 'Missing "categoryScores" object';
      return null;
    }
  );

  return {
    ...routerResult.parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
      stopReason: routerResult.stopReason,
    },
  };
};
