const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'achito-posters', allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function deleteCloudinaryImage(url) {
  if (!url) return;
  try {
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
    cloudinary.uploader.destroy(publicId).catch(() => {});
  } catch {}
}

// GET /api/posters — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM posters ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posters — admin
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    if (!req.file) return res.status(400).json({ error: 'Image is required.' });
    const { rows: [row] } = await query(
      'INSERT INTO posters (title, description, image_url) VALUES ($1, $2, $3) RETURNING *',
      [title, description || '', req.file.path]
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posters/:id — admin
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM posters WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const { title, description } = req.body;
    let image_url = existing.image_url;
    if (req.file) {
      deleteCloudinaryImage(existing.image_url);
      image_url = req.file.path;
    }
    const { rows: [row] } = await query(
      'UPDATE posters SET title = $1, description = $2, image_url = $3 WHERE id = $4 RETURNING *',
      [title || existing.title, description !== undefined ? description : existing.description, image_url, req.params.id]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posters/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM posters WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    deleteCloudinaryImage(existing.image_url);
    await query('DELETE FROM posters WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
