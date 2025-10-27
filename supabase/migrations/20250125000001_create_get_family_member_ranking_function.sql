-- Create function to get family member ranking
-- This function returns family members ranked by their total points/activities
CREATE OR REPLACE FUNCTION get_family_member_ranking(_family_id uuid)
RETURNS TABLE(
  user_id uuid,
  name text,
  avatar_url text,
  total_points integer,
  completed_tasks integer,
  completed_events integer,
  completed_shopping_items integer,
  rank_position integer,
  role text,
  joined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH member_stats AS (
    SELECT 
      fm.user_id,
      p.name,
      p.avatar_url,
      fm.role,
      fm.joined_at,
      -- Count completed tasks
      COALESCE((
        SELECT COUNT(*)::integer
        FROM family_tasks ft
        WHERE ft.family_id = _family_id
          AND ft.assignee_id = fm.user_id
          AND ft.completed = true
      ), 0) as completed_tasks,
      -- Count completed events (events that have passed)
      COALESCE((
        SELECT COUNT(*)::integer
        FROM calendar_events ce
        WHERE ce.family_id = _family_id
          AND ce.id IN (
            SELECT ea.event_id
            FROM event_assignment ea
            WHERE ea.assignee_id = fm.user_id
          )
          AND (
            (ce.end_date IS NOT NULL AND ce.end_date < NOW()) OR
            (ce.end_date IS NULL AND ce.event_date < NOW())
          )
      ), 0) as completed_events,
      -- Count completed shopping items
      COALESCE((
        SELECT COUNT(*)::integer
        FROM shopping_items si
        WHERE si.family_id = _family_id
          AND si.added_by = fm.user_id
          AND si.completed = true
      ), 0) as completed_shopping_items
    FROM family_members fm
    JOIN profiles p ON p.id = fm.user_id
    WHERE fm.family_id = _family_id
  ),
  ranked_members AS (
    SELECT 
      ms.user_id,
      ms.name,
      ms.avatar_url,
      ms.role,
      ms.joined_at,
      ms.completed_tasks,
      ms.completed_events,
      ms.completed_shopping_items,
      -- Calculate total points (10 points per completed activity)
      (ms.completed_tasks + ms.completed_events + ms.completed_shopping_items) * 10 as total_points,
      -- Calculate rank based on total points
      ROW_NUMBER() OVER (
        ORDER BY 
          (ms.completed_tasks + ms.completed_events + ms.completed_shopping_items) DESC,
          ms.joined_at ASC
      ) as rank_position
    FROM member_stats ms
  )
  SELECT 
    rm.user_id,
    rm.name,
    rm.avatar_url,
    rm.total_points,
    rm.completed_tasks,
    rm.completed_events,
    rm.completed_shopping_items,
    rm.rank_position::integer,
    rm.role,
    rm.joined_at
  FROM ranked_members rm
  ORDER BY rm.rank_position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_family_member_ranking TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION get_family_member_ranking(uuid) IS 
'Returns family members ranked by their total points based on completed tasks, events, and shopping items';
