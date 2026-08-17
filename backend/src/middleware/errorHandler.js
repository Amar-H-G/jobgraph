/**
 * Global error handler middleware.
 * Catches errors thrown by controllers/services.
 * Never exposes stack traces or internal details to the client.
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Log full error server-side for debugging
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Database connectivity error
  if (
    err.code === 'ServiceUnavailable' ||
    err.message?.includes('Could not perform discovery') ||
    err.message?.includes('Failed to connect')
  ) {
    return res.status(503).json({
      error: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }

  // Validation error (thrown manually in controllers)
  if (err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }

  // Not found (thrown manually)
  if (err.statusCode === 404) {
    return res.status(404).json({ error: err.message });
  }

  // Default 500
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
};
