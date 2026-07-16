BEGIN;

DROP TABLE IF EXISTS resources;
DROP SEQUENCE IF EXISTS resources_id_seq;

ALTER TABLE users DROP COLUMN IF EXISTS max_resource_storage_bytes;

COMMIT;
