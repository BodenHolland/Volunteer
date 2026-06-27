-- Device GPS captured at photo-capture time, stored alongside the photo's own
-- EXIF GPS. A second proof-of-presence signal for the geotag-mismatch check that
-- works even when the photo carries no EXIF location (many phones strip it, and
-- our client-side downscale re-encode drops it too). Lives in the PRIVATE
-- audit_photo_exif side-table so precise location never reaches the public cluster.
ALTER TABLE audit_photo_exif ADD COLUMN device_geocode_lat REAL;
ALTER TABLE audit_photo_exif ADD COLUMN device_geocode_lng REAL;
