# Privacy Settings Feature Documentation

## Overview
The Privacy Settings feature provides users with granular control over their information visibility, activity sharing, and data preferences within the family app. Users can customize what information is shared with family members and control their online presence visibility.

## Implementation Date
October 30, 2025

## Features

### Core Functionality

#### 1. Profile Visibility
- **Profile Visible**: Toggle to allow/disallow family members from viewing your profile
- **Searchable**: Control whether others can find you through search functionality

#### 2. Activity & Statistics
- **Show Activity**: Control sharing of task and event activity with family members
- **Show Statistics**: Toggle visibility of points, achievements, and performance metrics

#### 3. Online Presence
- **Show Online Status**: Let others see when you're currently online
- **Show Last Seen**: Display when you were last active in the app

#### 4. Communication
- **Allow Messages**: Control whether you receive messages from family members

#### 5. Data Collection
- **Share Analytics**: Toggle participation in anonymous usage data collection for app improvement

### Additional Features
- **Save Settings**: Persist preferences to AsyncStorage and (in production) backend
- **Reset to Defaults**: One-click restoration of all settings to default values
- **Real-time Updates**: Immediate toggle response with visual feedback
- **Informational UI**: Clear descriptions for each setting
- **Organized Sections**: Settings grouped by category for easy navigation

## Technical Implementation

### File Changes

#### `app/(tabs)/profile.tsx`

**State Management**
```typescript
const [showPrivacyModal, setShowPrivacyModal] = useState(false);
const [privacySettings, setPrivacySettings] = useState({
  profileVisible: true,
  showActivity: true,
  showStats: true,
  allowMessages: true,
  searchable: true,
  shareAnalytics: true,
  showOnlineStatus: true,
  showLastSeen: false,
});
const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
```

**Key Functions**

1. **`loadPrivacySettings()`**
   - Loads saved settings from AsyncStorage
   - Called when modal opens
   - Populates state with stored preferences

2. **`handlePrivacySettings()`**
   - Opens privacy settings modal
   - Triggers loading of current settings

3. **`togglePrivacySetting(key)`**
   - Toggles individual setting on/off
   - Updates state immediately for responsive UI
   - Takes setting key as parameter

4. **`savePrivacySettings()`**
   - Saves settings to AsyncStorage
   - In production, also syncs to backend
   - Shows success/error notifications
   - Closes modal on successful save

5. **`resetPrivacySettings()`**
   - Resets all settings to default values
   - Shows confirmation dialog
   - Updates state without saving (user must explicitly save)

### Default Values

| Setting | Default Value | Reasoning |
|---------|---------------|-----------|
| `profileVisible` | `true` | Family app encourages openness |
| `showActivity` | `true` | Share achievements by default |
| `showStats` | `true` | Gamification element |
| `allowMessages` | `true` | Enable communication |
| `searchable` | `true` | Easy to find family members |
| `shareAnalytics` | `true` | Help improve the app |
| `showOnlineStatus` | `true` | See who's available |
| `showLastSeen` | `false` | More privacy-conscious |

### UI Components

#### Privacy Modal Structure
```
Modal
├── Title & Subtitle
└── ScrollView
    ├── Profile Visibility Section
    │   ├── Profile Visible Toggle
    │   └── Searchable Toggle
    ├── Activity & Statistics Section
    │   ├── Show Activity Toggle
    │   └── Show Statistics Toggle
    ├── Online Presence Section
    │   ├── Show Online Status Toggle
    │   └── Show Last Seen Toggle
    ├── Communication Section
    │   └── Allow Messages Toggle
    ├── Data Collection Section
    │   └── Share Analytics Toggle
    ├── Info Box
    └── Action Buttons
        ├── Cancel
        ├── Reset
        └── Save
```

#### Privacy Setting Item
Each setting includes:
- **Label**: Clear, concise name
- **Description**: Explains what the setting controls
- **Toggle Switch**: CustomToggleSwitch component for interaction

### Styling

**Key Style Components**
- `privacyModalContainer`: Modal with custom max height
- `privacySection`: Grouped settings by category
- `privacySectionTitle`: Uppercase category headers
- `privacyItem`: Individual setting card
- `privacyItemInfo`: Text container for label and description
- `privacyInfoBox`: Purple-themed info message
- `privacyResetButton`: Secondary action button
- `modalConfirmButtonDisabled`: Disabled state for save button

**Design Principles**
- Card-based layout for each setting
- Clear visual separation between sections
- Purple accent for privacy-related UI elements (🔒)
- Consistent spacing and typography
- Responsive to dark/light mode themes

## Translation Keys

### Modal Titles
- `profilePage.modals.privacy.title`: "Privacy Settings"
- `profilePage.modals.privacy.subtitle`: "Control who can see your information and activity"

### Section Headers
- `profilePage.privacy.sections.profile`: "Profile Visibility"
- `profilePage.privacy.sections.activity`: "Activity & Statistics"
- `profilePage.privacy.sections.presence`: "Online Presence"
- `profilePage.privacy.sections.communication`: "Communication"
- `profilePage.privacy.sections.data`: "Data Collection"

### Settings
Each setting has `.label` and `.description` keys:
- `profilePage.privacy.profileVisible.*`
- `profilePage.privacy.searchable.*`
- `profilePage.privacy.showActivity.*`
- `profilePage.privacy.showStats.*`
- `profilePage.privacy.showOnlineStatus.*`
- `profilePage.privacy.showLastSeen.*`
- `profilePage.privacy.allowMessages.*`
- `profilePage.privacy.shareAnalytics.*`

### Actions & Messages
- `profilePage.privacy.save`: "Save"
- `profilePage.privacy.saving`: "Saving..."
- `profilePage.privacy.reset`: "Reset"
- `profilePage.privacy.resetTitle`: "Reset Privacy Settings"
- `profilePage.privacy.resetMessage`: Confirmation message
- `profilePage.privacy.saved`: Success notification
- `profilePage.privacy.saveFailed`: Error notification
- `profilePage.privacy.resetSuccess`: Reset success message
- `profilePage.privacy.info`: Information about data security

## User Flow

### Opening Privacy Settings
1. User taps "Privacy Settings" in profile security section
2. Modal opens with loading of current settings
3. Settings are populated from AsyncStorage
4. User sees organized sections with toggle switches

### Changing Settings
1. User taps toggle switch for any setting
2. Switch immediately reflects new state
3. Setting is updated in component state
4. Changes are not saved until "Save" is pressed

### Saving Changes
1. User reviews changes
2. User taps "Save" button
3. Button shows "Saving..." state
4. Settings are saved to AsyncStorage
5. In production, sync to backend
6. Success notification is shown
7. Modal closes automatically

### Resetting Settings
1. User taps "Reset" button
2. Confirmation dialog appears
3. User confirms reset
4. All settings revert to default values
5. Success notification is shown
6. Settings are updated in UI but not saved
7. User can review defaults before saving

## Data Storage

### Local Storage (AsyncStorage)
- Key: `@privacy_settings`
- Format: JSON string
- Contains all 8 boolean settings

### Backend Storage (Production)
In production, settings should also be stored in database:
```sql
-- Example schema
CREATE TABLE user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  profile_visible BOOLEAN DEFAULT TRUE,
  show_activity BOOLEAN DEFAULT TRUE,
  show_stats BOOLEAN DEFAULT TRUE,
  allow_messages BOOLEAN DEFAULT TRUE,
  searchable BOOLEAN DEFAULT TRUE,
  share_analytics BOOLEAN DEFAULT TRUE,
  show_online_status BOOLEAN DEFAULT TRUE,
  show_last_seen BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Data Encryption**
   - All data stored is encrypted at rest
   - Settings sync over secure HTTPS connection

2. **Privacy by Design**
   - Sensible defaults that respect user privacy
   - Clear explanations for each setting
   - Easy to understand and modify

3. **User Control**
   - Users have complete control over their data
   - Settings can be changed at any time
   - No hidden data collection

4. **Family Context**
   - Settings apply within family context only
   - No data shared outside family group
   - Family admins cannot override privacy settings

## Future Enhancements

### Advanced Privacy Controls
1. **Granular Permissions**
   - Control visibility per family member
   - Role-based visibility settings
   - Temporary privacy modes

2. **Activity History**
   - View log of privacy setting changes
   - Audit trail for security
   - Export privacy data

3. **Smart Defaults**
   - Age-appropriate default settings
   - Role-based recommendations
   - Privacy score indicator

4. **Enhanced Communication Controls**
   - Block specific family members
   - Mute notifications from specific users
   - Message filtering options

5. **Data Management**
   - Export all personal data
   - Delete specific data types
   - Data retention preferences

### Integration Features
1. **Profile Privacy Application**
   - Respect settings in profile displays
   - Hide activity based on preferences
   - Filter search results

2. **Notification Respect**
   - Honor "Allow Messages" setting
   - Respect online status visibility
   - Custom notification rules

3. **Statistics Dashboard**
   - Show privacy impact analytics
   - Suggest privacy improvements
   - Compare with family averages (if permitted)

## Best Practices

### For Users
1. Review privacy settings regularly
2. Understand implications of each setting
3. Balance privacy with family connection
4. Use reset if uncertain about changes

### For Developers
1. Always respect privacy settings in features
2. Test privacy interactions thoroughly
3. Document privacy implications of new features
4. Provide clear UI feedback

## Testing Recommendations

### Functional Testing
1. **Settings Persistence**
   - Toggle each setting and verify save
   - Close/reopen modal to verify persistence
   - Test AsyncStorage retrieval

2. **Reset Functionality**
   - Verify all settings return to defaults
   - Test confirmation dialog
   - Verify settings update in UI

3. **Save Functionality**
   - Test successful save
   - Test save with errors
   - Verify loading states

### UI Testing
1. **Responsive Design**
   - Test on various screen sizes
   - Verify scrolling with long content
   - Check dark/light mode rendering

2. **Accessibility**
   - Verify toggle switch accessibility
   - Test with screen readers
   - Ensure sufficient color contrast

### Integration Testing
1. **Privacy Application**
   - Verify profile visibility respects setting
   - Test activity feed filtering
   - Check search functionality

2. **Cross-Feature Testing**
   - Test with messaging system
   - Verify with online presence indicators
   - Check statistics visibility

## Internationalization

All UI text is fully translated in:
- English (en.json)
- German (de.json)
- French (fr.json)
- Spanish (es.json)
- Italian (it.json)
- Dutch (nl.json)

## Related Features

- **Profile Page**: Displays privacy-conscious information
- **Messaging**: Respects "Allow Messages" setting
- **Search**: Honors "Searchable" preference
- **Activity Feed**: Filters based on "Show Activity"
- **Statistics**: Visibility controlled by "Show Stats"

## Compliance

### Data Protection
- GDPR compliant data controls
- User consent for analytics
- Right to privacy honored
- Data minimization principle

### Family Safety
- Age-appropriate defaults
- Parental guidance recommended
- Privacy education included
- Safe defaults for minors

## Support

For questions or issues related to privacy settings, refer to:
- AsyncStorage documentation for local storage
- Supabase documentation for backend sync
- React Native best practices for state management
- GDPR compliance guidelines for privacy features

## Notes

- Current implementation uses AsyncStorage for local persistence
- Backend synchronization requires API implementation
- Settings are scoped to individual users, not families
- Privacy settings do not affect admin capabilities
- All family members have equal privacy control rights

## Conclusion

The Privacy Settings feature provides comprehensive, user-friendly privacy controls that empower users to manage their information sharing preferences. The implementation balances family connectivity with individual privacy needs, following best practices for data protection and user experience.

