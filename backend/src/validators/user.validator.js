const v = require('./common.js');
const { username } = require('./auth.validator.js');
const { badRequest } = require('../utils/httpError.js');

function updateProfile(body = {}) {
  return {
    username: username(body.username),
    avatar: body.avatar ? v.httpUrl(body.avatar, 'Avatar') : null,
    bio: v.optionalText(body.bio, 'Bio', { max: 500 })
  };
}

function role(body = {}) {
  if (body.role !== 'user' && body.role !== 'admin') throw badRequest('Invalid user role specified');
  return body.role;
}

module.exports = { updateProfile, role };
