// Read-only operator check. Never prints secrets or sends prompts to Groq.
require('dotenv').config();
const postgres = require('postgres');
const { embeddingIdentity } = require('../src/ai/study/embedding-config');

async function main() {
  const required = ['DATABASE_URL', 'GROQ_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME', 'STUDY_INTERNAL_TOKEN'];
  const report = { configuration: Object.fromEntries(required.map(key => [key, Boolean(process.env[key])])),
    freePlanConfirmedByOperator: process.env.STUDY_GROQ_FREE_PLAN_CONFIRMED === 'true', database: null, embeddings: null };
  if (process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 8, ssl: process.env.DATABASE_URL.includes('neon.tech') ? 'require' : false, onnotice: () => {} });
    try {
      const [row] = await sql`SELECT to_regclass('public.study_workspaces') IS NOT NULL AS workspaces,
        to_regclass('public.study_usage') IS NOT NULL AS usage,
        to_regclass('public.study_account_deletions') IS NOT NULL AS account_cleanup,
        EXISTS(SELECT 1 FROM pg_extension WHERE extname='vector') AS pgvector,
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_documents' AND column_name='pasted_text') AS pasted_text`;
      report.database = row;
    } catch (error) { report.database = { error: error.code || 'DATABASE_UNAVAILABLE' }; }
    finally { await sql.end({ timeout: 1 }); }
  }
  if ((process.env.STUDY_INTERNAL_TOKEN || '').length >= 16) {
    try {
      const response = await fetch(`${process.env.STUDY_EMBEDDING_URL || 'http://127.0.0.1:8091'}/health`, {
        headers: { 'X-Study-Token': process.env.STUDY_INTERNAL_TOKEN }, signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      const identity = embeddingIdentity();
      report.embeddings = { ready: response.ok && data.dimension === 384 && data.model === identity.model && data.revision === identity.revision };
    } catch { report.embeddings = { ready: false }; }
  }
  console.log(JSON.stringify(report, null, 2));
  if (!Object.values(report.configuration).every(Boolean) || !report.freePlanConfirmedByOperator ||
      !report.database || !Object.values(report.database).every(value => value === true) || !report.embeddings?.ready) process.exitCode = 1;
}
main().catch(() => { console.error('Readiness check could not complete. No data was changed.'); process.exitCode = 1; });
