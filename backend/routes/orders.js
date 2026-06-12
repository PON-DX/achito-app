const express = require('express');
const { query, getClient } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — place order from cart
router.post('/', authenticateToken, async (req, res) => {
  const { notes, full_name, phone, shipping_address } = req.body;

  try {
    const { rows: cartItems } = await query(`
      SELECT c.id as cart_id, c.quantity, a.id as amulet_id, a.name, a.price, a.image_url, a.status, a.stock
      FROM carts c JOIN amulets a ON c.amulet_id = a.id
      WHERE c.user_id = $1
    `, [req.user.id]);

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty.' });

    const soldOut = cartItems.find(i => i.status === 'sold_out');
    if (soldOut) return res.status(400).json({ error: `"${soldOut.name}" is sold out.` });

    const notEnough = cartItems.find(i => i.stock !== null && i.stock < i.quantity);
    if (notEnough) return res.status(400).json({ error: `"${notEnough.name}" มีสินค้าไม่เพียงพอ (คงเหลือ ${notEnough.stock} ชิ้น)` });

    const total = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

    const client = await getClient();
    let orderId, convId;
    try {
      await client.query('BEGIN');

      const { rows: [order] } = await client.query(`
        INSERT INTO orders (user_id, total_price, full_name, phone, shipping_address, payment_method, notes)
        VALUES ($1, $2, $3, $4, $5, 'contact_seller', $6)
        RETURNING id
      `, [req.user.id, total, full_name || null, phone || null, shipping_address || null, notes || null]);
      orderId = order.id;

      for (const item of cartItems) {
        await client.query(`
          INSERT INTO order_items (order_id, amulet_id, amulet_name, amulet_image, quantity, price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderId, item.amulet_id, item.name, item.image_url, item.quantity, item.price]);
      }

      await client.query('DELETE FROM carts WHERE user_id = $1', [req.user.id]);

      for (const item of cartItems) {
        if (item.stock !== null) {
          const newStock = item.stock - item.quantity;
          await client.query(`
            UPDATE amulets SET
              stock = $1,
              status = CASE WHEN $2 <= 0 THEN 'sold_out' ELSE status END,
              updated_at = NOW()
            WHERE id = $3
          `, [newStock, newStock, item.amulet_id]);
        }
      }

      const { rows: convRows } = await client.query(
        'SELECT id FROM chat_conversations WHERE user_id = $1', [req.user.id]
      );
      if (convRows.length === 0) {
        const { rows: [newConv] } = await client.query(
          'INSERT INTO chat_conversations (user_id) VALUES ($1) RETURNING id', [req.user.id]
        );
        convId = newConv.id;
      } else {
        convId = convRows[0].id;
      }

      const lineItems = cartItems
        .map(i => `• ${i.name}  ×${i.quantity}  =  ฿${(parseFloat(i.price) * i.quantity).toLocaleString('th-TH')}`)
        .join('\n');
      const orderMsg = [
        `🛕 ออเดอร์ใหม่ #${orderId}`,
        `──────────────────`,
        lineItems,
        `──────────────────`,
        `💰 ยอดรวม: ฿${total.toLocaleString('th-TH')}`,
        notes ? `📝 หมายเหตุ: ${notes}` : null,
      ].filter(Boolean).join('\n');

      await client.query(`
        INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
        VALUES ($1, $2, $3, $4, 'order')
      `, [convId, req.user.id, req.user.role, orderMsg]);

      await client.query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [convId]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const { rows: [newOrder] } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.status(201).json({ ...newOrder, conversation_id: convId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error.' });
  }
});

// GET /api/orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await query(`
        SELECT o.*, u.username, u.email
        FROM orders o LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `));
    } else {
      ({ rows } = await query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      ));
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/track/:query — public tracking
router.get('/track/:query', async (req, res) => {
  try {
    const q = req.params.query;
    const { rows: [order] } = await query(`
      SELECT o.id, o.status, o.tracking_number, o.created_at, o.full_name, o.shipping_address, o.total_price
      FROM orders o WHERE o.id = $1 OR o.tracking_number = $2
    `, [q, q]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'ยกเลิกได้เฉพาะออเดอร์ที่ยังรอดำเนินการเท่านั้น' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [order.id]
      );

      for (const item of items) {
        if (item.amulet_id) {
          await client.query(`
            UPDATE amulets SET
              stock = CASE WHEN stock IS NOT NULL THEN stock + $1 ELSE NULL END,
              status = CASE WHEN status = 'sold_out' AND stock IS NOT NULL AND stock + $2 > 0 THEN 'available' ELSE status END,
              updated_at = NOW()
            WHERE id = $3
          `, [item.quantity, item.quantity, item.amulet_id]);
        }
      }

      const { rows: convRows } = await client.query(
        'SELECT id FROM chat_conversations WHERE user_id = $1', [req.user.id]
      );
      if (convRows.length > 0) {
        const convId = convRows[0].id;
        await client.query(`
          INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content, message_type)
          VALUES ($1, $2, $3, $4, 'text')
        `, [convId, req.user.id, req.user.role, `❌ ยกเลิกออเดอร์ #${order.id}`]);
        await client.query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [convId]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const { rows: [updated] } = await query('SELECT * FROM orders WHERE id = $1', [order.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id — admin: update status/tracking
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, tracking_number } = req.body;
    const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { rows: [updated] } = await query(`
      UPDATE orders SET status = $1, tracking_number = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [
      status || order.status,
      tracking_number !== undefined ? tracking_number : order.tracking_number,
      req.params.id
    ]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
