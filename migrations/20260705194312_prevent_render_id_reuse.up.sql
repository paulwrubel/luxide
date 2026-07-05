BEGIN;

-- Add deleted_at column for soft-delete
ALTER TABLE renders ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create sequence for auto-increment IDs that never reuse old IDs
-- Start after the current max ID to avoid conflicts with existing rows
CREATE SEQUENCE renders_id_seq;
SELECT setval('renders_id_seq', COALESCE((SELECT MAX(id) FROM renders), 0));

-- Update the render_states view to exclude soft-deleted renders
CREATE OR REPLACE VIEW render_states AS
SELECT 
    r.id,
    r.config->'name' as name,
    r.config->'parameters'->'image_dimensions' as image_dimensions,
    (r.config->'parameters'->>'samples_per_checkpoint')::integer as samples_per_checkpoint,
    (r.config->'parameters'->>'total_checkpoints')::integer as total_checkpoints,
    CASE WHEN jsonb_typeof(r.state) = 'object' THEN
        (SELECT k FROM jsonb_object_keys(r.state) k LIMIT 1)
    ELSE
        r.state#>>'{}'
    END as state,
    CASE WHEN jsonb_typeof(r.state) = 'object' THEN
        CASE 
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'running') THEN 
                (r.state->'running'->>'checkpoint_iteration')::integer
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'pausing') THEN 
                (r.state->'pausing'->>'checkpoint_iteration')::integer
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'paused') THEN 
                (r.state->'paused')::integer
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'finished_checkpoint_iteration') THEN
                (r.state->>'finished_checkpoint_iteration')::integer
            ELSE NULL
        END
    ELSE NULL
    END as checkpoint_iteration,
    CASE WHEN jsonb_typeof(r.state) = 'object' THEN
        CASE 
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'running') THEN
                round(((r.state->'running'->'progress_info'->>'progress')::float * 100)::numeric, 2)
            WHEN EXISTS (SELECT 1 FROM jsonb_object_keys(r.state) k WHERE k = 'pausing') THEN
                round(((r.state->'pausing'->'progress_info'->>'progress')::float * 100)::numeric, 2)
            ELSE NULL
        END
    ELSE NULL
    END as percent_complete
FROM renders r
WHERE r.deleted_at IS NULL;

COMMIT;
