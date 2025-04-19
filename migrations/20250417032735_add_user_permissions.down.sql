BEGIN;

ALTER TABLE users DROP COLUMN role;
ALTER TABLE users DROP COLUMN max_renders;
ALTER TABLE users DROP COLUMN max_checkpoints;
ALTER TABLE users DROP COLUMN max_render_pixel_count;

END;