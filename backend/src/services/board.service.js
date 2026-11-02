const boardRepo = require('../repositories/board.repository.js');
const pinRepo = require('../repositories/pin.repository.js');
const { notFound, forbidden } = require('../utils/httpError.js');

async function assertOwner(userId, boardId) {
  if (!(await boardRepo.findById(boardId))) throw notFound('Board not found');
  if (!(await boardRepo.isOwnedBy(boardId, userId))) throw forbidden('You can only change your own boards');
}

const list = userId => boardRepo.listForUser(userId);

async function create(userId, { name, description }) {
  const id = await boardRepo.create({ name, description, userId });
  return { id, name, description, pins_count: 0 };
}

async function pins(viewerId, boardId) {
  const board = await boardRepo.findById(boardId);
  if (!board) throw notFound('Board not found');
  return { board, pins: await boardRepo.listPins(viewerId, boardId) };
}

async function addPin(userId, boardId, pinId) {
  await assertOwner(userId, boardId);
  if (!(await pinRepo.exists(pinId))) throw notFound('Pin not found');
  return { success: true, already_saved: !(await boardRepo.addPin(boardId, pinId)) };
}

async function removePin(userId, boardId, pinId) {
  await assertOwner(userId, boardId);
  await boardRepo.removePin(boardId, pinId);
}

module.exports = { list, create, pins, addPin, removePin };
