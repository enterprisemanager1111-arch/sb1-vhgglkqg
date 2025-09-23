import { supabase } from '@/lib/supabase';

// Store verification codes in memory (in production, use a database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Generate a 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code to email
export const sendVerificationCode = async (email: string): Promise<boolean> => {
  try {
    const code = generateVerificationCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store the code
    verificationCodes.set(email, { code, expires });

    // In a real app, you would send this via email service
    // For now, we'll log it to console for testing
    console.log(`📧 Verification code for ${email}: ${code}`);
    console.log(`⏰ Code expires in 10 minutes`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error('Error sending verification code:', error);
    return false;
  }
};

// Verify the code
export const verifyCode = (email: string, code: string): boolean => {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    console.log('❌ No verification code found for email:', email);
    return false;
  }

  if (Date.now() > stored.expires) {
    console.log('❌ Verification code expired for email:', email);
    verificationCodes.delete(email);
    return false;
  }

  if (stored.code !== code) {
    console.log('❌ Invalid verification code for email:', email);
    return false;
  }

  // Code is valid, remove it
  verificationCodes.delete(email);
  console.log('✅ Verification code verified successfully for email:', email);
  return true;
};

// Clean up expired codes
export const cleanupExpiredCodes = (): void => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
};

// Clean up expired codes every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);
