
-- Create a SECURITY DEFINER function to create teams (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_team(
  p_name text,
  p_abbreviation text,
  p_logo_url text DEFAULT NULL,
  p_primary_color text DEFAULT '#DC2626',
  p_secondary_color text DEFAULT '#1F2937'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_team record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  INSERT INTO public.teams (name, abbreviation, logo_url, primary_color, secondary_color, user_id)
  VALUES (p_name, p_abbreviation, p_logo_url, p_primary_color, p_secondary_color, v_user_id)
  RETURNING * INTO v_team;
  
  RETURN row_to_json(v_team);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team(text, text, text, text, text) TO authenticated;
