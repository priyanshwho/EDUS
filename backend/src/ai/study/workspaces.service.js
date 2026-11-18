const { randomUUID } = require('node:crypto');
const { LIMITS, fail, assertId, workspaceInput, publicWorkspace, publicDocument, lockOwner, ownedWorkspace, queueDelete, expireUploads } = require('./policy');

function createWorkspaceService({ sql }) {
  const withOwner = (ownerId, work) => sql.begin(async (tx) => {
    await lockOwner(tx, ownerId);
    await expireUploads(tx, ownerId);
    return work(tx);
  });

  async function list(ownerId) {
    return withOwner(ownerId, async (tx) => {
      const workspaces = await tx`SELECT * FROM study_workspaces WHERE owner_id = ${ownerId} AND deleted_at IS NULL ORDER BY slot`;
      const totals = await tx`SELECT COALESCE(SUM(d.size_bytes) FILTER (WHERE d.status NOT IN ('reserved','uploading','deleted')),0) AS storage_bytes, COALESCE(SUM(d.size_bytes) FILTER (WHERE d.status IN ('reserved','uploading')),0) AS reserved_bytes FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE w.owner_id = ${ownerId}`;
      return { workspaces: workspaces.map(publicWorkspace), usage: { subjects: workspaces.length, storageBytes: Number(totals[0]?.storage_bytes || 0), reservedBytes: Number(totals[0]?.reserved_bytes || 0) }, limits: LIMITS };
    });
  }

  async function create(ownerId, input) {
    const clean = workspaceInput(input);
    return withOwner(ownerId, async (tx) => {
      if (clean.idempotencyKey) {
        const prior = await tx`SELECT * FROM study_workspaces WHERE owner_id = ${ownerId} AND idempotency_key = ${clean.idempotencyKey}`;
        if (prior.length) {
          if (prior[0].deleted_at) fail(409, 'SUBJECT_DELETED', 'This subject was deleted. Start a new subject request.');
          if (prior[0].title !== clean.title || prior[0].branch !== clean.branch || prior[0].semester !== clean.semester) {
            fail(409, 'IDEMPOTENCY_CONFLICT', 'This request key was already used for a different subject.');
          }
          return { workspace: publicWorkspace(prior[0]) };
        }
      }
      const active = await tx`SELECT slot FROM study_workspaces WHERE owner_id = ${ownerId} AND deleted_at IS NULL`;
      const occupied = new Set(active.map((row) => row.slot));
      const slot = Array.from({ length: LIMITS.subjects }, (_, i) => i + 1).find((number) => !occupied.has(number));
      if (!slot) fail(409, 'SUBJECT_LIMIT_REACHED', 'Subject limit reached (6/6). Delete an existing subject to add a new one.');
      const rows = await tx`INSERT INTO study_workspaces (id, owner_id, slot, title, branch, semester, idempotency_key) VALUES (${randomUUID()}, ${ownerId}, ${slot}, ${clean.title}, ${clean.branch}, ${clean.semester}, ${clean.idempotencyKey}) RETURNING *`;
      return { workspace: publicWorkspace(rows[0]) };
    });
  }

  async function get(ownerId, workspaceId) {
    assertId(workspaceId, 'Subject ID');
    return withOwner(ownerId, async (tx) => {
      const workspace = await ownedWorkspace(tx, ownerId, workspaceId);
      const documents = await tx`SELECT * FROM study_documents WHERE workspace_id = ${workspaceId} AND status <> 'deleted' ORDER BY created_at DESC`;
      const review = await tx`SELECT p.document_id,p.page_number,p.quality FROM study_pages p JOIN study_documents d ON d.id=p.document_id WHERE d.workspace_id=${workspaceId} AND d.status IN ('ready','partial') AND p.quality NOT IN ('good','blank') ORDER BY p.page_number`;
      return { workspace: publicWorkspace(workspace), documents: documents.map(document => ({
        ...publicDocument(document), reviewPages: review.filter(page => page.document_id === document.id).map(page => ({ page: page.page_number, quality: page.quality })),
      })) };
    });
  }

  async function remove(ownerId, workspaceId) {
    assertId(workspaceId, 'Subject ID');
    return withOwner(ownerId, async (tx) => {
      await ownedWorkspace(tx, ownerId, workspaceId, true);
      // This tombstone immediately excludes the subject from both queries and generation.
      await tx`UPDATE study_workspaces SET deleted_at = now() WHERE id = ${workspaceId}`;
      const documents = await tx`SELECT id FROM study_documents WHERE workspace_id = ${workspaceId} AND status <> 'deleted' FOR UPDATE`;
      for (const document of documents) await queueDelete(tx, document.id);
      return { deleted: true };
    });
  }

  return { list, create, get, remove };
}

module.exports = { createWorkspaceService };
