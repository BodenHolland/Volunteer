-- Add optional close date to task_templates.
-- NULL means the task is open-ended (no expiry).
-- listActiveTasks filters out rows where closes_at < now.
ALTER TABLE task_templates ADD COLUMN closes_at INTEGER;
