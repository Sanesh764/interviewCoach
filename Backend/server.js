import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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

// AWS Elastic Beanstalk sits behind an Nginx / ALB reverse proxy
// Trust the first proxy so req.ip correctly resolves client IP from X-Forwarded-For
app.set('trust proxy', 1);

// Environment-based CORS configuration
// Supports CLIENT_URL, FRONTEND_URL, and CORS_ORIGIN (including comma-separated lists)
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

const allowedOrigins = rawOrigins
  .flatMap((str) => str.split(','))
  .map((str) => str.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow non-browser requests (tools, curl, health checks, server-to-server) with no origin header
    if (!origin) {
      return callback(null, true);
    }

    // 2. Allow any localhost / 127.0.0.1 port for local development
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // 3. Allow explicit production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject unauthorized origins without throwing a 500 error
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check endpoints (supports EB default ALB health check on '/' as well as '/health' and '/api/health')
app.get(['/api/health', '/health', '/'], (req, res) => {
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

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`[Server] InterviewCoach AI backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

// Graceful shutdown handling for Elastic Beanstalk updates and container termination
const gracefulShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed.');
    });
  }
  try {
    await mongoose.connection.close(false);
    console.log('[MongoDB] Connection closed.');
  } catch (err) {
    console.error('[MongoDB Error] Error closing connection:', err.message);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
  process.exit(1);
});

startServer();

export default app;
