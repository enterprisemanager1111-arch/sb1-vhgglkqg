-- Create function to get events by date for a user
CREATE OR REPLACE FUNCTION get_events_by_date(
  _user_id uuid,
  _selected_date date
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  event_date timestamptz,
  end_date timestamptz,
  location text,
  created_by uuid,
  family_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  creator_profile jsonb,
  assignees jsonb,
  assignee_count bigint
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
          'avatar', p.avatar_url
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
    e.created_at,
    e.updated_at,
    CASE 
      WHEN p.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ELSE NULL
    END as creator_profile,
    COALESCE(ea.assignees, '[]'::jsonb) as assignees,
    COALESCE(ea.assignee_count, 0) as assignee_count
  FROM calendar_events e
  LEFT JOIN profiles p ON p.id = e.created_by
  LEFT JOIN event_assignees ea ON ea.event_id = e.id
  WHERE e.id IN (
    SELECT DISTINCT ea2.event_id 
    FROM event_assignment ea2 
    WHERE ea2.assignee_id = _user_id
  )
  AND DATE(e.event_date) = _selected_date
  ORDER BY e.event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_events_by_date TO authenticated;
