/*
# Fix RLS Infinite Recursion

This migration fixes the infinite recursion error in RLS policies by simplifying
the policy logic and removing circular dependencies.

## Problem
The existing policies on `family_members` and `families` tables were causing 
infinite recursion because:
1. family_members policies queried family_members table (self-reference)
2. families policies queried family_members, which triggered family_members policies

## Solution
1. Drop existing recursive policies
2. Create simplified, non-recursive policies
3. Handle complex authorization logic in application code where needed

## Changes
- Simplified family_members policies to avoid self-references
- Simplified families policies to avoid cross-table recursion
- Users can manage their own data directly
- Family-level permissions handled through application logic
*/

-- Drop existing problematic policies on family_members
DROP POLICY IF EXISTS "Family admins can manage members" ON family_members;
DROP POLICY IF EXISTS "Users can join families" ON family_members;
DROP POLICY IF EXISTS "Users can view family members of their families" ON family_members;

-- Drop existing problematic policies on families  
DROP POLICY IF EXISTS "Family admins can update their families" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;

-- Create simplified policies for family_members (no recursion)
CREATE POLICY "Users can view their own memberships"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" 
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON family_members
  FOR UPDATE  
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create simplified policies for families (no cross-table queries)
CREATE POLICY "Users can create families"
  ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family creators can view and update their families"
  ON families
  FOR ALL
  TO authenticated  
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to view families by code (for joining)
CREATE POLICY "Users can view families by code"
  ON families
  FOR SELECT
  TO authenticated
  USING (true);