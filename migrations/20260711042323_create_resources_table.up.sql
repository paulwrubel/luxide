BEGIN;

-- Create sequence for auto-increment resource IDs
CREATE SEQUENCE resources_id_seq;
SELECT setval('resources_id_seq', 1);

-- Create resources table for user-uploaded files (texture maps, normal maps, OBJ models)
CREATE TABLE resources (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data BYTEA NOT NULL,
    byte_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

COMMIT;
