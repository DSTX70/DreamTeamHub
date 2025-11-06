-- Speed up /api/ops/summary queries
-- Indexes for ops_event table to improve summary performance
CREATE INDEX IF NOT EXISTS idx_ops_event_owner_time ON ops_event(owner_type, owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_event_kind_time ON ops_event(kind, created_at DESC);
