function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.stack);
  } else {
    console.error('❌ Error:', message);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
  }

  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? message : err.stack,
  });
}

module.exports = errorHandler;