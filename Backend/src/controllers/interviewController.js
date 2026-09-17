import { Interview } from '../models/Interview.js';
import { QuestionAnswer } from '../models/QuestionAnswer.js';
import { interviewEngine } from '../services/interview/interviewEngine.js';
import { processVoiceRecording } from '../services/voice/voiceService.js';

// @desc    Create a new interview session and generate Question 1
// @route   POST /api/interviews
// @access  Private
export const createInterview = async (req, res, next) => {
  try {
    const {
      role,
      experienceLevel,
      mode,
      personality,
      totalQuestionsTarget,
      jobDescription,
      resumeData,
    } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const session = await interviewEngine.startInterview({
      userId: req.user.id,
      role,
      experienceLevel: experienceLevel || 'Fresher',
      mode: mode || 'text',
      personality: personality || 'professional',
      totalQuestionsTarget: totalQuestionsTarget || 5,
      jobDescription: jobDescription || '',
      resumeData: resumeData || null,
    });

    res.status(201).json({
      success: true,
      interview: session.interview,
      currentQuestion: session.currentQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview session state & current question
// @route   GET /api/interviews/:id
// @access  Private
export const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id, // Enforce user isolation
    }).populate('questions');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // Current active question is the last question in the sequence
    const currentQuestion = interview.questions[interview.questions.length - 1] || null;

    res.status(200).json({
      success: true,
      interview,
      currentQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit candidate answer in text mode
// @route   POST /api/interviews/:id/answer
// @access  Private
export const submitTextAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Answer text is required' });
    }

    // Verify ownership
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const result = await interviewEngine.processAnswer({
      interviewId: req.params.id,
      answerText: answer.trim(),
      answerMode: 'text',
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit candidate voice recording (Audio -> S3 -> Transcribe -> Bedrock)
// @route   POST /api/interviews/:id/voice-answer
// @access  Private
export const submitVoiceAnswer = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio recording file is required' });
    }

    // Verify ownership
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // 1. Process voice: Upload to S3 & transcribe with Amazon Transcribe
    const { audioUrl, transcript } = await processVoiceRecording({
      audioBuffer: req.file.buffer,
      mimeType: req.file.mimetype || 'audio/webm',
    });

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not detect clear speech in the audio recording. Please try speaking again.',
      });
    }

    // 2. Pass transcript to unified interview engine
    const result = await interviewEngine.processAnswer({
      interviewId: req.params.id,
      answerText: transcript,
      audioUrl,
      transcript,
      answerMode: 'voice',
    });

    res.status(200).json({
      success: true,
      transcript,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Switch interview mode (text <-> voice) without losing state
// @route   PATCH /api/interviews/:id/mode
// @access  Private
export const switchMode = async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['text', 'voice'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Invalid mode. Must be text or voice.' });
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { mode },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    res.status(200).json({ success: true, mode: interview.mode });
  } catch (error) {
    next(error);
  }
};

// @desc    Conclude interview and generate report
// @route   POST /api/interviews/:id/complete
// @access  Private
export const completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const result = await interviewEngine.completeInterview(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete interview report
// @route   GET /api/interviews/:id/report
// @access  Private
export const getInterviewReport = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('questions');

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    res.status(200).json({
      success: true,
      interview,
      questions: interview.questions || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user interview history
// @route   GET /api/interviews
// @access  Private
export const getInterviewHistory = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-resumeData.rawText -jobDescription');

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate dashboard statistics and progression trends
// @route   GET /api/interviews/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const completedInterviews = await Interview.find({
      userId: req.user.id,
      status: 'completed',
    }).sort({ completedAt: 1 });

    const totalInterviews = completedInterviews.length;

    // Calculate average score
    const totalScore = completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
    const averageScore = totalInterviews > 0 ? Math.round(totalScore / totalInterviews) : 0;

    // Calculate category aggregates to identify strongest & weakest skill
    const categoryTotals = {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      projectKnowledge: 0,
      behavioral: 0,
    };

    completedInterviews.forEach((item) => {
      if (item.categoryScores) {
        categoryTotals.technical += item.categoryScores.technical || 0;
        categoryTotals.communication += item.categoryScores.communication || 0;
        categoryTotals.problemSolving += item.categoryScores.problemSolving || 0;
        categoryTotals.projectKnowledge += item.categoryScores.projectKnowledge || 0;
        categoryTotals.behavioral += item.categoryScores.behavioral || 0;
      }
    });

    let strongestSkill = 'N/A';
    let weakestSkill = 'N/A';

    if (totalInterviews > 0) {
      const categoryNames = {
        technical: 'Technical Knowledge',
        communication: 'Communication',
        problemSolving: 'Problem Solving',
        projectKnowledge: 'Project Knowledge',
        behavioral: 'Behavioral Skills',
      };

      const sortedCategories = Object.entries(categoryTotals)
        .map(([key, sum]) => ({
          key,
          name: categoryNames[key],
          avg: Math.round(sum / totalInterviews),
        }))
        .sort((a, b) => b.avg - a.avg);

      strongestSkill = sortedCategories[0]?.name || 'Technical';
      weakestSkill = sortedCategories[sortedCategories.length - 1]?.name || 'Behavioral';
    }

    // Score history array for chart
    const scoreHistory = completedInterviews.map((item) => ({
      date: item.completedAt,
      role: item.role,
      overallScore: item.overallScore,
      technical: item.categoryScores?.technical || 0,
      communication: item.categoryScores?.communication || 0,
    }));

    // Recent 5 interviews (latest first)
    const recentInterviews = await Interview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('role experienceLevel mode status overallScore createdAt completedAt');

    // Recommended practice logic
    let recommendedPractice = 'Start your first interview to get personalized coaching.';
    if (totalInterviews > 0) {
      recommendedPractice = `Focus on ${weakestSkill}. Review fundamentals, explain technical decisions with clear trade-offs, and practice with a Strict interviewer personality.`;
    }

    res.status(200).json({
      success: true,
      stats: {
        totalInterviews,
        averageScore,
        strongestSkill,
        weakestSkill,
        scoreHistory,
        recommendedPractice,
      },
      recentInterviews,
    });
  } catch (error) {
    next(error);
  }
};
