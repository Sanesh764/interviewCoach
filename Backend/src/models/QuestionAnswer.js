import mongoose from 'mongoose';

const questionAnswerSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'Project', 'Behavioral', 'Follow-up', 'General'],
      default: 'Technical',
    },
    audioUrl: {
      type: String,
      default: '',
    },
    aiSpeechAudioUrl: {
      type: String,
      default: '',
    },
    answer: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    evaluation: {
      technicalAccuracy: { type: Number, min: 0, max: 10 },
      relevance: { type: Number, min: 0, max: 10 },
      depth: { type: Number, min: 0, max: 10 },
      clarity: { type: Number, min: 0, max: 10 },
      completeness: { type: Number, min: 0, max: 10 },
      communication: { type: Number, min: 0, max: 10 },
    },
    scores: {
      overall: { type: Number, min: 0, max: 100 },
      technical: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      problemSolving: { type: Number, min: 0, max: 100 },
      projectKnowledge: { type: Number, min: 0, max: 100 },
      behavioral: { type: Number, min: 0, max: 100 },
    },
    strengths: [{ type: String }],
    missingPoints: [{ type: String }],
    betterAnswer: { type: String, default: '' },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

export const QuestionAnswer = mongoose.model('QuestionAnswer', questionAnswerSchema);
