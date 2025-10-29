# Dark Mode Implementation Guide

## ✅ Completed Components

### 1. **Core Infrastructure**
- ✅ `contexts/DarkModeContext.tsx` - Global dark mode state management
- ✅ `constants/theme.ts` - Shared theme colors and utilities
- ✅ `utils/styleHelpers.ts` - Helper functions for themed styles
- ✅ `app/_layout.tsx` - DarkModeProvider added to app providers

### 2. **Completed Pages**
- ✅ `app/(tabs)/profile.tsx` - Full dark mode support
- ✅ `app/(tabs)/index.tsx` (Home) - Basic dark mode support  
- ✅ `app/(tabs)/tasks.tsx` - Basic dark mode support
- ✅ `app/notifications.tsx` - Full dark mode support (from previous task)

### 3. **Partially Completed**
- 🔄 `app/(tabs)/calendar.tsx` - Imports added, needs styles update

## 📋 Remaining Work

### Tab Pages
- ⏳ `app/(tabs)/calendar.tsx` - Finish styles implementation
- ⏳ `app/(tabs)/flames.tsx`
- ⏳ `app/(tabs)/family.tsx`
- ⏳ `app/(tabs)/shopList.tsx` (Already has translations from previous task)

### Navigation
- ⏳ `app/(tabs)/_layout.tsx` - Bottom tab bar

### Modals
- ⏳ `components/TaskCreationModal.tsx`
- ⏳ `components/EventCreationModal.tsx`
- ⏳ `components/ShoppingItemCreationModal.tsx`
- ⏳ `components/FeaturesToCreateModal.tsx`

### Other Pages
- ⏳ `app/myProfile.tsx`
- ⏳ `app/family.tsx` (standalone)

### Shared Components
- ⏳ `components/CustomAlert.tsx`
- ⏳ `components/Snackbar.tsx`
- ⏳ `components/NotificationCenter.tsx`
- ⏳ `components/EmptyState.tsx`

## 🎨 Theme Colors Reference

```typescript
// Light Theme
{
  background: '#f1f3f8',       // Main background
  backgroundAlt: '#FFFFFF',    // Alternative background
  surface: '#FFFFFF',          // Cards, modals
  surfaceSecondary: '#FEFEFE', // Secondary surfaces
  text: '#2d2d2d',            // Primary text
  textSecondary: '#666666',    // Secondary text
  textTertiary: '#466759',     // Tertiary text
  border: '#EAECF0',          // Borders
  borderLight: '#F0F0F0',      // Light borders
  input: '#F3F3F5',           // Input backgrounds
  inputBorder: '#E0E0E0',      // Input borders
  shadow: '#2d2d2d',          // Shadow color
  card: '#FFFFFF',            // Card background
  placeholder: '#999999',      // Placeholder text
}

// Dark Theme
{
  background: '#1a1a1a',       // Main background
  backgroundAlt: '#0f0f0f',    // Alternative background
  surface: '#2d2d2d',          // Cards, modals
  surfaceSecondary: '#353535', // Secondary surfaces
  text: '#ffffff',            // Primary text
  textSecondary: '#b0b0b0',    // Secondary text
  textTertiary: '#8a9a8f',     // Tertiary text
  border: '#404040',          // Borders
  borderLight: '#505050',      // Light borders
  input: '#353535',           // Input backgrounds
  inputBorder: '#505050',      // Input borders
  shadow: '#000000',          // Shadow color
  card: '#2d2d2d',            // Card background
  placeholder: '#707070',      // Placeholder text
}

// Brand colors (don't change with theme)
{
  primary: '#17F196',
  primaryDark: '#12c777',
  secondary: '#6366F1',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
}
```

## 🔧 Implementation Pattern

### Step 1: Add Imports
```typescript
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
```

### Step 2: Use Hook in Component
```typescript
export default function YourComponent() {
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  // ... rest of component
}
```

### Step 3: Convert Styles to Function
```typescript
// Before:
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
});

// After:
const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
  },
});
```

### Step 4: Initialize Styles Before Return
```typescript
// Before the return statement:
const styles = createStyles(theme);

return (
  <SafeAreaView style={styles.container}>
    <StatusBar 
      barStyle={isDarkMode ? "light-content" : "dark-content"} 
      backgroundColor={theme.surface} 
    />
    {/* ... */}
  </SafeAreaView>
);
```

### Step 5: Update Color Values
Replace hardcoded colors with theme properties:
- `backgroundColor: '#FFFFFF'` → `backgroundColor: theme.surface`
- `backgroundColor: '#f1f3f8'` → `backgroundColor: theme.background`
- `color: '#2d2d2d'` → `color: theme.text`
- `color: '#666666'` → `color: theme.textSecondary`
- `borderColor: '#EAECF0'` → `borderColor: theme.border`
- `backgroundColor: '#F3F3F5'` → `backgroundColor: theme.input`
- `shadowColor: '#2d2d2d'` → `shadowColor: theme.shadow`

### Step 6: Update TextInput Components
```typescript
<TextInput
  style={styles.input}
  placeholderTextColor={theme.placeholder}
  // ... other props
/>
```

## 🎯 Priority Order

### High Priority (User-facing)
1. **Tab Navigation Bar** - Users see this everywhere
2. **Creation Modals** - Frequently used features
3. **shopList.tsx** - Already has translations, easy to complete
4. **calendar.tsx** - Finish what's started
5. **flames.tsx** - Core feature
6. **family.tsx** - Core feature

### Medium Priority
1. **myProfile.tsx** - Less frequently accessed
2. **Shared Components** - Used across app

### Low Priority  
1. **Design System Components** - Can be done last

## 📝 Testing Checklist

For each completed page/component:
- [ ] Background color changes (light → dark)
- [ ] Surface/card colors change
- [ ] Text is readable (light → white)
- [ ] Borders are visible
- [ ] Inputs have proper background and text color
- [ ] StatusBar adapts (dark-content → light-content)
- [ ] Shadows are appropriate
- [ ] No hardcoded white/black colors remain (except brand colors)
- [ ] Placeholder text is visible
- [ ] Modals have proper background

## 🚀 Quick Commands

```bash
# Check for linting errors
# After each file update

# Test on device
# Toggle dark mode in Profile → Personalization → Dark Mode
```

## 💡 Tips

1. **Don't change brand colors** - `#17F196` (primary green) stays the same
2. **Keep gradients** - Gradient colors usually stay the same
3. **Avatar backgrounds** - Can keep colorful backgrounds like `#FFB6C1`
4. **Focus on big surfaces** - Background, cards, modals matter most
5. **Text hierarchy** - Use `text`, `textSecondary`, `textTertiary` appropriately
6. **Test as you go** - Check each page after updating

## 🐛 Common Issues

### Issue: Styles not updating
**Solution**: Make sure `const styles = createStyles(theme);` is INSIDE the component function, before the return statement.

### Issue: White flash on navigation
**Solution**: Ensure StatusBar background color uses `theme.surface`

### Issue: Text not visible
**Solution**: Make sure text color uses `theme.text` not hardcoded values

### Issue: Inputs hard to see
**Solution**: Use `theme.input` for background and `theme.inputBorder` for border

## 📚 Reference Files

**Best Examples to Follow:**
- `app/(tabs)/profile.tsx` - Most complete implementation
- `app/notifications.tsx` - Clean implementation
- `app/(tabs)/tasks.tsx` - Simple implementation

**Theme Utilities:**
- `constants/theme.ts` - All colors defined here
- `contexts/DarkModeContext.tsx` - State management
- `utils/styleHelpers.ts` - Helper functions (optional)

## ✨ Result

When complete, dark mode will work across:
- ✅ All tab pages
- ✅ All modals
- ✅ All standalone pages
- ✅ Navigation bar
- ✅ Shared components

Users can toggle dark mode in: **Profile → Personalization → Dark Mode**

The setting persists across app restarts via AsyncStorage.

