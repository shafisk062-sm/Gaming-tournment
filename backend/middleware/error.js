exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
exports.errorHandler = (err, req, res, next) => {
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate value', field: Object.keys(err.keyPattern || {})[0] });
  res.status(status).json({ message: err.message || 'Server error' });
};
