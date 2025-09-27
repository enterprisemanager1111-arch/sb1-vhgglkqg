import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image as RNImage,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';
import { supabase } from '@/lib/supabase';
import { resetUserPassword } from '@/lib/passwordReset';
import { sendVerificationEmailViaSupabase, validateVerificationCode } from '@/lib/supabaseEmailService';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ResetPassword() {
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError, showWarning } = useCustomAlert();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Email input, 2: Verification code, 3: Set new password
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [sentVerificationCode, setSentVerificationCode] = useState('');
  const [lastResetAttempt, setLastResetAttempt] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [emailFocused, setEmailFocused] = useState(false);
  
  // Refs for verification code inputs
  const verificationInputRefs = useRef<(TextInput | null)[]>([]);
  
  
  // Animation values



  // Validate email on change
  useEffect(() => {
    const sanitizedEmail = sanitizeInput(email);
    const valid = sanitizedEmail && validateEmail(sanitizedEmail);
    setIsEmailValid(!!valid);
  }, [email]);

  // Handle cooldown timer
  useEffect(() => {
    if (lastResetAttempt) {
      const interval = setInterval(() => {
        const timeSinceLastAttempt = Date.now() - lastResetAttempt;
        const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds
        const remainingTime = Math.max(0, Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000));
        
        setCooldownTime(remainingTime);
        
        if (remainingTime === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastResetAttempt]);

  const handleSendVerificationCode = async () => {
    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail) {
      showError('Missing Information', 'Please enter your email address');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      showError('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    showLoading('Sending password reset email...');
    
    try {
      console.log('🔧 Sending password reset email to:', sanitizedEmail);
      
      // Send password reset email using Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: "/resetPwd/enterNewPwd",
      });

      if (error) {
        console.error('❌ Password reset email error:', error);
        
        if (error.message?.includes('Too Many Requests')) {
          throw new Error('Too many password reset requests. Please wait a moment and try again.');
        }
        
        if (error.message?.includes('User not found')) {
          throw new Error('No account found with this email address.');
        }
        
        throw new Error('Failed to send password reset email. Please try again.');
      }

      console.log('✅ Password reset email sent successfully');
      console.log('📧 Email sent to:', sanitizedEmail);
      
      showSuccess('Code Sent!', 'A verification code has been sent to your email address. Please check your email and enter the code.');
      
      // Move to verification code step
      setCurrentStep(2);
      
    } catch (error: any) {
      console.error('❌ Error sending password reset email:', error);
      showError('Failed to Send Email', error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    // Handle paste of full code (6 digits)
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const newCode = value.split('');
      setVerificationCode(newCode);
      console.log('🔍 Full code pasted:', newCode.join(''));
      return;
    }
    
    // Handle single character input
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input if current input has a value
    if (value && index < 5) {
      setTimeout(() => {
        verificationInputRefs.current[index + 1]?.focus();
      }, 100);
    }
    
    // Debug logging
    console.log('🔍 Input change:', { index, value, newCode: newCode.join('') });
  };

  const handleVerificationKeyPress = (index: number, key: string) => {
    // Handle backspace - focus previous input if current is empty
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      setTimeout(() => {
        verificationInputRefs.current[index - 1]?.focus();
      }, 100);
    }
  };


  const handleSubmitVerificationCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      showError('Invalid Code', 'Please enter the complete 6-digit verification code');
      return;
    }

    if (verificationLoading) {
      return;
    }

    setVerificationLoading(true);
    showLoading('Verifying code...');
    
    try {
      console.log('🔍 Verifying OTP code:', code);
      console.log('📧 Email:', email);
      
      // Verify the OTP using Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,       // e.g. "123456"
        type: "recovery",  // recovery = password reset
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        
        if (error.message?.includes('Invalid token')) {
          throw new Error('Invalid verification code. Please check and try again.');
        }
        
        if (error.message?.includes('Token has expired')) {
          throw new Error('Verification code has expired. Please request a new one.');
        }
        
        throw new Error('Failed to verify code. Please try again.');
      }
      
      console.log('✅ OTP verification successful');
      console.log('👤 User session:', data.user);
      
      // Store the verified code for password update
      setSentVerificationCode(code);
      
      showSuccess('Code Verified!', 'Please set your new password.');
      
      // Navigate to the new password entry page
      setTimeout(() => {
        router.push('/resetPwd/enterNewPwd');
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      showError('Verification Failed', error.message || 'Failed to verify code. Please try again.');
    } finally {
      setVerificationLoading(false);
      hideLoading();
    }
  };

  const handleResendCode = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Resend Verification Code',
      'This will generate a NEW verification code. The old code will no longer work. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resend', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            showLoading('Resending verification code...');
            
            try {
              // Send new verification email (Supabase will generate its own code)
              console.log('📧 Resending verification email to:', email);
              
              const emailSent = await sendVerificationEmailViaSupabase(email);
              
              if (!emailSent) {
                throw new Error('Failed to resend verification email');
              }
              
              console.log('✅ Verification email resent successfully');
              console.log('📧 New email sent to:', email);
              console.log('💡 Check your email for the new verification code from Supabase');
              
              showSuccess('Code Resent!', 'A new verification code has been sent to your email. Please check your email for the new code.');
              
            } catch (error: any) {
              showError('Failed to Resend', 'Could not resend the verification code. Please try again.');
            } finally {
              setLoading(false);
              hideLoading();
            }
          }
        }
      ]
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

      {/* Full Screen Background Image */}
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
      </Pressable>

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={[styles.lowerSection, currentStep === 3 && styles.lowerSectionExtended]}>
        {/* Teal Icon with Security Safe - Overlapping the white card */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <RNImage 
              source={require('@/assets/images/icon/security-safe.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.contentCard}>
            
            {/* Title */}
            <View style={[styles.header, ]}>
              <Text style={styles.title}>
                {currentStep === 1 ? 'Forgot Password' : 
                 currentStep === 2 ? 'Forgot Password' : 
                 'Set a New Password'}
              </Text>
            </View>
            
            {currentStep === 1 ? (
              <>
                {/* Subtitle */}
                <View >
                  <Text style={styles.subtitle}>
                    Reset password code will be sent to your email to reset your password.
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
                      <View>
                        <Mail size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="My email"
                        placeholderTextColor="#888888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                      />
                    </View>
                  </View>

                  {/* Send Verification Code Button */}
                  <View>
                    <Pressable
                      style={[
                        styles.sendButton, 
                        loading && styles.sendButtonLoading,
                        !isEmailValid && styles.sendButtonDisabled
                      ]}
                      onPress={handleSendVerificationCode}
                      disabled={loading || !isEmailValid}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        loading && styles.sendButtonTextLoading,
                        !isEmailValid && styles.sendButtonTextDisabled
                      ]}>
                        {loading ? 'Sending...' : 'Send Verification Code'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Verification Code Step */}
                <View >
                  <Text style={styles.subtitle}>
                    A reset code has been sent to {email}, check your email to continue the password reset process.
                  </Text>
                </View>

                {/* Verification Code Input */}
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <View style={styles.verificationCodeContainer}>
                      {verificationCode.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => { verificationInputRefs.current[index] = ref; }}
                          style={styles.verificationCodeInput}
                          value={digit}
                          onChangeText={(value) => handleVerificationCodeChange(index, value)}
                          onKeyPress={({ nativeEvent }) => handleVerificationKeyPress(index, nativeEvent.key)}
                          keyboardType="numeric"
                          maxLength={6} // Allow paste of full code
                          textAlign="center"
                          placeholder="0"
                          placeholderTextColor="#CCCCCC"
                          selectTextOnFocus={true}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Resend Code Link */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Haven't received the verification code? </Text>
                    <Pressable onPress={handleResendCode} disabled={loading}>
                      <Text style={styles.resendLink}>Resend it.</Text>
                    </Pressable>
                  </View>

                  {/* Submit Button */}
                  <View>
                    <Pressable
                      style={[
                        styles.sendButton, 
                        verificationLoading && styles.sendButtonLoading
                      ]}
                      onPress={handleSubmitVerificationCode}
                      disabled={verificationLoading}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        verificationLoading && styles.sendButtonTextLoading
                      ]}>
                        {verificationLoading ? 'Verifying...' : 'Submit'}
                      </Text>
                    </Pressable>
                    
                  </View>
                </View>
              </>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102118',
    justifyContent: 'flex-end',
  },

  // Upper Section (40% of screen)
  upperSection: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Icon Container
  iconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },
  iconImage: {
    width: 48,
    height: 48,
  },

  // Lower Section (White Card)
  lowerSection: {
    height: '40%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  lowerSectionExtended: {
    height: '50%',
  },
  contentCard: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },

  // Form
  form: {
    flex: 1,
    gap: 16, // Increased from 10 to 16 for better spacing
    paddingBottom: 8, // Increased from 4 to 8
  },
  inputGroup: {
    gap: 8, // Increased from 6 to 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475467',
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#98a2b3',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#17f196',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },

  // Send Button
  sendButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  sendButtonLoading: {
    opacity: 0.8,
  },
  sendButtonTextLoading: {
    opacity: 0.8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
  boldEmail: {
    fontWeight: 'bold',
    color: '#161618',
  },
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  verificationCodeInput: {
    width: 50,
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#fefefe',
    fontFamily: 'Helvetica',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  resendLink: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: 'Helvetica',
    fontWeight: '500',
  },

  // Password Success Modal Styles
  passwordSuccessModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 3000,
  },
  passwordSuccessModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '45%',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 18,
  },
  passwordSuccessIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  passwordSuccessIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#17f196',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },
  passwordSuccessIconImage: {
    width: 48,
    height: 48,
  },
  passwordSuccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  passwordSuccessDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  passwordSuccessButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  passwordSuccessButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
});
