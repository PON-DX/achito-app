const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'achito-catalog', allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const GROUP_ORDER = ['พิมพ์ใหญ่', 'พิมพ์กลาง', 'พิมพ์เล็ก', 'พิมพ์ปิดตา', 'พระประจำวัน', 'เหรียญ', 'ผ้ายันต์'];

function deleteCloudinaryImage(url) {
  if (!url) return;
  try {
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
    cloudinary.uploader.destroy(publicId).catch(() => {});
  } catch {}
}

// GET /api/catalog — grouped by group_name
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM amulet_catalog ORDER BY group_name, id ASC');
    const grouped = {};
    GROUP_ORDER.forEach(g => { grouped[g] = []; });
    rows.forEach(r => {
      if (grouped[r.group_name]) grouped[r.group_name].push(r);
      else { grouped[r.group_name] = [r]; }
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/catalog — admin
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { group_name, name, description } = req.body;
    if (!group_name || !name) return res.status(400).json({ error: 'group_name and name are required.' });
    const image_url = req.file ? req.file.path : null;
    const { rows: [row] } = await query(
      'INSERT INTO amulet_catalog (group_name, name, image_url, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [group_name, name, image_url, description || '']
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalog/:id — admin
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulet_catalog WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    const { group_name, name, description } = req.body;
    let image_url = existing.image_url;
    if (req.file) {
      deleteCloudinaryImage(existing.image_url);
      image_url = req.file.path;
    }
    const { rows: [row] } = await query(
      'UPDATE amulet_catalog SET group_name = $1, name = $2, image_url = $3, description = $4 WHERE id = $5 RETURNING *',
      [group_name || existing.group_name, name || existing.name, image_url, description !== undefined ? description : existing.description, req.params.id]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/catalog/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulet_catalog WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    deleteCloudinaryImage(existing.image_url);
    await query('DELETE FROM amulet_catalog WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
