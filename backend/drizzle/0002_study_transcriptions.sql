-- Keep successful OCR across retries without exposing it through public resources.
CREATE TABLE study_transcriptions (
  document_id uuid NOT NULL REFERENCES study_documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL CHECK (page_number BETWEEN 1 AND 150),
  vision_model text NOT NULL,
  prompt_version text NOT NULL,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 60000),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(document_id,page_number,vision_model,prompt_version)
);
