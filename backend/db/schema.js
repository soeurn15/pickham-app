const { seedDb } = require('./seed.js');
const pool = require('../config/db.js');
const { FALLBACK_CATEGORY } = require('../utils/categories.js');

// Database and tables setup
async function initDb() {
  try {
    console.log('Connecting to MySQL and checking schema...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT 'password',
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        avatar VARCHAR(500),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter table if users exists to add role & password if missing
    try {
      await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'password'");
      await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'user'");
    } catch (err) {
      try {
        await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'password'");
      } catch (e) {}
      try {
        await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'");
      } catch (e) {}
    }

    // Create pins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        tags VARCHAR(500),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create boards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create board_pins table (Many-to-Many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS board_pins (
        board_id INT,
        pin_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (board_id, pin_id),
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
      )
    `);

    // Create likes table (Many-to-Many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id INT,
        pin_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pin_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
      )
    `);

    // Create favorites table (private bookmarks, separate from likes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INT,
        pin_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pin_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
      )
    `);

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pin_id INT,
        user_id INT,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create categories table (admin-managed; pins reference a category by name)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Seed the defaults, plus any category already used by an existing pin
    const defaults = ['Nature', 'Architecture', 'Food', 'Travel', 'Animals', 'Tech', FALLBACK_CATEGORY];
    const [used] = await pool.query("SELECT DISTINCT category FROM pins WHERE category IS NOT NULL AND category <> ''");
    const names = [...new Set([...defaults, ...used.map(r => r.category)])];
    await pool.query('INSERT IGNORE INTO categories (name) VALUES ?', [names.map(n => [n])]);

    console.log('MySQL Database tables initialized successfully.');
    
    // Seed initial data if empty
    await seedDb();
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

module.exports = { initDb };
