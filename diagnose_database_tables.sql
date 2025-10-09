-- Diagnostic script to check database tables
-- Run this to see what's currently in your database

-- 1. Check all tables that might be related to notifications
SELECT 
    table_name,
    table_schema,
    table_type,
    'FOUND' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%notification%' 
    OR table_name LIKE '%nitification%'
    OR table_name LIKE '%notif%'
)
ORDER BY table_name;

-- 2. Check if families and profiles tables exist (required for foreign keys)
SELECT 
    table_name,
    'REQUIRED_TABLE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('families', 'profiles', 'family_members')
ORDER BY table_name;

-- 3. Check if there are any typos in table names
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'nitifications' THEN 'TYPO: Should be notifications'
        WHEN table_name = 'notification' THEN 'SINGULAR: Should be notifications'
        WHEN table_name = 'notifications' THEN 'CORRECT'
        ELSE 'OTHER'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%notification%' 
    OR table_name LIKE '%nitification%'
);

-- 4. Check if notifications table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check RLS policies on notifications table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'notifications';

-- 6. Test if we can access the notifications table
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') 
        THEN 'notifications table EXISTS'
        ELSE 'notifications table DOES NOT EXIST'
    END as table_status;
