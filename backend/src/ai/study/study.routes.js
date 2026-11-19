const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { StudyError, LIMITS } = require('./policy');
const { createWorkspaceService } = require('./workspaces.service');
const { createDocumentService } = require('./documents.service');
const { createRequestLimiter } = require('./request-limit');

function defaultStorage() {
  const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const { s3Client, BUCKET } = require('../../config/s3.config');
  return {
    putFile: (key, filePath, sizeBytes) => s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: fs.createReadStream(filePath), ContentLength: sizeBytes, ContentType: 'application/pdf' }), { abortSignal: AbortSignal.timeout(5 * 60 * 1000) }),
    deleteObject: (key) => s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })),
    getDownloadUrl: (key) => getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key, ResponseContentType: 'application/pdf' }), { expiresIn: 60 }),
  };
}

function receivePdf(req, res, claim, directory) {
  const upload = multer({
    storage: multer.diskStorage({ destination: directory, filename: (_req, _file, callback) => callback(null, `${randomUUID()}.pdf`) }),
    // Busboy emits partsLimit as soon as the limit is reached, so allow the
    // terminating boundary after one file. files/fields enforce the real shape.
    // Busboy emits `limit` on equality. Permit one sentinel byte here; inspectPdf
    // requires the exact reserved length before any object-storage write.
    limits: { fileSize: Math.min(Number(claim.size_bytes), claim.kind === 'syllabus' ? LIMITS.syllabusBytes : LIMITS.notesBytes) + 1, files: 1, fields: 0, parts: 2 },
    fileFilter: (_req, file, callback) => {
      if (!['application/pdf', 'application/octet-stream'].includes(file.mimetype)) return callback(new StudyError(400, 'INVALID_PDF', 'Upload a PDF file.'));
      callback(null, true);
    },
  }).single('file');
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.removeListener('aborted', aborted);
      req.removeListener('error', aborted);
      if (error) reject(error); else resolve();
    };
    const aborted = () => finish(new StudyError(400, 'UPLOAD_INTERRUPTED', 'The upload was interrupted. Start a new upload.'));
    const timer = setTimeout(() => {
      finish(new StudyError(408, 'UPLOAD_TIMEOUT', 'The upload took too long. Start a new upload.'));
      req.destroy();
    }, 5 * 60 * 1000);
    req.once('aborted', aborted);
    req.once('error', aborted);
    upload(req, res, finish);
  });
}

function createStudyRouter(options = {}) {
  const sql = options.sql || require('../../db/client').sql;
  const authenticate = options.authenticate || require('../../middleware/authenticate').authenticate;
  const storage = options.storage || defaultStorage();
  const workspaces = options.workspaces || createWorkspaceService({ sql });
  const documents = options.documents || createDocumentService({ sql, storage });
  const rag = options.rag || require('./rag.service').createRagService({ sql });
  const router = express.Router();
  // All authenticated roles receive their own private storage; admins cannot bypass ownership.
  router.use(authenticate);
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(createRequestLimiter({ sql }));
  const handle = (work, status = 200) => (req, res, next) => Promise.resolve().then(() => work(req)).then((value) => res.status(status).json(value)).catch(next);

  router.get('/workspaces', handle((req) => workspaces.list(req.user.id)));
  router.post('/workspaces', handle((req) => workspaces.create(req.user.id, req.body), 201));
  router.get('/workspaces/:id', handle((req) => workspaces.get(req.user.id, req.params.id)));
  router.delete('/workspaces/:id', handle((req) => workspaces.remove(req.user.id, req.params.id)));
  router.post('/workspaces/:id/uploads', handle((req) => documents.initialize(req.user.id, req.params.id, req.body), 201));
  router.post('/workspaces/:id/text', handle((req) => documents.createText(req.user.id, req.params.id, req.body), 201));
  router.post('/documents/:id/upload', async (req, res, next) => {
    let claim;
    let directory;
    try {
      claim = await documents.claimUpload(req.user.id, req.params.id);
      directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'edus-study-'));
      await receivePdf(req, res, claim, directory);
      if (!req.file) throw new StudyError(400, 'FILE_REQUIRED', 'Choose a PDF file.');
      const result = await documents.uploadFile(req.user.id, claim, req.file.path);
      res.status(201).json(result);
    } catch (error) {
      if (claim) {
        try { await documents.failUpload(req.user.id, claim, error); }
        catch (cleanupError) { console.error('[Study] Upload cleanup will be retried by expiry sweep:', cleanupError.code || 'database_unavailable'); }
      }
      next(error);
    } finally {
      if (directory) {
        try { await fs.promises.rm(directory, { recursive: true, force: true }); }
        catch { console.warn('[Study] Temporary upload cleanup failed.'); }
      }
    }
  });
  router.delete('/documents/:id', handle((req) => documents.remove(req.user.id, req.params.id)));
  router.post('/documents/:id/retry', handle((req) => documents.retry(req.user.id, req.params.id)));
  router.get('/documents/:id/source', handle((req) => documents.source(req.user.id, req.params.id)));
  router.post('/workspaces/:id/chat', handle((req) => rag.chat(req.user.id, req.params.id, req.body)));
  router.post('/workspaces/:id/flashcards', handle((req) => rag.flashcards(req.user.id, req.params.id, req.body)));
  router.post('/workspaces/:id/mcq', handle((req) => rag.mcq(req.user.id, req.params.id, req.body)));

  router.use((error, _req, res, _next) => {
    if (res.headersSent) return res.end();
    if (error instanceof multer.MulterError) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ code: error.code, error: error.code === 'LIMIT_FILE_SIZE' ? 'The PDF exceeds its reserved size or file limit.' : 'Upload exactly one PDF in the file field.' });
    if (error instanceof StudyError) {
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      return res.status(error.status).json({ code: error.code, error: error.message });
    }
    console.error('[Study] Request failed:', error.code || 'internal_error');
    return res.status(503).json({ code: 'STUDY_UNAVAILABLE', error: 'Private study is temporarily unavailable. Try again shortly.' });
  });
  return router;
}

module.exports = { createStudyRouter, receivePdf };
