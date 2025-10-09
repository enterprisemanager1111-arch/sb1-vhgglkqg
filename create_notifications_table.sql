-- Create notifications table for task notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'task',
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for family members"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
    AND user_id IN (
      SELECT user_id FROM family_members 
      WHERE family_id = notifications.family_id
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_family_id_idx ON notifications(family_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
