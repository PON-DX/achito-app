const express = require('express');
const bcrypt = require('bcryptjs');
const { query, getClient } = require('../db/database');
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

// POST /api/users — admin creates an admin or seller account
router.post('/', async (req, res) => {
  try {
    const { username, password, email, first_name, last_name, role = 'admin' } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    if (!['admin', 'seller'].includes(role)) return res.status(400).json({ error: 'role must be admin or seller.' });

    const { rows: [existing] } = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    const hash = bcrypt.hashSync(password, 10);
    const { rows: [user] } = await query(
      'INSERT INTO users (username, password, email, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role, created_at',
      [username, hash, email || null, first_name || null, last_name || null, role]
    );
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

class UserChangeError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Runs `change(client, user)` in a transaction that locks every admin row first,
// so two admins demoting/deleting each other at once can't leave zero admins.
async function changeUserSafely(targetId, change) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: admins } = await client.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE");
    const { rows: [user] } = await client.query('SELECT id, username, role FROM users WHERE id = $1 FOR UPDATE', [targetId]);
    if (!user) throw new UserChangeError(404, 'User not found.');
    const isLastAdmin = user.role === 'admin' && admins.length <= 1;
    const result = await change(client, user, isLastAdmin);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

function sendError(res, err) {
  res.status(err instanceof UserChangeError ? err.status : 500).json({ error: err.message });
}

// PATCH /api/users/:id/role — admin changes a user to customer or seller
router.patch('/:id(\\d+)/role', async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'seller'].includes(role)) return res.status(400).json({ error: 'role must be customer or seller.' });
  if (parseInt(req.params.id, 10) === req.user.id) return res.status(400).json({ error: 'You cannot change your own role.' });
  try {
    const user = await changeUserSafely(req.params.id, async (client, user, isLastAdmin) => {
      if (isLastAdmin) throw new UserChangeError(400, 'Cannot demote the last admin.');
      const { rows: [updated] } = await client.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, first_name, last_name, role, created_at',
        [role, user.id]
      );
      return updated;
    });
    res.json(user);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE /api/users/:id
router.delete('/:id(\\d+)', async (req, res) => {
  if (parseInt(req.params.id, 10) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }
  try {
    await changeUserSafely(req.params.id, async (client, user, isLastAdmin) => {
      if (isLastAdmin) throw new UserChangeError(400, 'Cannot delete the last admin.');
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
