const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for PostgreSQL database client');
}

const isNeon = process.env.DATABASE_URL.includes('neon.tech');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: isNeon ? 'require' : false,
});

// Compatibility helper: some controllers call sql.query(text, params).
sql.query = (text, params = []) => sql.unsafe(text, params);

const db = drizzle(sql);

module.exports = { db, sql };
