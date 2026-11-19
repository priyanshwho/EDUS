const { StudyError } = require('./errors');

const MiB = 1024 * 1024;
const LIMITS = Object.freeze({
  subjects: 6,
  syllabusBytes: 5 * MiB,
  syllabusPages: 30,
  notesBytes: 20 * MiB,
  notesPages: 150,
  subjectBytes: 50 * MiB,
  userBytes: 300 * MiB,
  notesPerSubject: 5,
  pastedTextCharacters: 50000,
  pastedTextBytes: 64 * 1024,
  concurrentUploads: 2,
  attemptsPerTenMinutes: 12,
  attemptsPerDay: 24,
  uploadBytesPerDay: 100 * MiB,
  uploadExpiresSeconds: 15 * 60,
  manualRetriesPerDocument: 2,
  manualRetriesPerDay: 6,
});

function fail(status, code, message) { throw new StudyError(status, code, message); }

function assertId(value, name = 'ID') {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    fail(400, 'INVALID_ID', `${name} must be a valid UUID.`);
  }
  return value;
}

function workspaceInput(input = {}) {
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 150) {
    fail(400, 'INVALID_TITLE', 'Subject title must contain 1 to 150 characters.');
  }
  if (input.branch != null && (typeof input.branch !== 'string' || input.branch.length > 80)) {
    fail(400, 'INVALID_BRANCH', 'Branch must contain at most 80 characters.');
  }
  if (input.semester != null && (!Number.isInteger(input.semester) || input.semester < 1 || input.semester > 8)) {
    fail(400, 'INVALID_SEMESTER', 'Semester must be an integer from 1 to 8.');
  }
  if (input.idempotencyKey != null && (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(input.idempotencyKey))) {
    fail(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency key must contain 8 to 100 letters, digits, underscores or hyphens.');
  }
  return { title: input.title.trim(), branch: input.branch?.trim() || null, semester: input.semester ?? null, idempotencyKey: input.idempotencyKey || null };
}

function uploadInput(input = {}) {
  if (!['syllabus', 'notes'].includes(input.kind)) fail(400, 'INVALID_DOCUMENT_KIND', 'Choose syllabus or notes.');
  if (typeof input.filename !== 'string' || input.filename.length > 180 || !/\.pdf$/i.test(input.filename) || /[\x00-\x1f\x7f/\\]/.test(input.filename)) {
    fail(400, 'INVALID_FILENAME', 'Choose a PDF with a filename of at most 180 characters.');
  }
  const max = input.kind === 'syllabus' ? LIMITS.syllabusBytes : LIMITS.notesBytes;
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > max) {
    fail(413, 'FILE_TOO_LARGE', `${input.kind === 'syllabus' ? 'Syllabus' : 'Notes'} PDFs must be between 1 byte and ${max / MiB} MiB.`);
  }
  if (input.containsHandwriting != null && typeof input.containsHandwriting !== 'boolean') {
    fail(400, 'INVALID_HANDWRITING_FLAG', 'Handwriting selection must be true or false.');
  }
  return { kind: input.kind, filename: input.filename.trim(), sizeBytes: input.sizeBytes, containsHandwriting: input.containsHandwriting ?? false };
}

function publicWorkspace(row) {
  return { id: row.id, title: row.title, branch: row.branch, semester: row.semester, slot: row.slot, createdAt: row.created_at };
}

function publicDocument(row) {
  return {
    id: row.id, workspaceId: row.workspace_id, kind: row.kind, filename: row.filename, sourceType: row.source_type || 'pdf',
    sizeBytes: Number(row.size_bytes), status: row.status, containsHandwriting: row.contains_handwriting,
    pageCount: row.page_count, error: row.error, processingStage: row.processing_stage,
    expiresAt: row.expires_at, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function lockOwner(tx, ownerId) {
  assertId(ownerId, 'User ID');
  const rows = await tx`SELECT id FROM users WHERE id = ${ownerId} FOR UPDATE`;
  if (!rows.length) fail(401, 'USER_NOT_FOUND', 'Your account is no longer available.');
  const pending = await tx`SELECT owner_id FROM study_account_deletions WHERE owner_id=${ownerId}`;
  if (pending.length) fail(409, 'ACCOUNT_DELETION_PENDING', 'Account deletion is in progress. Private study uploads are disabled.');
}

async function ownedWorkspace(tx, ownerId, workspaceId, lock = false) {
  assertId(workspaceId, 'Subject ID');
  const rows = lock
    ? await tx`SELECT * FROM study_workspaces WHERE id = ${workspaceId} AND owner_id = ${ownerId} AND deleted_at IS NULL FOR UPDATE`
    : await tx`SELECT * FROM study_workspaces WHERE id = ${workspaceId} AND owner_id = ${ownerId} AND deleted_at IS NULL`;
  if (!rows.length) fail(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
  return rows[0];
}

async function ownedDocument(tx, ownerId, documentId, lock = false) {
  assertId(documentId, 'Document ID');
  const rows = lock
    ? await tx`SELECT d.* FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE d.id = ${documentId} AND w.owner_id = ${ownerId} AND w.deleted_at IS NULL AND d.status NOT IN ('deleting','deleted') FOR UPDATE OF d`
    : await tx`SELECT d.* FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE d.id = ${documentId} AND w.owner_id = ${ownerId} AND w.deleted_at IS NULL AND d.status NOT IN ('deleting','deleted')`;
  if (!rows.length) fail(404, 'DOCUMENT_NOT_FOUND', 'Document not found.');
  return rows[0];
}

async function queueDelete(tx, documentId) {
  await tx`UPDATE study_documents SET status = 'deleting', processing_stage = 'deleting', updated_at = now() WHERE id = ${documentId} AND status <> 'deleted'`;
  await tx`INSERT INTO study_jobs (document_id, kind) VALUES (${documentId}, 'delete') ON CONFLICT (document_id, kind) WHERE status IN ('queued','processing') DO NOTHING`;
}

// Called under the owner's lock. A periodic worker must also reap abandoned sessions.
async function expireUploads(tx, ownerId) {
  const rows = await tx`SELECT d.id FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE w.owner_id = ${ownerId} AND d.status IN ('reserved','uploading') AND d.expires_at <= now() FOR UPDATE OF d`;
  for (const row of rows) await queueDelete(tx, row.id);
}

function fixedWindow(date, milliseconds) {
  return new Date(Math.floor(date.getTime() / milliseconds) * milliseconds);
}

// Every caller holds the user's row lock, so quota reads and increments serialize.
async function consumeUsage(tx, ownerId, bucket, windowStart, amount, maximum, message) {
  const rows = await tx`SELECT amount FROM study_usage WHERE scope = ${ownerId} AND bucket = ${bucket} AND window_start = ${windowStart.toISOString()}`;
  if (Number(rows[0]?.amount || 0) + amount > maximum) {
    fail(429, 'UPLOAD_RATE_LIMIT', message);
  }
  await tx`INSERT INTO study_usage (scope, bucket, window_start, amount) VALUES (${ownerId}, ${bucket}, ${windowStart.toISOString()}, ${amount}) ON CONFLICT (scope, bucket, window_start) DO UPDATE SET amount = study_usage.amount + EXCLUDED.amount`;
}

module.exports = { StudyError, LIMITS, MiB, fail, assertId, workspaceInput, uploadInput, publicWorkspace, publicDocument, lockOwner, ownedWorkspace, ownedDocument, queueDelete, expireUploads, fixedWindow, consumeUsage };
