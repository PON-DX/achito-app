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

const posterStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'achito-monks-posters', allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
});
const posterUpload = multer({ storage: posterStorage, limits: { fileSize: 10 * 1024 * 1024 } });

function deleteCloudinaryImage(url) {
  if (!url) return;
  try {
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
    cloudinary.uploader.destroy(publicId).catch(() => {});
  } catch {}
}

// GET /api/history — public, returns monks with images[]
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT mh.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', mhi.id,
              'image_url', mhi.image_url,
              'caption', mhi.caption,
              'sort_order', mhi.sort_order
            ) ORDER BY mhi.sort_order, mhi.id
          ) FILTER (WHERE mhi.id IS NOT NULL),
          '[]'::json
        ) AS images
      FROM monk_history mh
      LEFT JOIN monk_history_images mhi ON mh.id = mhi.monk_id
      GROUP BY mh.id
      ORDER BY mh.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history — admin, create monk
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    const image_url = req.file ? req.file.path : null;
    const { rows: [row] } = await query(
      'INSERT INTO monk_history (name, image_url, content) VALUES ($1, $2, $3) RETURNING *',
      [name, image_url, content || '']
    );
    res.status(201).json({ ...row, images: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history/:id/images — admin, add poster image to a monk
router.post('/:id/images', requireAdmin, posterUpload.single('image'), async (req, res) => {
  try {
    const { rows: [monk] } = await query('SELECT id FROM monk_history WHERE id = $1', [req.params.id]);
    if (!monk) return res.status(404).json({ error: 'Monk not found.' });
    if (!req.file) return res.status(400).json({ error: 'Image is required.' });
    const { caption } = req.body;
    const { rows: [row] } = await query(
      'INSERT INTO monk_history_images (monk_id, image_url, caption) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.file.path, caption || '']
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/images/:imageId — admin, delete poster image
router.delete('/images/:imageId', requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM monk_history_images WHERE id = $1', [req.params.imageId]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    deleteCloudinaryImage(existing.image_url);
    await query('DELETE FROM monk_history_images WHERE id = $1', [req.params.imageId]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/history/:id — admin, update monk profile
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

// DELETE /api/history/:id — admin, delete monk (cascades poster images)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM monk_history WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const { rows: posterImages } = await query('SELECT image_url FROM monk_history_images WHERE monk_id = $1', [req.params.id]);
    deleteCloudinaryImage(existing.image_url);
    posterImages.forEach(pi => deleteCloudinaryImage(pi.image_url));
    await query('DELETE FROM monk_history WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
