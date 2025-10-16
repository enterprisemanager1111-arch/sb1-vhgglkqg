-- Create function to get all tasks for a family
CREATE OR REPLACE FUNCTION get_all_tasks(_family_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  completed boolean,
  points integer,
  category text,
  due_date timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid,
  family_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  assignee_profile jsonb,
  creator_profile jsonb,
  task_assignments jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH task_assignments AS (
    SELECT 
      ta.task_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ta.id,
          'user_id', ta.user_id,
          'status', ta.status,
          'assigned_at', ta.assigned_at,
          'completed_at', ta.completed_at,
          'assignee_profile', jsonb_build_object(
            'name', p.name,
            'avatar_url', p.avatar_url
          )
        )
      ) as assignments
    FROM task_assignment ta
    JOIN profiles p ON p.id = ta.user_id
    WHERE ta.task_id IN (
      SELECT DISTINCT ft.id 
      FROM family_tasks ft
      WHERE ft.family_id = _family_id
    )
    GROUP BY ta.task_id
  )
  SELECT 
    ft.id,
    ft.title,
    ft.description,
    ft.completed,
    ft.points,
    ft.category,
    ft.due_date,
    ft.start_date,
    ft.end_date,
    ft.created_by,
    ft.family_id,
    ft.created_at,
    ft.updated_at,
    CASE 
      WHEN p_assignee.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', p_assignee.name,
          'avatar_url', p_assignee.avatar_url
        )
      ELSE NULL
    END as assignee_profile,
    CASE 
      WHEN p_creator.id IS NOT NULL THEN 
        jsonb_build_object(
          'name', p_creator.name,
          'avatar_url', p_creator.avatar_url
        )
      ELSE NULL
    END as creator_profile,
    COALESCE(ta.assignments, '[]'::jsonb) as task_assignments
  FROM family_tasks ft
  LEFT JOIN profiles p_assignee ON p_assignee.id = ft.assignee_id
  LEFT JOIN profiles p_creator ON p_creator.id = ft.created_by
  LEFT JOIN task_assignments ta ON ta.task_id = ft.id
  WHERE ft.family_id = _family_id
  ORDER BY ft.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_tasks TO authenticated;
