// Entry point: loads settings, starts the HTTP server, then makes sure the database tables exist.
const { PORT } = require('./config/env.js');
const app = require('./app.js');
const { initDb } = require('./db/schema.js');

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDb();
});