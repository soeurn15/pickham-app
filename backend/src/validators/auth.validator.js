const v = require('./common.js');
const { badRequest } = require('../utils/httpError.js');

const USERNAME_RE = /^[\p{L}\p{N} ._-]{3,50}$/u;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

function login(body = {}) {
  if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || !body.password) {
    throw badRequest('Username and password are required');
  }
  return { username: body.username.trim().slice(0, 100), password: body.password.slice(0, MAX_PASSWORD) };
}

function username(value) {
  const name = v.text(value, 'Username', { max: 50 });
  if (!USERNAME_RE.test(name)) {
    throw badRequest('Username must be 3-50 characters: letters, numbers, spaces, dots, dashes or underscores');
  }
  return name;
}

function register(body = {}) {
  const name = username(body.username);
  if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD} characters`);
  }
  if (body.password.length > MAX_PASSWORD) throw badRequest(`Password must be ${MAX_PASSWORD} characters or fewer`);
  return {
    username: name,
    password: body.password,
    avatar: body.avatar ? v.httpUrl(body.avatar, 'Avatar') : null,
    bio: v.optionalText(body.bio, 'Bio', { max: 500, fallback: 'Visual Enthusiast' })
  };
}

module.exports = { login, register, username };
