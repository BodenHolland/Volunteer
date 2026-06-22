-- Immutable store snapshot on each audit.
--
-- An audit is an evidentiary record (a specific volunteer's measured work at a
-- specific store) that may later be handed to a state agency or referenced
-- alongside a CF 888. The `stores` table is shared and mutable — a store row
-- can be edited, corrected, or merged after the fact. Snapshotting the store's
-- name, address, and coordinates onto the audit at submit time keeps each
-- serialized audit record stable and self-contained regardless of later edits
-- to the shared store row.
ALTER TABLE audits ADD COLUMN store_name_snapshot TEXT;
ALTER TABLE audits ADD COLUMN store_address_snapshot TEXT;
ALTER TABLE audits ADD COLUMN store_geocode_lat_snapshot REAL;
ALTER TABLE audits ADD COLUMN store_geocode_lng_snapshot REAL;
