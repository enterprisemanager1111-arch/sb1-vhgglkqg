/*
  # Add automatic profile creation trigger

  This migration creates a database trigger that automatically creates a profile
  when a new user signs up, eliminating the need for retry logic in the application.
*/

-- Create function to handle new user profile creation
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

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
