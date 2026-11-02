// Likes, favourites and comments on pins.
const repo = require('../repositories/interaction.repository.js');
const pinRepo = require('../repositories/pin.repository.js');
const { notFound } = require('../utils/httpError.js');

async function assertPin(pinId) {
  if (!(await pinRepo.exists(pinId))) throw notFound('Pin not found');
}

async function like(userId, pinId) {
  await assertPin(pinId);
  await repo.addLike(userId, pinId);
  return { success: true, likes_count: await repo.countLikes(pinId) };
}

async function unlike(userId, pinId) {
  await repo.removeLike(userId, pinId);
  return { success: true, likes_count: await repo.countLikes(pinId) };
}

async function favorite(userId, pinId) {
  await assertPin(pinId);
  await repo.addFavorite(userId, pinId);
  return { success: true, is_favorited: true };
}

async function unfavorite(userId, pinId) {
  await repo.removeFavorite(userId, pinId);
  return { success: true, is_favorited: false };
}

const favorites = userId => repo.listFavorites(userId);

async function comments(pinId) {
  await assertPin(pinId);
  return repo.listComments(pinId);
}

async function addComment(userId, pinId, text) {
  await assertPin(pinId);
  return repo.addComment(pinId, userId, text);
}

module.exports = { like, unlike, favorite, unfavorite, favorites, comments, addComment };
