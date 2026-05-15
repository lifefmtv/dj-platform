-- Run this in the Supabase SQL Editor before importing the Excel schedule
-- Safe to run multiple times (all statements are idempotent)

-- 1. Add columns used by the Excel import (won't touch existing rows)
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS day_name    text;
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS slot_number integer;
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS status      text DEFAULT 'confirmed';
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS month       text;
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS year        integer;

-- 2. Drop any old conflicting constraint before adding the new one
ALTER TABLE schedule DROP CONSTRAINT IF EXISTS schedule_date_slot_unique;

-- 3. Unique constraint that allows upsert without duplicating rows
ALTER TABLE schedule
  ADD CONSTRAINT schedule_date_slot_unique UNIQUE (date, slot_number);

-- 4. New tables for the Dropbox sync (run these if you haven't already)
CREATE TABLE IF NOT EXISTS mixes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropbox_file_id  text UNIQUE,
  dropbox_path     text,
  title            text NOT NULL,
  dj_name          text DEFAULT '',
  recorded_at      date,
  status           text DEFAULT 'pending',
  temp_link        text,
  temp_link_expires_at timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flyers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropbox_file_id  text UNIQUE,
  dropbox_path     text,
  title            text NOT NULL,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropbox_file_id  text UNIQUE,
  dropbox_path     text,
  title            text NOT NULL,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_at    timestamptz DEFAULT now(),
  shows_found  integer DEFAULT 0,
  mixes_found  integer DEFAULT 0,
  flyers_found integer DEFAULT 0,
  photos_found integer DEFAULT 0,
  errors       text
);

-- 5. Add Dropbox columns to show_archive if not already present
ALTER TABLE show_archive ADD COLUMN IF NOT EXISTS dropbox_file_id      text UNIQUE;
ALTER TABLE show_archive ADD COLUMN IF NOT EXISTS dropbox_path         text;
ALTER TABLE show_archive ADD COLUMN IF NOT EXISTS temp_link            text;
ALTER TABLE show_archive ADD COLUMN IF NOT EXISTS temp_link_expires_at timestamptz;
ALTER TABLE show_archive ADD COLUMN IF NOT EXISTS genre                text;
