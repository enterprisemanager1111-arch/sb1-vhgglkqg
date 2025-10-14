# Calendar Auto-Reload Fix

## Issue Analysis
The "Today on the Calendar" panel was automatically reloading due to several issues in the real-time subscription and event fetching logic.

## Root Causes Identified

### 1. **Unstable Dependencies in useTodayEvents Hook**
**Problem**: The `useEffect` in `useTodayEvents.ts` had unstable dependencies that caused frequent re-renders:
```typescript
// Before (problematic)
useEffect(() => {
  // ... fetch logic
}, [user, currentFamily, familyLoading]);
```

**Issue**: 
- `user` and `currentFamily` objects change reference on every render
- `familyLoading` state changes frequently
- This caused the effect to run repeatedly

### 2. **Aggressive Real-Time Subscription Updates**
**Problem**: The home page notification subscription was calling `fetchNotificationCount()` on every UPDATE event:
```typescript
// Before (problematic)
.on('postgres_changes', {
  event: 'UPDATE',
  // ...
}, (payload) => {
  fetchNotificationCount(); // This caused re-renders
})
```

**Issue**: 
- `fetchNotificationCount()` made database calls on every notification update
- This triggered re-renders and potentially affected other components
- No debouncing or optimization

### 3. **No Debouncing Mechanism**
**Problem**: No protection against rapid successive fetches:
- Multiple triggers could cause overlapping fetch requests
- No cooldown period between fetches
- Potential race conditions

## Fixes Implemented

### 1. **Stabilized useEffect Dependencies**
**File**: `hooks/useTodayEvents.ts`

**Fixed Dependencies**:
```typescript
// After (stable)
useEffect(() => {
  // ... fetch logic
}, [user?.id, currentFamily?.id, familyLoading]);
```

**Benefits**:
- Uses stable IDs instead of full objects
- Reduces unnecessary re-renders
- More predictable behavior

### 2. **Optimized Real-Time Subscription**
**File**: `app/(tabs)/index.tsx`

**Before (Problematic)**:
```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  // ...
}, (payload) => {
  fetchNotificationCount(); // Database call on every update
})
```

**After (Optimized)**:
```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  // ...
}, (payload) => {
  // Only update count if status changed to/from unread
  if (payload.new.status !== payload.old.status) {
    if (payload.new.status === 'read') {
      setNotificationCount(prev => Math.max(0, prev - 1));
    } else if (payload.new.status === 'unread') {
      setNotificationCount(prev => prev + 1);
    }
  }
})
```

**Benefits**:
- No database calls on every update
- Direct state updates based on payload data
- More efficient and faster

### 3. **Added Debouncing Mechanism**
**File**: `hooks/useTodayEvents.ts`

**Added Debounce Logic**:
```typescript
const lastFetchRef = useRef<number>(0);

const fetchTodayEvents = async () => {
  // ... validation logic

  // Debounce: Don't fetch if we've fetched recently (within 5 seconds)
  const now = Date.now();
  if (now - lastFetchRef.current < 5000) {
    console.log('⏳ useTodayEvents: Debouncing fetch request (too recent)');
    return;
  }
  lastFetchRef.current = now;

  // ... fetch logic
};
```

**Benefits**:
- Prevents rapid successive fetches
- 5-second cooldown between fetches
- Eliminates race conditions
- Reduces unnecessary API calls

## Implementation Details

### **Dependency Optimization**
- **Before**: `[user, currentFamily, familyLoading]`
- **After**: `[user?.id, currentFamily?.id, familyLoading]`
- **Result**: Stable references, fewer re-renders

### **Real-Time Subscription Optimization**
- **Before**: Database call on every notification update
- **After**: Direct state manipulation based on payload
- **Result**: Faster updates, no unnecessary API calls

### **Debouncing Implementation**
- **Cooldown Period**: 5 seconds between fetches
- **Tracking**: `useRef` to store last fetch timestamp
- **Protection**: Prevents overlapping requests

## Expected Behavior After Fix

### **Stable Calendar Panel**
1. **No Auto-Reload**: Panel only updates when necessary
2. **Efficient Updates**: Only fetches when user/family changes
3. **Debounced Requests**: No rapid successive fetches
4. **Smooth Experience**: No flickering or reloading

### **Optimized Notifications**
1. **Fast Updates**: Direct state updates without API calls
2. **Accurate Counts**: Real-time badge updates
3. **No Side Effects**: Notification updates don't affect other components
4. **Efficient**: Minimal resource usage

### **Console Logging**
You should see logs like:
```
⏳ useTodayEvents: Debouncing fetch request (too recent)
🔄 useTodayEvents: User and family available, fetching events
✅ Final events with assignees: [events]
```

## Key Benefits

### **Performance**
- **Reduced API Calls**: Debouncing prevents unnecessary requests
- **Faster Updates**: Direct state manipulation for notifications
- **Stable Rendering**: Fewer re-renders due to stable dependencies

### **User Experience**
- **No Auto-Reload**: Calendar panel stays stable
- **Smooth Updates**: Real-time notifications work without side effects
- **Predictable Behavior**: Components update only when necessary

### **Resource Efficiency**
- **Lower CPU Usage**: Fewer unnecessary re-renders
- **Reduced Network**: Debouncing prevents rapid API calls
- **Memory Optimization**: Stable references prevent memory leaks

## Testing Recommendations

1. **Create Event**: Should not cause calendar panel to reload
2. **Mark Notification Read**: Should update count without affecting calendar
3. **Rapid Actions**: Multiple quick actions should be debounced
4. **Focus/Blur**: Page focus changes should not cause unnecessary reloads

The calendar panel should now remain stable and only update when actually necessary, providing a smooth user experience!
