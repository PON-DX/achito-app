const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'achito-products',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let sql = 'SELECT * FROM amulets WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (name ILIKE $${idx} OR temple ILIKE $${idx + 1} OR description ILIKE $${idx + 2})`;
      const term = `%${search}%`;
      params.push(term, term, term);
      idx += 3;
    }
    if (category && category !== 'All') {
      sql += ` AND category = $${idx}`;
      params.push(category);
      idx++;
    }
    if (status) {
      sql += ` AND status = $${idx}`;
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: [amulet] } = await query('SELECT * FROM amulets WHERE id = $1', [req.params.id]);
    if (!amulet) return res.status(404).json({ error: 'Amulet not found.' });
    res.json(amulet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    const image_url = req.file ? req.file.path : null;

    const { rows: [newAmulet] } = await query(`
      INSERT INTO amulets (name, category, temple, batch_version, year, price, status, description, image_url, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name, category, temple || null, batch_version || null, year || null,
      parseFloat(price), status || 'available', description || null, image_url,
      stock !== '' && stock !== undefined && stock !== null ? parseInt(stock) : null,
    ]);

    res.status(201).json(newAmulet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulets WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

    const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;

    let image_url = existing.image_url;
    if (req.file) {
      if (existing.image_url) {
        try {
          const publicId = existing.image_url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {}
      }
      image_url = req.file.path;
    }

    const newStock = stock !== undefined
      ? (stock === '' || stock === null ? null : parseInt(stock))
      : existing.stock;

    const { rows: [updated] } = await query(`
      UPDATE amulets SET
        name = $1, category = $2, temple = $3, batch_version = $4, year = $5,
        price = $6, status = $7, description = $8, image_url = $9, stock = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
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
      req.params.id,
    ]);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulets WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

    if (existing.image_url) {
      try {
        const publicId = existing.image_url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {}
    }

    await query('DELETE FROM amulets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Amulet deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
