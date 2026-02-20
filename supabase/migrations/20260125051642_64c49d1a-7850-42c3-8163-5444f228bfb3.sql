-- Add location, time, and notes columns to meets table
ALTER TABLE public.meets 
ADD COLUMN meet_time TIME,
ADD COLUMN location_address TEXT,
ADD COLUMN location_notes TEXT,
ADD COLUMN notes TEXT;