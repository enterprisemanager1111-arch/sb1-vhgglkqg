// Email service for sending verification codes
// This is a simple implementation using EmailJS
// In production, you might want to use other services like Resend, SendGrid, etc.

interface EmailParams {
  to_email: string;
  verification_code: string;
  user_name?: string;
}

export const sendVerificationEmail = async (
  email: string, 
  verificationCode: string
): Promise<boolean> => {
  try {
    console.log('📧 Sending verification email...');
    console.log('📧 To:', email);
    console.log('🔐 Code:', verificationCode);
    
    // For now, we'll simulate sending the email
    // In production, you would implement actual email sending here
    
    // Example with EmailJS:
    /*
    const emailParams: EmailParams = {
      to_email: email,
      verification_code: verificationCode,
      user_name: email.split('@')[0]
    };
    
    const response = await emailjs.send(
      process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
      emailParams,
      process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
    
    console.log('✅ Email sent successfully:', response);
    return true;
    */
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Email sent successfully (simulated)');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Alternative implementation using Resend
export const sendVerificationEmailWithResend = async (
  email: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    console.log('📧 Sending verification email with Resend...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: [email],
        subject: 'Password Reset Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Verification</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your account. Use the verification code below to continue:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0;">${verificationCode}</h1>
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>Your App Team</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully with Resend:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send email with Resend:', error);
    return false;
  }
};

// Alternative implementation using SendGrid
export const sendVerificationEmailWithSendGrid = async (
  email: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    console.log('📧 Sending verification email with SendGrid...');
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: 'Password Reset Verification Code',
          },
        ],
        from: { email: 'noreply@yourdomain.com', name: 'Your App' },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Verification</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your account. Use the verification code below to continue:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                  <h1 style="color: #007bff; font-size: 32px; margin: 0;">${verificationCode}</h1>
                </div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>Best regards,<br>Your App Team</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Email sent successfully with SendGrid');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send email with SendGrid:', error);
    return false;
  }
};
