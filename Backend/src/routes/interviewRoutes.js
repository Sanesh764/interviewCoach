import express from 'express';
import {
  createInterview,
  getInterview,
  submitTextAnswer,
  submitVoiceAnswer,
  switchMode,
  completeInterview,
  getInterviewReport,
  getInterviewHistory,
  getDashboardStats,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAudioMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Dashboard Stats (placed before :id route)
router.get('/dashboard/stats', protect, getDashboardStats);

// History & Creation
router.route('/')
  .post(protect, createInterview)
  .get(protect, getInterviewHistory);

// Single Interview Operations
router.get('/:id', protect, getInterview);
router.post('/:id/answer', protect, submitTextAnswer);
router.post('/:id/voice-answer', protect, uploadAudioMiddleware, submitVoiceAnswer);
router.patch('/:id/mode', protect, switchMode);
router.post('/:id/complete', protect, completeInterview);
router.get('/:id/report', protect, getInterviewReport);

export default router;
