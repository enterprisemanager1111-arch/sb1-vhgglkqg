# Calendar Events Schema Fix

## Problem
The `calendar_events` table has `event_date` and `end_date` columns of type `time without time zone`, but we need to store full date and time information (timestamptz).

## Error Message
```
column "event_date" is of type time without time zone but expression is of type date
```

## Solution
Run the comprehensive fix SQL to update the schema and function:

### Step 1: Run the Schema Fix
Execute `comprehensive_calendar_events_fix.sql` in your Supabase SQL editor. This will:

1. **Check Current Schema**: See what columns exist and their types
2. **Add New Columns**: Create `event_datetime` and `end_datetime` as `timestamptz`
3. **Migrate Data**: Move existing data from old columns to new ones
4. **Drop Old Columns**: Remove the old `time` columns
5. **Rename Columns**: Rename new columns to original names
6. **Update Function**: Update the function to work with new schema
7. **Verify Schema**: Confirm the changes worked

### Step 2: Test the Fix
After running the SQL, try creating an event with assignees. The function should now:
- ✅ Accept full ISO timestamps
- ✅ Store date and time information
- ✅ Create calendar events successfully
- ✅ Create event assignments

## What This Fixes

### Before:
- `event_date`: `time without time zone` (only time, no date)
- `end_date`: `time without time zone` (only time, no date)
- **Problem**: Can't store full date and time information

### After:
- `event_date`: `timestamptz` (full date and time with timezone)
- `end_date`: `timestamptz` (full date and time with timezone)
- **Result**: Can store complete date and time information

## Expected Result
After running the fix:
- ✅ **Schema Updated**: Columns now support full date/time
- ✅ **Function Updated**: Works with new schema
- ✅ **Data Preserved**: Existing data migrated safely
- ✅ **Event Creation**: Should work without type errors

## Test the Fix
1. Run the SQL script
2. Try creating an event with assignees
3. Check that both `calendar_events` and `event_assignment` tables are populated
4. Verify the dates are stored correctly

The EventCreationModal should now work correctly with proper date and time storage!
