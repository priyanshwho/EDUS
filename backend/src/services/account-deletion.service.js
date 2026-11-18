const { assertId, fail, queueDelete } = require('../ai/study/policy');

function createAccountDeletionService({ sql, adminEmail }) {
  async function remove(userId, { withResources = false } = {}) {
    assertId(userId, 'User ID');
    return sql.begin(async tx => {
      // Match the study API lock order. Keep this lock until the user is deleted.
      const rows = await tx`SELECT id,email FROM users WHERE id=${userId} FOR UPDATE`;
      if (!rows.length) fail(404, 'USER_NOT_FOUND', 'User not found');
      if (rows[0].email === adminEmail) fail(403, 'SUPER_ADMIN_PROTECTED', 'Cannot delete super admin');
      await tx`INSERT INTO study_account_deletions(owner_id) VALUES(${userId}) ON CONFLICT DO NOTHING`;
      await tx`UPDATE study_workspaces SET deleted_at=COALESCE(deleted_at,now()) WHERE owner_id=${userId}`;
      const pending = await tx`SELECT d.id FROM study_documents d JOIN study_workspaces w ON w.id=d.workspace_id WHERE w.owner_id=${userId} AND d.status <> 'deleted' FOR UPDATE OF d`;
      if (pending.length) {
        for (const document of pending) await queueDelete(tx, document.id);
        return { pending: true };
      }
      // Originals have been removed by the worker; only tombstones remain.
      await tx`DELETE FROM study_jobs j USING study_documents d,study_workspaces w WHERE j.document_id=d.id AND d.workspace_id=w.id AND w.owner_id=${userId}`;
      await tx`DELETE FROM study_documents d USING study_workspaces w WHERE d.workspace_id=w.id AND w.owner_id=${userId}`;
      await tx`DELETE FROM study_workspaces WHERE owner_id=${userId}`;
      const resources = withResources ? await tx`SELECT aws_s3_key FROM resources WHERE uploaded_by=${userId}` : [];
      if (withResources) await tx`DELETE FROM resources WHERE uploaded_by=${userId}`;
      await tx`DELETE FROM users WHERE id=${userId}`;
      return { deleted: true, deletedResourcesCount: resources.length, keys: resources.map(resource => resource.aws_s3_key).filter(Boolean) };
    });
  }
  return { remove };
}

module.exports = { createAccountDeletionService };
