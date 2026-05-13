-- ============================================================
-- 045 — calendar_events: add reminder_job_ids column
-- ------------------------------------------------------------
-- Stores the QStash message IDs for scheduled reminder jobs so
-- they can be cancelled when the event is updated or deleted.
-- ============================================================

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS reminder_job_ids text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN calendar_events.reminder_job_ids IS
  'QStash message IDs for pending reminder jobs. Populated by the API; used for cancellation on update/delete.';
