# Redesigned Database Logic

## New Database Structure

### **Step 1: Save Task Details to `family_tasks` Table**
```typescript
const taskData = {
  title: "Task Title",
  description: "Task Description", 
  start_date: "2025-01-08",
  end_date: "2025-01-15",
  category: "household",
  points: 100,
  due_date: "2025-01-10",
  completed: false,
  family_id: "family-uuid",
  created_by: "creator-uuid"
  // NO assignee_id - assignments handled separately
};
```

### **Step 2: Save Assignments to `task_assignment` Table**
```typescript
const assignmentData = assigneeIds.map(userId => ({
  task_id: task.id,        // From family_tasks table
  user_id: userId,         // From profiles table (user_id)
  assigned_by: user?.id,   // Who made the assignment
  status: 'assigned'
}));
```

## Database Schema

### **`family_tasks` Table**
```sql
CREATE TABLE family_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    start_date timestamptz,
    end_date timestamptz,
    due_date timestamptz,
    category text,
    points integer DEFAULT 0,
    completed boolean DEFAULT false,
    family_id uuid NOT NULL REFERENCES families(id),
    created_by uuid NOT NULL REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### **`task_assignment` Table** (Redesigned)
```sql
CREATE TABLE task_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    status text DEFAULT 'assigned',
    assigned_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (task_id, user_id) -- A user can only be assigned to a specific task once
);
```

## Key Changes Made

### **1. Database Schema**
- **Redesigned `task_assignment` table** with correct column names
- **Used `user_id`** instead of `assignee_id` for clarity
- **Added proper foreign key relationships**
- **Added unique constraint** to prevent duplicate assignments

### **2. Code Updates**
- **TaskCreationModal.tsx**: Updated to use `user_id` instead of `assignee_id`
- **useFamilyTasks.ts**: Updated to query `user_id` column
- **Clear separation**: Task details → `family_tasks`, Assignments → `task_assignment`

## Data Flow

### **Task Creation Process**:
1. **User creates task** with title, description, start date, end date, assignees
2. **Save task details** to `family_tasks` table
3. **Get `task_id`** from created task
4. **For each assignee**: Save `task_id` + `user_id` to `task_assignment` table

### **Example Database Records**:

**family_tasks table**:
```sql
INSERT INTO family_tasks (title, description, start_date, end_date, family_id, created_by)
VALUES ('Clean Kitchen', 'Deep clean the kitchen', '2025-01-08', '2025-01-10', 'family-123', 'user-456');
-- Returns task_id: 'task-789'
```

**task_assignment table**:
```sql
INSERT INTO task_assignment (task_id, user_id, assigned_by, status)
VALUES 
  ('task-789', 'user-111', 'user-456', 'assigned'),
  ('task-789', 'user-222', 'user-456', 'assigned');
```

## Benefits

1. **Clear Logic**: Task details and assignments are completely separate
2. **Multiple Assignees**: One task can have multiple assignments
3. **Flexible**: Tasks can exist without assignees
4. **Proper Relationships**: Foreign keys link tables correctly
5. **No Duplicates**: Unique constraint prevents duplicate assignments
6. **Audit Trail**: Track who assigned what to whom

## Implementation Steps

### **Step 1: Run Database Script**
Execute `redesign_task_assignment_table.sql` on your Supabase database to:
- Drop existing `task_assignment` table
- Create new `task_assignment` table with correct structure
- Add proper indexes and RLS policies

### **Step 2: Verify Schema**
Check that both tables have the correct structure:
```sql
-- Check family_tasks table
SELECT column_name FROM information_schema.columns WHERE table_name = 'family_tasks';

-- Check task_assignment table  
SELECT column_name FROM information_schema.columns WHERE table_name = 'task_assignment';
```

### **Step 3: Test Application**
1. Create a task with multiple assignees
2. Verify task details are saved to `family_tasks`
3. Verify assignments are saved to `task_assignment`
4. Check that tasks load with proper assignment information

## Files Modified

- `redesign_task_assignment_table.sql` - Database schema fix
- `components/TaskCreationModal.tsx` - Updated to use `user_id`
- `hooks/useFamilyTasks.ts` - Updated to query `user_id`
- `REDESIGNED_DATABASE_LOGIC.md` - This documentation

## Expected Results

### **Before Fix**:
```
❌ Error: column task_assignment.assignee_id does not exist
❌ Task assignments fail to create
❌ Multiple assignees not supported
```

### **After Fix**:
```
✅ task_assignment table has user_id column
✅ Task details saved to family_tasks table
✅ Assignments saved to task_assignment table
✅ Multiple assignees supported
✅ Clean separation of concerns
```

The redesigned database logic now properly separates task details from assignments, making the system more maintainable and following your exact requirements.
