-- Create function to get current user's events for today with assignees
CREATE OR REPLACE FUNCTION get_current_user_events(_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  event_date timestamptz,
  end_date timestamptz,
  location text,
  created_by uuid,
  family_id uuid,
  assignee_count bigint,
  creator_profile jsonb,
  assignees jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH event_assignees AS (
    SELECT 
      ea.event_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', p.id,
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ) as assignees,
      COUNT(ea.id) as assignee_count
    FROM event_assignment ea
    JOIN profiles p ON p.id = ea.assignee_id
    WHERE ea.event_id IN (
      SELECT DISTINCT ea2.event_id 
      FROM event_assignment ea2 
      WHERE ea2.assignee_id = _user_id
    )
    GROUP BY ea.event_id
  )
  SELECT 
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.end_date,
    e.location,
    e.created_by,
    e.family_id,
    COALESCE(ea.assignee_count, 0) as assignee_count,
    CASE 
      WHEN p.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ELSE NULL
    END as creator_profile,
    COALESCE(ea.assignees, '[]'::jsonb) as assignees
  FROM calendar_events e
  LEFT JOIN profiles p ON p.id = e.created_by
  LEFT JOIN event_assignees ea ON ea.event_id = e.id
  WHERE e.id IN (
    SELECT DISTINCT ea2.event_id 
    FROM event_assignment ea2 
    WHERE ea2.assignee_id = _user_id
  )
  AND DATE(e.event_date) = CURRENT_DATE
  ORDER BY e.event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_events TO authenticated;
