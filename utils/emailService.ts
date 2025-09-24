// Email Service Utility
// This service can be easily integrated with real email providers like:
// - EmailJS (free tier available)
// - SendGrid
// - AWS SES
// - Nodemailer with SMTP

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailData {
  to: string;
  code: string;
  expiresIn: number; // minutes
}

// Email template for verification code
const getVerificationEmailTemplate = (code: string, expiresIn: number): { html: string; text: string } => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Famora</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #17f196;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
        }
        .code-container {
          background-color: #f8f9fa;
          border: 2px solid #17f196;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .verification-code {
          font-size: 36px;
          font-weight: bold;
          color: #17f196;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .expires {
          color: #666;
          font-size: 14px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">∞ Famora</div>
          <h1 class="title">Email Verification</h1>
        </div>
        
        <p>Thank you for signing up for Famora! To complete your registration, please verify your email address using the code below:</p>
        
        <div class="code-container">
          <div class="verification-code">${code}</div>
          <div class="expires">This code expires in ${expiresIn} minutes</div>
        </div>
        
        <div class="warning">
          <strong>Security Notice:</strong> Never share this verification code with anyone. Famora will never ask for your verification code via phone, email, or any other method.
        </div>
        
        <p>If you didn't request this verification code, please ignore this email.</p>
        
        <div class="footer">
          <p>This email was sent by Famora. If you have any questions, please contact our support team.</p>
          <p>&copy; 2024 Famora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Famora - Email Verification

Thank you for signing up for Famora! To complete your registration, please verify your email address using the code below:

Verification Code: ${code}

This code expires in ${expiresIn} minutes.

Security Notice: Never share this verification code with anyone. Famora will never ask for your verification code via phone, email, or any other method.

If you didn't request this verification code, please ignore this email.

This email was sent by Famora. If you have any questions, please contact our support team.

© 2024 Famora. All rights reserved.
  `;

  return { html, text };
};

// Simulate email sending (replace with real email service)
const simulateEmailSending = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 Email Service - Sending email:');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   Content: ${emailData.text || 'HTML email'}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ Email sent successfully (simulated)');
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

// Real email service integration (uncomment and configure as needed)
/*
// Example with EmailJS
import emailjs from '@emailjs/browser';

const sendEmailWithEmailJS = async (emailData: EmailData): Promise<boolean> => {
  try {
    const result = await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.html,
      },
      'YOUR_PUBLIC_KEY'
    );
    
    console.log('✅ Email sent via EmailJS:', result);
    return true;
  } catch (error) {
    console.error('❌ EmailJS sending failed:', error);
    return false;
  }
};

// Example with SendGrid
import sgMail from '@sendgrid/mail';

const sendEmailWithSendGrid = async (emailData: EmailData): Promise<boolean> => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const msg = {
      to: emailData.to,
      from: 'noreply@famora.com',
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };
    
    await sgMail.send(msg);
    console.log('✅ Email sent via SendGrid');
    return true;
  } catch (error) {
    console.error('❌ SendGrid sending failed:', error);
    return false;
  }
};
*/

// Main email sending function
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  // For now, use simulation. In production, replace with real email service
  return await simulateEmailSending(emailData);
  
  // Uncomment one of these for real email sending:
  // return await sendEmailWithEmailJS(emailData);
  // return await sendEmailWithSendGrid(emailData);
};

// Send verification code email
export const sendVerificationEmail = async (data: VerificationEmailData): Promise<boolean> => {
  const { html, text } = getVerificationEmailTemplate(data.code, data.expiresIn);
  
  const emailData: EmailData = {
    to: data.to,
    subject: 'Verify Your Email - Famora',
    html,
    text,
  };
  
  return await sendEmail(emailData);
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Famora!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #17f196; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">∞ Famora</div>
          <h1>Welcome to Famora!</h1>
        </div>
        <p>Hi ${name},</p>
        <p>Welcome to Famora! Your account has been successfully created and verified.</p>
        <p>You can now start using all the features of our family management app.</p>
        <p>Best regards,<br>The Famora Team</p>
      </div>
    </body>
    </html>
  `;
  
  const emailData: EmailData = {
    to: email,
    subject: 'Welcome to Famora!',
    html,
    text: `Welcome to Famora! Hi ${name}, your account has been successfully created and verified.`,
  };
  
  return await sendEmail(emailData);
};

