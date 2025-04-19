-- Add down migration script here
BEGIN;

-- drop the ended_at column from checkpoints
ALTER TABLE checkpoints
DROP ended_at;

-- rename checkpoint timestamp column back
ALTER TABLE checkpoints
RENAME started_at TO created_at;

-- restore default values for checkpoint timestamps
ALTER TABLE checkpoints
ALTER created_at SET DEFAULT NOW();

-- restore default values for render timestamps
ALTER TABLE renders
ALTER updated_at SET DEFAULT NOW();

ALTER TABLE renders
ALTER created_at SET DEFAULT NOW();

END;