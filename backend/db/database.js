const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Refusing to start without a database.');
  process.exit(1);
}

// SSL is on by default (Railway Postgres); off for a local database or DATABASE_SSL=false
function sslConfig(connectionString) {
  if (process.env.DATABASE_SSL === 'false') return false;
  const { hostname } = new URL(connectionString);
  if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(process.env.DATABASE_URL),
});

async function query(sql, params) {
  return pool.query(sql, params);
}

async function getClient() {
  return pool.connect();
}

async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'customer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS amulets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      temple TEXT,
      batch_version TEXT,
      year INTEGER,
      price NUMERIC NOT NULL,
      status TEXT DEFAULT 'available',
      description TEXT,
      image_url TEXT,
      stock INTEGER DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amulet_id INTEGER NOT NULL REFERENCES amulets(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, amulet_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_price NUMERIC NOT NULL,
      status TEXT DEFAULT 'pending',
      tracking_number TEXT,
      full_name TEXT,
      phone TEXT,
      shipping_address TEXT,
      payment_method TEXT DEFAULT 'bank_transfer',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amulet_id INTEGER,
      amulet_name TEXT NOT NULL,
      amulet_image TEXT,
      quantity INTEGER NOT NULL,
      price NUMERIC NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      last_message_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      section TEXT PRIMARY KEY,
      content JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS monk_history (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES amulets(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS monk_history_images (
      id SERIAL PRIMARY KEY,
      monk_id INTEGER NOT NULL REFERENCES monk_history(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS amulet_catalog (
      id SERIAL PRIMARY KEY,
      group_name TEXT NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posters (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seller_profiles (
      username TEXT PRIMARY KEY,
      facebook_url TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scam_reports (
      id SERIAL PRIMARY KEY,
      reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
      item_description TEXT NOT NULL,
      incident_date DATE NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scam_report_images (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      public_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // pg_trgm lets the name search use an index for partial (ILIKE '%...%') matches
  await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_scam_reports_account_number ON scam_reports (account_number)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_scam_reports_account_name ON scam_reports USING GIN (account_name gin_trgm_ops)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_scam_reports_reporter ON scam_reports (reporter_id, created_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_scam_report_images_report ON scam_report_images (report_id)');

  await pool.query('ALTER TABLE amulets ADD COLUMN IF NOT EXISTS seller_username TEXT');
  await pool.query("UPDATE amulets SET seller_username = 'kanokpon' WHERE seller_username IS NULL");

  await seedSellerProfiles();

  await seedAdmin();
  await seedSampleAmulets();
  console.log('✅ Database schema initialized.');
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const { rows } = await pool.query('SELECT id, role FROM users WHERE username = $1', [username]);
  if (rows.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hash, 'admin']);
    console.log(`✅ Admin user seeded: username=${username}`);
  } else if (rows[0].role !== 'admin') {
    // Never silently promote an existing account (e.g. a customer who registered this name)
    console.warn(`⚠️  ADMIN_USERNAME "${username}" belongs to a non-admin account; not promoting it.`);
  }
}

async function seedSampleAmulets() {
  const { rows } = await pool.query('SELECT id FROM amulets LIMIT 1');
  if (rows.length > 0) return;

  const samples = [
    ['Phra Somdej Wat Rakhang', 'Powder', 'Wat Rakhang Kositaram', 'First Edition', 1866, 250000, 'available', 'One of the most revered amulets in Thailand, created by Somdej Phra Phutthachan (Toh Phrommarangsi). Made from sacred white powder mixed with holy water and blessed rice. Known for protection and good fortune.', null],
    ['LP Thuad Wat Chang Hai', 'Metal', 'Wat Chang Hai', 'BE 2497', 1954, 185000, 'available', 'Sacred metal amulet of the legendary monk Luang Phor Thuad from Wat Chang Hai, Pattani. Renowned for miraculous protection against danger and harm.', null],
    ['Ganesha Brass Statue', 'Statues', 'Devasathan Royal Brahmin Temple', 'Special Blessing', 2010, 45000, 'available', 'Handcrafted brass statue of Lord Ganesha, blessed by Brahmin priests at Devasathan. Perfect for business owners seeking prosperity.', null],
    ['Phra Nang Phaya Phitsanulok', 'Powder', 'Wat Nang Phaya', 'Original', 1890, 320000, 'sold_out', 'Ancient powder amulet from Wat Nang Phaya, Phitsanulok. One of the five most sacred amulets of Thailand (Benjaphakee).', null],
    ['LP Parn Coin BE 2460', 'Metal', 'Wat Bang Nom Kho', 'BE 2460', 1917, 95000, 'available', 'Rare sacred coin amulet of Luang Phor Parn. Believed to provide invincibility and bring great luck to the owner.', null],
    ['Jatukam Ramathep', 'Metal', 'Wat Mahathat', 'Nakhon Si Thammarat', 2006, 12000, 'available', 'The legendary Jatukam Ramathep amulet from Nakhon Si Thammarat. Believed to bring wealth, health, and protection.', null],
  ];

  for (const s of samples) {
    await pool.query(
      'INSERT INTO amulets (name,category,temple,batch_version,year,price,status,description,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      s
    );
  }
  console.log('✅ Sample amulets seeded.');
}

async function seedSellerProfiles() {
  const sellers = [
    { username: 'kanokpon', facebook_url: 'https://www.facebook.com/share/p/1BkWwcHePP/' },
    { username: 'sorawit',  facebook_url: 'https://www.facebook.com/share/1Ma34JZ9yf/?mibextid=wwXIfr' },
    { username: 'jermsak',  facebook_url: 'https://www.facebook.com/ceim.sakdi.nwl.seux' },
  ];
  for (const s of sellers) {
    await pool.query(
      'INSERT INTO seller_profiles (username, facebook_url) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET facebook_url = EXCLUDED.facebook_url',
      [s.username, s.facebook_url]
    );
  }
}

module.exports = { pool, query, getClient, initializeSchema };
