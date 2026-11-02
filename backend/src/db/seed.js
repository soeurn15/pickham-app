const pool = require('../config/db.js');
const { hashPassword } = require('../utils/password.js');

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
    const seedPassword = await hashPassword('password');
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

module.exports = { seedDb };
