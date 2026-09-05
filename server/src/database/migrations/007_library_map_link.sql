-- Owner-editable Google Maps link for the library's public page/location tab.
ALTER TABLE libraries ADD COLUMN IF NOT EXISTS map_link TEXT;
