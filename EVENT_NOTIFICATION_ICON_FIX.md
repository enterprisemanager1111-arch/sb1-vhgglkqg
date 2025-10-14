# Event Notification Icon Fix

## Issue
Event notifications should display the `meeting_image.png` icon instead of the default task icon.

## Changes Implemented

### 1. **Updated Notification Icon Logic**
**File**: `app/notifications.tsx`

**Added Event Type Case**:
```typescript
case 'event':
  return (
    <Image 
      source={require('@/assets/images/icon/meeting_image.png')}
      style={styles.notificationIconImage}
      resizeMode="contain"
    />
  );
```

**Complete Icon Logic**:
```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task':
      return <Image source={require('@/assets/images/icon/task_image.png')} />;
    case 'expense':
      return <Image source={require('@/assets/images/icon/task_image.png')} />;
    case 'meeting':
      return <Image source={require('@/assets/images/icon/meeting_image.png')} />;
    case 'event':  // Added for event notifications
      return <Image source={require('@/assets/images/icon/meeting_image.png')} />;
    default:
      return <Image source={require('@/assets/images/icon/task_image.png')} />;
  }
};
```

### 2. **Updated Event Notification Creation**
**File**: `utils/eventNotificationService.ts`

**Changed Notification Type**:
```typescript
// Before
type: 'meeting', // Use 'meeting' type for event notifications

// After
type: 'event', // Use 'event' type for event notifications
```

**Updated Notification Creation**:
```typescript
const notifications = data.assigneeIds.map(assigneeId => ({
  assignee_id: assigneeId,
  assigner_id: data.assignerId,
  event_id: data.eventId,
  type: 'event',  // Changed from 'meeting' to 'event'
  status: 'unread',
  created_at: new Date().toISOString()
}));
```

## Expected Behavior

### **Event Notifications**
1. **Icon**: Display `meeting_image.png` icon
2. **Title**: "New Meeting Assigned to You!"
3. **Description**: "You have a new meeting from [assigner], you can check your meeting '[event title]' by tap here"
4. **Navigation**: Tapping navigates to calendar page

### **Task Notifications**
1. **Icon**: Display `task_image.png` icon
2. **Title**: "New Task Assigned to You!"
3. **Description**: "You have new task for this sprint from [assigner], you can check your task '[task title]' by tap here"
4. **Navigation**: Tapping navigates to tasks page

### **Meeting Notifications**
1. **Icon**: Display `meeting_image.png` icon
2. **Title**: "New Meeting Assigned to You!"
3. **Description**: "You have a new meeting from [assigner], you can check your meeting '[event title]' by tap here"
4. **Navigation**: Tapping navigates to calendar page

## Implementation Details

### **Icon Display Logic**
- **Event Type**: Uses `meeting_image.png` (same as meeting type)
- **Task Type**: Uses `task_image.png`
- **Meeting Type**: Uses `meeting_image.png`
- **Default**: Uses `task_image.png` for unknown types

### **Notification Type Consistency**
- **Event Creation**: Creates notifications with `type: 'event'`
- **Icon Mapping**: `'event'` type maps to `meeting_image.png`
- **Display Logic**: Handles both `'meeting'` and `'event'` types identically

### **Backward Compatibility**
- **Existing Meeting Notifications**: Continue to work with `meeting_image.png`
- **New Event Notifications**: Use `meeting_image.png` with `'event'` type
- **Task Notifications**: Unchanged, continue to use `task_image.png`

## Benefits

### **Visual Consistency**
- **Event Notifications**: Clear visual distinction with meeting icon
- **Task Notifications**: Maintain existing task icon
- **User Experience**: Users can quickly identify notification types

### **Type Safety**
- **Specific Types**: Event notifications use `'event'` type
- **Icon Mapping**: Clear mapping between types and icons
- **Future Extensibility**: Easy to add new notification types

### **Maintainability**
- **Clear Logic**: Explicit case for each notification type
- **Consistent Behavior**: Same icon for meeting and event types
- **Easy Updates**: Simple to modify icon mappings

## Testing

### **Verify Event Notifications**
1. **Create Event**: Assign an event to a user
2. **Check Icon**: Verify `meeting_image.png` is displayed
3. **Check Title**: Verify "New Meeting Assigned to You!" title
4. **Check Navigation**: Verify tapping navigates to calendar

### **Verify Task Notifications**
1. **Create Task**: Assign a task to a user
2. **Check Icon**: Verify `task_image.png` is displayed
3. **Check Title**: Verify "New Task Assigned to You!" title
4. **Check Navigation**: Verify tapping navigates to tasks

### **Console Logging**
Look for logs like:
```
🔔 Creating event notifications for: [event-data]
✅ Event notifications created successfully: [notifications]
```

## Summary

Event notifications now properly display the `meeting_image.png` icon by:

1. **Adding 'event' case** to the `getNotificationIcon` function
2. **Updating notification creation** to use `'event'` type instead of `'meeting'`
3. **Maintaining existing logic** for display, navigation, and messaging

Event notifications will now show the correct meeting icon while maintaining all existing functionality!
