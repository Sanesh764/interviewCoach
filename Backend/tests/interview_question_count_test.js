import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Interview } from '../src/models/Interview.js';
import { QuestionAnswer } from '../src/models/QuestionAnswer.js';
import { interviewEngine } from '../src/services/interview/interviewEngine.js';
import { processAnswerUnified } from '../src/services/ai/bedrockService.js';
import aiProvider from '../src/services/ai/aiProvider.js';

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

// Helper to create mock Bedrock client returning custom text
function createMockClientWithResponses(responses) {
  let callIndex = 0;
  return {
    send: async (command) => {
      const resp = responses[callIndex] || responses[responses.length - 1];
      callIndex++;
      const payload = {
        anthropic: {
          content: [{ type: 'text', text: typeof resp === 'string' ? resp : JSON.stringify(resp) }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      };
      return {
        body: new TextEncoder().encode(JSON.stringify(payload.anthropic)),
      };
    },
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('INTERVIEWCOACH AI — QUESTION COUNT & EARLY-COMPLETION TEST SUITE');
  console.log('====================================================\n');

  await connectDB();

  // Find or create a test user
  let testUser = await User.findOne({ email: 'count_test_user@interviewcoach.ai' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Question Count Tester',
      email: 'count_test_user@interviewcoach.ai',
      password: 'hashedpassword123',
    });
  }

  // ========================================================
  // TEST 1: Response Validator enforces nextQuestion when !isLastQuestion
  // ========================================================
  console.log('--- TEST 1: Schema Validator in processAnswerUnified ---');
  try {
    // 1a. When currentQuestionNumber (5) < totalQuestions (10), nextQuestion: null MUST trigger validation error
    // Model 1 (Claude) returns nextQuestion: null -> should fail validation and fallback to Model 2 (Nova)
    let claudeAttempted = false;
    let novaAttempted = false;

    const mockRouterClient = {
      send: async (command) => {
        const modelId = command.input.modelId;
        if (modelId.includes('claude')) {
          claudeAttempted = true;
          // Claude returns valid evaluation but nextQuestion is null (the bug condition)
          return {
            output: {
              message: {
                content: [{
                  text: JSON.stringify({
                    evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
                    scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
                    strengths: ['Good answer'],
                    missingPoints: ['Missing edge cases'],
                    betterAnswer: 'Model answer...',
                    shouldFollowUp: false,
                    nextQuestion: null, // Invalid since Q5 < 10!
                  }),
                }],
              },
            },
            stopReason: 'end_turn',
            usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
          };
        } else if (modelId.includes('nova')) {
          novaAttempted = true;
          // Nova returns valid nextQuestion
          return {
            output: {
              message: {
                content: [{
                  text: JSON.stringify({
                    evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
                    scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
                    strengths: ['Good answer'],
                    missingPoints: ['None'],
                    betterAnswer: 'Better answer',
                    shouldFollowUp: false,
                    nextQuestion: {
                      question: 'What is your approach to distributed transactions?',
                      category: 'Technical',
                    },
                  }),
                }],
              },
            },
            stopReason: 'end_turn',
            usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
          };
        }
        throw new Error(`Unexpected model: ${modelId}`);
      },
    };

    const routerResult = await processAnswerUnified({
      question: 'How do you monitor services?',
      answer: 'Using metrics and logs.',
      role: 'Backend Developer',
      experienceLevel: 'Fresher',
      currentQuestionNumber: 5,
      totalQuestions: 10,
      isLastQuestion: false,
      customClient: mockRouterClient,
    });

    assert(
      '1a. Claude returning nextQuestion: null at Q5 of 10 was rejected by validator',
      claudeAttempted === true
    );
    assert(
      '1b. Fallback router engaged and recovered using Nova Lite',
      novaAttempted === true && (routerResult._metadata?.modelUsed || routerResult.modelUsed || '').includes('nova')
    );
    assert(
      '1c. Next question was successfully populated from fallback model',
      !!routerResult.nextQuestion && typeof routerResult.nextQuestion.question === 'string'
    );
  } catch (err) {
    assert('TEST 1: Schema validator error', false, err.message);
  }

  // ========================================================
  // TEST 2: Genuine Final Question allows nextQuestion: null
  // ========================================================
  console.log('\n--- TEST 2: Genuine Final Question (Q10 of 10) ---');
  try {
    const finalMockClient = {
      send: async () => ({
        output: {
          message: {
            content: [{
              text: JSON.stringify({
                evaluation: { technicalAccuracy: 9, relevance: 9, depth: 8, clarity: 9, completeness: 8, communication: 9 },
                scores: { overall: 88, technical: 90, communication: 85, problemSolving: 85, projectKnowledge: 90, behavioral: 85 },
                strengths: ['Excellent architecture reasoning'],
                missingPoints: [],
                betterAnswer: 'Optimal answer',
                shouldFollowUp: false,
                nextQuestion: null, // Genuinely final question!
              }),
            }],
          },
        },
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      }),
    };

    const finalResult = await processAnswerUnified({
      question: 'Final technical question',
      answer: 'My final comprehensive answer',
      role: 'Backend Developer',
      experienceLevel: 'Fresher',
      currentQuestionNumber: 10,
      totalQuestions: 10,
      isLastQuestion: true,
      customClient: finalMockClient,
    });

    assert(
      '2a. Final question (Q10 of 10) with nextQuestion: null passes validation',
      finalResult.nextQuestion === null
    );
  } catch (err) {
    assert('TEST 2 failed', false, err.message);
  }

  // ========================================================
  // TEST 3: Edge Case — AI returns nextQuestion: null at Q5 of 10 in interviewEngine
  // Engine MUST NOT complete interview, but generate fallback question and advance to Q6!
  // ========================================================
  console.log('\n--- TEST 3: Edge Case: Q5 of 10 AI returns nextQuestion: null in interviewEngine ---');
  try {
    const interview10 = await Interview.create({
      userId: testUser._id,
      role: 'Software Engineer',
      experienceLevel: 'Fresher',
      mode: 'text',
      personality: 'professional',
      totalQuestionsTarget: 10,
      currentQuestionIndex: 5,
      status: 'in_progress',
      questions: [],
    });

    // Populate 5 questions in the interview
    for (let i = 1; i <= 5; i++) {
      const qa = await QuestionAnswer.create({
        interviewId: interview10._id,
        questionNumber: i,
        question: `Question ${i} text`,
        category: 'Technical',
        answer: i < 5 ? `Answer ${i}` : '', // Q5 is unanswered
      });
      interview10.questions.push(qa._id);
    }
    await interview10.save();

    // Temporarily mock aiProvider to simulate AI failing to provide nextQuestion
    const originalProcess = aiProvider.processAnswerUnified;
    const originalGenerate = aiProvider.generateInterviewQuestion;

    let fallbackQuestionGenerated = false;

    aiProvider.processAnswerUnified = async () => ({
      evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
      scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
      strengths: ['Strength'],
      missingPoints: ['Missing point'],
      betterAnswer: 'Better answer',
      shouldFollowUp: false,
      nextQuestion: null, // Simulating bug scenario where AI returned null
      _metadata: { modelUsed: 'test-model', latencyMs: 100, usage: {} },
    });

    aiProvider.generateInterviewQuestion = async (params) => {
      fallbackQuestionGenerated = true;
      return {
        question: `Fallback Generated Question ${params.questionNumber} for ${params.role}`,
        category: 'Technical',
        _metadata: { modelUsed: 'fallback-model', latencyMs: 150, usage: {} },
      };
    };

    const processResult = await interviewEngine.processAnswer({
      interviewId: interview10._id.toString(),
      answerText: 'Answer to Question 5',
      answerMode: 'text',
    });

    // Restore original methods
    aiProvider.processAnswerUnified = originalProcess;
    aiProvider.generateInterviewQuestion = originalGenerate;

    assert(
      '3a. Interview did NOT finish early at Question 5 (completed === false)',
      processResult.completed === false
    );
    assert(
      '3b. Fallback question generation was triggered when nextQuestion was null',
      fallbackQuestionGenerated === true
    );
    assert(
      '3c. Next question is Question 6',
      processResult.nextQuestion.questionNumber === 6
    );

    const reloadedInterview = await Interview.findById(interview10._id);
    assert(
      '3d. Interview status in DB is still "in_progress"',
      reloadedInterview.status === 'in_progress'
    );
    assert(
      '3e. currentQuestionIndex in DB advanced to 6',
      reloadedInterview.currentQuestionIndex === 6
    );
    assert(
      '3f. Total questions in interview array is now 6',
      reloadedInterview.questions.length === 6
    );

    // Clean up
    await QuestionAnswer.deleteMany({ interviewId: interview10._id });
    await Interview.deleteOne({ _id: interview10._id });
  } catch (err) {
    assert('TEST 3 failed', false, err.message);
  }

  // ========================================================
  // TEST 4: Case A (Selected = 5 questions -> exactly 5 questions)
  // ========================================================
  console.log('\n--- TEST 4: Case A (Selected = 5 questions -> finishes after exactly 5 questions) ---');
  try {
    const origProcess = aiProvider.processAnswerUnified;
    const origQ1 = aiProvider.generateInterviewQuestion;
    const origReport = aiProvider.generateFinalReport;

    aiProvider.generateInterviewQuestion = async ({ questionNumber, role }) => ({
      question: `Question ${questionNumber} for ${role}`,
      category: 'Technical',
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.processAnswerUnified = async ({ currentQuestionNumber, totalQuestions, isLastQuestion }) => ({
      evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
      scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
      strengths: ['Strength'],
      missingPoints: [],
      betterAnswer: 'Better answer',
      shouldFollowUp: false,
      nextQuestion: isLastQuestion
        ? null
        : {
            question: `Next Question ${currentQuestionNumber + 1}`,
            category: 'Technical',
          },
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.generateFinalReport = async () => ({
      overallScore: 82,
      categoryScores: { technical: 85, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
      strengths: ['Strong technical fundamentals'],
      weakAreas: [{ topic: 'Testing', whatWasMissing: 'Edge cases', whyItMatters: 'Quality', whatToPractice: 'Unit tests' }],
      improvementPlan: [{ day: 1, title: 'Day 1 Plan', focus: 'Testing', tasks: ['Task 1'] }],
      summary: 'Well done',
      _metadata: { modelUsed: 'mock-model' },
    });

    const session = await interviewEngine.startInterview({
      userId: testUser._id,
      role: 'Backend Developer',
      experienceLevel: 'Fresher',
      mode: 'text',
      personality: 'professional',
      totalQuestionsTarget: 5,
    });

    const interviewId = session.interview._id.toString();
    let lastResult = null;

    for (let q = 1; q <= 5; q++) {
      lastResult = await interviewEngine.processAnswer({
        interviewId,
        answerText: `Candidate thorough answer for question ${q}`,
        answerMode: 'text',
      });

      if (q < 5) {
        assert(`4.${q}. Q${q}/5 answered -> completed === false, nextQuestion is Q${q + 1}`,
          lastResult.completed === false && lastResult.nextQuestion.questionNumber === q + 1
        );
      } else {
        assert('4.5. Q5/5 answered -> completed === true, final report generated',
          lastResult.completed === true && !!lastResult.report
        );
      }
    }

    const doc5 = await Interview.findById(interviewId).populate('questions');
    assert('4a. Final status is "completed"', doc5.status === 'completed');
    assert('4b. Exactly 5 questions were asked and answered', doc5.questions.length === 5);
    assert('4c. All 5 questions have answers', doc5.questions.every((q) => !!q.answer));

    // Clean up
    await QuestionAnswer.deleteMany({ interviewId });
    await Interview.deleteOne({ _id: interviewId });

    // Restore
    aiProvider.processAnswerUnified = origProcess;
    aiProvider.generateInterviewQuestion = origQ1;
    aiProvider.generateFinalReport = origReport;
  } catch (err) {
    assert('TEST 4 failed', false, err.message);
  }

  // ========================================================
  // TEST 5: Case B (Selected = 7 questions -> finishes after exactly 7 questions)
  // ========================================================
  console.log('\n--- TEST 5: Case B (Selected = 7 questions -> finishes after exactly 7 questions) ---');
  try {
    const origProcess = aiProvider.processAnswerUnified;
    const origQ1 = aiProvider.generateInterviewQuestion;
    const origReport = aiProvider.generateFinalReport;

    aiProvider.generateInterviewQuestion = async ({ questionNumber, role }) => ({
      question: `Question ${questionNumber} for ${role}`,
      category: 'Technical',
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.processAnswerUnified = async ({ currentQuestionNumber, totalQuestions, isLastQuestion }) => ({
      evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
      scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
      strengths: ['Strength'],
      missingPoints: [],
      betterAnswer: 'Better answer',
      shouldFollowUp: false,
      nextQuestion: isLastQuestion
        ? null
        : {
            question: `Next Question ${currentQuestionNumber + 1}`,
            category: 'Technical',
          },
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.generateFinalReport = async () => ({
      overallScore: 85,
      categoryScores: { technical: 85, communication: 85, problemSolving: 85, projectKnowledge: 85, behavioral: 85 },
      strengths: ['Strong technical fundamentals'],
      weakAreas: [],
      improvementPlan: [],
      summary: 'Solid performance',
      _metadata: { modelUsed: 'mock-model' },
    });

    const session = await interviewEngine.startInterview({
      userId: testUser._id,
      role: 'Full Stack Developer',
      experienceLevel: 'Fresher',
      mode: 'text',
      personality: 'professional',
      totalQuestionsTarget: 7,
    });

    const interviewId = session.interview._id.toString();
    let lastResult = null;

    for (let q = 1; q <= 7; q++) {
      lastResult = await interviewEngine.processAnswer({
        interviewId,
        answerText: `Candidate thorough answer for question ${q}`,
        answerMode: 'text',
      });

      if (q < 7) {
        assert(`5.${q}. Q${q}/7 answered -> completed === false, nextQuestion is Q${q + 1}`,
          lastResult.completed === false && lastResult.nextQuestion.questionNumber === q + 1
        );
      } else {
        assert('5.7. Q7/7 answered -> completed === true, final report generated',
          lastResult.completed === true && !!lastResult.report
        );
      }
    }

    const doc7 = await Interview.findById(interviewId).populate('questions');
    assert('5a. Final status is "completed"', doc7.status === 'completed');
    assert('5b. Exactly 7 questions were asked and answered', doc7.questions.length === 7);
    assert('5c. All 7 questions have answers', doc7.questions.every((q) => !!q.answer));

    // Clean up
    await QuestionAnswer.deleteMany({ interviewId });
    await Interview.deleteOne({ _id: interviewId });

    // Restore
    aiProvider.processAnswerUnified = origProcess;
    aiProvider.generateInterviewQuestion = origQ1;
    aiProvider.generateFinalReport = origReport;
  } catch (err) {
    assert('TEST 5 failed', false, err.message);
  }

  // ========================================================
  // TEST 6: Case C (Selected = 10 questions -> finishes after exactly 10 questions)
  // ========================================================
  console.log('\n--- TEST 6: Case C (Selected = 10 questions -> finishes after exactly 10 questions) ---');
  try {
    const origProcess = aiProvider.processAnswerUnified;
    const origQ1 = aiProvider.generateInterviewQuestion;
    const origReport = aiProvider.generateFinalReport;

    aiProvider.generateInterviewQuestion = async ({ questionNumber, role }) => ({
      question: `Question ${questionNumber} for ${role}`,
      category: 'Technical',
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.processAnswerUnified = async ({ currentQuestionNumber, totalQuestions, isLastQuestion }) => ({
      evaluation: { technicalAccuracy: 8, relevance: 8, depth: 7, clarity: 8, completeness: 7, communication: 8 },
      scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, projectKnowledge: 80, behavioral: 80 },
      strengths: ['Strength'],
      missingPoints: [],
      betterAnswer: 'Better answer',
      shouldFollowUp: false,
      nextQuestion: isLastQuestion
        ? null
        : {
            question: `Next Question ${currentQuestionNumber + 1}`,
            category: 'Technical',
          },
      _metadata: { modelUsed: 'mock-model' },
    });

    aiProvider.generateFinalReport = async () => ({
      overallScore: 90,
      categoryScores: { technical: 90, communication: 90, problemSolving: 90, projectKnowledge: 90, behavioral: 90 },
      strengths: ['Comprehensive domain expertise'],
      weakAreas: [],
      improvementPlan: [],
      summary: 'Exceptional interview',
      _metadata: { modelUsed: 'mock-model' },
    });

    const session = await interviewEngine.startInterview({
      userId: testUser._id,
      role: 'Software Engineer',
      experienceLevel: 'Fresher',
      mode: 'text',
      personality: 'professional',
      totalQuestionsTarget: 10,
    });

    const interviewId = session.interview._id.toString();
    let lastResult = null;

    for (let q = 1; q <= 10; q++) {
      lastResult = await interviewEngine.processAnswer({
        interviewId,
        answerText: `Candidate thorough answer for question ${q}`,
        answerMode: 'text',
      });

      if (q < 10) {
        assert(`6.${q}. Q${q}/10 answered -> completed === false, nextQuestion is Q${q + 1}`,
          lastResult.completed === false && lastResult.nextQuestion.questionNumber === q + 1
        );
      } else {
        assert('6.10. Q10/10 answered -> completed === true, final report generated',
          lastResult.completed === true && !!lastResult.report
        );
      }
    }

    const doc10 = await Interview.findById(interviewId).populate('questions');
    assert('6a. Final status is "completed"', doc10.status === 'completed');
    assert('6b. Exactly 10 questions were asked and answered (NOT 5!)', doc10.questions.length === 10);
    assert('6c. All 10 questions have answers', doc10.questions.every((q) => !!q.answer));
    assert('6d. Question 11 was NOT generated', !doc10.questions.some((q) => q.questionNumber === 11));

    // Clean up
    await QuestionAnswer.deleteMany({ interviewId });
    await Interview.deleteOne({ _id: interviewId });

    // Restore
    aiProvider.processAnswerUnified = origProcess;
    aiProvider.generateInterviewQuestion = origQ1;
    aiProvider.generateFinalReport = origReport;
  } catch (err) {
    assert('TEST 6 failed', false, err.message);
  }

  // Clean up test user
  await User.deleteOne({ _id: testUser._id });
  await mongoose.connection.close();

  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
