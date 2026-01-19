-- Function to get user email by user ID
-- This function allows clients to look up email addresses for username-based login
CREATE OR REPLACE FUNCTION get_user_email_by_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Query auth.users to get email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_by_id(UUID) TO anon;

