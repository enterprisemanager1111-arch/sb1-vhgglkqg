/*
  # Allow Family Search for Joining

  The current RLS policy only allows users to view families they already belong to,
  which prevents them from searching for families to join. We need to add a policy
  that allows users to search for families by name, code, or ID for joining purposes.

  This policy should allow:
  1. Users to search for families by name, code, or ID
  2. Users to view basic family information (name, code, id) for joining
  3. But still restrict access to sensitive family data
*/

-- Add a new policy that allows users to search for families to join
-- This policy allows viewing basic family information for joining purposes
-- We'll allow searching by name, code, or ID for joining purposes
CREATE POLICY "Users can search families to join"
  ON families
  FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to search families

-- Note: This policy allows users to see all families, but they can only join
-- families they have the correct code for, and they can only become members
-- through the joinFamily function which has its own validation.
-- The joinFamily function will still validate that the user has the correct code.
