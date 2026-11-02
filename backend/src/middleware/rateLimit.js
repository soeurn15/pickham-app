// Tiny in-memory rate limiter (no dependency). Resets when the server restarts.
// For several server instances, back this with a shared store such as Redis.
function rateLimit({ windowMs, max, message, key = req => req.ip }) {
  const hits = new Map(); // key -> { count, resetAt }

  setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const k = key(req);
    const entry = hits.get(k);

    if (!entry || entry.resetAt <= now) {
      hits.set(k, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Login and sign-up: 20 attempts per 15 minutes per IP address.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.'
});

// Every other API call: 600 per 5 minutes per IP.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  message: 'Too many requests. Please slow down.'
});

// Uploads are expensive: 30 per 10 minutes per user.
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Upload limit reached. Please try again later.',
  key: req => `user:${req.user ? req.user.id : req.ip}`
});

module.exports = { rateLimit, authLimiter, apiLimiter, uploadLimiter };
