export const formatBytes = (value = 0) => {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const documentStatus = (document) => document.status || document.processingState || 'awaiting_upload';
export const isProcessing = (document) => ['queued', 'processing', 'extracting', 'extracting_text', 'ocr', 'ocr_processing', 'indexing', 'embedding'].includes(documentStatus(document));
export const isReady = (document) => ['ready', 'partial'].includes(documentStatus(document));
export const isFailed = (document) => ['failed', 'upload_failed', 'error'].includes(documentStatus(document));

export const STATUS_LABELS = {
  reserved: 'Waiting for upload', awaiting_upload: 'Waiting for PDF', uploading: 'Uploading', queued: 'Queued', processing: 'Reading PDF',
  extracting: 'Extracting text', extracting_text: 'Extracting text', ocr: 'Reading scanned pages',
  waiting_for_ocr_quota: 'Waiting for free OCR capacity',
  ocr_processing: 'Reading scanned pages', indexing: 'Building study index', embedding: 'Building study index',
  ready: 'Ready to study', partial: 'Some pages need attention', failed: 'Processing failed', upload_failed: 'Upload failed', error: 'Processing failed',
  deleting: 'Removing stored PDF',
};

/** Keep completed uploads and registered IDs when a batch partly fails.
 * Retrying a batch never creates another workspace or reuploads completed files.
 */
export async function uploadStudyFiles(api, workspaceId, files, onUpdate = () => {}) {
  const results = [];
  for (const item of files) {
    if (item.uploaded) { results.push(item); continue; }
    let current = { ...item, error: '', state: 'uploading' };
    onUpdate(current);
    try {
      if (current.sourceType === 'text') {
        const result = await api.saveText(workspaceId, {
          kind: current.kind, title: current.title, content: current.content, idempotencyKey: current.key,
        });
        current = { ...current, documentId: result.document.id, uploaded: true, state: 'uploaded' };
        results.push(current); onUpdate(current); continue;
      }
      if (current.documentId) {
        const response = await api.get(workspaceId);
        const existing = (response.documents || []).find((document) => document.id === current.documentId);
        if (existing && ['queued', 'processing', 'ready', 'partial', 'failed'].includes(existing.status)) {
          current = { ...current, uploaded: true, state: 'uploaded' };
          results.push(current); onUpdate(current); continue;
        }
        if (existing?.status === 'uploading') throw new Error('This upload is still in progress. Wait before retrying.');
        // A consumed ticket is never replayed. Failed uploads receive a new
        // reservation, while an unused reserved ticket remains safe to resume.
        if (!existing || existing.status !== 'reserved') current = { ...current, documentId: undefined };
      }
      if (!current.documentId) {
        const { document } = await api.initUpload(workspaceId, {
          kind: current.kind, filename: current.file.name, sizeBytes: current.file.size,
          containsHandwriting: Boolean(current.containsHandwriting),
        });
        current = { ...current, documentId: document.id };
        onUpdate(current);
      }
      await api.upload(current.documentId, current.file);
      current = { ...current, uploaded: true, state: 'uploaded' };
    } catch (error) {
      const message = error?.message || 'Upload failed. Please try again.';
      current = { ...current, state: 'failed', error: error?.retryAfter > 0 ? `${message} Try again in ${Math.ceil(error.retryAfter)} seconds.` : message };
    }
    results.push(current);
    onUpdate(current);
  }
  return results;
}

export function sourcesForItem(item, sources = []) {
  return Array.isArray(item.sourceIds) ? sources.filter((source) => item.sourceIds.includes(source.id)) : sources;
}

export function correctOptionIndex(item) {
  if (Number.isInteger(item.correctIndex)) return item.correctIndex;
  if (Number.isInteger(item.correctAnswer)) return item.correctAnswer;
  const answer = item.correct ?? item.answer ?? item.correctAnswer;
  return item.options.findIndex((option, index) => option === answer || String.fromCharCode(65 + index) === answer);
}
