-- migrations/003_chat_conversation_participants.sql
-- Adds conversation_participants with support for users and pods.
-- Note: pods table already exists with integer IDs

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id INTEGER NOT NULL,
  principal_type TEXT NOT NULL CHECK (principal_type IN ('user','pod')),
  principal_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  notify BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by TEXT NULL,
  PRIMARY KEY (conversation_id, principal_type, principal_id),
  CONSTRAINT fk_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- pod_members: many-to-many relationship between pods and persons
CREATE TABLE IF NOT EXISTS pod_members (
  pod_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY (pod_id, user_id),
  CONSTRAINT fk_pod FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_pod ON pod_members(pod_id);

-- Add conversation_messages table if it doesn't exist (for new chat system)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  author_id TEXT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_conv_msg FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON conversation_messages(conversation_id);
