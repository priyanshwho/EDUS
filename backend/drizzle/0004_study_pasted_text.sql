ALTER TABLE study_documents ADD COLUMN source_type text NOT NULL DEFAULT 'pdf'
  CHECK (source_type IN ('pdf','text'));
ALTER TABLE study_documents ADD COLUMN pasted_text text;
ALTER TABLE study_documents ADD COLUMN submission_key text;
ALTER TABLE study_documents ALTER COLUMN s3_key DROP NOT NULL;
ALTER TABLE study_documents ADD CONSTRAINT study_document_source_check CHECK (
  (source_type='pdf' AND s3_key IS NOT NULL AND pasted_text IS NULL) OR
  (source_type='text' AND s3_key IS NULL AND
    ((pasted_text IS NOT NULL AND length(pasted_text) BETWEEN 1 AND 50000 AND octet_length(pasted_text)<=65536)
      OR (pasted_text IS NULL AND status='deleted')))
);
CREATE UNIQUE INDEX study_document_submission_uq ON study_documents(workspace_id,submission_key)
  WHERE submission_key IS NOT NULL;
