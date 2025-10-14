# Notification Table Name Fix

## Issue
**Error**: `PGRST205` - Could not find the table 'public.tasks' in the schema cache

**Root Cause**: The notification fetching logic was trying to query the `tasks` table, but the actual table name is `family_tasks`.

## Solution Implemented

### **Before (Problematic)**
```typescript
const { data: tasks, error: tasksError } = await supabase
  .from('tasks')  // ❌ This table doesn't exist
  .select('id, title, description')
  .in('id', taskIds);
```

### **After (Fixed)**
```typescript
const { data: tasks, error: tasksError } = await supabase
  .from('family_tasks')  // ✅ Correct table name
  .select('id, title, description')
  .in('id', taskIds);
```

## Changes Made

### **1. Updated Initial Fetch Function**
**File**: `app/notifications.tsx`

**Fixed Table Name**:
```typescript
// Fetch task details for task notifications
const taskIds = notifications.filter(n => n.task_id).map(n => n.task_id);
let taskDetails = [];
if (taskIds.length > 0) {
  const { data: tasks, error: tasksError } = await supabase
    .from('family_tasks')  // Changed from 'tasks' to 'family_tasks'
    .select('id, title, description')
    .in('id', taskIds);
  
  if (tasksError) {
    console.warn('⚠️ Error fetching task details:', tasksError);
  } else {
    taskDetails = tasks || [];
  }
}
```

### **2. Updated Refresh Function**
**File**: `app/notifications.tsx`

**Fixed Table Name**:
```typescript
// Fetch task details
const taskIds = notifications.filter(n => n.task_id).map(n => n.task_id);
let taskDetails = [];
if (taskIds.length > 0) {
  const { data: tasks } = await supabase
    .from('family_tasks')  // Changed from 'tasks' to 'family_tasks'
    .select('id, title, description')
    .in('id', taskIds);
  taskDetails = tasks || [];
}
```

## Database Schema Context

### **Correct Table Names**
- **Tasks**: `family_tasks` (not `tasks`)
- **Events**: `calendar_events` (correct)
- **Profiles**: `profiles` (correct)
- **Notifications**: `notifications` (correct)

### **Table Relationships**
- **Notifications → Tasks**: `notification.task_id` → `family_tasks.id`
- **Notifications → Events**: `notification.event_id` → `calendar_events.id`
- **Notifications → Profiles**: `notification.assigner_id` → `profiles.id`

## Expected Behavior After Fix

### **Task Notifications**
1. **No Table Errors**: Should not see PGRST205 errors
2. **Task Details**: Should display task titles and descriptions
3. **Rich Data**: Task notifications show complete information
4. **Error Handling**: Graceful fallback if task details fail to load

### **Event Notifications**
1. **Event Details**: Should display event titles and descriptions
2. **Rich Data**: Event notifications show complete information
3. **No Impact**: Event notifications unaffected by task table fix

### **Console Logging**
You should see logs like:
```
🔍 Fetching all notifications for user: [user-id]
📨 Notifications fetched: [notifications-array]
📨 Enriched notifications: [enriched-notifications-array]
```

**No more errors like**:
```
❌ Error fetching task details: PGRST205
```

## Benefits

### **Reliability**
- **No Table Errors**: Eliminates PGRST205 errors
- **Correct Queries**: Uses actual database table names
- **Data Consistency**: Fetches task data from correct table

### **Performance**
- **Successful Queries**: Task details load properly
- **Rich Notifications**: Complete task information displayed
- **Error Resilience**: Graceful handling of any remaining issues

### **User Experience**
- **Task Notifications**: Show actual task titles instead of generic text
- **Complete Data**: Users see full task details
- **No Errors**: Smooth notification loading experience

## Testing

### **Verify Fix**
1. **No Table Errors**: Should not see PGRST205 errors in console
2. **Task Notifications**: Should display task titles and descriptions
3. **Event Notifications**: Should continue to work normally
4. **Rich Data**: All notification types should show complete information

### **Test Scenarios**
1. **Task Assignment**: Create task and assign to user
2. **Event Assignment**: Create event and assign to user
3. **Mixed Notifications**: Verify both types display correctly
4. **Error Handling**: Check graceful fallback if any queries fail

## Summary

The notification system now uses the correct table name `family_tasks` instead of the non-existent `tasks` table. This eliminates the PGRST205 error and ensures task notifications display with complete task details.

**Key Changes**:
- ✅ **Initial Fetch**: Updated to use `family_tasks` table
- ✅ **Refresh Function**: Updated to use `family_tasks` table
- ✅ **Error Handling**: Maintains graceful fallback for any remaining issues
- ✅ **Data Consistency**: Task notifications now show actual task information

The notification page should now work without table name errors and display complete task and event information!
