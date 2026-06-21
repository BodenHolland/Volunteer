-- Slice 3+: simplify the live catalog to only the food-audit task.
-- Archives every other seeded task so it disappears from /app/tasks but the
-- historical submissions / hours ledger rows that reference them stay intact.

UPDATE task_templates
SET status = 'archived'
WHERE id IN (
  'task_trees',
  'task_translate',
  'task_hazards',
  'task_space',
  'task_input',
  'task_seminar'
);

-- Update the food-audit copy: drop "California", retitle, neutralize the time
-- estimate so it doesn't look like a per-store fixed price (volunteers may do
-- 1 store or 10).
UPDATE task_templates
SET
  title = 'Audit food prices at a store near you',
  short_description = 'Visit any food retailer and capture shelf-tag prices for a 6-item basket (milk, eggs, bread, rice, beans, fresh produce). You decide how many stores you do — hours credit based on your measured time.',
  instructions_md =
    '## What you''ll do' || X'0A' ||
    'Walk into any food retailer — supermarket, bodega, ethnic market, dollar store, farmers market — and capture **shelf-tag prices** for a fixed 6-item USDA basket. You don''t buy anything.' || X'0A' || X'0A' ||
    '1. Find a store.' || X'0A' ||
    '2. For each of the 6 items, snap **one photo** of the item next to its shelf tag, then enter the price and size.' || X'0A' ||
    '3. If an item is missing, mark it out-of-stock.' || X'0A' ||
    '4. Submit. Hours credit when your audit verifies.' || X'0A' || X'0A' ||
    '## What you get out of it' || X'0A' ||
    'Verified audits flow into a public food-access dataset showing where food is most affordable. The deliverable is free and public. Your time is credited against your SNAP work-requirement hours.',
  validation_rubric_md =
    'A complete audit captures price and a clear photo for every in-stock basket item, taken inside a real food retailer. The photo should clearly show the item and its shelf price tag side by side. Flag missing photos, illegible tags, prices wildly outside expected bands, or EXIF geotags inconsistent with the claimed store location. Reject if photos are stock-like, duplicated across audits, or clearly not of the claimed item.'
WHERE id = 'task_food_audit';
