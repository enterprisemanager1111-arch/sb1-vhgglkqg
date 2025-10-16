-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(_notification_id uuid[])
RETURNS TABLE(
  updated_count integer,
  success boolean,
  message text
) AS $$
DECLARE
  updated_rows integer;
BEGIN
  -- Update notifications status to 'read' for the given IDs
  UPDATE notifications 
  SET status = 'read'
  WHERE id = ANY(_notification_id)
    AND status != 'read';
  
  -- Get the number of updated rows
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  -- Return success with count
  RETURN QUERY SELECT updated_rows, true, 'Notifications marked as read successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT 0, false, 'Error marking notifications as read: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notifications_as_read TO authenticated;

