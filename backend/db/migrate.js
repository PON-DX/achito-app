// Creates/updates the schema and seeds initial data. Run with `npm run migrate`
// (Railway runs it as the preDeployCommand before each deploy).
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
