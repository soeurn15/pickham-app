const boardService = require('../services/board.service.js');
const validate = require('../validators/board.validator.js');
const { id } = require('../validators/common.js');

const list = async (req, res) => res.json(await boardService.list(req.user.id));
const create = async (req, res) => res.status(201).json(await boardService.create(req.user.id, validate.create(req.body)));
const pins = async (req, res) => res.json(await boardService.pins(req.user.id, id(req.params.id)));

async function addPin(req, res) {
  res.json(await boardService.addPin(req.user.id, id(req.params.id), id(req.body && req.body.pin_id, 'pin id')));
}

async function removePin(req, res) {
  await boardService.removePin(req.user.id, id(req.params.id), id(req.params.pinId, 'pin id'));
  res.json({ success: true });
}

module.exports = { list, create, pins, addPin, removePin };
