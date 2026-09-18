import { Interview } from '../../models/Interview.js';
import { QuestionAnswer } from '../../models/QuestionAnswer.js';
import aiProvider from '../ai/aiProvider.js';
import { synthesizeSpeech } from '../aws/pollyService.js';

export const interviewEngine = {
  // 1. Initialize an interview session and generate Question 1 (single AI call)
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
    const compactJD = jobDescription ? jobDescription.trim().substring(0, 800) : '';

    // Single unified AI call: extracts structured JD requirements (if provided) AND generates Question 1
    const generated = await aiProvider.generateInterviewQuestion({
      role,
      experienceLevel,
      personality,
      resumeData,
      jobDescription: compactJD,
      questionNumber: 1,
      totalQuestions: totalQuestionsTarget,
      previousQAs: [],
    });

    const jdAnalysis = generated.jobDescriptionAnalysis || {
      requiredSkills: [],
      preferredSkills: [],
      technologies: [],
      responsibilities: [],
      experienceRequirements: '',
    };

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
      jobDescription: compactJD,
      jobDescriptionAnalysis: jdAnalysis,
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

  // 2. Process candidate answer (Unified single Bedrock call for evaluation + next question)
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

    // Find current active question (the last question in the list)
    const currentQA = interview.questions[interview.questions.length - 1];
    if (!currentQA) {
      throw new Error('No active question found for this interview.');
    }

    // Guard against duplicate answer submission
    if (currentQA.answer || currentQA.transcript) {
      throw new Error('This question has already been answered. Please wait for the next question.');
    }

    const currentCount = interview.questions.length;
    const targetCount = interview.totalQuestionsTarget || 5;
    const isLastQuestion = currentCount >= targetCount;
    const finalAnswer = answerText || transcript || '';

    // Compact context (avoids sending bloated strings and token overload)
    const resumeSkills = interview.resumeData?.skills || [];
    const jobDescriptionContext = interview.jobDescription
      ? interview.jobDescription.substring(0, 200)
      : '';
    const previousTopics = interview.questions.map((q) => q.category).filter(Boolean);

    // Calculate dynamic adaptive difficulty from previous question scores
    const evaluatedQAs = interview.questions.filter(
      (q) => q._id.toString() !== currentQA._id.toString() && (q.scores?.overall || q.evaluation?.technicalAccuracy)
    );
    let difficultyLevel = 'balanced';
    if (evaluatedQAs.length > 0) {
      const avgScore =
        evaluatedQAs.reduce((sum, q) => sum + (q.scores?.overall || 70), 0) / evaluatedQAs.length;
      if (avgScore < 65) {
        difficultyLevel = 'foundational';
      } else if (avgScore > 80) {
        difficultyLevel = 'advanced';
      } else {
        difficultyLevel = 'balanced';
      }
    }

    // 1. Single Bedrock Call: Evaluates Answer AND decides/generates Next Question
    const combinedResult = await aiProvider.processAnswerUnified({
      question: currentQA.question,
      answer: finalAnswer,
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      personality: interview.personality,
      currentQuestionNumber: currentCount,
      totalQuestions: targetCount,
      isLastQuestion,
      resumeSkills,
      jobDescriptionContext,
      previousTopics,
      difficultyLevel,
    });

    // 2. Save evaluation to current QuestionAnswer
    currentQA.answer = finalAnswer;
    currentQA.transcript = transcript;
    currentQA.audioUrl = audioUrl;
    currentQA.mode = answerMode;
    currentQA.evaluation = combinedResult.evaluation;
    currentQA.scores = combinedResult.scores;
    currentQA.strengths = combinedResult.strengths || [];
    currentQA.missingPoints = combinedResult.missingPoints || [];
    currentQA.betterAnswer = combinedResult.betterAnswer || '';
    await currentQA.save();

    // 3. If this was the final question, conclude interview
    if (isLastQuestion || !combinedResult.nextQuestion) {
      return await interviewEngine.completeInterview(interviewId);
    }

    const nextQuestionData = combinedResult.nextQuestion;
    const isFollowUp = combinedResult.shouldFollowUp || false;

    // 4. Generate Polly audio for next question if in voice mode
    let aiSpeechAudioUrl = '';
    if (interview.mode === 'voice' || answerMode === 'voice') {
      try {
        const speech = await synthesizeSpeech(nextQuestionData.question);
        aiSpeechAudioUrl = speech.audioUrl;
      } catch (err) {
        console.warn('[InterviewEngine] Polly synthesis warning:', err.message);
      }
    }

    // 5. Create next QuestionAnswer
    const nextQA = await QuestionAnswer.create({
      interviewId: interview._id,
      questionNumber: currentCount + 1,
      question: nextQuestionData.question,
      category: isFollowUp ? 'Follow-up' : nextQuestionData.category || 'Technical',
      isFollowUp,
      aiSpeechAudioUrl,
      mode: interview.mode,
    });

    try {
      interview.questions.push(nextQA._id);
      interview.currentQuestionIndex = currentCount + 1;
      await interview.save();
    } catch (saveErr) {
      await QuestionAnswer.findByIdAndDelete(nextQA._id).catch(() => {});
      throw saveErr;
    }

    return {
      completed: false,
      interview,
      nextQuestion: nextQA,
      evaluation: currentQA,
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

    // Call AI to generate final report
    const finalReport = await aiProvider.generateFinalReport({
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
