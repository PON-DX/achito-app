const express = require('express');
const { createUpload } = require('../upload');
const cloudinary = require('../cloudinary');
const { query, getClient } = require('../db/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const upload = createUpload('scam-reports');

const MAX_IMAGES = 5;
const DAILY_REPORT_LIMIT = 5;
const STATUSES = ['pending', 'approved', 'rejected'];
const MAX_LENGTH = {
  bank_name: 100,
  account_name: 150,
  item_description: 500,
  details: 3000,
  admin_note: 1000,
};

// Shared SELECT: report columns + ordered images. incident_date as text avoids timezone shifts.
const REPORT_SELECT = `
  SELECT r.id, r.reporter_id, r.bank_name, r.account_number, r.account_name, r.amount,
    r.item_description, to_char(r.incident_date, 'YYYY-MM-DD') AS incident_date, r.details,
    r.status, r.admin_note, r.created_at, r.updated_at, u.username AS reporter_username,
    COALESCE(
      json_agg(json_build_object('id', i.id, 'image_url', i.image_url) ORDER BY i.sort_order)
        FILTER (WHERE i.id IS NOT NULL),
      '[]'::json
    ) AS images
  FROM scam_reports r
  LEFT JOIN users u ON u.id = r.reporter_id
  LEFT JOIN scam_report_images i ON i.report_id = r.id
`;
const REPORT_GROUP = 'GROUP BY r.id, u.username';

// Public view never exposes who reported it or the admin's note
function toPublic(r) {
  const { reporter_id, reporter_username, admin_note, status, ...rest } = r;
  return rest;
}

function toOwner(r) {
  const { reporter_id, reporter_username, ...rest } = r;
  return rest;
}

function normalizeAccountNumber(value) {
  return String(value ?? '').replace(/[\s-]/g, '');
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function todayInBangkok() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

function validateReport(body, fileCount) {
  const data = {
    bank_name: normalizeText(body.bank_name),
    account_number: normalizeAccountNumber(body.account_number),
    account_name: normalizeText(body.account_name),
    amount: String(body.amount ?? '').replace(/,/g, '').trim(),
    item_description: String(body.item_description ?? '').trim(),
    incident_date: String(body.incident_date ?? '').trim(),
    details: String(body.details ?? '').trim() || null,
  };

  for (const field of ['bank_name', 'account_number', 'account_name', 'amount', 'item_description', 'incident_date']) {
    if (!data[field]) return { error: `${field} is required.` };
  }
  for (const [field, max] of Object.entries(MAX_LENGTH)) {
    if (data[field] && data[field].length > max) return { error: `${field} must be at most ${max} characters.` };
  }
  if (!/^\d{10,15}$/.test(data.account_number)) {
    return { error: 'account_number must be 10-15 digits.' };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(data.amount) || Number(data.amount) <= 0 || Number(data.amount) >= 1e12) {
    return { error: 'amount must be a number greater than 0.' };
  }
  const date = new Date(`${data.incident_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.incident_date) || isNaN(date) || date.toISOString().slice(0, 10) !== data.incident_date) {
    return { error: 'incident_date must be a valid date (YYYY-MM-DD).' };
  }
  if (data.incident_date > todayInBangkok()) {
    return { error: 'incident_date cannot be in the future.' };
  }
  if (fileCount < 1 || fileCount > MAX_IMAGES) {
    return { error: `Please attach 1-${MAX_IMAGES} images.` };
  }
  return { data };
}

function deleteImages(publicIds) {
  return Promise.allSettled(publicIds.map(id => cloudinary.uploader.destroy(id)));
}

// Runs before multer so rejected requests never upload anything to Cloudinary
async function dailyLimit(req, res, next) {
  try {
    const { rows: [{ count }] } = await query(
      "SELECT COUNT(*)::int AS count FROM scam_reports WHERE reporter_id = $1 AND created_at > NOW() - INTERVAL '24 hours'",
      [req.user.id]
    );
    if (count >= DAILY_REPORT_LIMIT) {
      return res.status(429).json({ error: `You can submit at most ${DAILY_REPORT_LIMIT} reports per day.` });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReport(id) {
  const { rows: [report] } = await query(`${REPORT_SELECT} WHERE r.id = $1 ${REPORT_GROUP}`, [id]);
  return report;
}

// POST /api/scam-reports — logged-in users, 1-5 images
router.post('/', authenticateToken, dailyLimit, upload.array('images', MAX_IMAGES), async (req, res) => {
  const files = req.files || [];
  const { data, error } = validateReport(req.body, files.length);
  if (error) {
    await deleteImages(files.map(f => f.filename));
    return res.status(400).json({ error });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: [report] } = await client.query(`
      INSERT INTO scam_reports
        (reporter_id, bank_name, account_number, account_name, amount, item_description, incident_date, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [req.user.id, data.bank_name, data.account_number, data.account_name, data.amount,
        data.item_description, data.incident_date, data.details]);

    for (let i = 0; i < files.length; i++) {
      await client.query(
        'INSERT INTO scam_report_images (report_id, image_url, public_id, sort_order) VALUES ($1, $2, $3, $4)',
        [report.id, files[i].path, files[i].filename, i]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(toOwner(await getReport(report.id)));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    await deleteImages(files.map(f => f.filename));
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/scam-reports/search?q= — public, approved reports only
router.get('/search', async (req, res) => {
  try {
    const q = normalizeText(req.query.q);
    const digits = normalizeAccountNumber(q);
    let where;
    let param;

    if (/^\d+$/.test(digits)) {
      if (digits.length < 10) return res.status(400).json({ error: 'Please enter the full account number (10-15 digits).' });
      where = 'r.account_number = $1';
      param = digits;
    } else {
      if (q.length < 2) return res.status(400).json({ error: 'Please enter at least 2 characters.' });
      where = "r.account_name ILIKE '%' || $1 || '%'";
      param = q.replace(/[\\%_]/g, '\\$&');
    }

    const { rows: [summary] } = await query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(r.amount), 0) AS total_amount
       FROM scam_reports r WHERE r.status = 'approved' AND ${where}`,
      [param]
    );
    const { rows } = await query(
      `${REPORT_SELECT} WHERE r.status = 'approved' AND ${where} ${REPORT_GROUP}
       ORDER BY r.incident_date DESC, r.id DESC LIMIT 50`,
      [param]
    );
    res.json({ count: summary.count, total_amount: summary.total_amount, reports: rows.map(toPublic) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scam-reports/mine — the current user's reports with status
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query(
      `${REPORT_SELECT} WHERE r.reporter_id = $1 ${REPORT_GROUP} ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(toOwner));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scam-reports/admin?status=pending — admin review queue
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    if (status !== 'all' && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const { rows } = await query(
      `${REPORT_SELECT} ${status === 'all' ? '' : 'WHERE r.status = $1'} ${REPORT_GROUP} ORDER BY r.created_at ASC`,
      status === 'all' ? [] : [status]
    );
    const { rows: counts } = await query('SELECT status, COUNT(*)::int AS count FROM scam_reports GROUP BY status');
    res.json({
      reports: rows,
      counts: Object.fromEntries(STATUSES.map(s => [s, counts.find(c => c.status === s)?.count || 0])),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scam-reports/:id — approved, or the reporter, or an admin
router.get('/:id(\\d+)', optionalAuth, async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    const isAdmin = req.user?.role === 'admin';
    const isOwner = report && req.user?.id === report.reporter_id;
    if (!report || (report.status !== 'approved' && !isOwner && !isAdmin)) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json(isAdmin ? report : isOwner ? toOwner(report) : toPublic(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/scam-reports/:id/status — admin approves/rejects
router.patch('/:id(\\d+)/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const admin_note = String(req.body.admin_note ?? '').trim() || null;
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    if (admin_note && admin_note.length > MAX_LENGTH.admin_note) {
      return res.status(400).json({ error: `admin_note must be at most ${MAX_LENGTH.admin_note} characters.` });
    }

    const { rowCount } = await query(
      'UPDATE scam_reports SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3',
      [status, admin_note, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Report not found.' });
    res.json(await getReport(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/scam-reports/:id — admin, also removes the images from Cloudinary
router.delete('/:id(\\d+)', requireAdmin, async (req, res) => {
  try {
    const { rows: images } = await query('SELECT public_id FROM scam_report_images WHERE report_id = $1', [req.params.id]);
    const { rowCount } = await query('DELETE FROM scam_reports WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Report not found.' });
    await deleteImages(images.map(i => i.public_id));
    res.json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
