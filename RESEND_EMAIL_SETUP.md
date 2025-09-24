# Resend Email Setup Guide

This guide will help you set up real email sending using Resend API for the verification code system.

## Current Status

✅ **Verification modal displays** after signup  
✅ **Verification codes generated** and stored  
✅ **Code validation** working  
✅ **Account creation** only after verification  
✅ **Resend API integrated** (ready for configuration)

## Setup Resend API

### Step 1: Create Resend Account

1. **Go to [Resend.com](https://resend.com)**
2. **Sign up** for a free account
3. **Verify your email** address

### Step 2: Get API Key

1. **Go to API Keys** in your Resend dashboard
2. **Create a new API key**
3. **Copy the API key** (starts with `re_`)

### Step 3: Configure Environment Variables

Add this to your `.env` file:

```env
EXPO_PUBLIC_RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 4: Verify Domain (Optional)

For production, you should verify your domain:

1. **Go to Domains** in Resend dashboard
2. **Add your domain** (e.g., `famora.com`)
3. **Add DNS records** as instructed
4. **Update the email sender** in the code

## Current Email Template

The system sends a beautiful HTML email with:

- **Famora branding** with green color scheme
- **Large verification code** display
- **Professional styling**
- **Expiration notice** (10 minutes)
- **Company footer**

## Testing

### Without Resend API Key (Current)
- **Codes displayed** in console
- **Verification works** normally
- **No real emails sent**

### With Resend API Key
- **Real emails sent** to user's inbox
- **Beautiful HTML template**
- **Professional appearance**
- **Full email delivery**

## Email Template Preview

```
Welcome to Famora!

Please verify your email address by entering the code below:

┌─────────────────┐
│      123456     │
└─────────────────┘

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.

© 2024 Famora. All rights reserved.
```

## Production Setup

For production, you should:

1. **Verify your domain** in Resend
2. **Update sender email** to your domain
3. **Customize email template** with your branding
4. **Set up email analytics** and tracking
5. **Monitor delivery rates** and bounces

## Environment Variables

```env
# Resend API Key
EXPO_PUBLIC_RESEND_API_KEY=re_your_actual_api_key_here

# Optional: Custom sender email
EXPO_PUBLIC_SENDER_EMAIL=noreply@yourdomain.com
```

## Current Flow

1. **User signs up** → Data stored temporarily
2. **Verification code generated** → Stored locally
3. **Email sent via Resend** → (if API key configured)
4. **Code displayed in console** → (always, for testing)
5. **User enters code** → Validated
6. **Account created** → Only after verification

## Troubleshooting

### Email Not Received
1. **Check spam folder**
2. **Verify API key** is correct
3. **Check Resend dashboard** for delivery status
4. **Verify email address** is valid

### API Errors
1. **Check API key** format (starts with `re_`)
2. **Verify account** is active
3. **Check rate limits** in Resend dashboard
4. **Review error logs** in console

The system is now ready for real email sending! 🚀

Just add your Resend API key to the environment variables and emails will be sent automatically.
