// Loads .env once, before anything else reads process.env.
require('dotenv').config({ quiet: true });

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET
};