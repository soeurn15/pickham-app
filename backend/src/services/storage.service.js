// Storage driver for uploaded media. Only a local-disk driver exists today; to move to S3/R2 later,
// implement save() and remove() with the same signatures and nothing else needs to change.
const fs = require('fs/promises');
const path = require('path');
const { UPLOADS_DIR } = require('../utils/files.js');

// Saves a buffer under a generated name and returns its public URL.
async function save(name, buffer) {
  const safeName = path.basename(name);
  await fs.writeFile(path.join(UPLOADS_DIR, safeName), buffer, { flag: 'wx' });
  return `/uploads/${safeName}`;
}

// Deletes by public URL; ignores anything that is not a local upload.
async function remove(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const filepath = path.join(UPLOADS_DIR, path.basename(url));
  if (path.dirname(filepath) === UPLOADS_DIR) await fs.rm(filepath, { force: true });
}

module.exports = { save, remove };
