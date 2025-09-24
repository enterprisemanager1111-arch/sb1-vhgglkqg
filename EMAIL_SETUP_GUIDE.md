# Email Service Setup Guide

## Overview

The current implementation simulates email sending. To send real verification codes, you need to set up an email service.

## Why Supabase Doesn't Send Verification Codes

Supabase's `resetPasswordForEmail` function sends a **password reset link**, not a verification code. The email you saw with code `715594` was likely from a different system or custom email template.

## Email Service Options

### 1. EmailJS (Easiest to set up)

**Pros:**
- Easy to set up
- No backend required
- Free tier available
- Works directly from frontend

**Setup:**
1. Go to [EmailJS](https://www.emailjs.com/)
2. Create an account and verify your email
3. Create an email service (Gmail, Outlook, etc.)
4. Create an email template
5. Get your Service ID, Template ID, and Public Key
6. Add to your `.env` file:

```bash
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

**Email Template Example:**
```
Subject: Password Reset Verification Code

Hello {{user_name}},

You requested a password reset for your account. Use the verification code below to continue:

{{verification_code}}

This code will expire in 10 minutes.

If you did not request a password reset, please ignore this email.

Best regards,
Your App Team
```

### 2. Resend (Recommended for production)

**Pros:**
- Modern email API
- Good deliverability
- Developer-friendly
- Free tier available

**Setup:**
1. Go to [Resend](https://resend.com/)
2. Create an account
3. Get your API key
4. Add to your `.env` file:

```bash
EXPO_PUBLIC_RESEND_API_KEY=your_api_key
```

**Usage:**
```typescript
import { sendVerificationEmailWithResend } from '@/lib/emailService';

// In your component
const emailSent = await sendVerificationEmailWithResend(email, code);
```

### 3. SendGrid

**Pros:**
- Enterprise-grade
- High deliverability
- Advanced features
- Free tier available

**Setup:**
1. Go to [SendGrid](https://sendgrid.com/)
2. Create an account
3. Get your API key
4. Add to your `.env` file:

```bash
EXPO_PUBLIC_SENDGRID_API_KEY=your_api_key
```

### 4. AWS SES

**Pros:**
- Very cost-effective
- High deliverability
- Integrates with AWS services

**Setup:**
1. Set up AWS SES
2. Verify your domain/email
3. Get your API credentials
4. Add to your `.env` file:

```bash
EXPO_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key
EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_key
EXPO_PUBLIC_AWS_REGION=your_region
```

## Implementation Steps

### Step 1: Choose an Email Service

For development/testing: **EmailJS**
For production: **Resend** or **SendGrid**

### Step 2: Set Up Environment Variables

Add your email service credentials to `.env`:

```bash
# EmailJS
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# Resend
EXPO_PUBLIC_RESEND_API_KEY=your_api_key

# SendGrid
EXPO_PUBLIC_SENDGRID_API_KEY=your_api_key
```

### Step 3: Update Email Service

In `lib/emailService.ts`, uncomment the relevant implementation:

```typescript
// For EmailJS
const response = await emailjs.send(
  process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
  process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
  emailParams,
  process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!
);

// For Resend
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_RESEND_API_KEY}`,
  },
  body: JSON.stringify({...}),
});
```

### Step 4: Test Email Sending

1. Set up your chosen email service
2. Add environment variables
3. Update the email service implementation
4. Test the password reset flow
5. Check your email for the verification code

## Current Status

- **✅ Code Generation**: Working correctly
- **✅ Code Validation**: Working correctly
- **⚠️ Email Sending**: Currently simulated
- **✅ UI Display**: Shows generated code for testing

## Testing Without Real Emails

For development, you can:

1. **Use the debug code display** in the UI
2. **Check console logs** for the generated code
3. **Use the simulated email sending** (current implementation)

## Production Checklist

- [ ] Set up email service (Resend/SendGrid)
- [ ] Add environment variables
- [ ] Update email service implementation
- [ ] Test email delivery
- [ ] Remove debug code display
- [ ] Set up email monitoring
- [ ] Configure email templates
- [ ] Test with real email addresses

## Troubleshooting

**Common Issues:**

1. **Emails not received**
   - Check spam folder
   - Verify email service configuration
   - Check API key permissions

2. **API errors**
   - Verify environment variables
   - Check API key validity
   - Review email service logs

3. **Template issues**
   - Verify template ID
   - Check template syntax
   - Test with simple template first

## Security Considerations

- **Never expose API keys** in client-side code
- **Use environment variables** for all credentials
- **Implement rate limiting** for email sending
- **Validate email addresses** before sending
- **Set expiration times** for verification codes
- **Log email sending** for audit purposes
