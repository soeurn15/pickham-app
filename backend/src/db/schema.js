// Creates and upgrades the database schema on start-up. Safe to run repeatedly.
const pool = require('../config/db.js');
const { SEED_DEMO_DATA } = require('../config/env.js');
const { seedDb } = require('./seed.js');
const { hashPassword } = require('../utils/password.js');
const { FALLBACK_CATEGORY } = require('../repositories/category.repository.js');

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    avatar VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    thumb_url VARCHAR(500),
    category VARCHAR(100),
    tags VARCHAR(500),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS board_pins (
    board_id INT,
    pin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (board_id, pin_id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS likes (
    user_id INT,
    pin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, pin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
  )`,
  // Favourites are private bookmarks, separate from likes
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id INT,
    pin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, pin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pin_id INT,
    user_id INT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  // Admin-managed; pins reference a category by name
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

async function columnExists(table, column) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(table, name) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
    [table, name]
  );
  return rows.length > 0;
}

// Indexes for the queries the app runs most (foreign-key columns are not always indexed automatically)
const INDEXES = [
  ['users', 'uq_users_username', 'UNIQUE (username)'],
  ['pins', 'idx_pins_user', '(user_id)'],
  ['pins', 'idx_pins_category', '(category)'],
  ['pins', 'idx_pins_created', '(created_at)'],
  ['boards', 'idx_boards_user', '(user_id)'],
  ['board_pins', 'idx_board_pins_pin', '(pin_id)'],
  ['likes', 'idx_likes_pin', '(pin_id)'],
  ['favorites', 'idx_favorites_pin', '(pin_id)'],
  ['comments', 'idx_comments_pin', '(pin_id, id)'],
  ['comments', 'idx_comments_user', '(user_id)']
];

async function ensureIndex([table, name, definition]) {
  if (await indexExists(table, name)) return;
  const unique = definition.startsWith('UNIQUE');
  try {
    await pool.query(
      unique
        ? `ALTER TABLE ${table} ADD CONSTRAINT ${name} ${definition}`
        : `CREATE INDEX ${name} ON ${table} ${definition}`
    );
  } catch (error) {
    // An existing database may already contain duplicates; report it instead of refusing to start
    if (unique && error.code === 'ER_DUP_ENTRY') {
      console.warn(`Could not add unique index ${name}: duplicate values exist. Remove the duplicates and restart.`);
    } else {
      throw error;
    }
  }
}

// One-time upgrade of any passwords still stored as plaintext by older versions
async function hashLegacyPasswords() {
  const [rows] = await pool.query("SELECT id, password FROM users WHERE password NOT LIKE 'scrypt$%'");
  for (const row of rows) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [await hashPassword(row.password), row.id]);
  }
  if (rows.length) console.log(`Hashed ${rows.length} legacy plaintext password(s).`);
}

async function initDb() {
  console.log('Connecting to MySQL and checking schema...');

  for (const sql of TABLES) await pool.query(sql);

  // Upgrades for databases created by earlier versions
  if (!(await columnExists('pins', 'thumb_url'))) await pool.query('ALTER TABLE pins ADD COLUMN thumb_url VARCHAR(500) NULL');
  await pool.query('ALTER TABLE users ALTER COLUMN password DROP DEFAULT').catch(() => {});
  await hashLegacyPasswords();
  for (const index of INDEXES) await ensureIndex(index);

  // Seed the default categories, plus any category already used by an existing pin
  const defaults = ['Nature', 'Architecture', 'Food', 'Travel', 'Animals', 'Tech', FALLBACK_CATEGORY];
  const [used] = await pool.query("SELECT DISTINCT category FROM pins WHERE category IS NOT NULL AND category <> ''");
  const names = [...new Set([...defaults, ...used.map(r => r.category)])];
  await pool.query('INSERT IGNORE INTO categories (name) VALUES ?', [names.map(n => [n])]);

  if (SEED_DEMO_DATA) await seedDb();
  console.log('Database ready.');
}

module.exports = { initDb };
