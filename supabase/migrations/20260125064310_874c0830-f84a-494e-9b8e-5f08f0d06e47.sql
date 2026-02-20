-- Add column to track scratched wrestler in a match
ALTER TABLE public.matches 
ADD COLUMN scratched_wrestler_id UUID REFERENCES wrestlers(id) NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.matches.scratched_wrestler_id IS 'Tracks which wrestler was scratched and replaced in this match';