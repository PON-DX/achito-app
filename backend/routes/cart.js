const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/cart
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT c.id, c.quantity, a.id as amulet_id, a.name, a.price, a.status, a.image_url, a.category
    FROM carts c JOIN amulets a ON c.amulet_id = a.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json(items);
});

// POST /api/cart
router.post('/', (req, res) => {
  const { amulet_id, quantity = 1 } = req.body;
  if (!amulet_id) return res.status(400).json({ error: 'amulet_id is required.' });

  const db = getDb();
  const amulet = db.prepare('SELECT * FROM amulets WHERE id = ?').get(amulet_id);
  if (!amulet) return res.status(404).json({ error: 'Amulet not found.' });
  if (amulet.status === 'sold_out') return res.status(400).json({ error: 'This amulet is sold out.' });

  const existing = db.prepare('SELECT * FROM carts WHERE user_id = ? AND amulet_id = ?').get(req.user.id, amulet_id);
  if (existing) {
    db.prepare('UPDATE carts SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO carts (user_id, amulet_id, quantity) VALUES (?, ?, ?)').run(req.user.id, amulet_id, quantity);
  }

  const items = db.prepare(`
    SELECT c.id, c.quantity, a.id as amulet_id, a.name, a.price, a.status, a.image_url, a.category
    FROM carts c JOIN amulets a ON c.amulet_id = a.id
    WHERE c.user_id = ?
  `).all(req.user.id);
  res.json(items);
});

// PUT /api/cart/:id
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });

  const db = getDb();
  const item = db.prepare('SELECT * FROM carts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found.' });

  db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  res.json({ success: true });
});

// DELETE /api/cart/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// DELETE /api/cart  (clear cart)
router.delete('/', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM carts WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
