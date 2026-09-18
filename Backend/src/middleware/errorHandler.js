export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Bedrock ThrottlingException (Quota limit)
  if (err.name === 'ThrottlingException' || err.statusCode === 429) {
    statusCode = 429;
    message =
      'AI interview service is temporarily unavailable because the AI provider has reached its current usage limit. Please try again later.';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 10MB.'
        : `File upload error: ${err.message}`;
  } else if (
    err.name === 'CredentialsProviderError' ||
    err.name === 'ServiceUnavailable' ||
    err.message?.includes('credentials') ||
    err.message?.includes('Bedrock') ||
    err.name === 'AccessDeniedException'
  ) {
    statusCode = 503;
    message =
      'AI interview service is temporarily unavailable. Please try again later.';
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
