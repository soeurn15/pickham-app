// Builds the Express app: security headers, CORS, body limits, rate limiting and routes.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { CORS_ORIGINS, TRUST_PROXY } = require('./config/env.js');
const { UPLOADS_DIR } = require('./utils/files.js');
const { apiLimiter } = require('./middleware/rateLimit.js');
const { errorHandler, notFound } = require('./middleware/errorHandler.js');
const routes = require('./routes/index.js');

const app = express();

app.disable('x-powered-by');
if (TRUST_PROXY > 0) app.set('trust proxy', TRUST_PROXY);

// Uploaded images are shown by the website on another origin, so they must be embeddable cross-origin
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 600
}));
app.use(express.json({ limit: '100kb' }));

// Uploaded images are public files; never let a browser guess a type or run one as a page
app.use('/uploads', express.static(UPLOADS_DIR, {
  index: false,
  dotfiles: 'deny',
  maxAge: '7d',
  immutable: true,
  setHeaders: res => res.set('Content-Disposition', 'inline')
}));

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
