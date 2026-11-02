// Image uploads: held in memory (10 MB max, one file, images only), then verified and stored by media.service.
const multer = require('multer');
const { badRequest } = require('../utils/httpError.js');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    cb(badRequest('Only images are allowed (jpg, png, gif, webp)'));
  }
});

module.exports = { upload };
