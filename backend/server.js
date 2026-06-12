require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./db/database');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const userRoutes    = require('./routes/users');
const chatRoutes    = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/chat',     chatRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

initializeSchema()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🏮 Achito API running on http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
