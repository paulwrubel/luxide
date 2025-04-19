BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    github_id INTEGER NOT NULL UNIQUE,
    username TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_github_id ON users(github_id);

END;
