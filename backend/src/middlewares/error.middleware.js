export function notFound(req, res) {
  return res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  return res.status(status).json({
    message: error.message || 'Internal server error',
  });
}
