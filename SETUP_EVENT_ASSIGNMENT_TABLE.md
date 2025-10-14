# Setup Event Assignment Table

## Problem
The `event_assignment` table doesn't exist in the database, so assignees cannot be saved when creating events.

## Solution
Run the following SQL commands in your Supabase SQL editor to create the table:

### Step 1: Create the Function
```sql
-- Create a function to create the event_assignment table
CREATE OR REPLACE FUNCTION create_event_assignment_table()
RETURNS TEXT AS $$
BEGIN
    -- Drop table if exists to start fresh
    DROP TABLE IF EXISTS event_assignment CASCADE;
    
    -- Create event_assignment table
    CREATE TABLE event_assignment (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
      assignee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_at timestamptz DEFAULT now(),
      status text DEFAULT 'assigned',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE (event_id, assignee_id)
    );
    
    -- Add indexes
    CREATE INDEX event_assignment_event_id_idx ON event_assignment(event_id);
    CREATE INDEX event_assignment_assignee_id_idx ON event_assignment(assignee_id);
    CREATE INDEX event_assignment_assigned_by_idx ON event_assignment(assigned_by);
    
    -- Enable RLS
    ALTER TABLE event_assignment ENABLE ROW LEVEL SECURITY;
    
    -- Create simple RLS policy (allow all for authenticated users)
    CREATE POLICY "Allow all operations for authenticated users"
      ON event_assignment
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    
    RETURN 'Event assignment table created successfully';
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Execute the Function
```sql
-- Run the function to create the table
SELECT create_event_assignment_table();
```

### Step 3: Verify the Table
```sql
-- Check if the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_assignment'
ORDER BY ordinal_position;
```

### Step 4: Test the Table
```sql
-- Test insert (replace with actual IDs from your database)
INSERT INTO event_assignment (event_id, assignee_id, assigned_by)
VALUES (
  (SELECT id FROM calendar_events LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM profiles LIMIT 1)
);

-- Check if insert worked
SELECT COUNT(*) as test_count FROM event_assignment;

-- Clean up test data
DELETE FROM event_assignment WHERE event_id = (SELECT id FROM calendar_events LIMIT 1);
```

## What This Does

1. **Creates the Table**: `event_assignment` table with proper structure
2. **Sets Up Relationships**: Foreign keys to `calendar_events` and `profiles`
3. **Adds Indexes**: For better performance
4. **Enables RLS**: Row Level Security for data protection
5. **Creates Policies**: Allows authenticated users to manage assignments

## Table Structure

- `id`: Primary key (UUID)
- `event_id`: References `calendar_events.id`
- `assignee_id`: References `profiles.id` (the assigned user)
- `assigned_by`: References `profiles.id` (who made the assignment)
- `assigned_at`: When the assignment was made
- `status`: Assignment status (default: 'assigned')
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

## After Setup

Once the table is created, the EventCreationModal will automatically:
1. Save event data to `calendar_events` table
2. Save assignee relationships to `event_assignment` table
3. Link each assignee to the created event
4. Provide detailed logging for debugging

## Troubleshooting

If you still have issues:
1. Check the console logs for detailed error messages
2. Verify the table exists: `SELECT * FROM event_assignment LIMIT 1;`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'event_assignment';`
4. Test with a simple insert to verify permissions
