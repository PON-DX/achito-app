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

async function getAmuletWithImages(id) {
  const { rows: [amulet] } = await query(`
    SELECT a.*,
      COALESCE(json_agg(pi.image_url ORDER BY pi.sort_order) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS images,
      sp.facebook_url AS seller_facebook_url
    FROM amulets a
    LEFT JOIN product_images pi ON a.id = pi.product_id
    LEFT JOIN seller_profiles sp ON a.seller_username = sp.username
    WHERE a.id = $1
    GROUP BY a.id, sp.facebook_url
  `, [id]);
  return amulet;
}

async function deleteCloudinaryImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  for (const url of unique) {
    try {
      const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    } catch {}
  }
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, category, status, seller } = req.query;
    let sql = 'SELECT * FROM amulets WHERE 1=1';
    const params = [];
    let idx = 1;

    if (seller) {
      sql += ` AND seller_username = $${idx}`;
      params.push(seller);
      idx++;
    }
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

    sql += " ORDER BY CASE WHEN status = 'sold_out' THEN 1 ELSE 0 END ASC, created_at DESC";

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/sales-summary?seller=username
router.get('/sales-summary', async (req, res) => {
  try {
    const { seller } = req.query;
    if (!seller) return res.json({ sold_count: 0, total_value: 0 });
    const { rows: [row] } = await query(
      `SELECT COUNT(*)::int AS sold_count, COALESCE(SUM(price), 0)::numeric AS total_value
       FROM amulets WHERE seller_username = $1 AND status = 'sold_out'`,
      [seller]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const amulet = await getAmuletWithImages(req.params.id);
    if (!amulet) return res.status(404).json({ error: 'Amulet not found.' });
    res.json(amulet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    const files = req.files || [];
    const image_url = files.length > 0 ? files[0].path : null;

    const { rows: [newAmulet] } = await query(`
      INSERT INTO amulets (name, category, temple, batch_version, year, price, status, description, image_url, stock, seller_username)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      name, category, temple || null, batch_version || null, year || null,
      parseFloat(price), status || 'available', description || null, image_url,
      stock !== '' && stock !== undefined && stock !== null ? parseInt(stock) : null,
      req.user?.username || null,
    ]);

    for (let i = 0; i < files.length; i++) {
      await query(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
        [newAmulet.id, files[i].path, i]
      );
    }

    const result = await getAmuletWithImages(newAmulet.id);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulets WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

    const { name, category, temple, batch_version, year, price, status, description, stock } = req.body;

    const files = req.files || [];
    let image_url = existing.image_url;

    if (files.length > 0) {
      const { rows: oldImages } = await query('SELECT image_url FROM product_images WHERE product_id = $1', [req.params.id]);
      const urlsToDelete = oldImages.map(r => r.image_url);
      if (existing.image_url) urlsToDelete.push(existing.image_url);
      await deleteCloudinaryImages(urlsToDelete);
      await query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);

      for (let i = 0; i < files.length; i++) {
        await query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [req.params.id, files[i].path, i]
        );
      }
      image_url = files[0].path;
    }

    const newStock = stock !== undefined
      ? (stock === '' || stock === null ? null : parseInt(stock))
      : existing.stock;

    await query(`
      UPDATE amulets SET
        name = $1, category = $2, temple = $3, batch_version = $4, year = $5,
        price = $6, status = $7, description = $8, image_url = $9, stock = $10,
        updated_at = NOW()
      WHERE id = $11
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

    const result = await getAmuletWithImages(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { rows: [existing] } = await query('SELECT * FROM amulets WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Amulet not found.' });

    const { rows: productImages } = await query('SELECT image_url FROM product_images WHERE product_id = $1', [req.params.id]);
    const urlsToDelete = productImages.map(r => r.image_url);
    if (existing.image_url) urlsToDelete.push(existing.image_url);
    await deleteCloudinaryImages(urlsToDelete);

    await query('DELETE FROM amulets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Amulet deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
