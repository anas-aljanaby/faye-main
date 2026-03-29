-- Optional lists on orphan profile (Arabic text lines)
ALTER TABLE orphans
  ADD COLUMN IF NOT EXISTS hobbies TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS needs_wishes TEXT[] NOT NULL DEFAULT '{}';
