# Quick Fix for Event Date Columns

## Problem
The `calendar_events` table has `event_date` and `end_date` columns of type `time without time zone`, but we need to store full date and time information.

## Solution
Run this SQL in your Supabase SQL editor:

```sql
-- Fix calendar_events table to use proper timestamp columns
ALTER TABLE calendar_events 
ALTER COLUMN event_date TYPE timestamptz 
USING event_date::timestamptz;

ALTER TABLE calendar_events 
ALTER COLUMN end_date TYPE timestamptz 
USING end_date::timestamptz;
```

## What This Does
- Changes `event_date` from `time` to `timestamptz` (full date and time)
- Changes `end_date` from `time` to `timestamptz` (full date and time)
- Allows storing complete ISO timestamps

## After Running This
The EventCreationModal should work correctly and be able to:
- ✅ Create calendar events with full date/time
- ✅ Save assignees to event_assignment table
- ✅ Handle duration calculations properly

## Test
Try creating an event with assignees - it should now work without the type error!
