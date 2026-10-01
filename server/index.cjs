const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Auth helpers (scrypt password hashing + HMAC-signed session tokens) ---
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let TOKEN_SECRET = process.env.JWT_SECRET;
if (!TOKEN_SECRET) {
  TOKEN_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is not set in .env - using a temporary secret; logins will reset on restart.');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function verifyPassword(password, stored) {
  if (!stored.startsWith('scrypt$')) {
    return safeEqual(password, stored); // legacy plaintext, upgraded on login
  }
  const [, salt, hash] = stored.split('$');
  return safeEqual(crypto.scryptSync(password, salt, 64).toString('hex'), hash);
}

function signToken(userId) {
  const payload = `${userId}.${Date.now() + TOKEN_TTL_MS}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function readToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${id}.${exp}`).digest('hex');
  if (!safeEqual(sig, expected) || Number(exp) < Date.now()) return null;
  return parseInt(id, 10);
}

// Never send the password hash to the browser
function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const userId = readToken(header.startsWith('Bearer ') ? header.slice(7) : '');
    if (!userId) return res.status(401).json({ error: 'Please log in again' });

    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists' });

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpg, jpeg, png, gif, webp)'));
  }
});

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'content-dabase',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

    console.log('MySQL Database tables initialized successfully.');
    
    // Seed initial data if empty
    await seedDb();
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

// Seed helper function
async function seedDb() {
  try {
    // Check if we already have users
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    if (users.length > 0) {
      console.log('Database already has data. Seeding skipped.');
      return;
    }

    console.log('Seeding initial data...');

    // 1. Insert default user (Aqeel)
    const seedPassword = hashPassword('password');
    const [userResult] = await pool.query(
      'INSERT INTO users (username, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      [
        'Aqeel',
        seedPassword,
        'admin',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        'Creative developer, photographer, and designer of interface animations. Curating the best visual designs.'
      ]
    );
    const userId = userResult.insertId;

    // 2. Insert some other users to make the comments section lively
    const otherUsers = [
      ['Zara Chen', seedPassword, 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', 'UI Enthusiast'],
      ['Marcus Aurelius', seedPassword, 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', 'Philosopher & Designer'],
      ['Elena Rostova', seedPassword, 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', 'Nature Illustrator']
    ];
    
    const seededUserIds = [];
    for (const u of otherUsers) {
      const [res] = await pool.query('INSERT INTO users (username, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?)', u);
      seededUserIds.push(res.insertId);
    }

    // 3. Create default Boards for Aqeel
    const [board1] = await pool.query('INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)', ['Nature Escape', 'Calming views of forests, rivers, and mountains', userId]);
    const [board2] = await pool.query('INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)', ['Modern Architectures', 'Sleek, minimalist residential and commercial design', userId]);
    const [board3] = await pool.query('INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)', ['Tech Inspo', 'Futuristic gadgets, circuits, and development setups', userId]);

    // 4. Seed default Pins from Unsplash
    const seedPins = [
      {
        title: 'Misty Alpine Lake',
        description: 'A serene view of an alpine lake surrounded by pine forests shrouded in morning mist.',
        image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80',
        category: 'Nature',
        tags: 'lake, mountain, mist, forest, green, landscape',
        boardId: board1.insertId
      },
      {
        title: 'Emerald Green Valley',
        description: 'Sunlight breaking through clouds onto an expansive green valley with rolling hills.',
        image_url: 'https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&w=800&q=80',
        category: 'Nature',
        tags: 'valley, grass, green, sunshine, nature, summer',
        boardId: board1.insertId
      },
      {
        title: 'Minimalist Glass Villa',
        description: 'A striking modern house in the woods built mostly of glass and black steel frame.',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        category: 'Architecture',
        tags: 'house, modern, minimalist, glass, luxury, architecture',
        boardId: board2.insertId
      },
      {
        title: 'Brutalist Concrete Loft',
        description: 'Cozy study setup inside a raw brutalist concrete structure with soft warm lights.',
        image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        category: 'Architecture',
        tags: 'loft, interior, concrete, cozy, study, light, design',
        boardId: board2.insertId
      },
      {
        title: 'Artisanal Neapolitan Pizza',
        description: 'Freshly baked wood-fired pizza with bubbling mozzarella, rich tomato sauce, and basil.',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        category: 'Food',
        tags: 'pizza, cheese, food, lunch, Italian, gourmet',
        boardId: null
      },
      {
        title: 'Berry French Toast',
        description: 'Delicious thick slices of brioche toast topped with fresh raspberries, blueberries, and powdered sugar.',
        image_url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',
        category: 'Food',
        tags: 'toast, dessert, sweet, berries, breakfast, food',
        boardId: null
      },
      {
        title: 'Sunset Beach Hammock',
        description: 'Hammock stretched between palm trees looking out towards a beautiful tropical sunset.',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        category: 'Travel',
        tags: 'beach, hammock, sunset, tropical, ocean, vacation',
        boardId: null
      },
      {
        title: 'Desert Highway Adventure',
        description: 'A straight, empty highway disappearing into a beautiful desert landscape under clear blue skies.',
        image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        category: 'Travel',
        tags: 'highway, road, desert, adventure, travel, car, freedom',
        boardId: null
      },
      {
        title: 'Wild Red Fox',
        description: 'Close-up of a red fox sitting in dry grass, looking curiously towards the camera.',
        image_url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80',
        category: 'Animals',
        tags: 'fox, animal, red, grass, wildlife, nature, fields',
        boardId: board1.insertId
      },
      {
        title: 'Golden Retriever Joy',
        description: 'A happy golden retriever running through a grassy park with its tongue out.',
        image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
        category: 'Animals',
        tags: 'dog, golden retriever, animal, pet, run, happy, park',
        boardId: null
      },
      {
        title: 'Silicon Microprocessor Detail',
        description: 'Macro photography of complex circuits on a modern silicon microprocessor chip.',
        image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        category: 'Tech',
        tags: 'chip, silicon, circuit, tech, hardware, science',
        boardId: board3.insertId
      },
      {
        title: 'Cybersecurity Matrix Shield',
        description: 'Abstract digital interface representing server firewalls and encrypted security nodes.',
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
        category: 'Tech',
        tags: 'cyber, security, server, firewall, digital, blue, code',
        boardId: board3.insertId
      }
    ];

    for (const p of seedPins) {
      const [pinRes] = await pool.query(
        'INSERT INTO pins (title, description, image_url, category, tags, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [p.title, p.description, p.image_url, p.category, p.tags, userId]
      );
      
      const pinId = pinRes.insertId;

      // If assigned to a board, record in board_pins
      if (p.boardId) {
        await pool.query('INSERT INTO board_pins (board_id, pin_id) VALUES (?, ?)', [p.boardId, pinId]);
      }

      // Add a couple of sample comments to some pins
      if (p.title === 'Misty Alpine Lake') {
        await pool.query('INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)', [pinId, seededUserIds[0], 'Wow, this looks so peaceful! I wish I were there right now.']);
        await pool.query('INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)', [pinId, seededUserIds[1], 'Great composition. The lighting in the fog is fantastic.']);
      } else if (p.title === 'Minimalist Glass Villa') {
        await pool.query('INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)', [pinId, seededUserIds[2], 'Ultimate dream home! Living in harmony with nature.']);
      } else if (p.title === 'Artisanal Neapolitan Pizza') {
        await pool.query('INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)', [pinId, seededUserIds[0], 'This is making me so hungry, yum!']);
      }
      
      // Seed some likes
      await pool.query('INSERT INTO likes (user_id, pin_id) VALUES (?, ?)', [userId, pinId]);
      if (Math.random() > 0.4) {
        await pool.query('INSERT INTO likes (user_id, pin_id) VALUES (?, ?)', [seededUserIds[0], pinId]);
      }
      if (Math.random() > 0.6) {
        await pool.query('INSERT INTO likes (user_id, pin_id) VALUES (?, ?)', [seededUserIds[1], pinId]);
      }
    }

    console.log('Database seeded with default values.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// --- API Endpoints ---

// Every /api route needs a valid token except login/register; /api/admin also needs the admin role
app.use('/api', (req, res, next) => (req.path.startsWith('/auth/') ? next() : requireAuth(req, res, next)));
app.use('/api/admin', requireAdmin);

// 1. Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // User details
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = publicUser(users[0]);

    // Created pins
    const [createdPins] = await pool.query(
      `SELECT p.*, COUNT(DISTINCT l.user_id) as likes_count
       FROM pins p 
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.id DESC`, 
      [id]
    );

    // Liked pins
    const [likedPins] = await pool.query(
      `SELECT p.*, COUNT(DISTINCT l2.user_id) as likes_count
       FROM likes l
       JOIN pins p ON l.pin_id = p.id
       LEFT JOIN likes l2 ON p.id = l2.pin_id
       WHERE l.user_id = ?
       GROUP BY p.id
       ORDER BY l.created_at DESC`,
      [id]
    );

    // Boards
    const [boards] = await pool.query('SELECT * FROM boards WHERE user_id = ? ORDER BY id DESC', [id]);

    res.json({
      user,
      created_pins: createdPins,
      liked_pins: likedPins,
      boards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// Update user profile
app.post('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, avatar, bio } = req.body;

    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    await pool.query(
      'UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?',
      [username.trim(), avatar, bio, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 2. Pins List (supports Search, Category, and Tag)
app.get('/api/pins', async (req, res) => {
  try {
    const { search, category, tag } = req.query;
    let sql = `
      SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
             EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
      FROM pins p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.pin_id
    `;
    const params = [req.user.id]; // current user checks likes
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('p.category = ?');
      params.push(category);
    }

    if (tag) {
      conditions.push('LOWER(p.tags) LIKE ?');
      params.push(`%${tag.toString().toLowerCase()}%`);
    }

    if (search) {
      conditions.push('(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?)');
      const searchPattern = `%${search.toString().toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pins' });
  }
});

// 3. Pin Details & Recomended similar pins
app.get('/api/pins/:id', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Fetch details
    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, u.bio as user_bio,
              COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
       FROM pins p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [userId, pinId]
    );

    if (pins.length === 0) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    const pin = pins[0];

    // Split tags for matching
    const tagsArr = pin.tags ? pin.tags.split(',').map(t => t.trim().toLowerCase()) : [];
    
    // Similar Pins calculation:
    // Match same category or overlap in tags. Sort by matches count.
    let similarPins = [];
    if (tagsArr.length > 0 || pin.category) {
      let tagsQueryParts = tagsArr.map(() => 'LOWER(p.tags) LIKE ?').join(' OR ');
      let conditions = [];
      let params = [];

      if (pin.category) {
        conditions.push('p.category = ?');
        params.push(pin.category);
      }
      if (tagsQueryParts) {
        conditions.push(`(${tagsQueryParts})`);
        tagsArr.forEach(t => params.push(`%${t}%`));
      }

      // Exclude current pin
      params.push(pinId);

      const [simRows] = await pool.query(
        `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count
         FROM pins p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN likes l ON p.id = l.pin_id
         WHERE (${conditions.join(' OR ')}) AND p.id != ?
         GROUP BY p.id
         ORDER BY (CASE WHEN p.category = ? THEN 2 ELSE 0 END) DESC, p.id DESC
         LIMIT 8`,
        [...params, pin.category]
      );
      similarPins = simRows;
    }

    res.json({ pin, similar: similarPins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pin details' });
  }
});

// 4. Create Pin
app.post('/api/pins', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    let imageUrl = '';

    if (req.file) {
      // Physical file uploaded
      imageUrl = '/uploads/' + req.file.filename;
    } else if (req.body.image_url) {
      // Image URL provided
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'Please upload an image or provide a valid image URL' });
    }

    const userId = req.user.id;
    const parsedTags = tags ? tags.toString().split(',').map(t => t.trim()).join(', ') : 'creative';

    const [insertResult] = await pool.query(
      'INSERT INTO pins (title, description, image_url, category, tags, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title || 'Untitled Pin', description || '', imageUrl, category || 'Other', parsedTags, userId]
    );

    const pinId = insertResult.insertId;

    // Check if the user selected a board to save to directly
    const boardId = req.body.board_id ? parseInt(req.body.board_id, 10) : null;
    if (boardId && (await ownsBoard(userId, boardId))) {
      await pool.query('INSERT INTO board_pins (board_id, pin_id) VALUES (?, ?)', [boardId, pinId]);
    }

    res.status(201).json({ success: true, pinId });
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ error: 'Failed to create pin: ' + error.message });
  }
});

// Delete Pin
app.delete('/api/pins/:id', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Verify ownership
    const [pin] = await pool.query('SELECT user_id, image_url FROM pins WHERE id = ?', [pinId]);
    if (pin.length === 0) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    if (pin[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this pin' });
    }

    // Delete physically if local upload
    if (pin[0].image_url.startsWith('/uploads/')) {
      const filename = pin[0].image_url.replace('/uploads/', '');
      const filepath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await pool.query('DELETE FROM pins WHERE id = ?', [pinId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete pin' });
  }
});

// 5. Likes Endpoints
app.post('/api/pins/:id/like', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    await pool.query('INSERT IGNORE INTO likes (user_id, pin_id) VALUES (?, ?)', [userId, pinId]);
    const [count] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE pin_id = ?', [pinId]);
    
    res.json({ success: true, likes_count: count[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to like pin' });
  }
});

app.delete('/api/pins/:id/like', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    await pool.query('DELETE FROM likes WHERE user_id = ? AND pin_id = ?', [userId, pinId]);
    const [count] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE pin_id = ?', [pinId]);

    res.json({ success: true, likes_count: count[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to unlike pin' });
  }
});

// Favorites (private bookmarks)
app.get('/api/favorites', async (req, res) => {
  try {
    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
              1 as is_favorited
       FROM favorites f
       JOIN pins p ON f.pin_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE f.user_id = ?
       GROUP BY p.id, f.created_at
       ORDER BY f.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json(pins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

app.post('/api/pins/:id/favorite', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const [pin] = await pool.query('SELECT id FROM pins WHERE id = ?', [pinId]);
    if (pin.length === 0) return res.status(404).json({ error: 'Pin not found' });

    await pool.query('INSERT IGNORE INTO favorites (user_id, pin_id) VALUES (?, ?)', [req.user.id, pinId]);
    res.json({ success: true, is_favorited: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.delete('/api/pins/:id/favorite', async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND pin_id = ?', [req.user.id, parseInt(req.params.id, 10)]);
    res.json({ success: true, is_favorited: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// 6. Comments Endpoints
app.get('/api/pins/:id/comments', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT c.*, u.username, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.pin_id = ?
       ORDER BY c.id ASC`,
      [pinId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

app.post('/api/pins/:id/comments', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const { comment_text } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)',
      [pinId, req.user.id, comment_text.trim()]
    );

    // Fetch the newly inserted comment with user details
    const [comments] = await pool.query(
      `SELECT c.*, u.username, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(comments[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 7. Boards Endpoints
app.get('/api/boards', async (req, res) => {
  try {
    const userId = req.user.id;
    // Get boards alongside pins count and cover image (first pin in the board)
    const [rows] = await pool.query(
      `SELECT b.*, COUNT(bp.pin_id) as pins_count, 
              (SELECT p.image_url FROM board_pins bp2 
               JOIN pins p ON bp2.pin_id = p.id 
               WHERE bp2.board_id = b.id ORDER BY bp2.created_at DESC LIMIT 1) as cover_url
       FROM boards b
       LEFT JOIN board_pins bp ON b.id = bp.board_id
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.id DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve boards' });
  }
});

app.post('/api/boards', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)',
      [name.trim(), description || '', req.user.id]
    );

    res.status(201).json({ id: result.insertId, name, description, pins_count: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// Get pins saved within a board
app.get('/api/boards/:id/pins', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Board details
    const [boards] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
       FROM board_pins bp
       JOIN pins p ON bp.pin_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE bp.board_id = ?
       GROUP BY p.id
       ORDER BY bp.created_at DESC`,
      [userId, boardId]
    );

    res.json({ board: boards[0], pins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pins in board' });
  }
});

async function ownsBoard(userId, boardId) {
  const [rows] = await pool.query('SELECT 1 FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]);
  return rows.length > 0;
}

// Save a pin to a board
app.post('/api/boards/:id/pins', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const { pin_id } = req.body;

    if (!(await ownsBoard(req.user.id, boardId))) {
      return res.status(403).json({ error: 'You can only change your own boards' });
    }
    const [result] = await pool.query('INSERT IGNORE INTO board_pins (board_id, pin_id) VALUES (?, ?)', [boardId, parseInt(pin_id, 10)]);
    res.json({ success: true, already_saved: result.affectedRows === 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save pin to board' });
  }
});

// Remove a pin from a board
app.delete('/api/boards/:id/pins/:pinId', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const pinId = parseInt(req.params.pinId, 10);

    if (!(await ownsBoard(req.user.id, boardId))) {
      return res.status(403).json({ error: 'You can only change your own boards' });
    }
    await pool.query('DELETE FROM board_pins WHERE board_id = ? AND pin_id = ?', [boardId, pinId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove pin from board' });
  }
});


// --- AUTHENTICATION ENDPOINTS ---

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (rows.length === 0 || !verifyPassword(password.trim(), rows[0].password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Upgrade legacy plaintext passwords to a hash on first successful login
    if (!rows[0].password.startsWith('scrypt$')) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashPassword(password.trim()), rows[0].id]);
    }

    res.json({ ...publicUser(rows[0]), token: signToken(rows[0].id) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, avatar, bio } = req.body;
    if (!username || !username.trim() || !password || !password.trim()) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const defaultAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username.trim())}&background=random`;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), hashPassword(password.trim()), 'user', defaultAvatar, bio || 'Visual Enthusiast']
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...publicUser(newUser[0]), token: signToken(result.insertId) });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// --- ADMIN MANAGEMENT ENDPOINTS ---

// Get Platform Metrics
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const [[usersCount]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[pinsCount]] = await pool.query('SELECT COUNT(*) as count FROM pins');
    const [[boardsCount]] = await pool.query('SELECT COUNT(*) as count FROM boards');
    const [[commentsCount]] = await pool.query('SELECT COUNT(*) as count FROM comments');

    const [[likesCount]] = await pool.query('SELECT COUNT(*) as count FROM likes');
    const [categories] = await pool.query(
      `SELECT COALESCE(category, 'Other') as category, COUNT(*) as count
       FROM pins GROUP BY category ORDER BY count DESC`
    );

    res.json({
      users: usersCount.count,
      pins: pinsCount.count,
      boards: boardsCount.count,
      comments: commentsCount.count,
      likes: likesCount.count,
      categories
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve admin metrics' });
  }
});

// Get User Accounts list (Admin role checks should ideally be handled, but simple route is fine for development)
app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.bio, u.role, u.created_at, COUNT(p.id) as pins_count
      FROM users u
      LEFT JOIN pins p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Failed to get admin users:', error);
    res.status(500).json({ error: 'Failed to retrieve admin users list' });
  }
});

// Toggle role between user/admin
app.post('/api/admin/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid user role specified' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

// Admin edit user profile details
app.post('/api/admin/users/:id/edit', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, avatar, bio } = req.body;

    await pool.query(
      'UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?',
      [username, avatar, bio, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Admin delete user account
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Check if user exists
    const [user] = await pool.query('SELECT username FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade automatically cleans up pins, likes, comments, etc.)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// JSON error responses (e.g. upload size/type rejections from multer)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err instanceof multer.MulterError || /Only images/.test(err.message) ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 400 ? err.message : 'Internal server error' });
});

// Start server and initialize tables
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDb();
});
