-- Drop the mat_count column from meets table since mat count is now derived from mat_rules
ALTER TABLE public.meets DROP COLUMN IF EXISTS mat_count;