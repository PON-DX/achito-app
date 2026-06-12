const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { query } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'achito-check-amulet',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'heic'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// GET /api/chat/conversation
router.get('/conversation', async (req, res) => {
  try {
    let { rows: [conv] } = await query(
      'SELECT * FROM chat_conversations WHERE user_id = $1', [req.user.id]
    );
    if (!conv) {
      const { rows: [newConv] } = await query(
        'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING *', [req.user.id]
      );
      conv = newConv;
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/conversations — admin: all conversations
router.get('/conversations', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  try {
    const { rows } = await query(`
      SELECT
        c.id, c.user_id, c.last_message_at, c.created_at,
        u.username, u.email, u.first_name, u.last_name,
        lm.content AS last_message,
        lm.sender_role AS last_sender_role,
        lm.message_type AS last_message_type,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) AS message_count
      FROM chat_conversations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN chat_messages lm ON lm.id = (
        SELECT id FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
      )
      ORDER BY c.last_message_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { rows: [conv] } = await query(
      'SELECT * FROM chat_conversations WHERE id = $1', [req.params.id]
    );
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (req.user.role !== 'admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const since = req.query.since;
    let rows;
    if (since) {
      ({ rows } = await query(`
        SELECT m.*, u.username AS sender_username
        FROM chat_messages m JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1 AND m.created_at > $2
        ORDER BY m.created_at ASC
      `, [req.params.id, since]));
    } else {
      ({ rows } = await query(`
        SELECT m.*, u.username AS sender_username
        FROM chat_messages m JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [req.params.id]));
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, message_type = 'text' } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required.' });

    const { rows: [conv] } = await query(
      'SELECT * FROM chat_conversations WHERE id = $1', [req.params.id]
    );
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (req.user.role !== 'admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { rows: [msg] } = await query(`
      INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.params.id, req.user.id, req.user.role, content.trim(), message_type]);

    await query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [req.params.id]);

    const { rows: [fullMsg] } = await query(`
      SELECT m.*, u.username AS sender_username
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [msg.id]);

    res.status(201).json(fullMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/check-amulet — upload photo for amulet check
router.post('/check-amulet', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'กรุณาแนบรูปภาพ' });

    const imageUrl = req.file.path;
    const note = (req.body.note || '').trim();

    let { rows: [conv] } = await query(
      'SELECT * FROM chat_conversations WHERE user_id = $1', [req.user.id]
    );
    if (!conv) {
      const { rows: [newConv] } = await query(
        'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING *', [req.user.id]
      );
      conv = newConv;
    }

    const content = JSON.stringify({ image: imageUrl, note });
    const { rows: [msg] } = await query(`
      INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
      VALUES ($1, $2, $3, $4, 'check_amulet')
      RETURNING *
    `, [conv.id, req.user.id, req.user.role, content]);

    await query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [conv.id]);

    const { rows: [fullMsg] } = await query(`
      SELECT m.*, u.username AS sender_username
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [msg.id]);

    res.status(201).json({ conversation_id: conv.id, message: fullMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
