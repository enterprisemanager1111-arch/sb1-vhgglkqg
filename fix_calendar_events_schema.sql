-- Fix calendar_events table schema to use proper timestamp columns
-- This will change event_date and end_date from time to timestamptz

-- First, check current schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
ORDER BY ordinal_position;

-- Update event_date column to timestamptz
ALTER TABLE calendar_events 
ALTER COLUMN event_date TYPE timestamptz 
USING event_date::timestamptz;

-- Update end_date column to timestamptz (if it exists)
ALTER TABLE calendar_events 
ALTER COLUMN end_date TYPE timestamptz 
USING end_date::timestamptz;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
ORDER BY ordinal_position;
