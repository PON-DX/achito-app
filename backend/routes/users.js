const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — admin creates another admin
router.post('/', async (req, res) => {
  try {
    const { username, password, email, first_name, last_name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const { rows: [existing] } = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    const hash = bcrypt.hashSync(password, 10);
    const { rows: [user] } = await query(
      'INSERT INTO users (username, password, email, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role, created_at',
      [username, hash, email || null, first_name || null, last_name || null, 'admin']
    );
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    const { rows: [user] } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
