const { withTransaction } = require('../config/db.js');
const pinRepo = require('../repositories/pin.repository.js');
const boardRepo = require('../repositories/board.repository.js');
const categoryRepo = require('../repositories/category.repository.js');
const media = require('./media.service.js');
const storage = require('./storage.service.js');
const { notFound, forbidden, badRequest } = require('../utils/httpError.js');

async function list(viewerId, query) {
  const [pins, total] = await Promise.all([pinRepo.search(viewerId, query), pinRepo.countMatching(query)]);
  return { pins, total };
}

async function detail(viewerId, pinId) {
  const pin = await pinRepo.findDetail(viewerId, pinId);
  if (!pin) throw notFound('Pin not found');

  const tags = pin.tags ? pin.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
  return { pin, similar: await pinRepo.findSimilar(pin, tags) };
}

// Stores the (verified) image, then saves the pin and its optional board link in one transaction.
async function create(user, input, file) {
  if (!file && !input.externalImageUrl) throw badRequest('Please upload an image or provide a valid image URL');

  const stored = file ? await media.processImage(file.buffer) : { imageUrl: input.externalImageUrl, thumbUrl: null };
  try {
    // Unknown (e.g. just-deleted) categories fall back to "Other"
    const category = (await categoryRepo.names()).includes(input.category) ? input.category : categoryRepo.FALLBACK_CATEGORY;

    return await withTransaction(async conn => {
      const pinId = await pinRepo.create({ ...input, ...stored, category, userId: user.id }, conn);
      if (input.boardId && (await boardRepo.isOwnedBy(input.boardId, user.id))) {
        await boardRepo.addPin(input.boardId, pinId, conn);
      }
      return pinId;
    });
  } catch (error) {
    // Don't leave orphaned files behind when the database write fails
    if (file) await Promise.all([storage.remove(stored.imageUrl), storage.remove(stored.thumbUrl)]);
    throw error;
  }
}

async function remove(user, pinId) {
  const pin = await pinRepo.findOwnerAndImage(pinId);
  if (!pin) throw notFound('Pin not found');
  if (pin.user_id !== user.id && user.role !== 'admin') throw forbidden('You are not authorized to delete this pin');

  await pinRepo.remove(pinId);
  await Promise.all([storage.remove(pin.image_url), storage.remove(pin.thumb_url)]);
}

module.exports = { list, detail, create, remove };
