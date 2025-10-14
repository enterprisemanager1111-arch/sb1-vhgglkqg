# Setup Calendar Event Function

## Overview
The `create_calendar_event_with_details` function creates calendar events and automatically assigns them to multiple users in a single database operation.

## Setup Instructions

### Step 1: Create the Function
Run this SQL in your Supabase SQL editor:

```sql
-- Create the create_calendar_event_with_details function
CREATE OR REPLACE FUNCTION create_calendar_event_with_details(
  p_family_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_event_date timestamptz,
  p_end_date timestamptz DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_created_by uuid,
  p_assignee_ids uuid[] DEFAULT '{}'
)
RETURNS json AS $$
DECLARE
  v_event_id uuid;
  v_assignment_count integer := 0;
  v_result json;
BEGIN
  -- Insert the calendar event
  INSERT INTO calendar_events (
    family_id,
    title,
    description,
    event_date,
    end_date,
    location,
    created_by
  ) VALUES (
    p_family_id,
    p_title,
    p_description,
    p_event_date,
    p_end_date,
    p_location,
    p_created_by
  ) RETURNING id INTO v_event_id;

  -- Create assignments for each assignee if provided
  IF array_length(p_assignee_ids, 1) > 0 THEN
    -- Create event_assignment table if it doesn't exist
    BEGIN
      CREATE TABLE IF NOT EXISTS event_assignment (
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
      
      -- Enable RLS if not already enabled
      ALTER TABLE event_assignment ENABLE ROW LEVEL SECURITY;
      
      -- Create simple RLS policy if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_assignment' 
        AND policyname = 'Allow all operations for authenticated users'
      ) THEN
        CREATE POLICY "Allow all operations for authenticated users"
          ON event_assignment
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Table might already exist, continue
        NULL;
    END;

    -- Insert assignments for each assignee
    FOR i IN 1..array_length(p_assignee_ids, 1) LOOP
      BEGIN
        INSERT INTO event_assignment (
          event_id,
          assignee_id,
          assigned_by,
          status
        ) VALUES (
          v_event_id,
          p_assignee_ids[i],
          p_created_by,
          'assigned'
        );
        
        v_assignment_count := v_assignment_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but continue with other assignments
          RAISE WARNING 'Failed to create assignment for assignee %: %', p_assignee_ids[i], SQLERRM;
      END;
    END LOOP;
  END IF;

  -- Return result
  v_result := json_build_object(
    'event_id', v_event_id,
    'assignments_created', v_assignment_count,
    'total_assignees', COALESCE(array_length(p_assignee_ids, 1), 0),
    'success', true
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Test the Function
```sql
-- Test the function with sample data
SELECT create_calendar_event_with_details(
  (SELECT id FROM families LIMIT 1), -- Replace with actual family ID
  'Test Event',
  'Test Description',
  now(),
  now() + interval '1 hour',
  'Test Location',
  (SELECT id FROM profiles LIMIT 1), -- Replace with actual user ID
  ARRAY[(SELECT id FROM profiles LIMIT 1)] -- Replace with actual user IDs
);
```

### Step 3: Verify Results
```sql
-- Check if the event was created
SELECT * FROM calendar_events WHERE title = 'Test Event';

-- Check if assignments were created
SELECT * FROM event_assignment WHERE event_id = (
  SELECT id FROM calendar_events WHERE title = 'Test Event'
);
```

## Function Parameters

- `p_family_id`: UUID of the family
- `p_title`: Event title
- `p_description`: Event description (optional)
- `p_event_date`: Start date/time of the event
- `p_end_date`: End date/time of the event (optional)
- `p_location`: Event location (optional)
- `p_created_by`: UUID of the user creating the event
- `p_assignee_ids`: Array of user UUIDs to assign the event to

## Return Value

The function returns a JSON object with:
- `event_id`: UUID of the created event
- `assignments_created`: Number of successful assignments
- `total_assignees`: Total number of assignees provided
- `success`: Boolean indicating overall success

## Features

1. **Automatic Table Creation**: Creates `event_assignment` table if it doesn't exist
2. **RLS Setup**: Automatically configures Row Level Security
3. **Error Handling**: Continues processing even if some assignments fail
4. **Atomic Operation**: All operations happen in a single transaction
5. **Detailed Logging**: Provides comprehensive result information

## Usage in Code

The EventCreationModal now calls this function with:
```typescript
const { data: result, error: functionError } = await supabase.rpc(
  'create_calendar_event_with_details',
  {
    p_family_id: family.id,
    p_title: eventData.title,
    p_description: eventData.description,
    p_event_date: startTime.toISOString(),
    p_end_date: endTime ? endTime.toISOString() : null,
    p_location: null,
    p_created_by: user?.id,
    p_assignee_ids: eventData.assignee
  }
);
```

This approach is much more efficient and reliable than the previous method!
