/*
  # Add company_id and phone_num columns to profiles table

  This migration adds the missing company_id and phone_num columns to the profiles table
  to support the signup form functionality.
*/

-- Add company_ID column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_ID TEXT;

-- Add phone_num column to profiles table  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_num TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.company_ID IS 'Company ID provided during signup';
COMMENT ON COLUMN public.profiles.phone_num IS 'Phone number provided during signup';
