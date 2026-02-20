-- Add season_id column to meets table
ALTER TABLE public.meets 
ADD COLUMN season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_meets_season_id ON public.meets(season_id);