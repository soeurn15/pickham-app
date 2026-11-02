// Entry point: loads settings, prepares the database, then starts the HTTP server and handles shutdown.
const { PORT } = require('./config/env.js');
const pool = require('./config/db.js');
const app = require('./app.js');
const { initDb } = require('./db/schema.js');

async function main() {
  await initDb(); // a failure here must stop the server rather than run against a broken schema

  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  const shutdown = signal => {
    console.log(`${signal} received, shutting down...`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(error => {
  console.error('Failed to start:', error);
  process.exit(1);
});

process.on('unhandledRejection', reason => console.error('Unhandled rejection:', reason));
