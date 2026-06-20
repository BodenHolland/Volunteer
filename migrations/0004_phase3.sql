-- Phase 3: deliverable distribution + cap-calibration methodology.

-- A submission's public deliverable has been published (given away free).
ALTER TABLE submissions ADD COLUMN published_at INTEGER;

-- Calibrated-cap methodology metadata (Change 5): when a task's cap was last
-- calibrated against the observed median of real quality-passing sessions.
ALTER TABLE task_templates ADD COLUMN cap_calibrated_at INTEGER;
ALTER TABLE task_templates ADD COLUMN cap_sample_size INTEGER;
