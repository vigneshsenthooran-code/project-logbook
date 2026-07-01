-- Adds the "count breaks" toggle to the term/period builder — when off, break
-- weeks are skipped when numbering later weeks instead of consuming a slot.
-- Run this once in the Supabase SQL editor if your project already exists.

alter table periods add column if not exists count_breaks boolean;
