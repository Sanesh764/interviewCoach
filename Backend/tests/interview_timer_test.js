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

async function runTests() {
  console.log('====================================================');
  console.log('INTERVIEWCOACH AI — SEPARATE MODES TEST SUITE');
  console.log('(Mode 1: Question Count Mode vs Mode 2: Timed Interview Mode)');
  console.log('====================================================\n');

  await connectDB();

  let user = await User.findOne({ email: 'modes_test@interviewcoach.test' });
  if (!user) {
    user = await User.create({
      name: 'Modes Test Candidate',
      email: 'modes_test@interviewcoach.test',
      password: 'password123',
    });
  }

  // Backup existing methods
  const originalGenerateInterviewQuestion = aiProvider.generateInterviewQuestion;
  const originalProcessAnswerUnified = aiProvider.processAnswerUnified;
  const originalGenerateFinalReport = aiProvider.generateFinalReport;

  // Mock aiProvider methods
  aiProvider.generateInterviewQuestion = async ({ questionNumber, totalQuestions }) => {
    return {
      question: `Question ${questionNumber}${totalQuestions ? ` of ${totalQuestions}` : ' (Timed)'}: Explain core architecture concepts.`,
      category: 'Technical',
      _metadata: { modelUsed: 'apac.amazon.nova-lite-v1:0', latencyMs: 20 },
    };
  };

  aiProvider.processAnswerUnified = async ({ currentQuestionNumber, totalQuestions, isLastQuestion }) => {
    const isFinal = isLastQuestion || (totalQuestions ? currentQuestionNumber >= totalQuestions : false);
    return {
      evaluation: { technicalAccuracy: 8, relevance: 9, depth: 8, clarity: 8, completeness: 8, communication: 8 },
      scores: { overall: 85, technical: 85, communication: 85, problemSolving: 85, projectKnowledge: 85, behavioral: 85 },
      strengths: ['Clear answer'],
      missingPoints: [],
      betterAnswer: '',
      shouldFollowUp: false,
      nextQuestion: isFinal
        ? null
        : {
            question: `Question ${currentQuestionNumber + 1}${totalQuestions ? ` of ${totalQuestions}` : ' (Timed)'}: Follow-up architecture question.`,
            category: 'Technical',
          },
      _metadata: { modelUsed: 'apac.amazon.nova-lite-v1:0', latencyMs: 30 },
    };
  };

  aiProvider.generateFinalReport = async () => {
    return {
      overallScore: 86,
      categoryScores: { technical: 85, communication: 85, problemSolving: 85, projectKnowledge: 85, behavioral: 85 },
      strengths: ['Great domain knowledge'],
      weakAreas: [],
      improvementPlan: [{ day: 1, title: 'Deep dive', focus: 'Concepts', tasks: ['Task 1'] }],
      summary: 'Candidate demonstrated solid software engineering competence.',
      _metadata: { modelUsed: 'apac.amazon.nova-lite-v1:0' },
    };
  };

  try {
    // ---------------------------------------------------------------------------------
    // TEST 1: Question Count Mode + 5 Questions -> exactly 5 questions
    // ---------------------------------------------------------------------------------
    console.log('--- TEST 1: Question Count Mode (5 Questions Target) ---');
    const t1 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Backend Engineer',
      interviewType: 'question_count',
      totalQuestionsTarget: 5,
    });

    assert('1a. interviewType is "question_count"', t1.interview.interviewType === 'question_count');
    assert('1b. totalQuestionsTarget is 5', t1.interview.totalQuestionsTarget === 5);
    assert('1c. durationMinutes is null (no timer restriction)', t1.interview.durationMinutes === null);
    assert('1d. expiresAt is null (not time bounded)', t1.interview.expiresAt === null);

    for (let q = 1; q <= 4; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t1.interview._id,
        answerText: `Answer ${q}`,
      });
      assert(`1.${q}. Q${q}/5 answered -> completed === false`, res.completed === false);
    }

    const t1Final = await interviewEngine.processAnswer({
      interviewId: t1.interview._id,
      answerText: 'Answer 5',
    });

    assert('1.5. Q5/5 answered -> completed === true', t1Final.completed === true);
    const t1Db = await Interview.findById(t1.interview._id);
    assert('1e. Status is "completed"', t1Db.status === 'completed');
    assert('1f. completionReason is "questions_completed"', t1Db.completionReason === 'questions_completed');
    assert('1g. Exactly 5 questions were recorded in session', t1Db.questions.length === 5);

    // ---------------------------------------------------------------------------------
    // TEST 2: Question Count Mode + 10 Questions -> exactly 10 questions
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 2: Question Count Mode (10 Questions Target) ---');
    const t2 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Full Stack Engineer',
      interviewType: 'question_count',
      totalQuestionsTarget: 10,
    });

    assert('2a. interviewType is "question_count"', t2.interview.interviewType === 'question_count');
    assert('2b. totalQuestionsTarget is 10', t2.interview.totalQuestionsTarget === 10);

    for (let q = 1; q <= 9; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t2.interview._id,
        answerText: `Answer ${q}`,
      });
      assert(`2.${q}. Q${q}/10 answered -> completed === false`, res.completed === false);
    }

    const t2Final = await interviewEngine.processAnswer({
      interviewId: t2.interview._id,
      answerText: 'Answer 10',
    });

    assert('2.10. Q10/10 answered -> completed === true', t2Final.completed === true);
    const t2Db = await Interview.findById(t2.interview._id);
    assert('2c. Status is "completed"', t2Db.status === 'completed');
    assert('2d. completionReason is "questions_completed"', t2Db.completionReason === 'questions_completed');
    assert('2e. Exactly 10 questions were recorded (Q11 was NOT generated)', t2Db.questions.length === 10);

    // ---------------------------------------------------------------------------------
    // TEST 3: Timed Mode + 10 Minutes -> unlimited questions until 10 minutes expire
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 3: Timed Mode (10 Minutes Duration, Unlimited Questions) ---');
    const t3 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Cloud Architect',
      interviewType: 'timed',
      durationMinutes: 10,
    });

    assert('3a. interviewType is "timed"', t3.interview.interviewType === 'timed');
    assert('3b. durationMinutes is 10', t3.interview.durationMinutes === 10);
    assert('3c. totalQuestionsTarget is null (NO question count limit)', t3.interview.totalQuestionsTarget === null);
    assert('3d. expiresAt is set to startedAt + 10 minutes',
      Math.abs(new Date(t3.interview.expiresAt).getTime() - (new Date(t3.interview.startedAt).getTime() + 10 * 60 * 1000)) < 1000
    );

    // Fast candidate answers 8 questions in 6 minutes without stopping
    for (let q = 1; q <= 8; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t3.interview._id,
        answerText: `Fast answer ${q}`,
      });
      assert(`3.${q}. Q${q} answered in Timed Mode -> session in progress`, res.completed === false);
    }

    // Now simulate 10 minutes expiring
    await Interview.findByIdAndUpdate(t3.interview._id, {
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    // Attempt answering Question 9 after timer expired
    const t3Expired = await interviewEngine.processAnswer({
      interviewId: t3.interview._id,
      answerText: 'Submitting after 10m timer expired',
    });

    assert('3e. Submission after timer expiration returns completed === true', t3Expired.completed === true);
    const t3Db = await Interview.findById(t3.interview._id);
    assert('3f. Status is "completed"', t3Db.status === 'completed');
    assert('3g. completionReason is "time_expired"', t3Db.completionReason === 'time_expired');
    assert('3h. Completed with all 8 questions answered', t3Db.questions.length === 9); // Q9 was the active question when timer expired

    // ---------------------------------------------------------------------------------
    // TEST 4: Timed Mode + 20 Minutes -> unlimited questions until 20 minutes expire
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 4: Timed Mode (20 Minutes Duration, Unlimited Questions) ---');
    const t4 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Systems Engineer',
      interviewType: 'timed',
      durationMinutes: 20,
    });

    assert('4a. interviewType is "timed"', t4.interview.interviewType === 'timed');
    assert('4b. durationMinutes is 20', t4.interview.durationMinutes === 20);
    assert('4c. totalQuestionsTarget is null', t4.interview.totalQuestionsTarget === null);

    // Answer 11 questions
    for (let q = 1; q <= 11; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t4.interview._id,
        answerText: `Comprehensive answer ${q}`,
      });
      assert(`4.${q}. Q${q} answered with 20m duration -> completed === false`, res.completed === false);
    }

    // Simulate 20 minutes expiring
    await Interview.findByIdAndUpdate(t4.interview._id, {
      expiresAt: new Date(Date.now() - 500),
    });

    const t4Expired = await interviewEngine.completeInterview(t4.interview._id, 'time_expired');
    assert('4d. completeInterview on 20m expiration returns completed === true', t4Expired.completed === true);
    assert('4e. completionReason is "time_expired"', t4Expired.interview.completionReason === 'time_expired');

    // ---------------------------------------------------------------------------------
    // TEST 5: Timed Mode + 30 Minutes -> unlimited questions until 30 minutes expire
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 5: Timed Mode (30 Minutes Duration, Unlimited Questions) ---');
    const t5 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Staff Engineer',
      interviewType: 'timed',
      durationMinutes: 30,
    });

    assert('5a. interviewType is "timed"', t5.interview.interviewType === 'timed');
    assert('5b. durationMinutes is 30', t5.interview.durationMinutes === 30);
    assert('5c. totalQuestionsTarget is null', t5.interview.totalQuestionsTarget === null);

    // Answer 14 questions
    for (let q = 1; q <= 14; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t5.interview._id,
        answerText: `Staff level answer ${q}`,
      });
      assert(`5.${q}. Q${q} answered in 30m timed session -> completed === false`, res.completed === false);
    }

    const t5Midway = await Interview.findById(t5.interview._id);
    assert('5d. Session has 15 questions created without any cap', t5Midway.questions.length === 15);
    assert('5e. Session status remains "in_progress"', t5Midway.status === 'in_progress');

    // ---------------------------------------------------------------------------------
    // TEST 6: Verify that Timed Mode does NOT stop at Question 5, 7, or 10
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 6: Explicit Verification: Timed Mode Does NOT Stop at Q5, Q7, or Q10 ---');
    const t6 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'Principal Engineer',
      interviewType: 'timed',
      durationMinutes: 30,
    });

    const t6Id = t6.interview._id;

    // Answer Q1 through Q4
    for (let q = 1; q <= 4; q++) {
      await interviewEngine.processAnswer({ interviewId: t6Id, answerText: `Ans ${q}` });
    }

    // Answer Question 5
    const q5Res = await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 5' });
    assert('6a. Q5 answered in Timed Mode does NOT conclude the interview (completed === false)', q5Res.completed === false);
    assert('6b. Q6 was generated after Q5', q5Res.nextQuestion.questionNumber === 6);

    // Answer Question 6
    await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 6' });

    // Answer Question 7
    const q7Res = await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 7' });
    assert('6c. Q7 answered in Timed Mode does NOT conclude the interview (completed === false)', q7Res.completed === false);
    assert('6d. Q8 was generated after Q7', q7Res.nextQuestion.questionNumber === 8);

    // Answer Question 8 and 9
    await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 8' });
    await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 9' });

    // Answer Question 10
    const q10Res = await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 10' });
    assert('6e. Q10 answered in Timed Mode does NOT conclude the interview (completed === false)', q10Res.completed === false);
    assert('6f. Q11 was generated after Q10', q10Res.nextQuestion.questionNumber === 11);

    // Answer Question 11 and 12
    const q11Res = await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 11' });
    assert('6g. Q11 answered in Timed Mode -> continues (completed === false)', q11Res.completed === false);

    const q12Res = await interviewEngine.processAnswer({ interviewId: t6Id, answerText: 'Ans 12' });
    assert('6h. Q12 answered in Timed Mode -> continues (completed === false)', q12Res.completed === false);
    assert('6i. Q13 was generated after Q12', q12Res.nextQuestion.questionNumber === 13);

    const t6Db = await Interview.findById(t6Id);
    assert('6j. Status in DB is still "in_progress" at Question 13', t6Db.status === 'in_progress');
    assert('6k. totalQuestionsTarget in DB is null (strictly no question cap)', t6Db.totalQuestionsTarget === null);

    // ---------------------------------------------------------------------------------
    // TEST 7: Verify Question Count Mode (7 Questions) is completely unaffected
    // ---------------------------------------------------------------------------------
    console.log('\n--- TEST 7: Question Count Mode (7 Questions Target) Unaffected ---');
    const t7 = await interviewEngine.startInterview({
      userId: user._id,
      role: 'QA Engineer',
      interviewType: 'question_count',
      totalQuestionsTarget: 7,
    });

    for (let q = 1; q <= 6; q++) {
      const res = await interviewEngine.processAnswer({
        interviewId: t7.interview._id,
        answerText: `Test answer ${q}`,
      });
      assert(`7.${q}. Q${q}/7 answered -> completed === false`, res.completed === false);
    }

    const t7Final = await interviewEngine.processAnswer({
      interviewId: t7.interview._id,
      answerText: 'Final test answer 7',
    });

    assert('7.7. Q7/7 answered -> completed === true', t7Final.completed === true);
    const t7Db = await Interview.findById(t7.interview._id);
    assert('7a. Status is "completed"', t7Db.status === 'completed');
    assert('7b. completionReason is "questions_completed"', t7Db.completionReason === 'questions_completed');
    assert('7c. Exactly 7 questions in session', t7Db.questions.length === 7);

  } finally {
    aiProvider.generateInterviewQuestion = originalGenerateInterviewQuestion;
    aiProvider.processAnswerUnified = originalProcessAnswerUnified;
    aiProvider.generateFinalReport = originalGenerateFinalReport;

    await mongoose.connection.close();
  }

  console.log('\n====================================================');
  console.log(`MODES TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
