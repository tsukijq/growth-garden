-- Add category, has_revealed_bloom, and consistent_days columns to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category text DEFAULT null;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS has_revealed_bloom boolean DEFAULT false;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS consistent_days integer DEFAULT 0;
