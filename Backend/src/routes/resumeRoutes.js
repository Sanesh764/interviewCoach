import express from 'express';
import { handleResumeUpload } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadResumeMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', protect, uploadResumeMiddleware, handleResumeUpload);

export default router;
