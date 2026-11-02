// One consistent error shape for every failure: { error: "message" }.
const multer = require('multer');
const { HttpError } = require('../utils/httpError.js');

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'Image is too large (10 MB maximum)',
  LIMIT_FILE_COUNT: 'Only one file can be uploaded at a time',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field'
};

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ error: MULTER_MESSAGES[err.code] || 'Upload failed' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That already exists' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'Referenced item not found' });

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler, notFound };
