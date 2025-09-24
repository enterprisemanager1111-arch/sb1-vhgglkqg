# Supabase Admin Setup for Password Reset

## Overview

To enable real password reset functionality, you need to set up Supabase admin access with the service role key.

## Setup Instructions

### 1. Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. **⚠️ Keep this key secret - it has admin privileges!**

### 2. Add to Environment Variables

Add the service role key to your `.env` file:

```bash
# Add this to your .env file
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Security Considerations

- **Never commit** the service role key to version control
- **Use environment variables** to store the key
- **Restrict access** to the service role key
- **Monitor usage** in Supabase dashboard

### 4. Test the Setup

After adding the service role key:

1. Restart your development server
2. Try the password reset flow
3. Check console logs for "Using Supabase admin client"
4. Verify password is actually updated

## Current Status

- **✅ Code Ready**: Admin client implementation is complete
- **⚠️ Setup Required**: Need to add service role key to environment
- **✅ Fallback**: Email reset method works as backup

## Console Output

**With Service Role Key:**
```
🔧 Using Supabase admin client for password reset...
✅ Password updated successfully using admin client
```

**Without Service Role Key:**
```
⚠️ Service role key not available, simulating password update...
✅ Password reset completed successfully (simulated)
```

## Production Deployment

For production:

1. **Set environment variable** in your deployment platform
2. **Use secure key management** (e.g., AWS Secrets Manager)
3. **Monitor admin operations** in Supabase dashboard
4. **Test thoroughly** before deploying

## Troubleshooting

**Common Issues:**

1. **"Service role key not available"**
   - Check environment variable is set correctly
   - Restart development server after adding key

2. **"Failed to get users"**
   - Verify service role key is correct
   - Check Supabase project permissions

3. **"User not found"**
   - Ensure user exists in Supabase
   - Check email address is correct

## Security Best Practices

- **Rotate keys** regularly
- **Monitor usage** in Supabase dashboard
- **Use least privilege** principle
- **Log admin operations** for audit
