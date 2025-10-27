-- Create function to process uncompleted family items
-- This function will clean up old uncompleted tasks, events, and shopping items
CREATE OR REPLACE FUNCTION process_uncompleted_family_items()
RETURNS TABLE(
  processed_tasks integer,
  processed_events integer,
  processed_shopping_items integer,
  success boolean,
  message text
) AS $$
DECLARE
  tasks_processed integer := 0;
  events_processed integer := 0;
  shopping_items_processed integer := 0;
  seven_days_ago timestamptz;
BEGIN
  -- Calculate date 7 days ago
  seven_days_ago := NOW() - INTERVAL '7 days';
  
  -- Process uncompleted tasks older than 7 days
  -- Mark them as completed if they're past their due date
  UPDATE family_tasks 
  SET completed = true, updated_at = NOW()
  WHERE completed = false 
    AND due_date IS NOT NULL 
    AND due_date < NOW()
    AND created_at < seven_days_ago;
  
  GET DIAGNOSTICS tasks_processed = ROW_COUNT;
  
  -- Process uncompleted events older than 7 days
  -- Mark them as completed if they're past their end date
  UPDATE calendar_events 
  SET updated_at = NOW()
  WHERE (end_date IS NOT NULL AND end_date < NOW())
    OR (end_date IS NULL AND event_date < NOW())
  AND created_at < seven_days_ago;
  
  GET DIAGNOSTICS events_processed = ROW_COUNT;
  
  -- Process uncompleted shopping items older than 7 days
  -- Delete them as they're likely outdated
  DELETE FROM shopping_items 
  WHERE completed = false 
    AND created_at < seven_days_ago;
  
  GET DIAGNOSTICS shopping_items_processed = ROW_COUNT;
  
  -- Return success with counts
  RETURN QUERY SELECT 
    tasks_processed, 
    events_processed, 
    shopping_items_processed, 
    true, 
    'Successfully processed uncompleted family items';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT 
      0, 0, 0, false, 
      'Error processing uncompleted family items: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_uncompleted_family_items TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION process_uncompleted_family_items() IS 
'Processes uncompleted family items by marking overdue tasks as completed, updating past events, and removing old shopping items';
