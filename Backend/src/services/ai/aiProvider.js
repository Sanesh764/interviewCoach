import * as bedrockProvider from './bedrockService.js';

/**
 * AI Provider Abstraction Layer
 *
 * Current Architecture:
 * Interview Engine / Controllers
 *       ↓
 * aiProvider.js (Unified AI Interface)
 *       ↓
 * bedrockService.js (Amazon Bedrock Runtime)
 *
 * This layer decouples the core interview engine from the specific cloud provider,
 * allowing future providers (e.g. OpenAI, Anthropic direct, Azure OpenAI) to be
 * introduced without modifying interview orchestration logic.
 */

export const aiProvider = {
  // Extract structured candidate information from resume text
  analyzeResume: (rawText) => bedrockProvider.analyzeResume(rawText),

  // Extract structured requirements from target Job Description
  analyzeJobDescription: (jdText) => bedrockProvider.analyzeJobDescription(jdText),

  // Generate question (with optional inline JD analysis)
  generateInterviewQuestion: (params) => bedrockProvider.generateInterviewQuestion(params),

  // Unified answer evaluation and next-question generation (single call)
  processAnswerUnified: (params) => bedrockProvider.processAnswerUnified(params),

  // Synthesize post-interview diagnostic evaluation and 7-day study plan
  generateFinalReport: (params) => bedrockProvider.generateFinalReport(params),
};

export default aiProvider;
