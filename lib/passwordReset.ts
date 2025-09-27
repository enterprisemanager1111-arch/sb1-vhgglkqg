import { createClient } from '@supabase/supabase-js';

// This would use Supabase admin client to update passwords
// Note: This requires the service role key and should be used carefully

export const resetUserPassword = async (email: string, verificationCode: string, newPassword: string) => {
  try {
    console.log('🔧 Attempting to reset password for:', email);
    console.log('🔧 Verification code:', verificationCode);
    console.log('🔐 New password length:', newPassword.length);

    // Validate input parameters
    if (!email || !newPassword) {
      throw new Error('Missing required parameters for password reset');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check for rate limiting
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const lastAttemptKey = `last_password_reset_attempt_${email}`;
    const lastAttempt = await AsyncStorage.getItem(lastAttemptKey);
    
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds
      
      if (timeSinceLastAttempt < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before attempting another password reset.`);
      }
    }

    // Try to use Supabase admin client if available
    const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      console.log('🔧 Using Supabase admin client for password reset...');
      
      const supabaseAdmin = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );

      // First, get the user by email
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Failed to get users:', userError);
        throw new Error(`Failed to get users: ${userError.message}`);
      }

      const user = users.users.find(u => u.email === email);
      if (!user) {
        console.error('❌ User not found:', email);
        throw new Error('No account found with this email address');
      }

      console.log('👤 Found user:', user.id);

      // Update the user's password
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (error) {
        console.error('❌ Failed to update password:', error);
        throw new Error(`Failed to update password: ${error.message}`);
      }

      console.log('✅ Password updated successfully using admin client');
      return { 
        success: true, 
        user: data.user,
        message: 'Password updated successfully' 
      };
    } else {
      console.log('🔧 Using direct password update approach...');
      
      // Since verification was already done in the previous step, we can update the password directly
      // This approach uses Supabase's resetPasswordForEmail to create a proper reset session
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        // Send password reset email to create a proper reset session
        console.log('🔧 Sending password reset email to create reset session...');
        
        const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: '/resetPwd/enterNewPwd',
        });

        if (resetError) {
          console.error('❌ Password reset email error:', resetError);
          
          if (resetError.message?.includes('Too Many Requests')) {
            throw new Error('Too many password reset requests. Please wait a moment and try again.');
          }
          
          if (resetError.message?.includes('User not found')) {
            throw new Error('No account found with this email address.');
          }
          
          throw new Error('Failed to initiate password reset. Please try again.');
        }

        console.log('✅ Password reset email sent successfully');
        
        // Store the new password temporarily for the callback page
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('temp_new_password', newPassword);
        await AsyncStorage.setItem('temp_reset_email', email);
        await AsyncStorage.setItem('temp_verification_code', verificationCode || '');
        await AsyncStorage.setItem('temp_password_update_timestamp', Date.now().toString());
        
        console.log('💾 Password and info stored for callback');
        console.log('📧 User will receive an email to complete password reset');
        console.log('💡 The password will be updated when user clicks the email link');

        // Record successful attempt for rate limiting
        await AsyncStorage.setItem(lastAttemptKey, Date.now().toString());

        return { 
          success: true, 
          message: 'Password reset email sent. Please check your email and click the reset link to complete the process.' 
        };
      } catch (error) {
        console.error('❌ Error in password update flow:', error);
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    // Record failed attempt for rate limiting
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const lastAttemptKey = `last_password_reset_attempt_${email}`;
      await AsyncStorage.setItem(lastAttemptKey, Date.now().toString());
    } catch (storageError) {
      console.error('❌ Failed to record attempt timestamp:', storageError);
    }
    
    throw error;
  }
};
