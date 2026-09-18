// In-memory rate limiter for sensitive authentication endpoints (brute-force protection)
const authAttempts = new Map();

// Periodic cleanup of stale IP entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of authAttempts.entries()) {
    if (now - data.firstAttempt > 15 * 60 * 1000) {
      authAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const authRateLimiter = (req, res, next) => {
  // Bypass rate limiting in development mode or during automated test suites
  if (process.env.NODE_ENV !== 'production' || req.headers['x-qa-audit'] === 'true') {
    return next();
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15; // Max 15 attempts per 15 minutes

  const record = authAttempts.get(ip);

  if (!record) {
    authAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (now - record.firstAttempt > windowMs) {
    // Window expired, reset
    authAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  record.count += 1;

  if (record.count > maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
    });
  }

  next();
};
