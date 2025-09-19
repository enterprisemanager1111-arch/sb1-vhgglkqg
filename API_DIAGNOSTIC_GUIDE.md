# API Connection Diagnostic Guide

## Problem
API calls are failing during sign in and sign up, preventing authentication from working.

## Root Causes Identified

### 1. Network Configuration Issues
- React Native/Expo may have network connectivity problems
- Supabase client configuration may need optimization
- Environment variables might not be properly loaded

### 2. Supabase Configuration Issues
- Missing or incorrect API keys
- Database schema problems
- Network timeout issues

## Solutions Applied

### 1. Enhanced Supabase Client Configuration
Updated `lib/supabase.ts` with:
- Better fetch configuration with timeout handling
- Debug mode for development
- Improved error handling
- Network timeout configuration (30 seconds)

### 2. Improved Authentication Functions
Enhanced `contexts/AuthContext.tsx` with:
- Connection testing before authentication attempts
- Detailed logging for debugging
- Better error messages
- Network connectivity checks

### 3. Diagnostic Tools
Created test scripts to help identify issues:
- `test-api-connection.js` - Tests basic API connectivity
- Enhanced error messages in the console

## How to Diagnose and Fix

### Step 1: Check Environment Variables
```bash
# Check if .env file exists and has correct values
Get-Content .env
```

Your `.env` file should contain:
```env
EXPO_PUBLIC_SUPABASE_URL=https://eqaxmxbqqiuiwkhjwvvz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_full_anon_key_here
```

### Step 2: Test API Connection
```bash
# Run the diagnostic script
node test-api-connection.js
```

### Step 3: Check Console Logs
When you try to sign in/sign up, check the console for these messages:
- `🚀 SignUp called with:` - Shows the function is being called
- `🌐 Attempting to connect to Supabase...` - Shows connection attempt
- `📡 Supabase URL:` - Shows the URL being used
- `✅ Connection test passed` - Shows successful connection
- `❌ Network connection test failed` - Shows connection failure

### Step 4: Common Issues and Solutions

#### Issue: "fetch failed" or "Network error"
**Solutions:**
1. **Check Internet Connection**: Ensure you have a stable internet connection
2. **Check Supabase Project Status**: Verify your Supabase project is active
3. **Check Firewall/Proxy**: Corporate networks may block API calls
4. **Try Different Network**: Test on a different network (mobile hotspot)

#### Issue: "Missing Supabase environment variables"
**Solutions:**
1. **Verify .env file**: Make sure it's in the project root
2. **Check file format**: No spaces around `=` sign
3. **Restart development server**: `npx expo start --clear`

#### Issue: "Connection timeout"
**Solutions:**
1. **Check Supabase URL**: Verify the URL is correct
2. **Check API Key**: Verify the anon key is complete
3. **Check Network Speed**: Slow connections may timeout

#### Issue: "Database schema is outdated"
**Solutions:**
1. **Run Database Migrations**: Apply the schema updates
2. **Check Supabase Dashboard**: Verify tables exist

### Step 5: Advanced Troubleshooting

#### Test Supabase Project Directly
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run a simple query: `SELECT 1;`
4. If this fails, there's a project-level issue

#### Check Network Configuration
```bash
# Test basic connectivity
ping supabase.co

# Test specific endpoint
curl -I https://eqaxmxbqqiuiwkhjwvvz.supabase.co
```

#### Check Expo/React Native Network
1. **Clear Expo Cache**: `npx expo start --clear`
2. **Reset Metro Cache**: `npx expo start --clear --reset-cache`
3. **Check Expo Go App**: If using Expo Go, ensure it's updated

### Step 6: Environment-Specific Issues

#### Development Environment
- **Expo Go**: May have network restrictions
- **Simulator/Emulator**: Network settings may differ
- **Physical Device**: Check device network settings

#### Production Environment
- **Build Configuration**: Ensure environment variables are included
- **Network Policies**: Check if production network allows API calls

## Expected Behavior After Fix

### Successful Connection
You should see these console messages:
```
🚀 SignUp called with: { email: "test@example.com", fullName: "Test User" }
🌐 Attempting to connect to Supabase...
📡 Supabase URL: https://eqaxmxbqqiuiwkhjwvvz.supabase.co
✅ Connection test passed, proceeding with signup...
✅ SignIn successful!
```

### Error Messages
If there are still issues, you'll see specific error messages:
- **Network Issues**: "Unable to connect to the server. Please check your internet connection and try again."
- **Timeout Issues**: "Signup is taking too long. Please check your internet connection and try again."
- **Database Issues**: "Database schema is outdated. Please contact support or try again later."

## Next Steps

1. **Apply the fixes** by restarting your development server
2. **Test the connection** using the diagnostic tools
3. **Check console logs** for detailed error information
4. **Try authentication** and monitor the console output
5. **Report specific error messages** if issues persist

The enhanced error handling and logging will help identify the exact cause of any remaining API connection issues.
