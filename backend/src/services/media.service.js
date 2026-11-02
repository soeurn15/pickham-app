// Turns an uploaded buffer into a verified, metadata-free image plus a small thumbnail.
const crypto = require('crypto');
const sharp = require('sharp');
const storage = require('./storage.service.js');
const { badRequest } = require('../utils/httpError.js');

const FORMATS = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif' };
const MAX_PIXELS = 50_000_000; // rejects decompression bombs
const THUMB_WIDTH = 480;

const open = buffer => sharp(buffer, { limitInputPixels: MAX_PIXELS });

async function processImage(buffer) {
  let meta;
  try {
    // Decoding the real bytes proves the file is an image, whatever its name or declared type says
    meta = await open(buffer).metadata();
  } catch {
    throw badRequest('The file is not a valid image');
  }
  const ext = FORMATS[meta.format];
  if (!ext) throw badRequest('Only images are allowed (jpg, png, gif, webp)');

  const id = crypto.randomBytes(16).toString('hex');
  // Re-encoding drops EXIF data such as GPS location; animated GIFs are kept as they are
  const image = meta.format === 'gif' ? buffer : await open(buffer).rotate().toFormat(meta.format).toBuffer();
  const thumb = await open(buffer)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  const imageUrl = await storage.save(`${id}.${ext}`, image);
  const thumbUrl = await storage.save(`${id}_thumb.webp`, thumb);
  return { imageUrl, thumbUrl };
}

module.exports = { processImage };
