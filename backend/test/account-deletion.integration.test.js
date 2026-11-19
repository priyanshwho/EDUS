const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { database } = require('./helpers/pglite');
const { createAccountDeletionService } = require('../src/services/account-deletion.service');
const { createWorkspaceService } = require('../src/ai/study/workspaces.service');

test('account removal waits for private cleanup before deleting public resources or the user', async () => {
  const { sql, close } = await database();
  try {
    await sql.unsafe('ALTER TABLE users ADD COLUMN email text');
    await sql.unsafe('CREATE TABLE resources(id uuid PRIMARY KEY,uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,aws_s3_key text)');
    const owner = randomUUID(), admin = randomUUID(), resource = randomUUID(), document = randomUUID();
    await sql.unsafe("INSERT INTO users(id,email) VALUES($1,'student@example.invalid'),($2,'admin@example.invalid')", [owner, admin]);
    const workspaces = createWorkspaceService({ sql });
    const workspace = (await workspaces.create(owner, { title: 'Private notes' })).workspace;
    await sql.unsafe("INSERT INTO study_documents(id,workspace_id,kind,filename,size_bytes,s3_key,status,expires_at) VALUES($1,$2,'notes','notes.pdf',100,$3,'queued',now())", [document, workspace.id, `private/${document}`]);
    await sql.unsafe("INSERT INTO resources(id,uploaded_by,aws_s3_key) VALUES($1,$2,'uploads/public.pdf')", [resource, owner]);
    const accounts = createAccountDeletionService({ sql, adminEmail: 'admin@example.invalid' });
    await assert.rejects(accounts.remove(admin), { code: 'SUPER_ADMIN_PROTECTED' });
    assert.deepEqual(await accounts.remove(owner, { withResources: true }), { pending: true });
    assert.equal((await sql.unsafe('SELECT id FROM users WHERE id=$1', [owner])).length, 1);
    assert.equal((await sql.unsafe('SELECT id FROM resources WHERE id=$1', [resource])).length, 1);
    assert.equal((await sql.unsafe("SELECT id FROM study_jobs WHERE document_id=$1 AND kind='delete' AND status='queued'", [document])).length, 1);
    await assert.rejects(workspaces.create(owner, { title: 'Another upload' }), { code: 'ACCOUNT_DELETION_PENDING' });
    // The worker's object removal/publication is covered separately. Finish its tombstone here.
    await sql.unsafe("UPDATE study_documents SET status='deleted' WHERE id=$1", [document]);
    const result = await accounts.remove(owner, { withResources: true });
    assert.equal(result.deleted, true);
    assert.equal(result.deletedResourcesCount, 1);
    assert.deepEqual(result.keys, ['uploads/public.pdf']);
    for (const table of ['study_workspaces', 'study_documents', 'study_jobs', 'study_account_deletions', 'resources']) {
      assert.equal((await sql.unsafe(`SELECT * FROM ${table}`)).length, 0);
    }
    assert.equal((await sql.unsafe('SELECT id FROM users WHERE id=$1', [owner])).length, 0);
  } finally { await close(); }
});
