const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Multer storage config
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
  }
});

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/products
router.get('/', (req, res) => {
  const { search, category, status } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM amulets WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR temple LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const amulets = db.prepare(query).all(...params);
  res.json(amulets);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const amulet = db.prepare('SELECT * FROM amulets WHERE id = ?').get(req.params.id);
  if (!amulet) return res.status(404).json({ error: 'Amulet not found.' });
  res.json(amulet);
});

// ─── PROTECTED ROUTES (Admin only) ───────────────────────────────────────────

// POST /api/products
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required.' });
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO amulets (name, category, temple, batch_version, year, price, status, description, image_url, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, temple || null, batch_version || null, year || null,
         parseFloat(price), status || 'available', description || null, image_url,
         stock !== '' && stock !== undefined && stock !== null ? parseInt(stock) : null);

  const newAmulet = db.prepare('SELECT * FROM amulets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newAmulet);
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM amulets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

  const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;

  let image_url = existing.image_url;
  if (req.file) {
    if (existing.image_url) {
      const oldPath = path.join(__dirname, '..', existing.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image_url = `/uploads/${req.file.filename}`;
  }

  const newStock = stock !== undefined
    ? (stock === '' || stock === null ? null : parseInt(stock))
    : existing.stock;

  db.prepare(`
    UPDATE amulets SET
      name = ?, category = ?, temple = ?, batch_version = ?, year = ?,
      price = ?, status = ?, description = ?, image_url = ?, stock = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name || existing.name,
    category || existing.category,
    temple !== undefined ? temple : existing.temple,
    batch_version !== undefined ? batch_version : existing.batch_version,
    year !== undefined ? year : existing.year,
    price ? parseFloat(price) : existing.price,
    status || existing.status,
    description !== undefined ? description : existing.description,
    image_url,
    newStock,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM amulets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM amulets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

  if (existing.image_url) {
    const imgPath = path.join(__dirname, '..', existing.image_url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.prepare('DELETE FROM amulets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Amulet deleted successfully.' });
});

module.exports = router;
