const userService = require('../services/user.service.js');
const adminService = require('../services/admin.service.js');
const validate = require('../validators/user.validator.js');
const { id } = require('../validators/common.js');

const profile = async (req, res) => res.json(await userService.getProfile(id(req.params.id)));

async function updateProfile(req, res) {
  await userService.updateProfile(req.user, id(req.params.id), validate.updateProfile(req.body));
  res.json({ success: true });
}

// --- admin ---
const metrics = async (req, res) => res.json(await adminService.metrics());
const listUsers = async (req, res) => res.json(await userService.listForAdmin());

async function setRole(req, res) {
  await userService.setRole(req.user, id(req.params.id), validate.role(req.body));
  res.json({ success: true });
}

async function removeUser(req, res) {
  await userService.remove(req.user, id(req.params.id));
  res.json({ success: true });
}

module.exports = { profile, updateProfile, metrics, listUsers, setRole, removeUser };
