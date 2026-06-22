-- User-entered round-trip travel minutes that override the per-mode estimate.
-- When set, credit-computation uses this value instead of the estimate for the
-- selected commute_mode. The UI caps the input at the slowest mode's estimate
-- (max of drive/walk/transit) to prevent open-ended hours inflation while
-- still letting volunteers correct an estimate that's wrong for them. The
-- existing COMMUTE_CAP_MINUTES (90) still applies as a final ceiling.
ALTER TABLE audits ADD COLUMN commute_user_minutes INTEGER;
