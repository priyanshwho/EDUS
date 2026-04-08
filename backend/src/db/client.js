const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Neon/Drizzle database client');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

module.exports = { db, sql };
