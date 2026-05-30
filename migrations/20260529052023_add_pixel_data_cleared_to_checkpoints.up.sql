BEGIN;

-- Add pixel_data_cleared flag to track which checkpoints have had their pixel data freed
ALTER TABLE checkpoints
ADD COLUMN pixel_data_cleared BOOLEAN NOT NULL DEFAULT FALSE;

-- Make pixel_data nullable so we can clear it while keeping metadata
ALTER TABLE checkpoints
ALTER COLUMN pixel_data DROP NOT NULL;

COMMIT;
