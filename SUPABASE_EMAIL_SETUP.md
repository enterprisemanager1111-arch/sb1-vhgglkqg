# Supabase Email Service Setup Guide

## Overview

This guide shows how to configure Supabase to send verification codes via email using Supabase's email service.

## Method 1: Supabase Edge Function (Recommended)

### Step 1: Create Supabase Edge Function

Create a new Edge Function in your Supabase project:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Create new function
supabase functions new send-verification-email
```

### Step 2: Function Code

Create `supabase/functions/send-verification-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, verification_code, user_name } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Send email using Supabase's email service
    const { data, error } = await supabaseClient.auth.admin.sendEmail({
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Verification</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Hello ${user_name || 'User'},
            </p>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              You requested a password reset for your account. Use the verification code below to continue:
            </p>
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="font-size: 36px; margin: 0; letter-spacing: 5px;">${verification_code}</h1>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Verification
        
        Hello ${user_name || 'User'},
        
        You requested a password reset for your account. Use the verification code below to continue:
        
        ${verification_code}
        
        This code will expire in 10 minutes.
        
        If you did not request a password reset, please ignore this email.
      `
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 3: Deploy Function

```bash
# Deploy the function
supabase functions deploy send-verification-email
```

## Method 2: Custom Email Templates

### Step 1: Configure Email Templates

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Create a custom template for password reset

### Step 2: Template Configuration

**Subject:** `Password Reset Verification Code`

**HTML Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
    <h2 style="color: #333; margin-bottom: 20px;">Password Reset Verification</h2>
    <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
      You requested a password reset for your account. Use the verification code below to continue:
    </p>
    <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h1 style="font-size: 36px; margin: 0; letter-spacing: 5px;">{{ .VerificationCode }}</h1>
    </div>
    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    <p style="color: #999; font-size: 12px;">
      If you did not request a password reset, please ignore this email.
    </p>
  </div>
</div>
```

## Method 3: Database Table for Verification Codes

### Step 1: Create Verification Codes Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can manage verification codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 2: Use the Table

The `sendVerificationEmailViaReset` function will automatically use this table to store verification codes.

## Method 4: SMTP Configuration

### Step 1: Configure SMTP in Supabase

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider:

**Gmail:**
- SMTP Host: `smtp.gmail.com`
- Port: `587`
- Username: `your-email@gmail.com`
- Password: `your-app-password`

**SendGrid:**
- SMTP Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: `your-sendgrid-api-key`

**Custom SMTP:**
- Configure according to your provider's settings

### Step 2: Test Email Sending

After configuring SMTP, test the email sending functionality.

## Environment Variables

Add these to your `.env` file:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Edge Functions (if using Method 1)
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing the Implementation

### Step 1: Test Email Sending

1. Run your app
2. Go to password reset page
3. Enter email address
4. Click "Send Verification Code"
5. Check your email for the verification code

### Step 2: Test Code Validation

1. Enter the verification code from email
2. Verify it validates correctly
3. Proceed to password reset

## Troubleshooting

### Common Issues:

1. **Function not found**
   - Ensure Edge Function is deployed
   - Check function name matches exactly

2. **Email not received**
   - Check SMTP configuration
   - Verify email address
   - Check spam folder

3. **Permission errors**
   - Ensure service role key is correct
   - Check RLS policies

4. **Template not working**
   - Verify template syntax
   - Check variable names

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for email sending
2. **Code Expiration**: Set appropriate expiration times
3. **Security**: Use secure random code generation
4. **Monitoring**: Monitor email delivery rates
5. **Fallbacks**: Implement fallback email methods

## Current Implementation Status

- **✅ Edge Function**: Ready to deploy
- **✅ Email Templates**: Configurable in dashboard
- **✅ Database Table**: SQL provided
- **✅ SMTP Configuration**: Instructions provided
- **✅ Testing**: Ready for testing

Choose the method that best fits your needs and follow the setup instructions.