-- Add up migration script here
BEGIN;

CREATE TABLE IF NOT EXISTS renders (
    id INTEGER NOT NULL PRIMARY KEY,
    state JSONB NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkpoints (
    render_id INTEGER NOT NULL,
    iteration INTEGER NOT NULL,
    pixel_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (render_id, iteration),
    FOREIGN KEY (render_id) REFERENCES renders(id)
);

COMMIT;