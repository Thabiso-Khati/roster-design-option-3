-- ============================================================
-- Migration 043 — tool_snapshots archive column
-- ============================================================
-- Adds archived_at to tool_snapshots so users can hide work
-- tools from their Workspace without permanently deleting them.
-- Archived snapshots are preserved and can be restored.
--
-- Run once in Supabase SQL Editor:
--   Supabase → SQL Editor → paste this → Run
-- ============================================================

-- 1. Add the column (safe to run multiple times)
ALTER TABLE tool_snapshots
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Partial index for fast "show archived" queries
CREATE INDEX IF NOT EXISTS tool_snapshots_archived_idx
  ON tool_snapshots (user_id, archived_at)
  WHERE archived_at IS NOT NULL;
