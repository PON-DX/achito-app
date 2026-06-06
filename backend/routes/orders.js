const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — place order from cart (no required shipping info; auto-sends to chat)
router.post('/', authenticateToken, (req, res) => {
  const { notes, full_name, phone, shipping_address } = req.body;

  const db = getDb();
  const cartItems = db.prepare(`
    SELECT c.id as cart_id, c.quantity, a.id as amulet_id, a.name, a.price, a.image_url, a.status, a.stock
    FROM carts c JOIN amulets a ON c.amulet_id = a.id
    WHERE c.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty.' });

  const soldOut = cartItems.find(i => i.status === 'sold_out');
  if (soldOut) return res.status(400).json({ error: `"${soldOut.name}" is sold out.` });

  const notEnough = cartItems.find(i => i.stock !== null && i.stock < i.quantity);
  if (notEnough) return res.status(400).json({ error: `"${notEnough.name}" มีสินค้าไม่เพียงพอ (คงเหลือ ${notEnough.stock} ชิ้น)` });

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const result = db.transaction(() => {
    // Create order
    const order = db.prepare(`
      INSERT INTO orders (user_id, total_price, full_name, phone, shipping_address, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, 'contact_seller', ?)
    `).run(req.user.id, total, full_name || null, phone || null, shipping_address || null, notes || null);

    const orderId = order.lastInsertRowid;

    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, amulet_id, amulet_name, amulet_image, quantity, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of cartItems) {
      insertItem.run(orderId, item.amulet_id, item.name, item.image_url, item.quantity, item.price);
    }

    // Clear cart
    db.prepare('DELETE FROM carts WHERE user_id = ?').run(req.user.id);

    // Deduct stock and auto-mark sold_out when stock reaches 0
    for (const item of cartItems) {
      if (item.stock !== null) {
        const newStock = item.stock - item.quantity;
        db.prepare(`
          UPDATE amulets SET stock = ?, status = CASE WHEN ? <= 0 THEN 'sold_out' ELSE status END,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(newStock, newStock, item.amulet_id);
      }
    }

    // Get or create chat conversation for this user
    let conv = db.prepare('SELECT * FROM chat_conversations WHERE user_id = ?').get(req.user.id);
    if (!conv) {
      const r = db.prepare('INSERT INTO chat_conversations (user_id) VALUES (?)').run(req.user.id);
      conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(r.lastInsertRowid);
    }

    // Build order summary message
    const lineItems = cartItems
      .map(i => `• ${i.name}  ×${i.quantity}  =  ฿${(i.price * i.quantity).toLocaleString('th-TH')}`)
      .join('\n');
    const orderMsg = [
      `🛕 ออเดอร์ใหม่ #${orderId}`,
      `──────────────────`,
      lineItems,
      `──────────────────`,
      `💰 ยอดรวม: ฿${total.toLocaleString('th-TH')}`,
      notes ? `📝 หมายเหตุ: ${notes}` : null,
    ].filter(Boolean).join('\n');

    db.prepare(`
      INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
      VALUES (?, ?, ?, ?, 'order')
    `).run(conv.id, req.user.id, req.user.role, orderMsg);

    db.prepare('UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conv.id);

    return { orderId, convId: conv.id };
  })();

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.orderId);
  res.status(201).json({ ...newOrder, conversation_id: result.convId });
});

// GET /api/orders
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let orders;
  if (req.user.role === 'admin') {
    orders = db.prepare(`
      SELECT o.*, u.username, u.email
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();
  } else {
    orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json(orders);
});

// GET /api/orders/track/:query — public tracking
router.get('/track/:query', (req, res) => {
  const db = getDb();
  const q = req.params.query;
  const order = db.prepare(`
    SELECT o.id, o.status, o.tracking_number, o.created_at, o.full_name, o.shipping_address, o.total_price
    FROM orders o WHERE o.id = ? OR o.tracking_number = ?
  `).get(q, q);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// POST /api/orders/:id/cancel — customer cancels own pending order, stock restored
router.post('/:id/cancel', authenticateToken, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'ยกเลิกได้เฉพาะออเดอร์ที่ยังรอดำเนินการเท่านั้น' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  db.transaction(() => {
    db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(order.id);

    for (const item of items) {
      if (item.amulet_id) {
        db.prepare(`
          UPDATE amulets SET
            stock = CASE WHEN stock IS NOT NULL THEN stock + ? ELSE NULL END,
            status = CASE WHEN status = 'sold_out' AND stock IS NOT NULL AND stock + ? > 0 THEN 'available' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.quantity, item.quantity, item.amulet_id);
      }
    }

    const conv = db.prepare('SELECT * FROM chat_conversations WHERE user_id = ?').get(req.user.id);
    if (conv) {
      db.prepare(`
        INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
        VALUES (?, ?, ?, ?, 'text')
      `).run(conv.id, req.user.id, req.user.role, `❌ ยกเลิกออเดอร์ #${order.id}`);
      db.prepare('UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conv.id);
    }
  })();

  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id));
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// PUT /api/orders/:id — admin: update status/tracking
router.put('/:id', requireAdmin, (req, res) => {
  const { status, tracking_number } = req.body;
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  db.prepare(`
    UPDATE orders SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status || order.status, tracking_number !== undefined ? tracking_number : order.tracking_number, req.params.id);
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

module.exports = router;
