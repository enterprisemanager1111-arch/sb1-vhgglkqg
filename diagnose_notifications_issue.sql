-- Diagnostic script to check notifications table issue
-- Run this to see what's happening with the notifications table

-- 1. Check all tables that contain 'notification' in the name
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%notification%' OR table_name LIKE '%nitification%')
ORDER BY table_name;

-- 2. Check if there are any typos in table names
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'nitifications' THEN 'TYPO: Should be notifications'
        WHEN table_name = 'notifications' THEN 'CORRECT'
        ELSE 'OTHER'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%notification%' OR table_name LIKE '%nitification%');

-- 3. Check if the notifications table exists and has the right structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check RLS policies on notifications table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Test if we can access the notifications table
SELECT COUNT(*) as notification_count FROM notifications;
