-- Preserve legacy values; missing fields in new entries are NULL.
ALTER TABLE public.daily_entries
  ALTER COLUMN activity DROP NOT NULL,
  ALTER COLUMN activity DROP DEFAULT,
  ALTER COLUMN coffee DROP NOT NULL,
  ALTER COLUMN coffee DROP DEFAULT,
  ALTER COLUMN energy DROP NOT NULL,
  ALTER COLUMN energy DROP DEFAULT,
  ALTER COLUMN hunger DROP NOT NULL,
  ALTER COLUMN hunger DROP DEFAULT,
  ALTER COLUMN protein DROP NOT NULL,
  ALTER COLUMN protein DROP DEFAULT;
ALTER TABLE public.daily_entries
  ADD COLUMN water integer,
  ADD COLUMN sleep_hours numeric,
  ADD COLUMN sleep_quality integer,
  ADD COLUMN schema_version integer NOT NULL DEFAULT 1,
  ADD COLUMN legacy boolean NOT NULL DEFAULT true;
ALTER TABLE public.daily_entries ALTER COLUMN schema_version SET DEFAULT 2, ALTER COLUMN legacy SET DEFAULT false;
