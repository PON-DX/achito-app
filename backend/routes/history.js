const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'achito-monks', allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function deleteCloudinaryImage(url) {
  if (!url) return;
  try {
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
    cloudinary.uploader.destroy(publicId).catch(() => {});
  } catch {}
}

// GET /api/history — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM monk_history ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history — admin
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    const image_url = req.file ? req.file.path : null;
    const { rows: [row] } = await query(
      'INSERT INTO monk_history (name, image_url, content) VALUES ($1, $2, $3) RETURNING *',
      [name, image_url, content || '']
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/history/:id — admin
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM monk_history WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const { name, content } = req.body;
    let image_url = existing.image_url;
    if (req.file) {
      deleteCloudinaryImage(existing.image_url);
      image_url = req.file.path;
    }
    const { rows: [row] } = await query(
      'UPDATE monk_history SET name = $1, image_url = $2, content = $3 WHERE id = $4 RETURNING *',
      [name || existing.name, image_url, content !== undefined ? content : existing.content, req.params.id]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM monk_history WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    deleteCloudinaryImage(existing.image_url);
    await query('DELETE FROM monk_history WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
