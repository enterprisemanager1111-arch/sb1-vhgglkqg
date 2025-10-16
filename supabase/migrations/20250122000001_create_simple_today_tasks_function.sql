-- Create a simpler function to get today's tasks
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
  creator_profile jsonb
) AS $$
BEGIN
  RETURN QUERY
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
    END as creator_profile
  FROM family_tasks ft
  LEFT JOIN profiles p_assignee ON p_assignee.id = ft.assignee_id
  LEFT JOIN profiles p_creator ON p_creator.id = ft.created_by
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
