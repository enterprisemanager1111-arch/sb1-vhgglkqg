-- Create function to get today's tasks with detailed information
CREATE OR REPLACE FUNCTION get_today_tasks_with_details(_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  completed boolean,
  points integer,
  category text,
  due_date timestamptz,
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
          'assignee_id', ta.assignee_id,
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
    JOIN profiles p ON p.id = ta.assignee_id
    WHERE ta.task_id IN (
      SELECT DISTINCT ft.id 
      FROM family_tasks ft
      WHERE ft.family_id IN (
        SELECT f.id 
        FROM families f
        JOIN family_members fm ON fm.family_id = f.id
        WHERE fm.user_id = _user_id
      )
      AND (
        ft.due_date IS NULL 
        OR DATE(ft.due_date) = CURRENT_DATE
      )
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
  WHERE ft.family_id IN (
    SELECT f.id 
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = _user_id
  )
  AND (
    ft.due_date IS NULL 
    OR DATE(ft.due_date) = CURRENT_DATE
  )
  ORDER BY ft.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_today_tasks_with_details TO authenticated;
