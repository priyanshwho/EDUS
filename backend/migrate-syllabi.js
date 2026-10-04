require('dotenv').config();
const { sql } = require('./src/db/client');

async function migrate() {
  console.log('[Migration] Creating syllabi table...');

  await sql`
    CREATE TABLE IF NOT EXISTS syllabi (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_name TEXT NOT NULL,
      subject_code TEXT,
      branch       TEXT NOT NULL,
      semester     INT NOT NULL,
      content      TEXT NOT NULL,
      section_a    TEXT,
      section_b    TEXT,
      created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  console.log('✓ Created syllabi table');

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_syllabi_subject_branch_sem 
    ON syllabi (LOWER(subject_name), UPPER(branch), semester);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_syllabi_branch_sem 
    ON syllabi (UPPER(branch), semester);
  `;
  console.log('✓ Created syllabi indexes');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
