const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Neon/Drizzle database client');
}

const sql = neon(process.env.DATABASE_URL);

// Compatibility helper: some controllers call sql.query(text, params).
// Neon http client is a function, so expose query() as an alias.
sql.query = (text, params = []) => sql(text, params);

const db = drizzle({ client: sql });

module.exports = { db, sql };
