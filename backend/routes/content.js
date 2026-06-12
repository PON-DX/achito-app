const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'achito-site', allowed_formats: ['jpeg', 'jpg', 'png', 'webp'] },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/content/:section — public
router.get('/:section', async (req, res) => {
  try {
    const { rows: [row] } = await query(
      'SELECT content FROM site_content WHERE section = $1',
      [req.params.section]
    );
    res.json(row ? row.content : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content/:section — admin only
router.put('/:section', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const section = req.params.section;
    let updates = {};
    try { updates = JSON.parse(req.body.data || '{}'); } catch {}

    if (req.file) {
      updates.image_url = req.file.path;
    }

    const { rows: [existing] } = await query(
      'SELECT content FROM site_content WHERE section = $1', [section]
    );

    const merged = { ...(existing?.content || {}), ...updates };

    const { rows: [saved] } = await query(`
      INSERT INTO site_content (section, content, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (section) DO UPDATE SET content = $2::jsonb, updated_at = NOW()
      RETURNING content
    `, [section, JSON.stringify(merged)]);

    res.json(saved.content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
