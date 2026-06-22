-- How the volunteer traveled to the store, chosen by them after picking the
-- store. Drives the commute-credit estimate: "drive" uses the OSRM driving
-- route duration; "walk" and "transit" are estimated from the route distance
-- (no free transit-routing API). Defaults to driving when unset. The estimate
-- stays bounded by the existing COMMUTE_CAP_MINUTES so a slower mode can't run
-- credited hours away.
ALTER TABLE audits ADD COLUMN commute_mode TEXT;
