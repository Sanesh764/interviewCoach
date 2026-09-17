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

// Fail fast if critical environment variables are missing
if (!process.env.JWT_SECRET) {
  console.error('[Fatal Error] JWT_SECRET is not configured in environment variables.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

// Environment-based CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow non-browser requests (tools, curl, server-to-server) with no origin header
    if (!origin) {
      return callback(null, true);
    }

    // 2. Allow any localhost / 127.0.0.1 port for local development
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // 3. Allow explicit production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject all unauthorized origins
    return callback(new Error(`CORS policy rejection: Origin '${origin}' is not permitted.`));
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
