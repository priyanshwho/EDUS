const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');

const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('\n[FATAL] Missing required environment variables:');
  missing.forEach(k => console.error(`  ✗ ${k}`));
  console.error('\nCopy .env.example to .env and fill in the values.\n');
  process.exit(1);   // clean exit with code 1 — PM2/systemd will restart and log it clearly
}

const isNeon = process.env.DATABASE_URL.includes('neon.tech');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: isNeon ? 'require' : false,
  // Prevent unhandled connection errors from crashing the process
  onnotice: () => {},
});

// Compatibility helper: some controllers call sql.query(text, params).
sql.query = (text, params = []) => sql.unsafe(text, params);

const db = drizzle(sql);

module.exports = { db, sql };
