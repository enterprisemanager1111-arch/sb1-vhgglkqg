# Event Assignment Column Fix

## Issue Analysis

**Error**: `column event_assignment.assignee_id does not exist`

**Root Cause**: The `event_assignment` table uses `user_id` instead of `assignee_id` for the assignee column, but the code was trying to query `assignee_id`.

## Database Schema

The `event_assignment` table structure uses:
- `user_id` - The user being assigned to the event
- NOT `assignee_id` - This column doesn't exist

## Fixes Applied

### 1. **useCalendarEvents Hook**
**File**: `hooks/useCalendarEvents.ts`

**Before**:
```typescript
const { data: assignments, error: assignmentError } = await supabase
  .from('event_assignment')
  .select('assignee_id')
  .eq('event_id', event.id);

return {
  ...event,
  assignees: assignments?.map(a => a.assignee_id) || []
};
```

**After**:
```typescript
const { data: assignments, error: assignmentError } = await supabase
  .from('event_assignment')
  .select('user_id')
  .eq('event_id', event.id);

return {
  ...event,
  assignees: assignments?.map(a => a.user_id) || []
};
```

### 2. **useTodayEvents Hook**
**File**: `hooks/useTodayEvents.ts`

**Before**:
```typescript
const { data: assignments } = await supabase
  .from('event_assignment')
  .select('assignee_id')
  .eq('event_id', event.id);

return {
  ...event,
  assignees: assignments?.map(a => a.assignee_id) || []
};
```

**After**:
```typescript
const { data: assignments } = await supabase
  .from('event_assignment')
  .select('user_id')
  .eq('event_id', event.id);

return {
  ...event,
  assignees: assignments?.map(a => a.user_id) || []
};
```

## Database Schema Reference

The `event_assignment` table uses the following structure:
```sql
CREATE TABLE event_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- NOT assignee_id
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);
```

## Key Changes

### ✅ **Column Name Correction**
- Changed `assignee_id` to `user_id` in all queries
- Updated mapping to use `a.user_id` instead of `a.assignee_id`

### ✅ **Consistent Schema Usage**
- All event assignment queries now use the correct column name
- Maintains consistency with the actual database schema

### ✅ **No Breaking Changes**
- Event display functionality remains the same
- Only the internal column reference was corrected
- User experience is unchanged

## Expected Behavior

After this fix:
1. **Calendar Events**: Should display events with correct assignee information
2. **Today's Events**: Should display events with correct assignee information
3. **No More Errors**: The `column event_assignment.assignee_id does not exist` error should be resolved
4. **Proper Assignee Display**: Event cards should show assignee avatars correctly

## Console Logs

You should now see successful queries like:
```
🔍 Fetching assignees for event: [event-id]
✅ Assignees fetched for event: [event-id] [assignments]
```

Instead of the previous error:
```
❌ Error fetching assignees for event: [event-id] { code: "42703", message: "column event_assignment.assignee_id does not exist" }
```

The event assignment functionality should now work correctly with the proper column names!
