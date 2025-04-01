-- Add down migration script here
BEGIN;

DROP TABLE IF EXISTS checkpoints;
DROP TABLE IF EXISTS renders;

COMMIT;

