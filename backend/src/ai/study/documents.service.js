const fs = require('node:fs');
const { createHash, randomUUID } = require('node:crypto');
const {
  LIMITS, fail, assertId, uploadInput, publicDocument, lockOwner, ownedWorkspace,
  ownedDocument, queueDelete, expireUploads, fixedWindow, consumeUsage,
} = require('./policy');

async function inspectPdf(filePath, expectedBytes) {
  const stat = await fs.promises.stat(filePath);
  if (stat.size !== Number(expectedBytes)) fail(400, 'UPLOAD_SIZE_MISMATCH', 'The uploaded size does not match the reserved file. Start a new upload.');
  const file = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(5);
    await file.read(header, 0, 5, 0);
    if (header.toString('ascii') !== '%PDF-') fail(400, 'INVALID_PDF', 'The file does not have a valid PDF header.');
  } finally { await file.close(); }
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
  return { sizeBytes: stat.size, sha256: hash.digest('hex') };
}

function createDocumentService({ sql, storage, now = () => new Date() }) {
  const withOwner = (ownerId, work) => sql.begin(async (tx) => {
    await lockOwner(tx, ownerId);
    return work(tx);
  });

  async function admit(tx, ownerId, workspaceId, clean) {
    await expireUploads(tx, ownerId);
    await ownedWorkspace(tx, ownerId, workspaceId, true);
    const rows = await tx`SELECT d.size_bytes, d.status, d.kind, d.workspace_id FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE w.owner_id = ${ownerId} AND d.status <> 'deleted'`;
    const active = rows.filter((d) => !['deleting', 'deleted'].includes(d.status));
    const subject = rows.filter((d) => d.workspace_id === workspaceId);
    const subjectActive = active.filter((d) => d.workspace_id === workspaceId);
    if (clean.sourceType !== 'text' && active.filter((d) => ['reserved', 'uploading'].includes(d.status)).length >= LIMITS.concurrentUploads) {
      fail(429, 'CONCURRENT_UPLOAD_LIMIT', 'Finish or delete an existing upload before starting another.');
    }
    if (clean.kind === 'syllabus' && subjectActive.some((d) => d.kind === 'syllabus')) {
      fail(409, 'SYLLABUS_ALREADY_EXISTS', 'Delete the existing syllabus before adding a replacement.');
    }
    if (clean.kind === 'notes' && subjectActive.filter((d) => d.kind === 'notes').length >= LIMITS.notesPerSubject) {
      fail(409, 'NOTES_LIMIT_REACHED', 'A subject can contain up to 5 notes sources. Delete a notes source to add another.');
    }
    const bytes = (docs) => docs.reduce((sum, doc) => sum + Number(doc.size_bytes), 0);
    if (bytes(subject) + clean.sizeBytes > LIMITS.subjectBytes) fail(413, 'SUBJECT_STORAGE_LIMIT', 'This subject has reached its 50 MiB storage limit. Pending deletions still count until cleaned up.');
    if (bytes(rows) + clean.sizeBytes > LIMITS.userBytes) fail(413, 'USER_STORAGE_LIMIT', 'Your private study storage limit is 300 MiB. Pending deletions still count until cleaned up.');
    const instant = now();
    await consumeUsage(tx, ownerId, 'upload_attempts_10m', fixedWindow(instant, 600000), 1, LIMITS.attemptsPerTenMinutes, 'Upload limit reached. Try again in the next 10 minute window.');
    await consumeUsage(tx, ownerId, 'upload_attempts_day', fixedWindow(instant, 86400000), 1, LIMITS.attemptsPerDay, 'Daily upload attempt limit reached. Try again tomorrow.');
    // Daily admission charges are intentionally not refunded for deletion or failure.
    await consumeUsage(tx, ownerId, 'upload_bytes_day', fixedWindow(instant, 86400000), clean.sizeBytes, LIMITS.uploadBytesPerDay, 'Daily upload size limit of 100 MiB reached. Try again tomorrow.');
    return instant;
  }

  async function initialize(ownerId, workspaceId, input) {
    assertId(workspaceId, 'Subject ID');
    const clean = uploadInput(input);
    return withOwner(ownerId, async (tx) => {
      const instant = await admit(tx, ownerId, workspaceId, clean);
      const id = randomUUID();
      const key = `private/study/${ownerId}/${id}/original.pdf`;
      const expiresAt = new Date(instant.getTime() + LIMITS.uploadExpiresSeconds * 1000);
      const inserted = await tx`INSERT INTO study_documents (id, workspace_id, kind, filename, size_bytes, s3_key, contains_handwriting, expires_at) VALUES (${id}, ${workspaceId}, ${clean.kind}, ${clean.filename}, ${clean.sizeBytes}, ${key}, ${clean.containsHandwriting}, ${expiresAt.toISOString()}) RETURNING *`;
      return { document: publicDocument(inserted[0]), uploadPath: `/study/documents/${id}/upload` };
    });
  }

  async function createText(ownerId, workspaceId, input = {}) {
    assertId(workspaceId, 'Subject ID');
    if (!['syllabus', 'notes'].includes(input.kind)) fail(400, 'INVALID_DOCUMENT_KIND', 'Choose syllabus or notes.');
    if (typeof input.content !== 'string' || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.content)) fail(400, 'INVALID_TEXT', 'Paste plain text without control characters.');
    const content = input.content.replace(/\r\n?/g, '\n').trim();
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    if (!content || content.length > LIMITS.pastedTextCharacters || sizeBytes > LIMITS.pastedTextBytes) fail(413, 'TEXT_LIMIT_REACHED', 'Paste between 1 and 50,000 characters, up to 64 KiB of text.');
    const title = input.title === undefined ? (input.kind === 'syllabus' ? 'Syllabus' : 'Notes') : input.title;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 || /[\x00-\x1f\x7f]/.test(title)) fail(400, 'INVALID_TITLE', 'Text title must contain 1 to 120 characters.');
    if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(input.idempotencyKey)) fail(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid text submission key is required.');
    const clean = { kind: input.kind, filename: title.trim(), sizeBytes, sourceType: 'text' };
    const sha256 = createHash('sha256').update(`text:${clean.kind}\0${content}`).digest('hex');
    return withOwner(ownerId, async tx => {
      await ownedWorkspace(tx, ownerId, workspaceId, true);
      const prior = await tx`SELECT * FROM study_documents WHERE workspace_id=${workspaceId} AND submission_key=${input.idempotencyKey}`;
      if (prior.length) {
        const document = prior[0];
        if (['deleting', 'deleted'].includes(document.status)) fail(409, 'TEXT_DELETED', 'This text was removed. Start a new submission.');
        if (document.kind !== clean.kind || document.filename !== clean.filename || document.pasted_text !== content) fail(409, 'SUBMISSION_CHANGED', 'Start a new submission to save different text.');
        return { document: publicDocument(document) };
      }
      const duplicate = await tx`SELECT * FROM study_documents WHERE workspace_id=${workspaceId} AND sha256=${sha256} AND status NOT IN ('deleting','deleted') LIMIT 1`;
      if (duplicate.length) return { document: publicDocument(duplicate[0]), duplicate: true };
      const instant = await admit(tx, ownerId, workspaceId, clean);
      const id = randomUUID();
      const rows = await tx`INSERT INTO study_documents(id,workspace_id,kind,filename,size_bytes,s3_key,sha256,source_type,pasted_text,submission_key,status,processing_stage,expires_at)
        VALUES(${id},${workspaceId},${clean.kind},${clean.filename},${sizeBytes},NULL,${sha256},'text',${content},${input.idempotencyKey},'queued','queued',${instant.toISOString()}) RETURNING *`;
      await tx`INSERT INTO study_jobs(document_id,kind) VALUES(${id},'ingest')`;
      return { document: publicDocument(rows[0]) };
    });
  }

  async function claimUpload(ownerId, documentId) {
    return withOwner(ownerId, async (tx) => {
      const document = await ownedDocument(tx, ownerId, documentId, true);
      if (document.source_type === 'text') fail(400, 'PDF_REQUIRED', 'Pasted text does not accept a PDF upload.');
      if (document.status !== 'reserved') fail(409, 'UPLOAD_ALREADY_CLAIMED', 'This upload has already started. Create a new upload if it failed.');
      if (new Date(document.expires_at).getTime() <= now().getTime()) fail(410, 'UPLOAD_EXPIRED', 'This upload expired. Delete it and start a new upload.');
      const token = randomUUID();
      // The lease starts when bytes are accepted, covering both bounded receive
      // and storage PUT time even if the reservation was claimed near expiry.
      const expiresAt = new Date(now().getTime() + LIMITS.uploadExpiresSeconds * 1000);
      const rows = await tx`UPDATE study_documents SET status = 'uploading', processing_stage = 'uploading', upload_token = ${token}, expires_at = ${expiresAt.toISOString()}, updated_at = now() WHERE id = ${documentId} RETURNING *`;
      return rows[0];
    });
  }

  function assertClaim(document, claim) {
    if (document.status !== 'uploading' || document.upload_token !== claim.upload_token) {
      fail(409, 'UPLOAD_NOT_ACTIVE', 'This upload is no longer active.');
    }
    if (new Date(document.expires_at).getTime() <= now().getTime()) fail(410, 'UPLOAD_EXPIRED', 'This upload expired. Start a new upload.');
  }

  async function uploadFile(ownerId, claim, filePath) {
    const inspected = await inspectPdf(filePath, claim.size_bytes);
    const duplicate = await withOwner(ownerId, async (tx) => {
      const document = await ownedDocument(tx, ownerId, claim.id, true);
      assertClaim(document, claim);
      const matching = await tx`SELECT * FROM study_documents WHERE workspace_id = ${document.workspace_id} AND sha256 = ${inspected.sha256} AND id <> ${claim.id} AND status NOT IN ('deleting','deleted') LIMIT 1`;
      if (matching.length) {
        // No object has been written, so this reservation can be released immediately.
        await tx`UPDATE study_documents SET status = 'deleted', processing_stage = 'duplicate', upload_token = NULL, updated_at = now() WHERE id = ${claim.id}`;
        return matching[0];
      }
      await tx`UPDATE study_documents SET sha256 = ${inspected.sha256}, updated_at = now() WHERE id = ${claim.id}`;
      return null;
    });
    if (duplicate) return { document: publicDocument(duplicate), duplicate: true };

    // Only the server writes this permanent key. There is no replayable browser PUT URL.
    await storage.putFile(claim.s3_key, filePath, inspected.sizeBytes);
    try {
      return await withOwner(ownerId, async (tx) => {
        const document = await ownedDocument(tx, ownerId, claim.id, true);
        assertClaim(document, claim);
        const rows = await tx`UPDATE study_documents SET status = 'queued', processing_stage = 'queued', upload_token = NULL, error = NULL, updated_at = now() WHERE id = ${claim.id} RETURNING *`;
        await tx`INSERT INTO study_jobs (document_id, kind) VALUES (${claim.id}, 'ingest') ON CONFLICT (document_id, kind) WHERE status IN ('queued','processing') DO NOTHING`;
        return { document: publicDocument(rows[0]) };
      });
    } catch (error) {
      // A delete/expiry may have won while the object was uploading.
      try { await storage.deleteObject(claim.s3_key); } catch { /* durable delete job below retries */ }
      throw error;
    }
  }

  async function failUpload(ownerId, claim, error) {
    // Cleanup is durable even if S3 is unavailable or a process dies during a PUT.
    return withOwner(ownerId, async (tx) => {
      const rows = await tx`SELECT d.* FROM study_documents d JOIN study_workspaces w ON w.id = d.workspace_id WHERE d.id = ${claim.id} AND w.owner_id = ${ownerId} FOR UPDATE OF d`;
      const document = rows[0];
      if (!document || document.status === 'deleted' || !['uploading', 'deleting'].includes(document.status)) return;
      if (document.upload_token !== claim.upload_token) return;
      // Keep the upload lease until its expiry: an aborted S3 PUT can still be
      // finishing remotely, so deletion must not complete before that boundary.
      await tx`UPDATE study_documents SET error = ${error.code ? error.message : 'Upload failed. Delete this file and try again.'}, updated_at = now() WHERE id = ${claim.id}`;
      await queueDelete(tx, claim.id);
    });
  }

  async function remove(ownerId, documentId) {
    return withOwner(ownerId, async (tx) => {
      await ownedDocument(tx, ownerId, documentId, true);
      await queueDelete(tx, documentId);
      return { deleted: true };
    });
  }

  async function retry(ownerId, documentId) {
    return withOwner(ownerId, async (tx) => {
      const document = await ownedDocument(tx, ownerId, documentId, true);
      if (!['failed', 'partial'].includes(document.status) || !document.sha256 || (document.source_type !== 'text' && !document.s3_key)) {
        fail(409, 'DOCUMENT_NOT_RETRYABLE', 'Only a processed file with an available original can be retried.');
      }
      if (Number(document.manual_retry_count) >= LIMITS.manualRetriesPerDocument) fail(429, 'DOCUMENT_RETRY_LIMIT', 'This file has reached its retry limit.');
      await consumeUsage(tx, ownerId, 'ingestion_retries_day', fixedWindow(now(), 86400000), 1, LIMITS.manualRetriesPerDay, 'Daily processing retry limit reached. Try again tomorrow.');
      const rows = await tx`UPDATE study_documents SET status = 'queued', processing_stage = 'queued', error = NULL, manual_retry_count = manual_retry_count + 1, updated_at = now() WHERE id = ${documentId} RETURNING *`;
      await tx`INSERT INTO study_jobs (document_id, kind) VALUES (${documentId}, 'ingest') ON CONFLICT (document_id, kind) WHERE status IN ('queued','processing') DO NOTHING`;
      return { document: publicDocument(rows[0]) };
    });
  }

  async function source(ownerId, documentId) {
    // Holding the owner/document lock until signing keeps a new download grant from
    // racing a tombstone. Already issued links remain valid for their short TTL.
    return withOwner(ownerId, async (tx) => {
      const document = await ownedDocument(tx, ownerId, documentId, true);
      if (!document.sha256 || ['reserved', 'uploading'].includes(document.status)) fail(409, 'SOURCE_NOT_AVAILABLE', 'The original PDF is not available yet.');
      if (document.source_type === 'text') return { type: 'text', title: document.filename, content: document.pasted_text };
      return { type: 'pdf', url: await storage.getDownloadUrl(document.s3_key) };
    });
  }

  return { initialize, createText, claimUpload, uploadFile, failUpload, remove, retry, source };
}

module.exports = { createDocumentService, inspectPdf };
