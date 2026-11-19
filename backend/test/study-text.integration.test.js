const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { database } = require('./helpers/pglite');
const { createWorkspaceService } = require('../src/ai/study/workspaces.service');
const { createDocumentService } = require('../src/ai/study/documents.service');

test('pasted syllabus and notes share private admission, idempotency and source access', async () => {
  const { sql, close } = await database();
  try {
    const owner = randomUUID(), other = randomUUID();
    await sql.unsafe('INSERT INTO users(id) VALUES($1),($2)', [owner, other]);
    const workspaces = createWorkspaceService({ sql });
    const { workspace } = await workspaces.create(owner, { title: 'Operating Systems' });
    let storageCalls = 0;
    const documents = createDocumentService({ sql, storage: new Proxy({}, { get: () => () => { storageCalls++; throw new Error('Text must not use S3'); } }) });
    const input = { kind: 'syllabus', title: 'OS Syllabus', content: 'Unit 1: Processes\r\nUnit 2: Deadlock', idempotencyKey: randomUUID() };
    await assert.rejects(documents.createText(other, workspace.id, input), { code: 'SUBJECT_NOT_FOUND' });
    const saved = await documents.createText(owner, workspace.id, input);
    assert.equal(saved.document.sourceType, 'text');
    assert.equal(saved.document.status, 'queued');
    assert.equal(saved.document.pasted_text, undefined);
    assert.equal((await documents.createText(owner, workspace.id, input)).document.id, saved.document.id);
    await assert.rejects(documents.createText(owner, workspace.id, { ...input, content: 'Changed input' }), { code: 'SUBMISSION_CHANGED' });
    await assert.rejects(documents.initialize(owner, workspace.id, { kind: 'syllabus', filename: 'another.pdf', sizeBytes: 40 }), { code: 'SYLLABUS_ALREADY_EXISTS' });
    await assert.rejects(documents.source(other, saved.document.id), { code: 'DOCUMENT_NOT_FOUND' });
    const source = await documents.source(owner, saved.document.id);
    assert.equal(source.type, 'text');
    assert.equal(source.content, 'Unit 1: Processes\nUnit 2: Deadlock');
    assert.equal(source.url, undefined);
    const note = { kind: 'notes', title: 'Deadlock', content: 'Deadlock needs mutual exclusion, hold and wait, no preemption and circular wait.', idempotencyKey: randomUUID() };
    const first = await documents.createText(owner, workspace.id, note);
    assert.equal((await documents.createText(owner, workspace.id, { ...note, idempotencyKey: randomUUID() })).document.id, first.document.id);
    for (let i = 0; i < 4; i++) await documents.createText(owner, workspace.id, { ...note, content: `Notes block ${i}`, idempotencyKey: randomUUID() });
    await assert.rejects(documents.createText(owner, workspace.id, { ...note, content: 'Sixth notes block', idempotencyKey: randomUUID() }), { code: 'NOTES_LIMIT_REACHED' });
    await assert.rejects(documents.createText(owner, workspace.id, { ...note, content: 'x'.repeat(50001) }), { code: 'TEXT_LIMIT_REACHED' });
    await assert.rejects(documents.createText(owner, workspace.id, { ...note, content: '漢'.repeat(30000) }), { code: 'TEXT_LIMIT_REACHED' });
    assert.equal((await sql.unsafe("SELECT count(*)::int AS count FROM study_jobs WHERE kind='ingest'"))[0].count, 6);
    assert.equal(storageCalls, 0);
    await documents.remove(owner, first.document.id);
    await assert.rejects(documents.source(owner, first.document.id), { code: 'DOCUMENT_NOT_FOUND' });
  } finally { await close(); }
});
