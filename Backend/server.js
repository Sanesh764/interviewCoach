import 'dotenv/config';
import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import resumeRoutes from './src/routes/resumeRoutes.js';
import interviewRoutes from './src/routes/interviewRoutes.js';

const app = express();
app.disable('x-powered-by');

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl) or any localhost port
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'InterviewCoach AI API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interviews', interviewRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] InterviewCoach AI backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;
