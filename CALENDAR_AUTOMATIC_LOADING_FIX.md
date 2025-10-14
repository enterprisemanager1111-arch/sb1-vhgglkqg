# Calendar Automatic Loading Fix

## Issue Analysis

**Problem**: The calendar was automatically loading events after a few minutes, even when no user interaction occurred.

**Root Cause**: The `useCalendarEvents` hook was being triggered by:
1. **Token Refresh**: Supabase automatically refreshes tokens, causing `user` object to change
2. **Date Array Recreation**: `selectedDates` array was being recreated on every render, triggering useEffect
3. **Real-time Subscriptions**: Family context has real-time subscriptions that might trigger re-fetches

## Console Log Analysis

From the logs, the automatic loading was happening because:
- `TOKEN_REFRESHED` events from Supabase auth
- `selectedDates` array being recreated with new Date objects
- useEffect dependencies changing unnecessarily

## Fixes Applied

### 1. **Stable Date Dependencies**
**File**: `hooks/useCalendarEvents.ts`

**Before**: Direct dependency on `selectedDates` array
```typescript
}, [user, currentFamily, familyLoading, selectedDates]);
```

**After**: Stable string representation
```typescript
// Create a stable string representation of selectedDates to prevent unnecessary re-fetches
const selectedDatesString = useMemo(() => {
  return selectedDates.map(date => date.toISOString().split('T')[0]).join(',');
}, [selectedDates]);

}, [user, currentFamily, familyLoading, selectedDatesString]);
```

### 2. **Meaningful Change Detection**
**File**: `hooks/useCalendarEvents.ts`

**Added Change Tracking**:
```typescript
// Track previous values to prevent unnecessary re-fetches
const prevUserRef = useRef(user?.id);
const prevFamilyRef = useRef(currentFamily?.id);
const prevDatesRef = useRef(selectedDatesString);

// Check if this is a meaningful change (not just token refresh)
const userChanged = prevUserRef.current !== user.id;
const familyChanged = prevFamilyRef.current !== currentFamily.id;
const datesChanged = prevDatesRef.current !== selectedDatesString;

if (userChanged || familyChanged || datesChanged) {
  console.log('🔄 useCalendarEvents: Meaningful change detected, fetching events');
  fetchEventsForDates(selectedDates);
  
  // Update refs
  prevUserRef.current = user.id;
  prevFamilyRef.current = currentFamily.id;
  prevDatesRef.current = selectedDatesString;
} else {
  console.log('⏹️ useCalendarEvents: No meaningful change detected, skipping fetch');
}
```

## Key Improvements

### ✅ **Prevents Token Refresh Triggers**
- Only fetches when user ID actually changes, not just token refresh
- Tracks previous user ID to detect meaningful changes
- Skips fetch when only token is refreshed

### ✅ **Stable Date Dependencies**
- Uses string representation instead of Date array references
- Prevents re-fetches when same dates are recreated
- More efficient dependency comparison

### ✅ **Smart Change Detection**
- Tracks previous values for user, family, and dates
- Only fetches when meaningful changes occur
- Prevents unnecessary API calls

### ✅ **Better Logging**
- Clear logging of what changes triggered the fetch
- Easy to debug automatic loading issues
- Shows when fetches are skipped

## Expected Behavior

After this fix:

1. **No More Automatic Loading**: Calendar won't automatically load events after a few minutes
2. **Token Refresh Ignored**: Token refreshes won't trigger event re-fetching
3. **Stable Dependencies**: Date array recreation won't cause unnecessary fetches
4. **Smart Fetching**: Only fetches when user, family, or dates actually change

## Console Log Flow

You should now see logs like:
```
🔄 useCalendarEvents: useEffect triggered { userChanged: false, familyChanged: false, datesChanged: false }
⏹️ useCalendarEvents: No meaningful change detected, skipping fetch
```

**Instead of automatic loading**:
- ❌ Automatic fetches every few minutes
- ❌ Token refresh triggering re-fetches
- ❌ Date array recreation causing fetches

## Root Causes Addressed

### 1. **Token Refresh Issue**
- **Problem**: `TOKEN_REFRESHED` events caused `user` object to change
- **Solution**: Track user ID changes, ignore token-only changes

### 2. **Date Array Recreation**
- **Problem**: `selectedDates` array recreated on every render
- **Solution**: Use stable string representation for comparison

### 3. **Real-time Subscriptions**
- **Problem**: Family context subscriptions might trigger changes
- **Solution**: Only respond to meaningful family ID changes

## Performance Benefits

- **Reduced API Calls**: No unnecessary event fetching
- **Better User Experience**: No unexpected loading states
- **Efficient Dependencies**: Stable dependency comparison
- **Smart Caching**: Events are cached until meaningful changes occur

The calendar should now only load events when the user actually changes dates or when there are meaningful changes to the user/family context!
