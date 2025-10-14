import { supabase } from '@/lib/supabase';

export interface EventNotificationData {
  eventId: string;
  assigneeIds: string[];
  assignerId: string;
  eventTitle: string;
  eventDescription?: string;
}

export const createEventNotifications = async (data: EventNotificationData) => {
  try {
    console.log('🔔 Creating event notifications for:', data);

    // Create notifications for each assignee
    const notifications = data.assigneeIds.map(assigneeId => ({
      assignee_id: assigneeId,
      assigner_id: data.assignerId,
      event_id: data.eventId,
      type: 'event', // Use 'event' type for event notifications
      status: 'unread',
      created_at: new Date().toISOString()
    }));

    const { data: insertedNotifications, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('❌ Error creating event notifications:', error);
      throw error;
    }

    console.log('✅ Event notifications created successfully:', insertedNotifications);
    return insertedNotifications;
  } catch (error) {
    console.error('❌ Failed to create event notifications:', error);
    throw error;
  }
};

export const markEventNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }

    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    throw error;
  }
};
