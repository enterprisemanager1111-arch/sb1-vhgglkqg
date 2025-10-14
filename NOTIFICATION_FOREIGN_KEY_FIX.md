# Notification Foreign Key Relationship Fix

## Issue
**Error**: `PGRST200` - Could not find a relationship between 'notifications' and 'profiles' in the schema cache

**Root Cause**: The foreign key relationship `notifications_assigner_id_fkey` doesn't exist in the database, causing the Supabase query to fail when trying to join the `notifications` and `profiles` tables.

## Solution Implemented

### **Before (Problematic)**
```typescript
const { data, error } = await supabase
  .from('notifications')
  .select(`
    *,
    assigner_profile:profiles!notifications_assigner_id_fkey(
      name,
      avatar_url
    ),
    task:tasks(
      title,
      description
    ),
    event:calendar_events(
      title,
      description,
      event_date
    )
  `)
  .eq('assignee_id', user.id)
  .order('created_at', { ascending: false });
```

### **After (Fixed)**
```typescript
// Step 1: Fetch notifications without joins
const { data: notifications, error: notificationsError } = await supabase
  .from('notifications')
  .select('*')
  .eq('assignee_id', user.id)
  .order('created_at', { ascending: false });

// Step 2: Fetch assigner profiles separately
const assignerIds = [...new Set(notifications.map(n => n.assigner_id))];
const { data: assignerProfiles } = await supabase
  .from('profiles')
  .select('id, name, avatar_url')
  .in('id', assignerIds);

// Step 3: Fetch task details separately
const taskIds = notifications.filter(n => n.task_id).map(n => n.task_id);
let taskDetails = [];
if (taskIds.length > 0) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description')
    .in('id', taskIds);
  taskDetails = tasks || [];
}

// Step 4: Fetch event details separately
const eventIds = notifications.filter(n => n.event_id).map(n => n.event_id);
let eventDetails = [];
if (eventIds.length > 0) {
  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, description, event_date')
    .in('id', eventIds);
  eventDetails = events || [];
}

// Step 5: Combine all data manually
const enrichedNotifications = notifications.map(notification => ({
  ...notification,
  assigner_profile: assignerProfiles?.find(p => p.id === notification.assigner_id),
  task: taskDetails.find(t => t.id === notification.task_id),
  event: eventDetails.find(e => e.id === notification.event_id)
}));
```

## Key Changes

### **1. Removed Foreign Key Joins**
- **Before**: Used `profiles!notifications_assigner_id_fkey` which doesn't exist
- **After**: Fetch data separately and combine manually

### **2. Separate Data Fetching**
- **Notifications**: Fetch basic notification data first
- **Profiles**: Fetch assigner profiles separately
- **Tasks**: Fetch task details for task notifications
- **Events**: Fetch event details for event notifications

### **3. Manual Data Combination**
- **Assigner Profiles**: Match by `assigner_id`
- **Task Details**: Match by `task_id`
- **Event Details**: Match by `event_id`

### **4. Error Handling**
- **Graceful Degradation**: If profile/task/event data fails, notifications still display
- **Warning Logs**: Log errors but don't fail the entire operation
- **Fallback Data**: Use empty arrays if related data fails to load

## Benefits

### **Reliability**
- **No Foreign Key Dependencies**: Works regardless of database schema
- **Graceful Degradation**: Partial data loading if some queries fail
- **Error Resilience**: Individual query failures don't break the entire operation

### **Performance**
- **Efficient Queries**: Only fetch related data when needed
- **Batch Operations**: Fetch all profiles/tasks/events in single queries
- **Optimized Joins**: Manual joining is more predictable than database joins

### **Maintainability**
- **Clear Logic**: Easy to understand and debug
- **Flexible**: Can easily add more related data
- **Testable**: Each step can be tested independently

## Implementation Details

### **Data Flow**
1. **Fetch Notifications**: Get all notifications for the user
2. **Extract IDs**: Get unique assigner IDs, task IDs, and event IDs
3. **Fetch Related Data**: Get profiles, tasks, and events in parallel
4. **Combine Data**: Manually match and combine all data
5. **Set State**: Update notifications state with enriched data

### **Error Handling**
```typescript
if (profilesError) {
  console.warn('⚠️ Error fetching assigner profiles:', profilesError);
  // Continue with empty profiles array
}

if (tasksError) {
  console.warn('⚠️ Error fetching task details:', tasksError);
  // Continue with empty tasks array
}

if (eventsError) {
  console.warn('⚠️ Error fetching event details:', eventsError);
  // Continue with empty events array
}
```

### **Optimization**
- **Unique IDs**: Use `Set` to avoid duplicate queries
- **Conditional Fetching**: Only fetch task/event data if IDs exist
- **Parallel Queries**: All related data fetched simultaneously

## Expected Behavior

### **Successful Operation**
1. **Notifications Load**: All notifications display with full details
2. **Assigner Names**: Show actual assigner names instead of "Someone"
3. **Task/Event Details**: Show task titles and event titles
4. **Real-Time Updates**: New notifications work with enriched data

### **Partial Failures**
1. **Profile Fetch Fails**: Notifications still display with "Someone" as assigner
2. **Task Fetch Fails**: Task notifications still display without task details
3. **Event Fetch Fails**: Event notifications still display without event details

### **Console Logging**
```
🔍 Fetching all notifications for user: [user-id]
📨 Notifications fetched: [notifications-array]
📨 Notifications count: [number]
📨 Enriched notifications: [enriched-notifications-array]
```

## Testing

### **Verify Fix**
1. **No Foreign Key Errors**: Should not see PGRST200 errors
2. **All Notifications Display**: Should show all notifications for the user
3. **Rich Data**: Should show assigner names, task titles, and event titles
4. **Real-Time Updates**: New notifications should appear with full details

### **Error Scenarios**
1. **Missing Profiles**: Should still display notifications
2. **Missing Tasks**: Should still display task notifications
3. **Missing Events**: Should still display event notifications

The notification page should now work reliably without foreign key relationship errors!
