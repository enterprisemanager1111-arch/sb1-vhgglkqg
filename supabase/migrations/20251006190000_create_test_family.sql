-- Create a test family for testing family join functionality
-- This family can be used for testing the join family feature

-- Insert a test family
INSERT INTO families (id, name, code, created_by, created_at, updated_at)
VALUES (
  'test-family-id-12345',
  'Test Family',
  'BKRQLZ',
  'test-user-id-12345',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert a test user profile (if it doesn't exist)
INSERT INTO profiles (id, name, created_at, updated_at)
VALUES (
  'test-user-id-12345',
  'Test User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert the test user as a member of the test family
INSERT INTO family_members (family_id, user_id, role, joined_at)
VALUES (
  'test-family-id-12345',
  'test-user-id-12345',
  'admin',
  NOW()
) ON CONFLICT (family_id, user_id) DO NOTHING;

-- Also create another test family with a different code
INSERT INTO families (id, name, code, created_by, created_at, updated_at)
VALUES (
  'test-family-id-67890',
  'Demo Family',
  'DEMO01',
  'test-user-id-12345',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert the test user as a member of the demo family
INSERT INTO family_members (family_id, user_id, role, joined_at)
VALUES (
  'test-family-id-67890',
  'test-user-id-12345',
  'admin',
  NOW()
) ON CONFLICT (family_id, user_id) DO NOTHING;
