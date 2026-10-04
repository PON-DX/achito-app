const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
require('./db/database');
const { uploadErrorHandler } = require('./upload');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const userRoutes    = require('./routes/users');
const chatRoutes    = require('./routes/chat');
const contentRoutes = require('./routes/content');
const historyRoutes = require('./routes/history');
const catalogRoutes = require('./routes/catalog');
const posterRoutes  = require('./routes/posters');
const scamReportRoutes = require('./routes/scamReports');

const app  = express();
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/content',  contentRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/catalog',  catalogRoutes);
app.use('/api/posters',  posterRoutes);
app.use('/api/scam-reports', scamReportRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));

// Frontend build + SPA fallback for client-side routes
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
} else {
  console.warn(`⚠️  Frontend build not found at ${DIST_DIR}; serving API only.`);
}

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use(uploadErrorHandler);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏮 Achito API running on http://localhost:${PORT}\n`);
});
