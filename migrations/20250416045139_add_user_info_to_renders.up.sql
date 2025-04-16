BEGIN;

ALTER TABLE renders ADD user_id INTEGER NOT NULL DEFAULT 1;

ALTER TABLE renders ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE renders ADD FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX idx_user_id ON renders(user_id);

END;