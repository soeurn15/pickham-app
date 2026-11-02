// Small input-checking helpers shared by the validators. Each throws a 400 on bad input.
const { badRequest } = require('../utils/httpError.js');

function id(value, label = 'id') {
  const s = String(value);
  if (!/^\d{1,10}$/.test(s)) throw badRequest(`Invalid ${label}`);
  return parseInt(s, 10);
}

// Required, trimmed string within [min, max] characters.
function text(value, label, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') throw badRequest(`${label} is required`);
  const v = value.trim();
  if (v.length < min) throw badRequest(min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`);
  if (v.length > max) throw badRequest(`${label} must be ${max} characters or fewer`);
  return v;
}

// Optional trimmed string; empty/missing becomes the fallback.
function optionalText(value, label, { max = 255, fallback = '' } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  return text(value, label, { min: 0, max });
}

// http(s) URL only - blocks javascript:, data: and other schemes.
function httpUrl(value, label, { max = 500 } = {}) {
  const v = text(value, label, { max });
  let url;
  try {
    url = new URL(v);
  } catch {
    throw badRequest(`${label} must be a valid http(s) URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw badRequest(`${label} must be a valid http(s) URL`);
  return v;
}

module.exports = { id, text, optionalText, httpUrl };
