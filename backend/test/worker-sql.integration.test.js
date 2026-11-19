const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const path = require('node:path');
const { database } = require('./helpers/pglite');

test('Python job leases, OCR cache, quota rollback, publication and cleanup use real PostgreSQL', { timeout: 60000 }, async () => {
  const { db, sql, close } = await database();
  const owner = randomUUID(), workspace = randomUUID(), document = randomUUID();
  let child;
  try {
    await sql.unsafe('INSERT INTO users(id) VALUES($1)', [owner]);
    await sql.unsafe("INSERT INTO study_workspaces(id,owner_id,slot,title) VALUES($1,$2,1,'Worker SQL test')", [workspace, owner]);
    await sql.unsafe("INSERT INTO study_documents(id,workspace_id,kind,filename,size_bytes,s3_key,status,expires_at) VALUES($1,$2,'notes','test.pdf',40,$3,'queued',now())", [document, workspace, `private/study/${owner}/${document}/original.pdf`]);
    await sql.unsafe("INSERT INTO study_jobs(document_id,kind) VALUES($1,'ingest')", [document]);
    child = spawn(process.env.STUDY_TEST_PYTHON || 'python3', [path.join(__dirname, 'helpers/worker-lifecycle.py')], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', bytes => { stderr += bytes; });
    const completion = new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', code => code === 0 ? resolve() : reject(new Error(`Worker SQL scenario failed (${code}): ${stderr}`)));
    });
    // Register rejection handling while the request stream is being processed.
    completion.catch(() => {});
    for await (const line of readline.createInterface({ input: child.stdout })) {
      const request = JSON.parse(line);
      let parameter = 0;
      const query = request.sql.replace(/%s/g, () => `$${++parameter}`);
      let result;
      try {
        const response = request.params.length ? await db.query(query, request.params) : (await db.exec(query)).at(-1);
        result = { rows: response.rows, affectedRows: response.affectedRows ?? response.rows.length };
      } catch (error) { result = { error: error.message }; }
      child.stdin.write(`${JSON.stringify(result)}\n`);
    }
    await completion;
    const [row] = await sql.unsafe('SELECT status FROM study_documents WHERE id=$1', [document]);
    assert.equal(row.status, 'deleted');
  } finally {
    child?.kill();
    await close();
  }
});
