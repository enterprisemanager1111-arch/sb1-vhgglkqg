-- Supabase Verification Codes Table Setup
-- Run this SQL in your Supabase SQL Editor

-- Create verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (allows the app to manage verification codes)
CREATE POLICY "Service role can manage verification codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for users to read their own codes (optional)
CREATE POLICY "Users can read their own verification codes" ON verification_codes
  FOR SELECT USING (auth.email() = email);

-- Create a function to clean up expired codes (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired codes (optional)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_codes()
RETURNS trigger AS $$
BEGIN
  -- Clean up expired codes when a new one is inserted
  PERFORM cleanup_expired_verification_codes();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_codes_trigger
  AFTER INSERT ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_codes();

-- Grant necessary permissions
GRANT ALL ON verification_codes TO service_role;
GRANT SELECT ON verification_codes TO authenticated;

-- Insert a test record (optional - remove in production)
-- INSERT INTO verification_codes (email, code, expires_at) 
-- VALUES ('test@example.com', '123456', NOW() + INTERVAL '10 minutes');

-- Verify the table was created
SELECT * FROM verification_codes LIMIT 1;
