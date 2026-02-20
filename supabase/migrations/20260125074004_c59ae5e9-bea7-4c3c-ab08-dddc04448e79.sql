-- Add min_skill and max_skill columns to mat_rules table (team defaults)
ALTER TABLE public.mat_rules 
ADD COLUMN min_skill integer NOT NULL DEFAULT 0,
ADD COLUMN max_skill integer NOT NULL DEFAULT 5;

-- Add min_skill and max_skill columns to meet_mat_rules table (meet-specific)
ALTER TABLE public.meet_mat_rules 
ADD COLUMN min_skill integer NOT NULL DEFAULT 0,
ADD COLUMN max_skill integer NOT NULL DEFAULT 5;