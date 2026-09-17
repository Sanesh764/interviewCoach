import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['Student', 'Fresher', '0-2 years', '2-5 years', '5+ years'],
      default: 'Fresher',
    },
    mode: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    personality: {
      type: String,
      enum: ['friendly', 'professional', 'strict'],
      default: 'professional',
    },
    totalQuestionsTarget: {
      type: Number,
      default: 5,
    },
    currentQuestionIndex: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    resumeData: {
      fileName: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      rawText: { type: String, default: '' },
      skills: [{ type: String }],
      projects: [{ type: String }],
      experience: [{ type: String }],
      technologies: [{ type: String }],
      education: [{ type: String }],
    },
    jobDescription: {
      type: String,
      default: '',
    },
    jobDescriptionAnalysis: {
      requiredSkills: [{ type: String }],
      preferredSkills: [{ type: String }],
      technologies: [{ type: String }],
      responsibilities: [{ type: String }],
      experienceRequirements: { type: String, default: '' },
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    categoryScores: {
      technical: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      projectKnowledge: { type: Number, default: 0 },
      behavioral: { type: Number, default: 0 },
    },
    report: {
      strengths: [{ type: String }],
      weakAreas: [
        {
          topic: { type: String },
          whatWasMissing: { type: String },
          whyItMatters: { type: String },
          whatToPractice: { type: String },
        },
      ],
      improvementPlan: [
        {
          day: { type: Number },
          title: { type: String },
          focus: { type: String },
          tasks: [{ type: String }],
        },
      ],
      summary: { type: String, default: '' },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionAnswer',
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Interview = mongoose.model('Interview', interviewSchema);
