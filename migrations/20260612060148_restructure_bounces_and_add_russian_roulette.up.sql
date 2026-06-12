BEGIN;

-- Restructure flat max_bounces into a nested bounces object.
-- No use_russian_roulette_after — Russian roulette didn't exist
-- before this migration, so it defaults to off (omitted key).
UPDATE renders
SET config = jsonb_set(
  config #- '{parameters,max_bounces}',
  '{parameters,bounces}',
  jsonb_build_object('max', config -> 'parameters' -> 'max_bounces')
)
WHERE config -> 'parameters' ? 'max_bounces';

COMMIT;
