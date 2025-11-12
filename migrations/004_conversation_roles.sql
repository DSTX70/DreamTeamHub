-- Migration: Add conversation_roles junction table for multi-persona support
-- This allows conversations to include multiple Dream Team members
-- Keeps existing role_handle column for backward compatibility

CREATE TABLE IF NOT EXISTS conversation_roles (
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role_handle TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by TEXT,
  PRIMARY KEY (conversation_id, role_handle)
);

CREATE INDEX idx_conversation_roles_conversation_id ON conversation_roles(conversation_id);
CREATE INDEX idx_conversation_roles_role_handle ON conversation_roles(role_handle);

-- Backfill existing conversations into the junction table
-- Each existing conversation gets one entry with its current role_handle
INSERT INTO conversation_roles (conversation_id, role_handle, added_at)
SELECT id, role_handle, created_at
FROM conversations
WHERE role_handle IS NOT NULL
ON CONFLICT (conversation_id, role_handle) DO NOTHING;

-- Note: We're keeping the conversations.role_handle column for now
-- It will be deprecated in a future migration after confirming the new system works
