const express = require('express');
const { query } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.id, c.quantity, a.id as amulet_id, a.name, a.price, a.status, a.image_url, a.category
      FROM carts c JOIN amulets a ON c.amulet_id = a.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { amulet_id, quantity = 1 } = req.body;
    if (!amulet_id) return res.status(400).json({ error: 'amulet_id is required.' });

    const { rows: [amulet] } = await query('SELECT * FROM amulets WHERE id = $1', [amulet_id]);
    if (!amulet) return res.status(404).json({ error: 'Amulet not found.' });
    if (amulet.status === 'sold_out') return res.status(400).json({ error: 'This amulet is sold out.' });

    const { rows: [existing] } = await query(
      'SELECT * FROM carts WHERE user_id = $1 AND amulet_id = $2',
      [req.user.id, amulet_id]
    );

    if (existing) {
      await query('UPDATE carts SET quantity = quantity + $1 WHERE id = $2', [quantity, existing.id]);
    } else {
      await query('INSERT INTO carts (user_id, amulet_id, quantity) VALUES ($1, $2, $3)', [req.user.id, amulet_id, quantity]);
    }

    const { rows } = await query(`
      SELECT c.id, c.quantity, a.id as amulet_id, a.name, a.price, a.status, a.image_url, a.category
      FROM carts c JOIN amulets a ON c.amulet_id = a.id
      WHERE c.user_id = $1
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/:id
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });

    const { rows: [item] } = await query(
      'SELECT * FROM carts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });

    await query('UPDATE carts SET quantity = $1 WHERE id = $2', [quantity, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM carts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart  (clear cart)
router.delete('/', async (req, res) => {
  try {
    await query('DELETE FROM carts WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
