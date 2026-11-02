const pinService = require('../services/pin.service.js');
const validate = require('../validators/pin.validator.js');
const { id } = require('../validators/common.js');

// Body is the page of pins; the total match count travels in X-Total-Count so the response shape stays a plain array.
async function list(req, res) {
  const { pins, total } = await pinService.list(req.user.id, validate.list(req.query));
  res.set('X-Total-Count', String(total)).json(pins);
}

const detail = async (req, res) => res.json(await pinService.detail(req.user.id, id(req.params.id)));

async function create(req, res) {
  const pinId = await pinService.create(req.user, validate.create(req.body), req.file);
  res.status(201).json({ success: true, pinId });
}

async function remove(req, res) {
  await pinService.remove(req.user, id(req.params.id));
  res.json({ success: true });
}

module.exports = { list, detail, create, remove };
