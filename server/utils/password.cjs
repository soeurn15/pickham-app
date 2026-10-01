// scrypt password hashing. Stored format: scrypt$<salt>$<hash>
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function verifyPassword(password, stored) {
  if (!stored.startsWith('scrypt$')) {
    return safeEqual(password, stored); // legacy plaintext, upgraded on login
  }
  const [, salt, hash] = stored.split('$');
  return safeEqual(crypto.scryptSync(password, salt, 64).toString('hex'), hash);
}

module.exports = { hashPassword, verifyPassword, safeEqual };