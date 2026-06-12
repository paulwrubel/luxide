BEGIN;

-- Restructure flat max_bounces into a nested bounces object.
-- Russian roulette didn't exist before this migration, so
-- use_russian_roulette_after is explicitly null (disabled).
UPDATE renders
SET config = jsonb_set(
  config #- '{parameters,max_bounces}',
  '{parameters,bounces}',
  jsonb_build_object(
    'max', config -> 'parameters' -> 'max_bounces',
    'use_russian_roulette_after', 'null'::jsonb
  )
)
WHERE config -> 'parameters' ? 'max_bounces';

COMMIT;
