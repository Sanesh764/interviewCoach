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
    interviewType = 'question_count',
    totalQuestionsTarget = 5,
    durationMinutes = null,
    jobDescription = '',
    resumeData = null,
  }) => {
    const compactJD = jobDescription ? jobDescription.trim().substring(0, 800) : '';

    const isTimed = interviewType === 'timed';
    const validDurations = [10, 20, 30];
    const targetDuration = isTimed
      ? (validDurations.includes(Number(durationMinutes)) ? Number(durationMinutes) : 20)
      : null;

    const startedAt = new Date();
    const expiresAt = isTimed ? new Date(startedAt.getTime() + targetDuration * 60 * 1000) : null;
    const targetQuestions = isTimed
      ? null
      : ([5, 7, 10].includes(Number(totalQuestionsTarget)) ? Number(totalQuestionsTarget) : 5);

    // Single unified AI call: extracts structured JD requirements (if provided) AND generates Question 1
    const generated = await aiProvider.generateInterviewQuestion({
      role,
      experienceLevel,
      personality,
      resumeData,
      jobDescription: compactJD,
      questionNumber: 1,
      totalQuestions: targetQuestions,
      previousQAs: [],
    });

    const jdAnalysis = generated.jobDescriptionAnalysis || {
      requiredSkills: [],
      preferredSkills: [],
      technologies: [],
      responsibilities: [],
      experienceRequirements: '',
    };

    const q1ModelUsed = generated._metadata?.modelUsed || '';
    const q1LatencyMs = generated._metadata?.latencyMs || 0;
    const q1Usage = generated._metadata?.usage || {};

    // Create Interview Document
    const interview = await Interview.create({
      userId,
      role,
      experienceLevel,
      mode,
      personality,
      interviewType: isTimed ? 'timed' : 'question_count',
      totalQuestionsTarget: targetQuestions,
      durationMinutes: targetDuration,
      startedAt,
      expiresAt,
      currentQuestionIndex: 1,
      status: 'in_progress',
      resumeData: resumeData || {},
      jobDescription: compactJD,
      jobDescriptionAnalysis: jdAnalysis,
      questions: [],
      modelsUsed: q1ModelUsed ? [q1ModelUsed] : [],
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

    // Save Question 1 with model metadata
    const firstQA = await QuestionAnswer.create({
      interviewId: interview._id,
      questionNumber: 1,
      question: generated.question,
      category: generated.category || 'General',
      isFollowUp: false,
      aiSpeechAudioUrl,
      mode,
      modelUsed: q1ModelUsed,
      latencyMs: q1LatencyMs,
      tokenUsage: {
        inputTokens: q1Usage.inputTokens || 0,
        outputTokens: q1Usage.outputTokens || 0,
        totalTokens: q1Usage.totalTokens || 0,
      },
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
      return {
        completed: true,
        interview,
        report: interview.report,
      };
    }

    const isTimed = interview.interviewType === 'timed';

    // 0. Server-authoritative expiration check BEFORE processing answer (strictly for timed mode)
    if (isTimed) {
      const freshMeta = await Interview.findById(interviewId).select('expiresAt status');
      const activeExpiresAt = freshMeta?.expiresAt || interview.expiresAt;
      const now = new Date();
      if (activeExpiresAt && now >= new Date(activeExpiresAt)) {
        console.log(
          `[InterviewEngine] Timed interview ${interviewId} time expired before processing answer (expiresAt: ${activeExpiresAt}). Concluding session.`
        );
        return await interviewEngine.completeInterview(interviewId, 'time_expired');
      }
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
    // In question_count mode: targetCount is selected 5, 7, or 10.
    // In timed mode: targetCount is null (no question cap), isLastQuestion is false.
    const targetCount = isTimed ? null : (interview.totalQuestionsTarget || 5);
    const isLastQuestion = isTimed ? false : currentCount >= targetCount;
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

    const modelUsed = combinedResult._metadata?.modelUsed || '';
    const latencyMs = combinedResult._metadata?.latencyMs || 0;
    const tokenUsage = combinedResult._metadata?.usage || {};

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
    currentQA.modelUsed = modelUsed;
    currentQA.latencyMs = latencyMs;
    currentQA.tokenUsage = {
      inputTokens: tokenUsage.inputTokens || 0,
      outputTokens: tokenUsage.outputTokens || 0,
      totalTokens: tokenUsage.totalTokens || 0,
    };
    await currentQA.save();

    // Track model used across the interview session
    if (modelUsed && !interview.modelsUsed.includes(modelUsed)) {
      interview.modelsUsed.push(modelUsed);
    }

    // 3. Conclude interview based on authoritative condition for each mode:
    if (isTimed) {
      // In Timed Mode: The ONLY stopping condition is time expiration
      const freshMeta = await Interview.findById(interviewId).select('expiresAt status');
      const activeExpiresAt = freshMeta?.expiresAt || interview.expiresAt;
      const isExpiredAfterEval = activeExpiresAt && new Date() >= new Date(activeExpiresAt);
      if (isExpiredAfterEval) {
        console.log(
          `[InterviewEngine] Timed interview ${interviewId} time expired during evaluation. Gracefully concluding.`
        );
        return await interviewEngine.completeInterview(interviewId, 'time_expired');
      }
    } else {
      // In Question Count Mode: The ONLY stopping condition is reaching target question count
      if (isLastQuestion) {
        return await interviewEngine.completeInterview(interviewId, 'questions_completed');
      }
    }

    let nextQuestionData = combinedResult.nextQuestion;
    let isFollowUp = combinedResult.shouldFollowUp || false;

    // Safety fallback: If AI returned null or missing nextQuestion while session is still in progress:
    // (In question_count mode: currentCount < targetCount; In timed mode: always in progress until timer expires)
    const shouldHaveNextQuestion = isTimed || currentCount < targetCount;

    if (shouldHaveNextQuestion && (!nextQuestionData || !nextQuestionData.question || typeof nextQuestionData.question !== 'string')) {
      console.warn(
        `[InterviewEngine] nextQuestion missing from processAnswerUnified at question ${currentCount}${targetCount ? `/${targetCount}` : ' (timed mode)'}. Generating fallback question...`
      );
      try {
        const fallbackGenerated = await aiProvider.generateInterviewQuestion({
          role: interview.role,
          experienceLevel: interview.experienceLevel,
          personality: interview.personality,
          resumeData: interview.resumeData,
          jobDescriptionAnalysis: interview.jobDescriptionAnalysis,
          questionNumber: currentCount + 1,
          totalQuestions: targetCount,
          previousQAs: interview.questions,
        });

        if (fallbackGenerated && fallbackGenerated.question) {
          nextQuestionData = {
            question: fallbackGenerated.question,
            category: fallbackGenerated.category || 'Technical',
          };
          isFollowUp = false;
        }
      } catch (fallbackErr) {
        console.error('[InterviewEngine] Fallback question generation failed:', fallbackErr.message);
      }
    }

    // Ultimate safeguard: If fallback generation was unable to provide question text,
    // provide a contextual role question so the interview strictly continues
    if (!nextQuestionData || !nextQuestionData.question) {
      nextQuestionData = {
        question: `Could you describe an example of how you apply core ${interview.role} engineering principles and trade-off considerations in your technical projects?`,
        category: 'Technical',
      };
      isFollowUp = false;
    }

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
      modelUsed,
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
  completeInterview: async (interviewId, completionReason = 'questions_completed') => {
    const interview = await Interview.findById(interviewId).populate('questions');
    if (!interview) {
      throw new Error('Interview not found');
    }

    // If already completed and has report, return immediately
    if (interview.status === 'completed' && interview.report?.summary) {
      return {
        completed: true,
        interview,
        report: interview.report,
      };
    }

    const isTimed = interview.interviewType === 'timed';
    let effectiveReason = completionReason;
    if (isTimed) {
      const freshMeta = await Interview.findById(interviewId).select('expiresAt');
      const activeExpiresAt = freshMeta?.expiresAt || interview.expiresAt;
      if (activeExpiresAt && new Date() >= new Date(activeExpiresAt)) {
        effectiveReason = 'time_expired';
      }
    } else {
      effectiveReason = completionReason === 'user_ended' ? 'user_ended' : 'questions_completed';
    }

    // Filter questions that have been answered
    const answeredQAs = interview.questions.filter((q) => q.answer || q.transcript);

    // Call AI to generate final report
    const finalReport = await aiProvider.generateFinalReport({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      questionAnswers: answeredQAs.length > 0 ? answeredQAs : interview.questions,
    });

    const reportModelUsed = finalReport._metadata?.modelUsed || '';

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.completionReason = effectiveReason;
    interview.overallScore = finalReport.overallScore || 0;
    interview.categoryScores = finalReport.categoryScores || {};
    interview.finalReportModelUsed = reportModelUsed;
    if (reportModelUsed && !interview.modelsUsed.includes(reportModelUsed)) {
      interview.modelsUsed.push(reportModelUsed);
    }

    let reportSummary = finalReport.summary || '';
    if (isTimed && effectiveReason === 'time_expired') {
      const answeredCount = answeredQAs.length;
      reportSummary = `[Session concluded: ${interview.durationMinutes || 20}-minute timed interview elapsed. Diagnostic evaluated based on ${answeredCount} completed questions.] ${reportSummary}`.trim();
    }

    interview.report = {
      strengths: finalReport.strengths || [],
      weakAreas: finalReport.weakAreas || [],
      improvementPlan: finalReport.improvementPlan || [],
      summary: reportSummary,
    };

    await interview.save();

    return {
      completed: true,
      interview,
      report: interview.report,
    };
  },
};
