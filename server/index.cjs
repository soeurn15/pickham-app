// Entry point: loads settings, starts the HTTP server, then makes sure the database tables exist.
const { PORT } = require('./config/env.cjs');
const app = require('./app.cjs');
const { initDb } = require('./db/schema.cjs');

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDb();
});