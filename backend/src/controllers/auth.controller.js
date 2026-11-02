const authService = require('../services/auth.service.js');
const validate = require('../validators/auth.validator.js');

const login = async (req, res) => res.json(await authService.login(validate.login(req.body)));
const register = async (req, res) => res.status(201).json(await authService.register(validate.register(req.body)));

module.exports = { login, register };
