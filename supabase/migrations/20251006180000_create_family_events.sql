-- Create family_events table
CREATE TABLE IF NOT EXISTS family_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'event',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 200,
  start_time TIMESTAMPTZ,
  duration TEXT, -- Store duration as text like "02:30:00"
  due_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_events_family_id ON family_events(family_id);
CREATE INDEX IF NOT EXISTS idx_family_events_assignee_id ON family_events(assignee_id);
CREATE INDEX IF NOT EXISTS idx_family_events_created_by ON family_events(created_by);
CREATE INDEX IF NOT EXISTS idx_family_events_start_time ON family_events(start_time);
CREATE INDEX IF NOT EXISTS idx_family_events_completed ON family_events(completed);

-- Enable RLS
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view events"
  ON family_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON family_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Event creators can update their events"
  ON family_events
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete their events"
  ON family_events
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_events_updated_at 
  BEFORE UPDATE ON family_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
