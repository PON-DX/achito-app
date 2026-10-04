const jwt = require('jsonwebtoken');
const { query } = require('../db/database');

function getToken(req) {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1];
}

// Verifies the JWT, then reloads the user so deleted accounts and role changes
// take effect immediately instead of when the token expires.
async function loadUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const { rows: [user] } = await query('SELECT id, username, role FROM users WHERE id = $1', [payload.id]);
  return user || null;
}

async function authenticateToken(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  let user;
  try {
    user = await loadUser(token);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) return res.status(403).json({ error: 'Invalid or expired token.' });
    return next(err);
  }
  if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    authenticateToken(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'You do not have permission to do this.' });
      }
      next();
    });
  };
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  });
}

// Sets req.user when a valid token is sent, but lets anonymous requests through
async function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (token) {
    try { req.user = (await loadUser(token)) || undefined; } catch {}
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, requireRole, optionalAuth };
