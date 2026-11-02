// Database + uploads backup:  npm run db:backup -w backend   (needs mysqldump on PATH)
// Writes backups/<timestamp>/db.sql and copies uploads/. Keep copies off this machine too.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { DB } = require('../src/config/env.js');

const root = path.join(__dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.join(root, 'backups', stamp);
fs.mkdirSync(dir, { recursive: true });

const dump = spawn(
  'mysqldump',
  ['--single-transaction', '--routines', '-h', DB.host, '-P', String(DB.port), '-u', DB.user, DB.database],
  { env: { ...process.env, MYSQL_PWD: DB.password }, stdio: ['ignore', 'pipe', 'inherit'] } // password via env, not argv
);
dump.stdout.pipe(fs.createWriteStream(path.join(dir, 'db.sql')));

dump.on('error', err => {
  console.error('Could not run mysqldump. Is it installed and on your PATH?', err.message);
  process.exit(1);
});
dump.on('close', code => {
  if (code !== 0) {
    console.error(`mysqldump failed with exit code ${code}`);
    process.exit(code || 1);
  }
  const uploads = path.join(root, 'uploads');
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(dir, 'uploads'), { recursive: true });
  console.log(`Backup written to ${dir}`);
});
