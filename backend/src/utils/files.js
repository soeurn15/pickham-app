// Location of the uploads folder (created on start-up). Files are written and removed by services/storage.service.js.
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

module.exports = { UPLOADS_DIR };
