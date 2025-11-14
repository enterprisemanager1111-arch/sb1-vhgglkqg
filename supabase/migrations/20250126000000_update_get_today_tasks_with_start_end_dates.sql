-- Update get_today_tasks_with_details function to include start_date, end_date, and progress calculation
CREATE OR REPLACE FUNCTION get_today_tasks_with_details(_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  completed boolean,
  points integer,
  category text,
  due_date timestamptz,
  start_date date,
  end_date date,
  family_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  task_assignments jsonb,
  progress numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH task_assignments AS (
    SELECT 
      ta.task_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ta.id,
          'assignee_id', ta.user_id,
          'assignee_profile', jsonb_build_object(
            'name', p.name,
            'avatar_url', p.avatar_url
          )
        )
      ) AS assignments
    FROM task_assignment ta
    JOIN profiles p ON p.id = ta.user_id
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
        OR (ft.start_date IS NOT NULL AND ft.end_date IS NOT NULL AND CURRENT_DATE BETWEEN DATE(ft.start_date) AND DATE(ft.end_date))
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
    DATE(ft.start_date) as start_date,
    DATE(ft.end_date) as end_date,
    ft.family_id,
    ft.created_at,
    ft.updated_at,
    COALESCE(ta.assignments, '[]'::jsonb) AS task_assignments,
    -- Calculate progress based on date range (not completion status)
    -- Progress reflects time elapsed, not task completion
    CASE
      WHEN ft.start_date IS NULL OR ft.end_date IS NULL THEN 0.0
      WHEN CURRENT_DATE < DATE(ft.start_date) THEN 0.0
      WHEN CURRENT_DATE >= DATE(ft.end_date) THEN 100.0
      ELSE
        -- Calculate progress: (current_date - start_date) / (end_date - start_date) * 100
        LEAST(100.0, GREATEST(0.0, 
          ((CURRENT_DATE - DATE(ft.start_date))::numeric / 
           NULLIF((DATE(ft.end_date) - DATE(ft.start_date))::numeric, 0)) * 100.0
        ))
    END AS progress
  FROM family_tasks ft
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
    OR (ft.start_date IS NOT NULL AND ft.end_date IS NOT NULL AND CURRENT_DATE BETWEEN DATE(ft.start_date) AND DATE(ft.end_date))
  )
  ORDER BY ft.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_today_tasks_with_details TO authenticated;

