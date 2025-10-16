-- Create function to get notifications with all related data
CREATE OR REPLACE FUNCTION get_notifications(_user_id uuid)
RETURNS TABLE(
  id uuid,
  assignee_id uuid,
  assigner_id uuid,
  task_id uuid,
  event_id uuid,
  type text,
  status text,
  created_at timestamptz,
  read_at timestamptz,
  assigner_profile jsonb,
  task jsonb,
  event jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.assignee_id,
    n.assigner_id,
    n.task_id,
    n.event_id,
    n.type,
    n.status,
    n.created_at,
    n.read_at,
    CASE 
      WHEN p.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ELSE NULL
    END as assigner_profile,
    CASE 
      WHEN t.id IS NOT NULL THEN 
        jsonb_build_object(
          'title', t.title,
          'description', t.description
        )
      ELSE NULL
    END as task,
    CASE 
      WHEN e.id IS NOT NULL THEN 
        jsonb_build_object(
          'title', e.title,
          'description', e.description,
          'event_date', e.event_date
        )
      ELSE NULL
    END as event
  FROM notifications n
  LEFT JOIN profiles p ON p.id = n.assigner_id
  LEFT JOIN family_tasks t ON t.id = n.task_id
  LEFT JOIN calendar_events e ON e.id = n.event_id
  WHERE n.assignee_id = _user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;
