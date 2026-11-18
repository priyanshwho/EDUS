const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

async function migrateStudy(sql) {
  const migration = await fs.readFile(path.join(__dirname, '../drizzle/0001_private_study.sql'), 'utf8');
  const checksum = createHash('sha256').update(migration).digest('hex');
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(91827261)`;
    await tx`CREATE TABLE IF NOT EXISTS study_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
    const existing = await tx`SELECT checksum FROM study_schema_migrations WHERE name = '0001_private_study'`;
    if (existing.length) {
      if (existing[0].checksum !== checksum) throw new Error('Study migration differs from the applied migration. Create a new migration instead of editing an applied one.');
      return false;
    }
    await tx.unsafe(migration);
    await tx`INSERT INTO study_schema_migrations (name, checksum) VALUES ('0001_private_study', ${checksum})`;
    return true;
  });
}

if (require.main === module) {
  require('dotenv').config();
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to run the study migration.');
    process.exitCode = 1;
  } else {
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: process.env.DATABASE_URL.includes('neon.tech') ? 'require' : false });
    migrateStudy(sql).then((changed) => console.log(changed ? 'Private study schema created.' : 'Private study schema already up to date.'))
      .catch((error) => { console.error('Study migration failed:', error.message); process.exitCode = 1; })
      .finally(() => sql.end());
  }
}

module.exports = { migrateStudy };
