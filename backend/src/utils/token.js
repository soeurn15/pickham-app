// HMAC-signed session tokens: <userId>.<expiry>.<signature>
const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env.js');
const { safeEqual } = require('./password.js');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sign = payload => crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');

function signToken(userId) {
  const payload = `${userId}.${Date.now() + TOKEN_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

// Returns the user id, or null for a malformed, tampered or expired token.
function readToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(exp)) return null;
  if (!safeEqual(sig, sign(`${id}.${exp}`)) || Number(exp) < Date.now()) return null;
  return parseInt(id, 10);
}

module.exports = { signToken, readToken };
