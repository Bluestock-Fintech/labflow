-- Location-based discovery (pincode + radius search) and admin-seeded
-- "unclaimed" listings for libraries that haven't self-registered yet.
ALTER TABLE libraries ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE libraries ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE libraries ALTER COLUMN owner_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_libraries_pincode ON libraries(pincode);
