# Function Parameter Fix

## Problem
The database function `create_calendar_event_with_details` exists with parameter names using underscores (`_assignees`, `_created_by`, etc.) but the code was calling it with `p_` prefix (`p_assignee_ids`, `p_created_by`, etc.).

## Error Message
```
Could not find the function public.create_calendar_event_with_details(p_assignee_ids, p_created_by, p_description, p_end_date, p_event_date, p_family_id, p_location, p_title) in the schema cache
```

## Solution
Updated the code to use the existing database function parameter names:

### Before (Code):
```typescript
const functionParams = {
  p_family_id: family.id,
  p_title: eventData.title,
  p_description: eventData.description || null,
  p_event_date: startTime.toISOString(),
  p_end_date: endTime ? endTime.toISOString() : null,
  p_location: null,
  p_created_by: user?.id,
  p_assignee_ids: eventData.assignee
};
```

### After (Code):
```typescript
const functionParams = {
  _family_id: family.id,
  _title: eventData.title,
  _description: eventData.description || null,
  _event_date: startTime.toISOString(),
  _end_date: endTime ? endTime.toISOString() : null,
  _location: null,
  _created_by: user?.id,
  _assignees: eventData.assignee
};
```

## What Changed
- `p_family_id` → `_family_id`
- `p_title` → `_title`
- `p_description` → `_description`
- `p_event_date` → `_event_date`
- `p_end_date` → `_end_date`
- `p_location` → `_location`
- `p_created_by` → `_created_by`
- `p_assignee_ids` → `_assignees`

## Result
The function call should now work correctly and:
- ✅ Create calendar events
- ✅ Save assignees to event_assignment table
- ✅ Handle errors gracefully
- ✅ Return detailed success/failure information

## Test
Try creating an event with assignees - it should now work without the parameter mismatch error!
