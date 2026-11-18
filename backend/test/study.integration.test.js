const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { database } = require('./helpers/pglite');
const { createWorkspaceService } = require('../src/ai/study/workspaces.service');
const { createDocumentService } = require('../src/ai/study/documents.service');
const { createRagService } = require('../src/ai/study/rag.service');
const { createGroqBudget } = require('../src/ai/study/groq-budget');
const { createRequestLimiter } = require('../src/ai/study/request-limit');
const { EMBEDDING_MODEL, EMBEDDING_REVISION } = require('../src/ai/study/embedding-config');
const { migrateStudy } = require('../scripts/migrate-study');

test('private study SQL lifecycle against isolated PostgreSQL and pgvector', async t => {
  const { sql, close } = await database();
  const owner = randomUUID(), stranger = randomUUID();
  await sql.unsafe('INSERT INTO users(id) VALUES($1),($2)', [owner, stranger]);
  const workspaces = createWorkspaceService({ sql });
  const stored = [];
  const documents = createDocumentService({ sql, storage: {
    putFile: async key => stored.push(key), deleteObject: async () => {}, getDownloadUrl: async () => 'https://example.invalid/authorized',
  } });
  let workspaceId;
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'edus-upload-test-'));
  try {
    await t.test('additive study migrations can be safely run again', async () => {
      assert.equal(await migrateStudy(sql), false);
      assert.equal((await sql.unsafe('SELECT * FROM study_schema_migrations')).length, 3);
    });
    await t.test('six parallel subjects succeed and a seventh is blocked', async () => {
      const created = await Promise.all(Array.from({ length: 6 }, (_, i) => workspaces.create(owner, { title: `Subject ${i}`, idempotencyKey: `subject_${i}` })));
      workspaceId = created[0].workspace.id;
      assert.equal(new Set(created.map(row => row.workspace.slot)).size, 6);
      await assert.rejects(workspaces.create(owner, { title: 'Seventh' }), { status: 409, code: 'SUBJECT_LIMIT_REACHED' });
      assert.equal((await workspaces.list(owner)).usage.subjects, 6);
      const retried = await workspaces.create(owner, { title: 'Subject 0', idempotencyKey: 'subject_0' });
      assert.equal(retried.workspace.id, workspaceId);
    });
    await t.test('another owner cannot list, open, delete, or attach documents to the private subject', async () => {
      assert.equal((await workspaces.list(stranger)).workspaces.length, 0);
      await assert.rejects(workspaces.get(stranger, workspaceId), { code: 'SUBJECT_NOT_FOUND' });
      await assert.rejects(workspaces.remove(stranger, workspaceId), { code: 'SUBJECT_NOT_FOUND' });
      await assert.rejects(documents.initialize(stranger, workspaceId, { kind: 'notes', filename: 'private.pdf', sizeBytes: 40 }), { code: 'SUBJECT_NOT_FOUND' });
      assert.equal(stored.length, 0);
    });
    await t.test('reservations count against the two-upload cap and oversized files never reach storage', async () => {
      const first = await documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'one.pdf', sizeBytes: 40 });
      const second = await documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'two.pdf', sizeBytes: 40 });
      await assert.rejects(documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'three.pdf', sizeBytes: 40 }), { code: 'CONCURRENT_UPLOAD_LIMIT' });
      await assert.rejects(documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'large.pdf', sizeBytes: 21 * 1024 * 1024 }), { code: 'FILE_TOO_LARGE' });
      assert.equal((await workspaces.list(owner)).usage.reservedBytes, 80);
      await documents.remove(owner, first.document.id);
      await documents.remove(owner, second.document.id);
      // Simulate successful durable storage cleanup, not just user deletion.
      await sql.unsafe("UPDATE study_documents SET status='deleted' WHERE workspace_id=$1", [workspaceId]);
      assert.equal(stored.length, 0);
    });
    let uploaded;
    await t.test('an upload ticket is single-use, indexes once, and never exposes its storage key', async () => {
      const bytes = Buffer.from('%PDF-1.7\nfixture for upload transport\n%%EOF\n');
      const file = path.join(temp, 'notes.pdf');
      await fs.writeFile(file, bytes);
      const initialized = await documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'OS.pdf', sizeBytes: bytes.length });
      assert.equal(initialized.document.s3_key, undefined);
      const claim = await documents.claimUpload(owner, initialized.document.id);
      await assert.rejects(documents.claimUpload(owner, initialized.document.id), { code: 'UPLOAD_ALREADY_CLAIMED' });
      uploaded = (await documents.uploadFile(owner, claim, file)).document;
      assert.equal(uploaded.status, 'queued');
      assert.equal(stored.length, 1);
      assert.equal((await sql.unsafe("SELECT * FROM study_jobs WHERE document_id=$1 AND kind='ingest'", [uploaded.id])).length, 1);
      await assert.rejects(documents.source(stranger, uploaded.id), { code: 'DOCUMENT_NOT_FOUND' });
      assert.equal((await documents.source(owner, uploaded.id)).url, 'https://example.invalid/authorized');
      const duplicate = await documents.initialize(owner, workspaceId, { kind: 'notes', filename: 'same.pdf', sizeBytes: bytes.length });
      const duplicateClaim = await documents.claimUpload(owner, duplicate.document.id);
      const result = await documents.uploadFile(owner, duplicateClaim, file);
      assert.equal(result.duplicate, true);
      assert.equal(stored.length, 1);
    });
    await t.test('SQL retrieval cannot include another owner’s vectors or stale deleted sources', async () => {
      const foreignWorkspace = (await workspaces.create(stranger, { title: 'Hidden material' })).workspace;
      const foreignId = randomUUID();
      await sql.unsafe("INSERT INTO study_documents(id,workspace_id,kind,filename,size_bytes,s3_key,status,expires_at) VALUES($1,$2,'notes','hidden.pdf',100,$3,'ready',now())", [foreignId, foreignWorkspace.id, `hidden/${foreignId}`]);
      await sql.unsafe("UPDATE study_documents SET status='ready' WHERE id=$1", [uploaded.id]);
      await sql.unsafe('UPDATE study_documents SET embedding_model=$1,embedding_revision=$2 WHERE id=$3 OR id=$4', [EMBEDDING_MODEL, EMBEDDING_REVISION, uploaded.id, foreignId]);
      const vector = JSON.stringify(Array(384).fill(0.1));
      for (const id of [uploaded.id, foreignId]) {
        await sql.unsafe("INSERT INTO study_pages(document_id,page_number,text,method,quality) VALUES($1,1,$2,'native','good')", [id, id === foreignId ? 'HIDDEN SECRET deadlock' : 'Deadlock needs four conditions.']);
        await sql.unsafe("INSERT INTO study_chunks(id,document_id,page_number,chunk_index,text,tokens,embedding) VALUES($1,$2,1,0,$3,8,$4::vector)", [randomUUID(), id, id === foreignId ? 'HIDDEN SECRET deadlock' : 'Deadlock needs four conditions.', vector]);
      }
      const rag = createRagService({ sql, embed: async () => Array(384).fill(0.1), generate: async () => { throw new Error('not called'); } });
      const result = await rag.retrieve(owner, workspaceId, undefined, 'deadlock');
      assert.equal(result.sources.length, 1);
      assert.equal(result.sources[0].documentId, uploaded.id);
      assert.ok(!JSON.stringify(result).includes('HIDDEN SECRET'));
      const sampled = await rag.coverage(owner, workspaceId);
      assert.equal(sampled.sources[0].documentId, uploaded.id);
      await documents.remove(owner, uploaded.id);
      await assert.rejects(rag.retrieve(owner, workspaceId, undefined, 'deadlock'), { code: 'DOCUMENTS_NOT_READY' });
    });
    await t.test('shared free-tier quota SQL rolls back all counters on exhaustion', async () => {
      const reserve = createGroqBudget({ sql, env: { STUDY_GROQ_FREE_PLAN_CONFIRMED: 'true', STUDY_GROQ_RPM: '1' }, now: () => 1800000000000 });
      const args = { model: 'openai/gpt-oss-120b', userId: owner, inputTokens: 100, outputTokens: 100 };
      await reserve(args);
      await assert.rejects(reserve(args), { code: 'AI_QUOTA_REACHED' });
      const [counter] = await sql.unsafe("SELECT amount FROM study_usage WHERE scope=$1 AND bucket='groq_requests_day'", [`groq:${args.model}`]);
      assert.equal(Number(counter.amount), 1);
    });
    await t.test('mutation throttling survives new limiter instances and rolls back IP accounting', async () => {
      const now = () => 1800000000000;
      const invoke = (limiter, method = 'POST', user = owner) => new Promise((resolve, reject) => {
        limiter({ method, user: { id: user }, ip: '192.0.2.1' }, {}, error => error ? reject(error) : resolve());
      });
      const first = createRequestLimiter({ sql, now });
      for (let i = 0; i < 60; i++) await invoke(first);
      const restarted = createRequestLimiter({ sql, now });
      await assert.rejects(invoke(restarted), { code: 'REQUEST_RATE_LIMIT', status: 429 });
      await invoke(restarted, 'GET');
      const [ip] = await sql.unsafe("SELECT amount FROM study_usage WHERE scope LIKE 'http:ip:%' AND bucket='mutations_10m'");
      assert.equal(Number(ip.amount), 60);
      await invoke(restarted, 'POST', stranger);
    });
    await t.test('deletion frees a subject slot while pending file bytes remain charged', async () => {
      await workspaces.remove(owner, workspaceId);
      const replacement = await workspaces.create(owner, { title: 'Replacement' });
      assert.equal(replacement.workspace.slot, 1);
      const summary = await workspaces.list(owner);
      assert.equal(summary.usage.subjects, 6);
      assert.ok(summary.usage.storageBytes > 0);
      await assert.rejects(workspaces.get(owner, workspaceId), { code: 'SUBJECT_NOT_FOUND' });
    });
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
    await close();
  }
});
