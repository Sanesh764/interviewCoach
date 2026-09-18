import { bedrockClient, AWS_CONFIG, getBedrockModelChain, verifyAwsConfiguration } from '../../config/awsConfig.js';
import { invokeBedrockModel } from './modelAdapters.js';

/**
 * Classifies whether an AWS Bedrock error is eligible for fallback to another model.
 * Eligible: Quota limits, rate limits, throttling, transient service unavailabilities.
 */
export const isFallbackEligible = (error) => {
  if (!error) return false;
  const name = error.name || '';
  const msg = (error.message || '').toLowerCase();
  const status = error.statusCode || error.$metadata?.httpStatusCode;

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

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (validatorFn) {
      const vErr = validatorFn(parsed);
      if (vErr) throw new Error(vErr);
    }
    return parsed;
  } catch (_) {}

  // Strategy 2: Strip outer markdown fences
  try {
    const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(unfenced);
    if (validatorFn) {
      const vErr = validatorFn(parsed);
      if (vErr) throw new Error(vErr);
    }
    return parsed;
  } catch (_) {}

  // Strategy 3: Outermost { ... } extraction
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const substring = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(substring);
      if (validatorFn) {
        const vErr = validatorFn(parsed);
        if (vErr) throw new Error(vErr);
      }
      return parsed;
    } catch (_) {}

    // Strategy 4: Trailing comma cleanup
    try {
      const withoutTrailingCommas = substring.replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(withoutTrailingCommas);
      if (validatorFn) {
        const vErr = validatorFn(parsed);
        if (vErr) throw new Error(vErr);
      }
      return parsed;
    } catch (_) {}
  }

  throw new Error(`Failed to parse structured JSON from Bedrock response: ${trimmed.substring(0, 150)}...`);
};

/**
 * Sequential Multi-Model Bedrock Fallback Router
 *
 * Sequence:
 *   Claude 3 Haiku (Primary)
 *         ↓ (if throttled/quota/transient error, after 1 jittered retry)
 *   Amazon Nova Lite (Fallback 1)
 *         ↓ (if throttled/quota/transient error, after 1 jittered retry)
 *   Google Gemma 3 27B (Fallback 2)
 *
 * Enforces:
 *   - Zero parallel calls under normal conditions (single active model).
 *   - Immediate fail-fast for IAM / Credential / Validation / Model ID bugs.
 *   - Tracks modelUsed, usage tokens, and latency across attempts.
 */
export const callBedrockRouter = async (
  prompt,
  systemPrompt = '',
  maxTokens = 800,
  temperature = 0.5,
  customClient = null
) => {
  verifyAwsConfiguration('Amazon Bedrock');

  const client = customClient || bedrockClient;
  const modelChain = getBedrockModelChain();
  const attemptHistory = [];

  for (let i = 0; i < modelChain.length; i++) {
    const modelId = modelChain[i];
    const isLastModel = i === modelChain.length - 1;

    // Up to 2 attempts on the same model (initial attempt + 1 short jittered retry for transient errors)
    for (let modelAttempt = 1; modelAttempt <= 2; modelAttempt++) {
      const startTime = Date.now();
      try {
        console.log(`[AI Router] Attempting model: ${modelId} (model attempt ${modelAttempt})`);

        const result = await invokeBedrockModel(client, modelId, {
          prompt,
          systemPrompt,
          maxTokens,
          temperature,
        });

        console.log(
          `[AI Router] Model ${modelId} succeeded (latency: ${result.latencyMs}ms, tokens: ${result.usage.totalTokens})`
        );

        attemptHistory.push({
          modelId,
          success: true,
          latencyMs: result.latencyMs,
          usage: result.usage,
        });

        return {
          text: result.text,
          modelUsed: modelId,
          usage: result.usage,
          latencyMs: result.latencyMs,
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
        });

        // 1. Check for non-fallback errors (IAM, credentials, bad model ID, client code validation)
        if (isNonFallbackError(error)) {
          console.error(
            `[AI Router] Fatal non-fallback error encountered on ${modelId} (${error.name}). Aborting routing immediately.`
          );
          const fatalErr = new Error('AI interview service is temporarily unavailable. Please try again later.');
          fatalErr.statusCode = 503;
          fatalErr.name = error.name || 'ServiceUnavailable';
          fatalErr.originalError = error;
          throw fatalErr;
        }

        // 2. Check if error is eligible for fallback
        if (!isFallbackEligible(error)) {
          // Unrecognized error: do not silently switch models
          console.error(`[AI Router] Non-eligible error encountered on ${modelId}:`, error);
          throw error;
        }

        // 3. If modelAttempt === 1 and not fatal, execute 1 short retry with jitter
        if (modelAttempt === 1) {
          const jitterMs = 200 + Math.floor(Math.random() * 150);
          console.log(`[AI Router] Transient error on ${modelId}. Retrying once in ${jitterMs}ms...`);
          await sleep(jitterMs);
          continue;
        }

        // 4. Model failed twice with fallback-eligible error
        if (!isLastModel) {
          const nextModelId = modelChain[i + 1];
          console.warn(
            `[AI Router] Model ${modelId} capacity/quota exhausted. Transitioning to fallback model: ${nextModelId}`
          );
          break; // Break inner loop to move to next model in chain
        } else {
          console.error(`[AI Router] All models in the fallback chain have been exhausted.`);
        }
      }
    }
  }

  // All models in the chain failed
  const finalError = new Error(
    'AI interview service is temporarily unavailable because the AI provider has reached its current usage limit. Please try again later.'
  );
  finalError.statusCode = 429;
  finalError.name = 'ThrottlingException';
  finalError.attempts = attemptHistory;
  throw finalError;
};

// Aliased helper matching existing call signature
export const callBedrock = async (prompt, systemPrompt = '', maxTokens = 800, temperature = 0.5) => {
  const result = await callBedrockRouter(prompt, systemPrompt, maxTokens, temperature);
  return result.text;
};

// ==========================================
// 1. Analyze Resume
// ==========================================
export const analyzeResume = async (rawText) => {
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
    600,
    0.3
  );

  const parsed = parseJsonResponse(routerResult.text, (data) => {
    if (!Array.isArray(data.skills)) return 'Missing "skills" array';
    return null;
  });

  return {
    ...parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
    },
  };
};

// ==========================================
// 2. Analyze Job Description
// ==========================================
export const analyzeJobDescription = async (jdText) => {
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
    600,
    0.3
  );

  const parsed = parseJsonResponse(routerResult.text, (data) => {
    if (!Array.isArray(data.requiredSkills)) return 'Missing "requiredSkills" array';
    return null;
  });

  return {
    ...parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
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
    hasJD && !jobDescriptionAnalysis ? 550 : 450,
    0.5
  );

  const parsed = parseJsonResponse(routerResult.text, (data) => {
    if (!data.question || typeof data.question !== 'string') return 'Missing or invalid "question" field';
    return null;
  });

  return {
    ...parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
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
    850,
    0.5
  );

  const parsed = parseJsonResponse(routerResult.text, (data) => {
    if (!data.evaluation || typeof data.evaluation !== 'object') return 'Missing "evaluation" object';
    if (!data.scores || typeof data.scores !== 'object') return 'Missing "scores" object';
    return null;
  });

  return {
    ...parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
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
    1200,
    0.4
  );

  const parsed = parseJsonResponse(routerResult.text, (data) => {
    if (typeof data.overallScore !== 'number') return 'Missing or non-numeric "overallScore"';
    if (!data.categoryScores || typeof data.categoryScores !== 'object') return 'Missing "categoryScores" object';
    return null;
  });

  return {
    ...parsed,
    _metadata: {
      modelUsed: routerResult.modelUsed,
      usage: routerResult.usage,
      latencyMs: routerResult.latencyMs,
    },
  };
};
