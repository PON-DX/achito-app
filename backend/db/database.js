const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'amulet_shop.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS amulets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      temple TEXT,
      batch_version TEXT,
      year INTEGER,
      price REAL NOT NULL,
      status TEXT DEFAULT 'available',
      description TEXT,
      image_url TEXT,
      stock INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amulet_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (amulet_id) REFERENCES amulets(id) ON DELETE CASCADE,
      UNIQUE(user_id, amulet_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      tracking_number TEXT,
      full_name TEXT,
      phone TEXT,
      shipping_address TEXT,
      payment_method TEXT DEFAULT 'bank_transfer',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amulet_id INTEGER,
      amulet_name TEXT NOT NULL,
      amulet_image TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing users table if needed
  const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!cols.includes('email'))      db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  if (!cols.includes('first_name')) db.exec("ALTER TABLE users ADD COLUMN first_name TEXT");

  // Migrate amulets table — add stock column if missing
  const amuletCols = db.prepare("PRAGMA table_info(amulets)").all().map(c => c.name);
  if (!amuletCols.includes('stock')) db.exec("ALTER TABLE amulets ADD COLUMN stock INTEGER DEFAULT NULL");
  if (!cols.includes('last_name'))  db.exec("ALTER TABLE users ADD COLUMN last_name TEXT");

  seedAdmin();
  seedSampleAmulets();
}

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, 'admin');
    console.log(`✅ Admin user seeded: username=${username}`);
  } else {
    // Ensure the existing admin has correct role
    db.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run(username);
  }
}

function seedSampleAmulets() {
  const count = db.prepare('SELECT COUNT(*) as c FROM amulets').get();
  if (count.c > 0) return;

  const samples = [
    { name: 'Phra Somdej Wat Rakhang', category: 'Powder', temple: 'Wat Rakhang Kositaram', batch_version: 'First Edition', year: 1866, price: 250000, status: 'available', description: 'One of the most revered amulets in Thailand, created by Somdej Phra Phutthachan (Toh Phrommarangsi). Made from sacred white powder mixed with holy water and blessed rice. Known for protection and good fortune.', image_url: null },
    { name: 'LP Thuad Wat Chang Hai', category: 'Metal', temple: 'Wat Chang Hai', batch_version: 'BE 2497', year: 1954, price: 185000, status: 'available', description: 'Sacred metal amulet of the legendary monk Luang Phor Thuad from Wat Chang Hai, Pattani. Renowned for miraculous protection against danger and harm.', image_url: null },
    { name: 'Ganesha Brass Statue', category: 'Statues', temple: 'Devasathan Royal Brahmin Temple', batch_version: 'Special Blessing', year: 2010, price: 45000, status: 'available', description: 'Handcrafted brass statue of Lord Ganesha, blessed by Brahmin priests at Devasathan. Perfect for business owners seeking prosperity.', image_url: null },
    { name: 'Phra Nang Phaya Phitsanulok', category: 'Powder', temple: 'Wat Nang Phaya', batch_version: 'Original', year: 1890, price: 320000, status: 'sold_out', description: 'Ancient powder amulet from Wat Nang Phaya, Phitsanulok. One of the five most sacred amulets of Thailand (Benjaphakee).', image_url: null },
    { name: 'LP Parn Coin BE 2460', category: 'Metal', temple: 'Wat Bang Nom Kho', batch_version: 'BE 2460', year: 1917, price: 95000, status: 'available', description: 'Rare sacred coin amulet of Luang Phor Parn. Believed to provide invincibility and bring great luck to the owner.', image_url: null },
    { name: 'Jatukam Ramathep', category: 'Metal', temple: 'Wat Mahathat', batch_version: 'Nakhon Si Thammarat', year: 2006, price: 12000, status: 'available', description: 'The legendary Jatukam Ramathep amulet from Nakhon Si Thammarat. Believed to bring wealth, health, and protection.', image_url: null }
  ];

  const insert = db.prepare(`INSERT INTO amulets (name,category,temple,batch_version,year,price,status,description,image_url) VALUES (@name,@category,@temple,@batch_version,@year,@price,@status,@description,@image_url)`);
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany(samples);
  console.log('✅ Sample amulets seeded.');
}

module.exports = { getDb };
