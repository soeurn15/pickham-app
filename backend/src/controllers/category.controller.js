const service = require('../services/category.service.js');
const validate = require('../validators/category.validator.js');
const { id } = require('../validators/common.js');

const list = async (req, res) => res.json(await service.list());
const create = async (req, res) => res.status(201).json(await service.create(validate.create(req.body).name));

async function remove(req, res) {
  await service.remove(id(req.params.id));
  res.json({ success: true });
}

module.exports = { list, create, remove };
