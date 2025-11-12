
-- migrations/003_chat_conversation_participants.sql
-- Adds conversation_participants with support for users and pods.

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id INTEGER NOT NULL,
  principal_type TEXT NOT NULL CHECK (principal_type IN ('user','pod')),
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  notify BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by TEXT NULL,
  PRIMARY KEY (conversation_id, principal_type, principal_id),
  CONSTRAINT fk_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (pod_id, user_id),
  CONSTRAINT fk_pod FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_pod ON pod_members(pod_id);
