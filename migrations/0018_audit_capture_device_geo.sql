-- Device GPS captured at photo-capture time, stored alongside the photo's own
-- EXIF GPS. A second proof-of-presence signal for the geotag-mismatch check that
-- works even when the photo carries no EXIF location (many phones strip it, and a
-- client-side re-encode can drop it too). Lives in the PRIVATE audit_photo_exif
-- side-table so precise location never reaches the public cluster. Additive.
--
-- NOTE: this filename intentionally matches the entry already in prod's
-- d1_migrations (the columns were applied to prod out-of-band), so wrangler SKIPS
-- it there and only applies it to fresh/local DBs that still lack the columns.
ALTER TABLE audit_photo_exif ADD COLUMN device_geocode_lat REAL;
ALTER TABLE audit_photo_exif ADD COLUMN device_geocode_lng REAL;
