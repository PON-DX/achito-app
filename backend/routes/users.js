const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// GET /api/users
router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// POST /api/users — admin creates another admin
router.post('/', (req, res) => {
  const { username, password, email, first_name, last_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already taken.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, email, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, hash, email || null, first_name || null, last_name || null, 'admin');

  const user = db.prepare('SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted.' });
});

module.exports = router;
