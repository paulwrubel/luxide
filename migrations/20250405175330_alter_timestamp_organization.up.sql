-- Add up migration script here
BEGIN;

-- drop default values for render timestamps
ALTER TABLE renders
ALTER created_at DROP DEFAULT;

ALTER TABLE renders
ALTER updated_at DROP DEFAULT;

-- drop default values for checkpoint timestamps
ALTER TABLE checkpoints
ALTER created_at DROP DEFAULT;

-- rename checkpoint timestamp columns
ALTER TABLE checkpoints
RENAME created_at TO started_at;

ALTER TABLE checkpoints
ADD ended_at TIMESTAMPTZ NOT NULL;

END;