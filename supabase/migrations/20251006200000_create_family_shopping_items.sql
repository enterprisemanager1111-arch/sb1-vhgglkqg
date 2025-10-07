-- Create family_shopping_items table
CREATE TABLE family_shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity TEXT DEFAULT '1.0 stk',
  category TEXT DEFAULT 'shopping',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  points INT DEFAULT 100 NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE family_shopping_items ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view shopping items in their family
CREATE POLICY "Family members can view shopping items"
  ON family_shopping_items
  FOR SELECT
  TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- Policy for family members to create shopping items
CREATE POLICY "Family members can create shopping items"
  ON family_shopping_items
  FOR INSERT
  TO authenticated
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()) AND created_by = auth.uid());

-- Policy for family members to update their own shopping items
CREATE POLICY "Family members can update their own shopping items"
  ON family_shopping_items
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- Policy for family members to delete their own shopping items
CREATE POLICY "Family members can delete their own shopping items"
  ON family_shopping_items
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_family_shopping_items_family_id ON family_shopping_items (family_id);
CREATE INDEX idx_family_shopping_items_assignee_id ON family_shopping_items (assignee_id);
CREATE INDEX idx_family_shopping_items_created_by ON family_shopping_items (created_by);
CREATE INDEX idx_family_shopping_items_completed ON family_shopping_items (completed);
