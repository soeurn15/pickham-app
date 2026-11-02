// scrypt password hashing (async, so it never blocks the event loop). Stored format: scrypt$<salt>$<hash>
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, KEY_LENGTH)).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  return safeEqual((await scrypt(password, salt, KEY_LENGTH)).toString('hex'), hash);
}

// Used to spend the same time on unknown usernames as on real ones (prevents user enumeration by timing)
const DUMMY_HASH_PROMISE = hashPassword(crypto.randomBytes(16).toString('hex'));

module.exports = { hashPassword, verifyPassword, safeEqual, DUMMY_HASH_PROMISE };
