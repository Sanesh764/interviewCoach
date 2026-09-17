import { Interview } from '../../models/Interview.js';
import { QuestionAnswer } from '../../models/QuestionAnswer.js';
import * as bedrockService from '../ai/bedrockService.js';
import { synthesizeSpeech } from '../aws/pollyService.js';

export const interviewEngine = {
  // 1. Initialize an interview session and generate Question 1
  startInterview: async ({
    userId,
    role,
    experienceLevel,
    mode = 'text',
    personality = 'professional',
    totalQuestionsTarget = 5,
    jobDescription = '',
    resumeData = null,
  }) => {
    // If JD is provided, analyze it via Bedrock
    let jobDescriptionAnalysis = null;
    if (jobDescription && jobDescription.trim().length > 20) {
      try {
        jobDescriptionAnalysis = await bedrockService.analyzeJobDescription(jobDescription);
      } catch (err) {
        console.warn('[InterviewEngine] JD analysis warning:', err.message);
      }
    }

    // Generate Question 1 first to ensure AI service is functional
    const generated = await bedrockService.generateInterviewQuestion({
      role,
      experienceLevel,
      personality,
      resumeData,
      jobDescriptionAnalysis,
      questionNumber: 1,
      totalQuestions: totalQuestionsTarget,
      previousQAs: [],
    });

    // Create Interview Document
    const interview = await Interview.create({
      userId,
      role,
      experienceLevel,
      mode,
      personality,
      totalQuestionsTarget,
      currentQuestionIndex: 1,
      status: 'in_progress',
      resumeData: resumeData || {},
      jobDescription,
      jobDescriptionAnalysis: jobDescriptionAnalysis || {},
      questions: [],
    });

    // Synthesize audio speech if mode is voice (optional for text)
    let aiSpeechAudioUrl = '';
    if (mode === 'voice') {
      try {
        const speech = await synthesizeSpeech(generated.question);
        aiSpeechAudioUrl = speech.audioUrl;
      } catch (err) {
        console.warn('[InterviewEngine] Polly synthesis warning for Q1:', err.message);
      }
    }

    // Save Question 1
    const firstQA = await QuestionAnswer.create({
      interviewId: interview._id,
      questionNumber: 1,
      question: generated.question,
      category: generated.category || 'General',
      isFollowUp: false,
      aiSpeechAudioUrl,
      mode,
    });

    interview.questions.push(firstQA._id);
    await interview.save();

    return {
      interview,
      currentQuestion: firstQA,
    };
  },

  // 2. Process candidate answer (Text or Transcript from Voice)
  processAnswer: async ({
    interviewId,
    answerText,
    audioUrl = '',
    transcript = '',
    answerMode = 'text',
  }) => {
    const interview = await Interview.findById(interviewId).populate('questions');
    if (!interview) {
      throw new Error('Interview session not found.');
    }

    if (interview.status === 'completed') {
      throw new Error('This interview session is already completed.');
    }

    // Find current active question (the last question in the list without an answer)
    const currentQA = interview.questions[interview.questions.length - 1];
    if (!currentQA) {
      throw new Error('No active question found for this interview.');
    }

    // 1. Evaluate answer using Bedrock
    const finalAnswer = answerText || transcript || '';
    const evalResult = await bedrockService.evaluateAnswer({
      question: currentQA.question,
      answer: finalAnswer,
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      personality: interview.personality,
    });

    // 2. Save evaluation to current QuestionAnswer
    currentQA.answer = finalAnswer;
    currentQA.transcript = transcript;
    currentQA.audioUrl = audioUrl;
    currentQA.mode = answerMode;
    currentQA.evaluation = evalResult.evaluation;
    currentQA.scores = evalResult.scores;
    currentQA.strengths = evalResult.strengths || [];
    currentQA.missingPoints = evalResult.missingPoints || [];
    currentQA.betterAnswer = evalResult.betterAnswer || '';
    await currentQA.save();

    const currentCount = interview.questions.length;
    const targetCount = interview.totalQuestionsTarget || 5;

    // 3. Determine if interview is finished
    // If we have reached total questions target and are not in a crucial follow-up
    if (currentCount >= targetCount) {
      return await interviewEngine.completeInterview(interviewId);
    }

    // 4. Dynamic Follow-Up System
    // If Bedrock suggested follow-up AND we have not already done multiple consecutive follow-ups
    let nextQuestionData = null;
    let isFollowUp = false;

    if (evalResult.shouldFollowUp && !currentQA.isFollowUp) {
      try {
        nextQuestionData = await bedrockService.generateFollowUp({
          question: currentQA.question,
          answer: finalAnswer,
          evaluation: evalResult,
          role: interview.role,
          personality: interview.personality,
        });
        isFollowUp = true;
      } catch (err) {
        console.warn('[InterviewEngine] Follow-up generation failed, proceeding to next topic:', err.message);
      }
    }

    // If no follow-up requested or follow-up failed, generate next topic question
    if (!nextQuestionData) {
      nextQuestionData = await bedrockService.generateInterviewQuestion({
        role: interview.role,
        experienceLevel: interview.experienceLevel,
        personality: interview.personality,
        resumeData: interview.resumeData,
        jobDescriptionAnalysis: interview.jobDescriptionAnalysis,
        questionNumber: currentCount + 1,
        totalQuestions: targetCount,
        previousQAs: interview.questions,
      });
      isFollowUp = false;
    }

    // 5. Generate Polly audio for next question if in voice mode
    let aiSpeechAudioUrl = '';
    if (interview.mode === 'voice' || answerMode === 'voice') {
      try {
        const speech = await synthesizeSpeech(nextQuestionData.question);
        aiSpeechAudioUrl = speech.audioUrl;
      } catch (err) {
        console.warn('[InterviewEngine] Polly synthesis warning:', err.message);
      }
    }

    // 6. Create next QuestionAnswer
    const nextQA = await QuestionAnswer.create({
      interviewId: interview._id,
      questionNumber: currentCount + 1,
      question: nextQuestionData.question,
      category: isFollowUp ? 'Follow-up' : nextQuestionData.category || 'Technical',
      isFollowUp,
      aiSpeechAudioUrl,
      mode: interview.mode,
    });

    interview.questions.push(nextQA._id);
    interview.currentQuestionIndex = currentCount + 1;
    await interview.save();

    return {
      completed: false,
      interview,
      nextQuestion: nextQA,
      transcript,
    };
  },

  // 3. Finalize interview, generate comprehensive report & 7-day plan
  completeInterview: async (interviewId) => {
    const interview = await Interview.findById(interviewId).populate('questions');
    if (!interview) {
      throw new Error('Interview not found');
    }

    // Filter questions that have been answered
    const answeredQAs = interview.questions.filter((q) => q.answer || q.transcript);

    // Call Bedrock to generate final report
    const finalReport = await bedrockService.generateFinalReport({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      questionAnswers: answeredQAs.length > 0 ? answeredQAs : interview.questions,
    });

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.overallScore = finalReport.overallScore || 0;
    interview.categoryScores = finalReport.categoryScores || {};
    interview.report = {
      strengths: finalReport.strengths || [],
      weakAreas: finalReport.weakAreas || [],
      improvementPlan: finalReport.improvementPlan || [],
      summary: finalReport.summary || '',
    };

    await interview.save();

    return {
      completed: true,
      interview,
      report: interview.report,
    };
  },
};
