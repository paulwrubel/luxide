BEGIN;

-- Delete rows that had their pixel data cleared, since NOT NULL will be restored
DELETE FROM checkpoints WHERE pixel_data IS NULL;

-- Restore the NOT NULL constraint on pixel_data
ALTER TABLE checkpoints
ALTER COLUMN pixel_data SET NOT NULL;

-- Drop the pixel_data_cleared column
ALTER TABLE checkpoints
DROP COLUMN pixel_data_cleared;

COMMIT;
