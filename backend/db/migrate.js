// Creates/updates the schema and seeds initial data without starting the server.
// The server runs the same initializeSchema() on every start; this is for manual runs.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool, initializeSchema } = require('./database');

initializeSchema()
  .then(() => pool.end())
  .catch(async err => {
    console.error('❌ Migration failed:', err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
