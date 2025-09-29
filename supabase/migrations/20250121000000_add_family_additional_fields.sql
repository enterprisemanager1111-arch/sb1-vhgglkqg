-- Add additional fields to families table for complete family information
-- This migration adds the missing fields: slogan, type, and family_img

-- Add slogan field to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS slogan text;

-- Add type field to families table (Private/Public)
ALTER TABLE families ADD COLUMN IF NOT EXISTS type text DEFAULT 'Private' CHECK (type IN ('Private', 'Public'));

-- Add family_img field to store the URL of the uploaded family image
ALTER TABLE families ADD COLUMN IF NOT EXISTS family_img text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS families_type_idx ON families (type) WHERE type IS NOT NULL;
CREATE INDEX IF NOT EXISTS families_family_img_idx ON families (family_img) WHERE family_img IS NOT NULL;
