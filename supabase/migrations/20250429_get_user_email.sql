
-- Function to get user email by ID
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id_input uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user email from auth.users where the id matches
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_input;
  
  RETURN user_email;
END;
$$;
