# API Timeout Issue Fix

## Problem Description
The application was experiencing API call failures after a few seconds of inactivity. This was caused by multiple competing timeout mechanisms and aggressive session management.

## Root Causes Identified

### 1. **Aggressive Timeout Settings**
- Session retrieval: 2-3 seconds (too short)
- API calls: 2-5 seconds (too short)
- Database operations: 2-3 seconds (too short)

### 2. **Frequent Background Health Checks**
- Session health check every 60 seconds
- Real-time heartbeat every 30 seconds
- Cleanup intervals every hour

### 3. **Minimal Supabase Configuration**
- Missing proper storage configuration
- No retry mechanisms
- Inadequate error handling

## Solutions Implemented

### 1. **Enhanced Supabase Configuration** (`lib/supabase.ts`)
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: AsyncStorage,
    flowType: 'pkce',
    debug: __DEV__,
  },
  global: {
    headers: {
      'X-Client-Info': 'famora-mobile',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});
```

### 2. **Increased Timeout Values**
- Session retrieval: 2-3 seconds → **10 seconds**
- Profile API calls: 5 seconds → **15 seconds**
- Family operations: 3-5 seconds → **10-15 seconds**
- General API calls: 2-5 seconds → **10-15 seconds**

### 3. **Optimized Background Processes**
- Session health check: 60 seconds → **5 minutes**
- Real-time heartbeat: 30 seconds → **2 minutes**
- Cleanup intervals: 1 hour → **2 hours**

### 4. **Added Retry Mechanisms** (`utils/apiRetry.ts`)
- Created comprehensive retry utility with exponential backoff
- Added intelligent error detection (non-retryable errors)
- Implemented timeout handling
- Applied to critical API calls

### 5. **Updated Critical Files**
- `contexts/AuthContext.tsx`: Enhanced profile loading with retries
- `hooks/useFamilyTasks.ts`: Added retry logic to task creation
- `contexts/FamilyContext.tsx`: Increased timeout values
- `app/(onboarding)/newFamily/workProfileEmpty.tsx`: Extended timeouts

## Expected Results

### ✅ **Improved Reliability**
- API calls will have more time to complete
- Automatic retry on transient failures
- Better error handling and recovery

### ✅ **Reduced Background Load**
- Less frequent health checks
- Optimized real-time connections
- Reduced battery usage

### ✅ **Better User Experience**
- Fewer "session expired" errors
- More stable API operations
- Graceful handling of network issues

## Testing Recommendations

1. **Test API calls after inactivity periods** (5+ minutes)
2. **Verify session persistence** across app backgrounding
3. **Check retry behavior** with poor network conditions
4. **Monitor console logs** for timeout and retry messages

## Monitoring

Watch for these console messages:
- `🔄 Retry attempt X/Y` - Retry mechanism working
- `✅ Session refreshed successfully` - Session management working
- `⚠️ Session health check failed` - May indicate network issues

## Files Modified

1. `lib/supabase.ts` - Enhanced Supabase configuration
2. `utils/apiRetry.ts` - New retry utility (created)
3. `contexts/AuthContext.tsx` - Profile loading with retries
4. `hooks/useFamilyTasks.ts` - Task creation with retries
5. `contexts/FamilyContext.tsx` - Increased timeouts
6. `hooks/useAuthRecovery.ts` - Reduced health check frequency
7. `hooks/useRealTimeFamily.ts` - Optimized heartbeat
8. `hooks/useFamilyShoppingItems.ts` - Reduced cleanup frequency
9. `app/(onboarding)/newFamily/workProfileEmpty.tsx` - Extended timeouts

The changes should resolve the API timeout issues while maintaining application performance and user experience.







