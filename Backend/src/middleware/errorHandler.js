export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Bedrock ThrottlingException (Quota limit)
  if (err.name === 'ThrottlingException' || err.statusCode === 429) {
    statusCode = 429;
    message = err.message;
  } else if (
    err.name === 'CredentialsProviderError' ||
    err.message?.includes('credentials') ||
    err.message?.includes('Bedrock') ||
    err.name === 'AccessDeniedException'
  ) {
    statusCode = 503;
    message = err.message.startsWith('AI service is not configured')
      ? err.message
      : `AI service configuration error: ${err.message}. Please configure AWS Bedrock credentials and model access in Backend/.env.`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'An account with this email already exists.';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
