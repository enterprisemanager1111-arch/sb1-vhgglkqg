-- Create function to notify when new notifications are inserted
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send a notification to the specific user
  PERFORM pg_notify(
    'new_notification',
    json_build_object(
      'user_id', NEW.assignee_id,
      'notification_id', NEW.id,
      'type', NEW.type,
      'title', NEW.title,
      'message', NEW.message,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when new notifications are inserted
DROP TRIGGER IF EXISTS trigger_notify_new_notification ON notifications;
CREATE TRIGGER trigger_notify_new_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_notification();

-- Create function to notify when notifications are updated (marked as read)
CREATE OR REPLACE FUNCTION notify_notification_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to 'read'
  IF OLD.status != 'read' AND NEW.status = 'read' THEN
    PERFORM pg_notify(
      'notification_read',
      json_build_object(
        'user_id', NEW.assignee_id,
        'notification_id', NEW.id,
        'status', NEW.status,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when notifications are updated
DROP TRIGGER IF EXISTS trigger_notify_notification_update ON notifications;
CREATE TRIGGER trigger_notify_notification_update
  AFTER UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_notification_update();

