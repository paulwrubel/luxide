BEGIN;

ALTER TABLE users RENAME max_checkpoints TO max_checkpoints_per_render;

END;