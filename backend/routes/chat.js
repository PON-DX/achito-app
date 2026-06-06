const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `check-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Image files only.'));
  },
});

// GET /api/chat/conversation — get or create conversation for current user
router.get('/conversation', (req, res) => {
  const db = getDb();
  let conv = db.prepare('SELECT * FROM chat_conversations WHERE user_id = ?').get(req.user.id);
  if (!conv) {
    const r = db.prepare('INSERT INTO chat_conversations (user_id) VALUES (?)').run(req.user.id);
    conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(r.lastInsertRowid);
  }
  res.json(conv);
});

// GET /api/chat/conversations — admin: all conversations with user info + last message
router.get('/conversations', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const db = getDb();
  const convs = db.prepare(`
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
  `).all();
  res.json(convs);
});

// GET /api/chat/conversations/:id/messages — get messages (poll)
router.get('/conversations/:id/messages', (req, res) => {
  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
  if (req.user.role !== 'admin' && conv.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const since = req.query.since; // optional: only return messages after this timestamp
  let messages;
  if (since) {
    messages = db.prepare(`
      SELECT m.*, u.username AS sender_username
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ? AND m.created_at > ?
      ORDER BY m.created_at ASC
    `).all(req.params.id, since);
  } else {
    messages = db.prepare(`
      SELECT m.*, u.username AS sender_username
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.id);
  }
  res.json(messages);
});

// POST /api/chat/conversations/:id/messages — send message
router.post('/conversations/:id/messages', (req, res) => {
  const { content, message_type = 'text' } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required.' });

  const db = getDb();
  const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
  if (req.user.role !== 'admin' && conv.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const result = db.prepare(`
    INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, req.user.role, content.trim(), message_type);

  db.prepare('UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  const msg = db.prepare(`
    SELECT m.*, u.username AS sender_username
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(msg);
});

// POST /api/chat/check-amulet — upload photo for amulet authenticity check
router.post('/check-amulet', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'กรุณาแนบรูปภาพ' });

  const db = getDb();
  const imageUrl = `/uploads/${req.file.filename}`;
  const note = (req.body.note || '').trim();

  let conv = db.prepare('SELECT * FROM chat_conversations WHERE user_id = ?').get(req.user.id);
  if (!conv) {
    const r = db.prepare('INSERT INTO chat_conversations (user_id) VALUES (?)').run(req.user.id);
    conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(r.lastInsertRowid);
  }

  const content = JSON.stringify({ image: imageUrl, note });
  const result = db.prepare(`
    INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
    VALUES (?, ?, ?, ?, 'check_amulet')
  `).run(conv.id, req.user.id, req.user.role, content);

  db.prepare('UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conv.id);

  const msg = db.prepare(`
    SELECT m.*, u.username AS sender_username
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ conversation_id: conv.id, message: msg });
});

module.exports = router;
