-- Verify that family_tasks table exists and has the correct structure
DO $$
BEGIN
  -- Check if family_tasks table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'family_tasks' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'family_tasks table does not exist';
  END IF;
  
  -- Check if the table has the required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_tasks' 
    AND table_schema = 'public'
    AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'family_tasks table missing id column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_tasks' 
    AND table_schema = 'public'
    AND column_name = 'title'
  ) THEN
    RAISE EXCEPTION 'family_tasks table missing title column';
  END IF;
  
  RAISE NOTICE 'family_tasks table exists and has required columns';
END $$;
