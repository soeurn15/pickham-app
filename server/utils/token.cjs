// HMAC-signed session tokens: <userId>.<expiry>.<signature>
const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env.cjs');
const { safeEqual } = require('./password.cjs');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let TOKEN_SECRET = JWT_SECRET;
if (!TOKEN_SECRET) {
  TOKEN_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is not set in .env - using a temporary secret; logins will reset on restart.');
}

function signToken(userId) {
  const payload = `${userId}.${Date.now() + TOKEN_TTL_MS}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function readToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${id}.${exp}`).digest('hex');
  if (!safeEqual(sig, expected) || Number(exp) < Date.now()) return null;
  return parseInt(id, 10);
}

module.exports = { signToken, readToken };