# EmailJS Setup Guide

## Quick Setup for Real Email Sending

### Step 1: Create EmailJS Account
1. Go to [https://emailjs.com](https://emailjs.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. **Copy the Service ID**

### Step 3: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template content:

**Subject:** Verify Your Email - Famora

**Content:**
```
<h2>Email Verification - Famora</h2>
<p>Hello,</p>
<p>Thank you for signing up for Famora! Please use the verification code below to complete your registration:</p>

<div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;">
  <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #17f196;">{{verification_code}}</span>
</div>

<p>This code will expire in {{expires_in}}.</p>
<p>If you didn't request this verification code, please ignore this email.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
<p style="font-size: 12px; color: #888;">This email was sent automatically. Please do not reply.</p>
```

4. **Copy the Template ID**

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. **Copy your Public Key**

### Step 5: Update Environment Variables
Add these to your `.env` file:

```env
# EmailJS Configuration
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### Step 6: Restart Development Server
```bash
npx expo start --clear
```

## Testing
1. Go to signup page
2. Fill out the form
3. Click "Sign Up"
4. Check your email for the verification code
5. Enter the code in the verification modal

## Free Tier Limits
- 200 emails per month
- Perfect for development and small apps

## Troubleshooting
- Check console logs for EmailJS errors
- Verify all environment variables are set correctly
- Make sure your email service is properly configured in EmailJS
- Check spam folder for verification emails
