/*
  # Update profile trigger to use empty string for display name

  This migration updates the database trigger to create profiles with empty
  display names instead of defaulting to 'Family Member'.
*/

-- Update the function to handle new user profile creation with empty name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at, updated_at, company_ID, phone_num)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), ''),
    now(),
    now(),
    NULL, -- company_ID will be set later via updateProfile
    NULL  -- phone_num will be set later via updateProfile
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
