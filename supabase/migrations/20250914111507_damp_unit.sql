/*
  # Points System for Family Rewards

  1. New Tables
    - `family_points_activities`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `activity_type` (text, task_completed, member_added, daily_checkin, etc.)
      - `points_earned` (integer)
      - `related_entity_id` (uuid, optional, references the task/event that triggered points)
      - `description` (text, human readable description)
      - `created_at` (timestamp)

    - `family_goals`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `target_points` (integer)
      - `current_points` (integer, calculated)
      - `target_date` (date, optional)
      - `completed` (boolean)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)

    - `family_achievements`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `achievement_type` (text, first_task, team_player, streak_master, etc.)
      - `title` (text)
      - `description` (text)
      - `points_reward` (integer)
      - `unlocked_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for family members to read/write their family's data
    - Ensure users can only earn points for their own activities

  3. Indexes
    - Add indexes for family_id, user_id, and activity_type for fast queries
    - Add index for points calculation and leaderboard queries
*/

-- Points Activities Table
CREATE TABLE IF NOT EXISTS family_points_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'task_completed',
    'shopping_item_completed', 
    'member_added',
    'daily_checkin',
    'event_created',
    'goal_achieved',
    'streak_bonus',
    'family_milestone'
  )),
  points_earned integer NOT NULL DEFAULT 0,
  related_entity_id uuid,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Family Goals Table
CREATE TABLE IF NOT EXISTS family_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_points integer NOT NULL DEFAULT 100,
  current_points integer DEFAULT 0,
  target_date date,
  completed boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family Achievements Table  
CREATE TABLE IF NOT EXISTS family_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL CHECK (achievement_type IN (
    'first_task',
    'team_player', 
    'streak_master',
    'family_hero',
    'organizer',
    'helper',
    'consistent',
    'milestone_100',
    'milestone_500',
    'milestone_1000'
  )),
  title text NOT NULL,
  description text NOT NULL,
  points_reward integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE family_points_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Points Activities
CREATE POLICY "Family members can view family points activities"
  ON family_points_activities
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create points activities"
  ON family_points_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- RLS Policies for Family Goals  
CREATE POLICY "Family members can view family goals"
  ON family_goals
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create family goals"
  ON family_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update family goals"
  ON family_goals
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Achievements
CREATE POLICY "Family members can view achievements"
  ON family_achievements
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create achievements"
  ON family_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS family_points_activities_family_id_idx ON family_points_activities(family_id);
CREATE INDEX IF NOT EXISTS family_points_activities_user_id_idx ON family_points_activities(user_id);
CREATE INDEX IF NOT EXISTS family_points_activities_activity_type_idx ON family_points_activities(activity_type);
CREATE INDEX IF NOT EXISTS family_points_activities_created_at_idx ON family_points_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS family_goals_family_id_idx ON family_goals(family_id);
CREATE INDEX IF NOT EXISTS family_goals_completed_idx ON family_goals(completed);

CREATE INDEX IF NOT EXISTS family_achievements_family_id_idx ON family_achievements(family_id);
CREATE INDEX IF NOT EXISTS family_achievements_user_id_idx ON family_achievements(user_id);
CREATE INDEX IF NOT EXISTS family_achievements_achievement_type_idx ON family_achievements(achievement_type);

-- Update triggers
CREATE OR REPLACE FUNCTION update_family_goals_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_goals_updated_at
  BEFORE UPDATE ON family_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_family_goals_updated_at();

-- Function to calculate total points for a user
CREATE OR REPLACE FUNCTION get_user_total_points(target_user_id uuid, target_family_id uuid)
RETURNS integer AS $$
DECLARE
  total_points integer;
BEGIN
  SELECT COALESCE(SUM(points_earned), 0)
  INTO total_points
  FROM family_points_activities
  WHERE user_id = target_user_id 
    AND family_id = target_family_id;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress(target_goal_id uuid)
RETURNS void AS $$
DECLARE
  goal_record family_goals%ROWTYPE;
  family_total_points integer;
BEGIN
  -- Get the goal
  SELECT * INTO goal_record
  FROM family_goals
  WHERE id = target_goal_id;
  
  IF goal_record.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate total family points
  SELECT COALESCE(SUM(points_earned), 0)
  INTO family_total_points
  FROM family_points_activities
  WHERE family_id = goal_record.family_id
    AND created_at >= goal_record.created_at;
  
  -- Update goal progress
  UPDATE family_goals
  SET 
    current_points = family_total_points,
    completed = (family_total_points >= target_points),
    updated_at = now()
  WHERE id = target_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;