-- Add listing_type and external_url to task_templates for Model A:
-- 'native' = full colift pipeline, certification eligible
-- 'external' = directory listing, links out to org's own signup

ALTER TABLE task_templates ADD COLUMN listing_type TEXT NOT NULL DEFAULT 'native'
  CHECK (listing_type IN ('native', 'external'));
ALTER TABLE task_templates ADD COLUMN external_url TEXT;
