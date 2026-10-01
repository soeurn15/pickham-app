// JSON error responses (e.g. upload size/type rejections from multer).
const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err instanceof multer.MulterError || /Only images/.test(err.message) ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 400 ? err.message : 'Internal server error' });
}

module.exports = errorHandler;