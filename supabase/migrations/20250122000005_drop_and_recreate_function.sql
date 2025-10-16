-- Drop the function first to clear any cached references
DROP FUNCTION IF EXISTS create_task_with_details(text, text, integer, text, timestamptz, timestamptz, timestamptz, uuid, uuid, uuid[]);

-- Create the function with explicit parameter types
CREATE OR REPLACE FUNCTION create_task_with_details(
  _title text,
  _description text,
  _points integer DEFAULT 0,
  _category text DEFAULT 'general',
  _due_date timestamptz DEFAULT NULL,
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL,
  _family_id uuid,
  _created_by uuid,
  _assignees uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  task_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  new_task_id uuid;
BEGIN
  -- Insert the task into family_tasks (explicitly specify the table)
  INSERT INTO public.family_tasks (
    title,
    description,
    points,
    category,
    due_date,
    start_date,
    end_date,
    family_id,
    created_by,
    assignee_id
  ) VALUES (
    _title,
    _description,
    _points,
    _category,
    _due_date,
    _start_date,
    _end_date,
    _family_id,
    _created_by,
    CASE WHEN array_length(_assignees, 1) = 1 THEN _assignees[1] ELSE NULL END
  ) RETURNING id INTO new_task_id;

  -- Return success
  RETURN QUERY SELECT new_task_id, true, 'Task created successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error with more details
    RETURN QUERY SELECT NULL::uuid, false, 'Failed to create task: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_task_with_details TO authenticated;
