BEGIN;

ALTER TABLE users ADD role TEXT NOT NULL;
ALTER TABLE users ADD max_renders INTEGER;
ALTER TABLE users ADD max_checkpoints INTEGER;
ALTER TABLE users ADD max_render_pixel_count INTEGER;

END;