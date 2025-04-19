BEGIN;

ALTER TABLE users RENAME max_checkpoints_per_render TO max_checkpoints;

END;