import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient, AWS_CONFIG, verifyAwsConfiguration } from '../../config/awsConfig.js';

// Helper to safely extract JSON from LLM response
const parseJsonResponse = (text) => {
  try {
    // 1. Check if enclosed in markdown code fences ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    // 2. Direct parse
    return JSON.parse(text);
  } catch (err) {
    // 3. Fallback: try finding outermost { ... } or [ ... ]
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    throw new Error(`Failed to parse structured JSON from Bedrock response: ${text.substring(0, 150)}...`);
  }
};

// Generic Bedrock invoker supporting Anthropic Claude models
const callBedrock = async (prompt, systemPrompt = '', maxTokens = 2048, temperature = 0.5) => {
  verifyAwsConfiguration('Amazon Bedrock');

  const modelId = AWS_CONFIG.bedrockModelId;

  // Format request body for Anthropic Claude 3 / 3.5 on Amazon Bedrock
  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody),
  });

  try {
    const response = await bedrockClient.send(command);
    const decoded = new TextDecoder().decode(response.body);
    const result = JSON.parse(decoded);

    // Extract text content from Claude's response structure
    const outputText = result.content?.[0]?.text || '';
    return outputText.trim();
  } catch (error) {
    console.error('[Amazon Bedrock Invocation Error]', error);
    if (error.name === 'ThrottlingException') {
      const err = new Error(
        `Amazon Bedrock quota limit reached: Your AWS account has reached its daily token limit on Amazon Bedrock ("Too many tokens per day"). Please wait for the daily quota reset or increase your Bedrock service quota in AWS Console.`
      );
      err.statusCode = 429;
      err.name = 'ThrottlingException';
      throw err;
    }
    if (
      error.name === 'AccessDeniedException' ||
      error.name === 'ValidationException' ||
      error.message?.includes('credentials') ||
      error.message?.includes('not found')
    ) {
      throw new Error(
        `AI service is not configured. Please configure AWS Bedrock credentials and model access in your server .env file. (Error: ${error.message})`
      );
    }
    throw error;
  }
};

// 1. Analyze Resume
export const analyzeResume = async (rawText) => {
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
${rawText}
`;

  const responseText = await callBedrock(
    prompt,
    'You are a precise technical resume extractor. Output valid JSON only with no conversational text.'
  );
  return parseJsonResponse(responseText);
};

// 2. Analyze Job Description
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

  const responseText = await callBedrock(
    prompt,
    'You are an expert hiring manager analyzing job descriptions. Output valid JSON only.'
  );
  return parseJsonResponse(responseText);
};

// 3. Generate Interview Question
export const generateInterviewQuestion = async ({
  role,
  experienceLevel,
  personality = 'professional',
  resumeData = null,
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

  const prompt = `You are an expert interviewer conducting a job interview.
Interview Context:
- Target Role: ${role}
- Experience Level: ${experienceLevel}
- Interviewer Personality: ${personality} (${personalityInstructions[personality] || personalityInstructions.professional})
- Progress: Question ${questionNumber} of ${totalQuestions}

${
  resumeData
    ? `- Candidate Resume Context:
   Extracted Skills: ${resumeData.skills?.join(', ') || 'N/A'}
   Extracted Projects: ${resumeData.projects?.join('; ') || 'N/A'}
   Extracted Technologies: ${resumeData.technologies?.join(', ') || 'N/A'}`
    : '- No resume provided.'
}

${
  jobDescriptionAnalysis
    ? `- Target Job Description Context:
   Required Skills: ${jobDescriptionAnalysis.requiredSkills?.join(', ') || 'N/A'}
   Core Technologies: ${jobDescriptionAnalysis.technologies?.join(', ') || 'N/A'}`
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
5. Return ONLY a valid JSON object in this exact schema:
{
  "question": "The interview question text to ask the candidate",
  "category": "Technical" | "Project" | "Behavioral" | "General"
}
`;

  const responseText = await callBedrock(
    prompt,
    'You are an expert AI interviewer. Output only valid JSON.'
  );
  return parseJsonResponse(responseText);
};

// 4. Evaluate Answer
export const evaluateAnswer = async ({
  question,
  answer,
  role,
  experienceLevel,
  personality = 'professional',
}) => {
  const prompt = `You are an expert technical interviewer evaluating a candidate's answer.
Context:
- Target Role: ${role}
- Experience Level: ${experienceLevel}
- Question Asked: "${question}"
- Candidate Answer: "${answer}"

Evaluate the candidate's answer objectively.
Metrics (Score 0-10):
- Technical Accuracy (0-10)
- Relevance (0-10)
- Depth (0-10)
- Clarity (0-10)
- Completeness (0-10)
- Communication (0-10)

Also calculate category scores (0-100) and identify:
- Strengths: 2-3 specific points the candidate explained well
- Missing Points: 2-3 critical concepts, trade-offs, edge cases, or details that were omitted
- Suggested Better Answer: A concise, ideal example answer demonstrating how to answer this effectively

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
  "strengths": [
    "Identified correct core concept",
    "Clear structure in explanation"
  ],
  "missingPoints": [
    "Did not mention error handling or token revocation",
    "Missed discussion of scalability trade-offs"
  ],
  "betterAnswer": "Concise ideal response that demonstrates high technical depth...",
  "shouldFollowUp": true or false,
  "followUpReason": "Explanation of why a follow-up probe is needed or not"
}
`;

  const responseText = await callBedrock(
    prompt,
    'You are an expert interview evaluator. Evaluate rigorously and constructively. Output only valid JSON.'
  );
  return parseJsonResponse(responseText);
};

// 5. Generate Follow-Up Question
export const generateFollowUp = async ({
  question,
  answer,
  evaluation,
  role,
  personality = 'professional',
}) => {
  const prompt = `You are an expert interviewer.
The candidate just answered a question, but their answer introduced a concept, was ambiguous, or missed critical trade-offs.
Generate an intelligent follow-up question that drills down directly into what they just said.

Context:
- Target Role: ${role}
- Interviewer Personality: ${personality}
- Previous Question: "${question}"
- Candidate's Answer: "${answer}"
- Evaluation Strengths: ${evaluation.strengths?.join(', ') || 'N/A'}
- Missing Points: ${evaluation.missingPoints?.join(', ') || 'N/A'}

Rules:
1. The follow-up question MUST directly quote or reference what the candidate said (e.g. "You mentioned X...", "Why did you choose Y over Z?").
2. Make it feel like a real conversational interviewer probing for depth.
3. Return ONLY a valid JSON object in this exact schema:
{
  "question": "The follow-up question text",
  "category": "Follow-up"
}
`;

  const responseText = await callBedrock(
    prompt,
    'You are an expert interviewer asking intelligent follow-up questions. Output only valid JSON.'
  );
  return parseJsonResponse(responseText);
};

// 6. Generate Final Report & 7-Day Improvement Plan
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

  const responseText = await callBedrock(
    prompt,
    'You are a senior hiring director synthesizing an actionable interview report. Output only valid JSON.'
  );
  return parseJsonResponse(responseText);
};
