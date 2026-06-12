BEGIN;

-- Revert nested bounces object back to flat max_bounces.
-- Discard use_russian_roulette_after — it didn't exist pre-PR.
UPDATE renders
SET config = jsonb_set(
  config #- '{parameters,bounces}',
  '{parameters,max_bounces}',
  config -> 'parameters' -> 'bounces' -> 'max'
)
WHERE config -> 'parameters' ? 'bounces';

COMMIT;
