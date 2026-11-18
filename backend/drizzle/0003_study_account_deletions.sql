-- Prevent new private uploads while durable account cleanup is in progress.
CREATE TABLE study_account_deletions (
  owner_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);
