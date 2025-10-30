# Privacy Settings - Database Integration

## Overview
Privacy settings are now stored in the `settings` JSONB field in the Supabase `profiles` table, providing flexible storage for all app settings in a single column.

## Database Structure

### Profiles Table - Settings Field

The `settings` column is a JSONB field that stores all user settings including privacy preferences.

```sql
-- settings column structure
{
  "privacy": {
    "showProfilePhoto": true,
    "showBirthday": true,
    "showEmail": false,
    "showPhone": false,
    "taskNotifications": true,
    "eventNotifications": true,
    "shoppingNotifications": true
  },
  // Other settings can be added here
  "notifications": { ... },
  "preferences": { ... }
}
```

## Implementation

### Load Privacy Settings

```typescript
const loadPrivacySettings = async () => {
  try {
    // Load from database
    if (user?.id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();

      if (!error && data?.settings?.privacy) {
        setPrivacySettings(data.settings.privacy);
        return;
      }
    }
    
    // Fallback to AsyncStorage if database load fails
    const storedSettings = await AsyncStorage.getItem('@privacy_settings');
    if (storedSettings) {
      setPrivacySettings(JSON.parse(storedSettings));
    }
  } catch (error) {
    console.error('Error loading privacy settings:', error);
  }
};
```

**Flow**:
1. Attempt to load from Supabase `profiles.settings.privacy`
2. If successful, update state with database values
3. If fails, fallback to AsyncStorage
4. If no data found, use default values from state initialization

### Save Privacy Settings

```typescript
const savePrivacySettings = async () => {
  setIsSavingPrivacy(true);
  try {
    // Save to database
    if (user?.id) {
      // First, get current settings to preserve other sections
      const { data: currentData } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();

      const updatedSettings = {
        ...(currentData?.settings || {}),
        privacy: privacySettings
      };

      const { error } = await supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', user.id);

      if (error) throw error;
    }
    
    // Also save to AsyncStorage as backup
    await AsyncStorage.setItem('@privacy_settings', JSON.stringify(privacySettings));
    
    showSnackbar('Privacy settings saved', 'success', 3000);
    setShowPrivacyModal(false);
  } catch (error) {
    console.error('Error saving privacy settings:', error);
    showSnackbar('Failed to save privacy settings', 'error', 4000);
  } finally {
    setIsSavingPrivacy(false);
  }
};
```

**Flow**:
1. Fetch current `settings` object from database
2. Merge privacy settings while preserving other sections
3. Update database with merged settings object
4. Save to AsyncStorage as backup
5. Show success/error notification
6. Close modal on success

## Database Schema

### Required Setup

Ensure the `profiles` table has the `settings` JSONB column:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'settings';

-- Add column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_settings 
ON profiles USING GIN (settings);
```

### Default Values

When a new user is created, initialize their settings:

```sql
-- In your user creation trigger/function
INSERT INTO profiles (id, settings)
VALUES (
  new_user_id,
  '{
    "privacy": {
      "showProfilePhoto": true,
      "showBirthday": true,
      "showEmail": false,
      "showPhone": false,
      "taskNotifications": true,
      "eventNotifications": true,
      "shoppingNotifications": true
    }
  }'::jsonb
);
```

## Data Structure

### Privacy Settings Object

```typescript
interface PrivacySettings {
  // Profile Information
  showProfilePhoto: boolean;    // Default: true
  showBirthday: boolean;         // Default: true
  showEmail: boolean;            // Default: false
  showPhone: boolean;            // Default: false
  
  // Notifications
  taskNotifications: boolean;    // Default: true
  eventNotifications: boolean;   // Default: true
  shoppingNotifications: boolean; // Default: true
}
```

### Full Settings Object

```typescript
interface UserSettings {
  privacy: PrivacySettings;
  // Future sections can be added here
  notifications?: NotificationSettings;
  preferences?: UserPreferences;
  appearance?: AppearanceSettings;
}
```

## Benefits of JSONB Storage

### 1. **Flexibility**
- Easy to add new settings without schema changes
- Can store nested objects
- Supports complex data structures

### 2. **Performance**
- GIN index enables fast queries
- Efficient storage for JSON data
- Native JSON operators in PostgreSQL

### 3. **Scalability**
- Single field for all settings
- No need for multiple columns
- Easy to add new setting categories

### 4. **Versioning**
- Can store schema version in JSON
- Easy migration between versions
- Backward compatibility support

## Querying Privacy Settings

### Get Specific Privacy Setting

```sql
-- Get user's profile photo visibility
SELECT settings->'privacy'->>'showProfilePhoto' as show_photo
FROM profiles
WHERE id = 'user_id';
```

### Filter Users by Privacy Setting

```sql
-- Find users who show their email
SELECT id, first_name, last_name, email
FROM profiles
WHERE (settings->'privacy'->>'showEmail')::boolean = true;
```

### Update Specific Privacy Setting

```sql
-- Update only the showEmail setting
UPDATE profiles
SET settings = jsonb_set(
  settings,
  '{privacy,showEmail}',
  'true'::jsonb
)
WHERE id = 'user_id';
```

### Query Multiple Settings

```sql
-- Get all privacy settings
SELECT 
  id,
  first_name,
  settings->'privacy' as privacy_settings
FROM profiles
WHERE id = 'user_id';
```

## Migration from Old Structure

If you had separate columns before:

```sql
-- Migrate from old columns to settings JSONB
UPDATE profiles
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{privacy}',
  jsonb_build_object(
    'showProfilePhoto', COALESCE(show_profile_photo, true),
    'showBirthday', COALESCE(show_birthday, true),
    'showEmail', COALESCE(show_email, false),
    'showPhone', COALESCE(show_phone, false),
    'taskNotifications', COALESCE(task_notifications, true),
    'eventNotifications', COALESCE(event_notifications, true),
    'shoppingNotifications', COALESCE(shopping_notifications, true)
  )
);

-- After migration, you can drop old columns (optional)
-- ALTER TABLE profiles DROP COLUMN show_profile_photo;
-- ALTER TABLE profiles DROP COLUMN show_birthday;
-- etc.
```

## Security Considerations

### Row Level Security (RLS)

Ensure users can only access their own settings:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Data Validation

Consider adding constraints:

```sql
-- Ensure privacy object has required fields
ALTER TABLE profiles
ADD CONSTRAINT valid_privacy_settings
CHECK (
  settings IS NULL OR
  (
    settings->'privacy' IS NULL OR
    (
      settings->'privacy' ? 'showProfilePhoto' AND
      settings->'privacy' ? 'showBirthday' AND
      settings->'privacy' ? 'showEmail' AND
      settings->'privacy' ? 'showPhone' AND
      settings->'privacy' ? 'taskNotifications' AND
      settings->'privacy' ? 'eventNotifications' AND
      settings->'privacy' ? 'shoppingNotifications'
    )
  )
);
```

## Backup Strategy

### AsyncStorage Backup

Local backup ensures settings are preserved even if database fails:

```typescript
// Saved automatically on every update
await AsyncStorage.setItem('@privacy_settings', JSON.stringify(privacySettings));

// Loaded as fallback
const storedSettings = await AsyncStorage.getItem('@privacy_settings');
```

### Database Backup

Regular Supabase backups ensure data safety:
- Point-in-time recovery available
- Daily automated backups
- Manual backup before major changes

## Performance Optimization

### Caching Strategy

```typescript
// Cache settings in memory
let cachedPrivacySettings: PrivacySettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const loadPrivacySettings = async () => {
  // Check cache first
  if (cachedPrivacySettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
    setPrivacySettings(cachedPrivacySettings);
    return;
  }
  
  // Load from database...
  const settings = await fetchFromDatabase();
  
  // Update cache
  cachedPrivacySettings = settings;
  cacheTimestamp = Date.now();
};
```

### Debouncing Updates

For frequent changes:

```typescript
let saveTimeout: NodeJS.Timeout;

const debouncedSave = (settings: PrivacySettings) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    savePrivacySettings(settings);
  }, 1000); // Wait 1 second after last change
};
```

## Testing

### Unit Tests

```typescript
describe('Privacy Settings', () => {
  it('should save settings to database', async () => {
    const mockSettings = {
      showProfilePhoto: false,
      showBirthday: true,
      // ...
    };
    
    await savePrivacySettings(mockSettings);
    
    const saved = await loadPrivacySettings();
    expect(saved).toEqual(mockSettings);
  });
  
  it('should fallback to AsyncStorage on database error', async () => {
    // Mock database failure
    mockSupabase.from.mockReturnValue({
      select: () => ({ error: 'Database error' })
    });
    
    await loadPrivacySettings();
    
    // Should load from AsyncStorage
    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('Privacy Settings Integration', () => {
  it('should persist across app restarts', async () => {
    // Save settings
    await savePrivacySettings({ showEmail: true });
    
    // Simulate app restart
    await simulateAppRestart();
    
    // Load settings
    const loaded = await loadPrivacySettings();
    expect(loaded.showEmail).toBe(true);
  });
});
```

## Monitoring

### Track Settings Changes

```sql
-- Create audit log table
CREATE TABLE settings_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  old_settings JSONB,
  new_settings JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to log changes
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.settings IS DISTINCT FROM NEW.settings THEN
    INSERT INTO settings_audit (user_id, old_settings, new_settings)
    VALUES (NEW.id, OLD.settings, NEW.settings);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_change_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_settings_change();
```

## Troubleshooting

### Common Issues

1. **Settings not saving**
   - Check user authentication
   - Verify RLS policies
   - Check network connectivity

2. **Settings not loading**
   - Check JSONB structure
   - Verify field names match
   - Check for null values

3. **Performance issues**
   - Ensure GIN index exists
   - Implement caching
   - Use debouncing for updates

## Future Enhancements

1. **Settings Sync**
   - Real-time updates across devices
   - Conflict resolution strategy
   - Optimistic updates

2. **Settings Versioning**
   - Track schema versions
   - Migration scripts
   - Backward compatibility

3. **Settings Export/Import**
   - JSON export functionality
   - Batch import for admin
   - Settings templates

## Conclusion

Storing privacy settings in the `settings` JSONB field provides:
- ✅ **Flexible storage** for evolving features
- ✅ **Efficient queries** with GIN indexing
- ✅ **Easy migration** without schema changes
- ✅ **Backup strategy** with AsyncStorage fallback
- ✅ **Scalable solution** for future settings

The implementation is production-ready and follows best practices for JSONB usage in PostgreSQL! 🎯🔒

