// Loads backend/.env once and exposes validated settings. Fails fast on unsafe production config.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const crypto = require('crypto');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const list = value => String(value || '').split(',').map(s => s.trim()).filter(Boolean);

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || /change-me/i.test(JWT_SECRET)) {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET must be set to a random string of at least 32 characters.');
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is missing or weak - using a temporary secret; logins reset on restart.');
}

module.exports = {
  NODE_ENV,
  isProduction,
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET,
  // Browser origins allowed to call the API (the Vite dev server by default)
  CORS_ORIGINS: list(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'),
  // Set to the number of reverse proxies in front of the API (0 = none) so rate limits see real client IPs
  TRUST_PROXY: parseInt(process.env.TRUST_PROXY || '0', 10),
  // Demo accounts are created on an empty database only outside production, unless explicitly enabled
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA ? process.env.SEED_DEMO_DATA === 'true' : !isProduction,
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'content-dabase'
  }
};
