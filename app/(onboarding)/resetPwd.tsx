import React, { useState, useEffect } from 'react';
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
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';
import { supabase } from '@/lib/supabase';
import { resetUserPassword } from '@/lib/passwordReset';
import { sendVerificationEmailViaSupabase, validateVerificationCode } from '@/lib/supabaseEmailService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [tempNewPassword, setTempNewPassword] = useState('');
  const [lastResetAttempt, setLastResetAttempt] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  
  
  // Animation values
  const backButtonScale = useSharedValue(1);
  const sendButtonScale = useSharedValue(1);
  const iconFloat = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const emailInputOpacity = useSharedValue(0);
  const emailInputTranslateX = useSharedValue(-50);
  const sendButtonOpacity = useSharedValue(0);
  const sendButtonContainerScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(1); // Start visible
  const iconScale = useSharedValue(1); // Start at normal size
  const iconTranslateY = useSharedValue(0); // Start at normal position

  const handleBackPressIn = () => {
    backButtonScale.value = withSpring(0.95);
  };

  const handleBackPressOut = () => {
    backButtonScale.value = withSpring(1);
  };

  const handleSendPressIn = () => {
    sendButtonScale.value = withSpring(0.95);
  };

  const handleSendPressOut = () => {
    sendButtonScale.value = withSpring(1);
  };

  // Animation trigger function
  const triggerAnimations = () => {
    // Icon animation - bounce in from top
    iconOpacity.value = withTiming(1, { duration: 800 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    iconTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Title animation - bounce in from top
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));

    // Subtitle animation - fade in with slight delay
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 120 }));

    // Email input - slide in from left
    emailInputOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    emailInputTranslateX.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Send button - scale in with bounce
    sendButtonOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    sendButtonContainerScale.value = withDelay(800, withSpring(1, { damping: 8, stiffness: 120 }));

    // Icon floating animation - continuous gentle float (only for mail icon)
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Button pulse animation - subtle pulse effect
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  };

  // Trigger animations on component mount
  useEffect(() => {
    triggerAnimations();
  }, []);

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

    // Test Supabase connection first
    console.log('🔧 Testing Supabase connection...');
    try {
      const { data, error: connectionError } = await supabase.auth.getSession();
      console.log('🔧 Supabase connection test:', { data, connectionError });
    } catch (connectionTestError) {
      console.error('❌ Supabase connection failed:', connectionTestError);
    }

    setLoading(true);
    showLoading('Sending verification code...');
    
    try {
      console.log('🔧 Attempting to send password reset email to:', sanitizedEmail);
      
      // Send verification email via Supabase (Supabase will generate its own code)
      console.log('📧 Sending verification email to:', sanitizedEmail);
      
      const emailSent = await sendVerificationEmailViaSupabase(sanitizedEmail);
      
      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }
      
      console.log('✅ Verification email sent successfully');
      console.log('📧 Email sent to:', sanitizedEmail);
      console.log('💡 Check your email for the verification code from Supabase');
      console.log('💡 Use the code from the email, not the debug display');
      
      showSuccess('Code Sent!', 'A verification code has been sent to your email address. Please check your email and use the code from the Supabase email.');
      
      // Move to verification code step
      setCurrentStep(2);
      
    } catch (error: any) {
      console.error('❌ Error in handleSendVerificationCode:', error);
      let errorMessage = 'An error occurred while sending the verification code';
      
      if (error.message?.includes('Email not found') || error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address.';
      } else       if (error.message?.includes('Rate limited') || error.message?.includes('you can only request this after')) {
        const timeMatch = error.message.match(/(\d+) seconds/);
        const waitTime = timeMatch ? timeMatch[1] : '60';
        errorMessage = `Rate limited. Please wait ${waitTime} seconds before requesting another verification code.`;
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError('Failed to Send Code', errorMessage);
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Debug logging
    console.log('🔍 Input change:', { index, value, newCode: newCode.join('') });
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
      // Debug logging
      console.log('🔍 ===== VERIFICATION DEBUG INFO =====');
      console.log('🔍 Entered code:', code);
      console.log('🔍 Email:', email);
      console.log('🔍 Code length:', code.length);
      console.log('🔍 ===================================');
      
      // Validate the entered code against the database
      const isValid = await validateVerificationCode(email, code);
      
      if (!isValid) {
        console.log('❌ Verification code validation failed');
        throw new Error('Invalid verification code');
      }
      
      // Simulate API call with validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Verification code validated successfully:', code);
      
      // Store the new password for later use in password update
      setTempNewPassword(newPassword);
      console.log('💾 Stored new password for reset process');
      
      showSuccess('Code Verified!', 'Your verification code has been accepted.');
      
      // Move to step 3: Set new password
      setTimeout(() => {
        setCurrentStep(3);
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      showError('Verification Failed', 'Invalid verification code. Please try again.');
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

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      showError('Missing Information', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      showError('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (passwordLoading) {
      return;
    }

    // Check for rate limiting
    if (lastResetAttempt) {
      const timeSinceLastAttempt = Date.now() - lastResetAttempt;
      const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds
      
      if (timeSinceLastAttempt < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000);
        showError('Rate Limited', `Please wait ${remainingTime} seconds before requesting another password reset.`);
        return;
      }
    }

    setPasswordLoading(true);
    showLoading('Updating password...');
    
    try {
      console.log('🔧 Attempting to reset password for:', email);
      console.log('🔧 Proceeding with password reset after verification');
      console.log('🔐 New password length:', newPassword.length);
      console.log('💾 Using stored password:', tempNewPassword ? 'Yes' : 'No');
      
      // Use the stored password from verification step
      const passwordToUse = tempNewPassword || newPassword;
      
      console.log('🔐 Final password to set (length):', passwordToUse.length);
      
      // For a proper password reset, we need to use a backend API
      // Since we can't directly update passwords without authentication, we'll use a different approach
      
      console.log('🔍 Attempting to update password via backend API...');
      
      // Store the new password temporarily so the callback page can use it
      console.log('💾 Storing new password for callback page...');
      await AsyncStorage.setItem('temp_new_password', passwordToUse);
      await AsyncStorage.setItem('temp_reset_email', email);
      
      // For password reset, we need to use Supabase's resetPasswordForEmail
      // This will send an email with a reset link that allows the user to set a new password
      console.log('📧 Sending password reset email via Supabase...');
      
      const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'famora://auth/reset-password-callback'
      });
      
      if (emailError) {
        console.error('❌ Password reset email error:', emailError);
        
        // Handle rate limiting specifically
        if (emailError.message?.includes('Too Many Requests') || emailError.message?.includes('you can only request this after')) {
          const timeMatch = emailError.message.match(/(\d+) seconds/);
          const waitTime = timeMatch ? timeMatch[1] : '60';
          
          console.log(`⏰ Rate limited - need to wait ${waitTime} seconds`);
          throw new Error(`Too many password reset requests. Please wait ${waitTime} seconds before trying again.`);
        }
        
        // Handle other specific errors
        if (emailError.message?.includes('User not found')) {
          throw new Error('No account found with this email address.');
        }
        
        if (emailError.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before resetting your password.');
        }
        
        // Generic error fallback
        throw new Error(`Failed to send password reset email: ${emailError.message}`);
      }
      
      console.log('✅ Password reset email sent successfully');
      console.log('📧 Check your email for the password reset link');
      console.log('🔗 Click the link to set your new password');
      console.log('💡 The verification code was used to validate your identity');
      console.log('🔐 You will be able to set your new password when you click the email link');
      
      // Record successful reset attempt
      setLastResetAttempt(Date.now());
      
      showSuccess('Reset Email Sent!', 'Please check your email and click the reset link to complete your password reset. You will be able to set your new password on the next page.');
      
      setTimeout(() => {
        router.back();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error updating password:', error);
      showError('Update Failed', error.message || 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
      hideLoading();
    }
  };

  // Animated styles
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const emailInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailInputOpacity.value,
    transform: [{ translateX: emailInputTranslateX.value }],
  }));

  const sendButtonContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sendButtonOpacity.value,
    transform: [{ scale: sendButtonContainerScale.value }],
  }));

  const lockIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { scale: iconScale.value }
    ],
  }));

  const mailIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(iconFloat.value, [0, 1], [-3, 3], Extrapolate.CLAMP)
    }],
  }));

  const buttonPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

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
      <AnimatedPressable
        style={[styles.backButton, backButtonAnimatedStyle]}
        onPress={() => router.back()}
        onPressIn={handleBackPressIn}
        onPressOut={handleBackPressOut}
      >
        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
      </AnimatedPressable>

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        {/* Teal Icon with Lock - Overlapping the white card */}
        <Animated.View style={[styles.iconContainer, lockIconAnimatedStyle]}>
          <View style={styles.iconBackground}>
            <Lock size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
        </Animated.View>
        <View style={styles.contentCard}>
            
            {/* Title */}
            <Animated.View style={[styles.header, titleAnimatedStyle]}>
              <Text style={styles.title}>
                {currentStep === 1 ? 'Forgot Password' : 
                 currentStep === 2 ? 'Verify Code' : 
                 'Set a New Password'}
              </Text>
            </Animated.View>
            
            {currentStep === 1 ? (
              <>
                {/* Subtitle */}
                <Animated.View style={subtitleAnimatedStyle}>
                  <Text style={styles.subtitle}>
                    Reset password code will be sent to your email to reset your password.
                  </Text>
                </Animated.View>

                {/* Form */}
                <View style={styles.form}>
                  {/* Email Input */}
                  <Animated.View style={[styles.inputGroup, emailInputAnimatedStyle]}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputContainer}>
                      <Animated.View style={mailIconAnimatedStyle}>
                        <Mail size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                      </Animated.View>
                      <TextInput
                        style={styles.input}
                        placeholder="My email"
                        placeholderTextColor="#888888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                  </Animated.View>

                  {/* Send Verification Code Button */}
                  <Animated.View style={sendButtonContainerAnimatedStyle}>
                    <AnimatedPressable
                      style={[
                        styles.sendButton, 
                        sendButtonAnimatedStyle,
                        buttonPulseAnimatedStyle,
                        loading && styles.sendButtonLoading,
                        !isEmailValid && styles.sendButtonDisabled
                      ]}
                      onPress={handleSendVerificationCode}
                      onPressIn={handleSendPressIn}
                      onPressOut={handleSendPressOut}
                      disabled={loading || !isEmailValid}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        loading && styles.sendButtonTextLoading,
                        !isEmailValid && styles.sendButtonTextDisabled
                      ]}>
                        {loading ? 'Sending...' : 'Send Verification Code'}
                      </Text>
                    </AnimatedPressable>
                  </Animated.View>
                </View>
              </>
            ) : currentStep === 2 ? (
              <>
                {/* Verification Code Step */}
                <Animated.View style={subtitleAnimatedStyle}>
                  <Text style={styles.subtitle}>
                    A reset code has been sent to {email}, check your email to continue the password reset process.
                  </Text>
                  <Text style={[styles.subtitle, { color: '#007bff', marginTop: 10, fontWeight: 'bold' }]}>
                    💡 Use the verification code from the email you received
                  </Text>
                </Animated.View>

                {/* Verification Code Input */}
                <View style={styles.form}>
                  <Animated.View style={[styles.inputGroup, emailInputAnimatedStyle]}>
                    <Text style={styles.inputLabel}>Verification Code</Text>
                    <View style={styles.verificationCodeContainer}>
                      {verificationCode.map((digit, index) => (
                        <TextInput
                          key={index}
                          style={styles.verificationCodeInput}
                          value={digit}
                          onChangeText={(value) => handleVerificationCodeChange(index, value)}
                          keyboardType="numeric"
                          maxLength={1}
                          textAlign="center"
                          placeholder="0"
                          placeholderTextColor="#CCCCCC"
                        />
                      ))}
                    </View>
                  </Animated.View>

                  {/* Resend Code Link */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Haven't received the verification code? </Text>
                    <Pressable onPress={handleResendCode} disabled={loading}>
                      <Text style={styles.resendLink}>Resend it.</Text>
                    </Pressable>
                  </View>

                  {/* Submit Button */}
                  <Animated.View style={sendButtonContainerAnimatedStyle}>
                    <AnimatedPressable
                      style={[
                        styles.sendButton, 
                        sendButtonAnimatedStyle,
                        buttonPulseAnimatedStyle,
                        verificationLoading && styles.sendButtonLoading
                      ]}
                      onPress={handleSubmitVerificationCode}
                      onPressIn={handleSendPressIn}
                      onPressOut={handleSendPressOut}
                      disabled={verificationLoading}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        verificationLoading && styles.sendButtonTextLoading
                      ]}>
                        {verificationLoading ? 'Verifying...' : 'Submit'}
                      </Text>
                    </AnimatedPressable>
                    
                  </Animated.View>
                </View>
              </>
            ) : (
              <>
                {/* Set New Password Step */}
                <Animated.View style={subtitleAnimatedStyle}>
                  <Text style={styles.subtitle}>
                    Please set a new password to secure your Famora account.
                  </Text>
                </Animated.View>

                {/* Form */}
                <View style={styles.form}>
                  {/* New Password Input */}
                  <Animated.View style={[styles.inputGroup, emailInputAnimatedStyle]}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Input Password"
                        placeholderTextColor="#888888"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color="#17f196" strokeWidth={1.5} />
                        ) : (
                          <Eye size={20} color="#17f196" strokeWidth={1.5} />
                        )}
                      </Pressable>
                    </View>
                  </Animated.View>

                  {/* Confirm Password Input */}
                  <Animated.View style={[styles.inputGroup, emailInputAnimatedStyle]}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Re Enter Your Password"
                        placeholderTextColor="#888888"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
                      />
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? (
                          <EyeOff size={20} color="#17f196" strokeWidth={1.5} />
                        ) : (
                          <Eye size={20} color="#17f196" strokeWidth={1.5} />
                        )}
                      </Pressable>
                    </View>
                  </Animated.View>

                  {/* Submit Button */}
                  <Animated.View style={sendButtonContainerAnimatedStyle}>
                    <AnimatedPressable
                      style={[
                        styles.sendButton, 
                        sendButtonAnimatedStyle,
                        buttonPulseAnimatedStyle,
                        passwordLoading && styles.sendButtonLoading
                      ]}
                      onPress={handleUpdatePassword}
                      onPressIn={handleSendPressIn}
                      onPressOut={handleSendPressOut}
                      disabled={passwordLoading || cooldownTime > 0}
                    >
                      <Text style={[
                        styles.sendButtonText,
                        passwordLoading && styles.sendButtonTextLoading
                      ]}>
                        {passwordLoading ? 'Updating...' : 
                         cooldownTime > 0 ? `Wait ${cooldownTime}s` : 'Submit'}
                      </Text>
                    </AnimatedPressable>
                  </Animated.View>
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
  },

  // Upper Section (50% of screen)
  upperSection: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60, // Extra padding to show the overlapping icon
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
    position: 'absolute',
    alignItems: 'center',
    top: -40,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 80, // Ensure the container has proper height
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Lower Section (White Card)
  lowerSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '50%', // Increased from 42% to 50%
    maxHeight: 450, // Increased from 380 to 450
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  contentCard: {
    flex: 1,
    paddingTop: 45,
    paddingHorizontal: 24,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'left',
    lineHeight: 18,
    paddingHorizontal: 0,
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Send Button
  sendButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    gap: 12,
  },
  verificationCodeInput: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    color: '#161618',
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  resendText: {
    fontSize: 14,
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  resendLink: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '500',
  },
});
