import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image as RNImage,
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
import { Mail, Phone, Building, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { sanitizeInput, validateEmail, sanitizeEmail } from '@/utils/sanitization';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isVerifyingSignup, setIsVerifyingSignup] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [generatedVerificationCode, setGeneratedVerificationCode] = useState('');
  const [tempSignupData, setTempSignupData] = useState<{
    email: string;
    password: string;
    phoneNumber: string;
    companyId: string;
  } | null>(null);
  
  // Refs for verification code inputs
  const verificationInputRefs = useRef<(TextInput | null)[]>([]);
  
  const { signUp } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError, showWarning } = useCustomAlert();

  // Generate a 6-digit verification code
  const generateVerificationCode = (): string => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated verification code:', code);
    return code;
  };

  // Send verification email (NO account creation yet)
  const sendVerificationEmail = async (email: string, userPassword: string): Promise<boolean> => {
    try {
      console.log('📧 Sending verification code (NO account created yet)...');
      
      // Generate verification code for testing
      const verificationCode = generateVerificationCode();
      setGeneratedVerificationCode(verificationCode);
      
      console.log('🔐 VERIFICATION CODE FOR TESTING:', verificationCode);
      console.log('📧 Email:', email);
      console.log('💡 Use this code in the verification modal to test the flow');
      console.log('⚠️ Account will be created ONLY after successful verification');
      
      // For now, we'll simulate email sending
      // In production, you would send the verification code via email service
      console.log('📧 Simulating email sending...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Verification code sent successfully (simulated)');
      return true;
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  };



  // Animation states
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const linkOpacity = useSharedValue(0);
  const linkTranslateY = useSharedValue(15);

  // Button animations
  const signUpButtonScale = useSharedValue(1);
  const signInLinkScale = useSharedValue(1);
  
  // Checkbox animations
  const checkboxScale = useSharedValue(1);
  const checkboxRotation = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const checkmarkRotation = useSharedValue(-180);
  
  // Modal animations
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(800);
  
  // Verification modal animations
  const verificationModalOpacity = useSharedValue(0);
  const verificationModalScale = useSharedValue(0.8);
  const verificationModalTranslateY = useSharedValue(50);
  
  

  // Welcome modal animations
  const welcomeModalOpacity = useSharedValue(0);
  const welcomeModalScale = useSharedValue(0.8);
  const welcomeModalTranslateY = useSharedValue(800);
  const welcomeIconScale = useSharedValue(0);
  const welcomeIconRotation = useSharedValue(0);

  // Animation trigger
  useEffect(() => {
    triggerAnimations();
  }, []);


  const triggerAnimations = () => {
    // Logo animation - scale and rotate
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    logoRotation.value = withSpring(360, { damping: 10, stiffness: 100 });

    // Title animation
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));

    // Subtitle animation
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subtitleTranslateY.value = withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }));

    // Form animation
    formOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Button animation
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(800, withSpring(0, { damping: 10, stiffness: 100 }));

    // Link animation
    linkOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
    linkTranslateY.value = withDelay(1000, withSpring(0, { damping: 10, stiffness: 100 }));
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const linkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: linkOpacity.value,
    transform: [{ translateY: linkTranslateY.value }],
  }));

  const signUpButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signUpButtonScale.value }],
  }));

  const signInLinkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signInLinkScale.value }],
  }));

  // Checkbox animated styles
  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkboxScale.value },
      { rotate: `${checkboxRotation.value}deg` }
    ],
  }));

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkmarkScale.value },
      { rotate: `${checkmarkRotation.value}deg` }
    ],
  }));

  // Modal animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));

  // Verification modal animated styles
  const verificationModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: verificationModalOpacity.value,
    transform: [
      { scale: verificationModalScale.value },
      { translateY: verificationModalTranslateY.value }
    ],
  }));



  // Welcome modal animated styles
  const welcomeModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: welcomeModalOpacity.value,
    transform: [
      { scale: welcomeModalScale.value },
      { translateY: welcomeModalTranslateY.value }
    ],
  }));

  const welcomeIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: welcomeIconScale.value },
      { rotate: `${welcomeIconRotation.value}deg` }
    ],
  }));

  // Button handlers
  const handleSignUpPressIn = () => {
    signUpButtonScale.value = withSpring(0.95);
  };

  const handleSignUpPressOut = () => {
    signUpButtonScale.value = withSpring(1);
  };

  const handleSignInLinkPressIn = () => {
    signInLinkScale.value = withSpring(0.95);
  };

  const handleSignInLinkPressOut = () => {
    signInLinkScale.value = withSpring(1);
  };

  // Checkbox animation handlers
  const handleCheckboxPress = () => {
    if (!agreeToTerms) {
      // Show modal if checkbox is not checked
      showModal('privacy');
    } else {
      // Uncheck the checkbox if it's already checked
      setAgreeToTerms(false);
      
      // Uncheck animation
      checkboxScale.value = withSpring(0.9, { damping: 8, stiffness: 120 });
      checkboxRotation.value = withSpring(-180, { damping: 10, stiffness: 100 });
      checkmarkScale.value = withTiming(0, { duration: 150 });
      checkmarkRotation.value = withTiming(-180, { duration: 150 });
    }
  };

  // Modal animation handlers
  const showModal = (type: 'terms' | 'privacy') => {
    setModalType(type);
    setShowTermsModal(true);
    
    // Modal entrance animation
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    modalTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
  };

  const hideModal = () => {
    // Modal exit animation
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.8, { duration: 200 });
    modalTranslateY.value = withTiming(800, { duration: 200 });
    
    // Hide modal after animation
    setTimeout(() => {
      setShowTermsModal(false);
      setModalType(null);
    }, 200);
  };

  const handleAgree = () => {
    // Check the checkbox and animate it
    setAgreeToTerms(true);
    
    // Check animation
    checkboxScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    checkboxRotation.value = withSpring(360, { damping: 10, stiffness: 100 });
    checkmarkScale.value = withSequence(
      withDelay(100, withTiming(1.3, { duration: 200 })),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    checkmarkRotation.value = withSpring(0, { damping: 10, stiffness: 100 });
    
    hideModal();
  };

  const handleDecline = () => {
    // Don't check the checkbox, just close the modal
    hideModal();
  };





  // Cleanup effect to clear verification flag on unmount
  useEffect(() => {
    return () => {
      AsyncStorage.removeItem('is_verifying_signup');
    };
  }, []);

  // Welcome modal handlers
  const showWelcomeModalHandler = () => {
    console.log('🎊 showWelcomeModalHandler called');
    console.log('🔍 Current showWelcomeModal state before setState:', showWelcomeModal);
    setShowWelcomeModal(true);
    console.log('✅ showWelcomeModal state set to true');
    console.log('🔍 showWelcomeModal state after setState (may not be updated yet):', showWelcomeModal);
    
    // Welcome modal entrance animation
    console.log('🎬 Starting welcome modal animations...');
    welcomeModalOpacity.value = withTiming(1, { duration: 300 });
    welcomeModalScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    welcomeModalTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
    
    // Icon animation
    welcomeIconScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    welcomeIconRotation.value = withSpring(360, { damping: 10, stiffness: 100 });
    
    console.log('✅ Welcome modal animations started');
  };

  const hideWelcomeModal = () => {
    // Welcome modal exit animation
    welcomeModalOpacity.value = withTiming(0, { duration: 200 });
    welcomeModalScale.value = withTiming(0.8, { duration: 200 });
    welcomeModalTranslateY.value = withTiming(800, { duration: 200 });
    
    // Hide modal after animation
    setTimeout(() => {
      setShowWelcomeModal(false);
    }, 200);
  };


  const handleSetUpProfile = () => {
    hideWelcomeModal();
    // Navigate to profile edit page
    router.push('/myProfile/edit');
  };

  const handleExploreApp = () => {
    hideWelcomeModal();
    // Navigate to main app (account already created)
    router.replace('/(tabs)');
  };

  // Verification modal handlers
  const showVerificationModalHandler = () => {
    console.log('🔧 showVerificationModalHandler called, setting modal to true');
    setShowVerificationModal(true);
    
    // Simple animation - just make it visible immediately
    verificationModalOpacity.value = withTiming(1, { duration: 200 });
    verificationModalScale.value = withTiming(1, { duration: 200 });
    verificationModalTranslateY.value = withTiming(0, { duration: 200 });
  };

  const hideVerificationModal = () => {
    // Verification modal exit animation
    verificationModalOpacity.value = withTiming(0, { duration: 200 });
    verificationModalScale.value = withTiming(0.8, { duration: 200 });
    verificationModalTranslateY.value = withTiming(50, { duration: 200 });
    
    // Hide modal after animation
    setTimeout(() => {
      setShowVerificationModal(false);
    }, 200);
  };











  // Verification code handling functions
  const handleVerificationCodeChange = (index: number, value: string) => {
    // Handle paste functionality - if value is longer than 1 character, it's likely a paste
    if (value.length > 1) {
      const pastedCode = value.replace(/\D/g, '').slice(0, 6); // Remove non-digits and limit to 6
      const newCode = ['', '', '', '', '', ''];
      
      // Fill the code array with pasted digits
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newCode[i] = pastedCode[i];
      }
      
      setVerificationCode(newCode);
      
      // Focus the next empty field or the last field if all are filled
      const nextEmptyIndex = newCode.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      
      setTimeout(() => {
        verificationInputRefs.current[focusIndex]?.focus();
      }, 100);
      
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
  };

  const handleVerificationKeyPress = (index: number, key: string) => {
    // Handle backspace - focus previous input if current is empty
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      setTimeout(() => {
        verificationInputRefs.current[index - 1]?.focus();
      }, 100);
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerificationLoading(true);
      
      console.log('🔄 Resending OTP verification code...');
      
      if (!tempSignupData) {
        throw new Error('Signup data not found. Please try signing up again.');
      }
      
      // Resend OTP verification code
      const { data, error } = await supabase.auth.signInWithOtp({
        email: tempSignupData.email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: '',
            phone_number: tempSignupData.phoneNumber,
            company_id: tempSignupData.companyId
          }
        }
      });
      
      if (error) {
        console.error('❌ Error resending OTP:', error);
        throw new Error(`Failed to resend verification code: ${error.message}`);
      }
      
      // Clear the current verification code input
      setVerificationCode(['', '', '', '', '', '']);
      
      console.log('✅ OTP verification code resent successfully');
      showSuccess('Code Resent!', 'A new 6-digit verification code has been sent to your email.');
      
    } catch (error: any) {
      console.error('❌ Error resending verification:', error);
      showError('Resend Failed', error.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      showError('Incomplete Code', 'Please enter the complete 6-digit verification code');
      return;
    }
    
    try {
      setVerificationLoading(true);
      setIsVerifyingSignup(true); // Set flag to prevent auth redirect
      
      // Set flag in AsyncStorage to prevent auth redirect
      await AsyncStorage.setItem('is_verifying_signup', 'true');
      
      console.log('🔐 Verifying OTP code:', code);
      
      if (!tempSignupData) {
        throw new Error('Signup data not found. Please try signing up again.');
      }
      
      // Verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email: tempSignupData.email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        
        // Handle specific OTP errors
        if (error.message?.includes('Invalid token')) {
          throw new Error('Invalid verification code. Please check the code and try again.');
        } else if (error.message?.includes('Token has expired')) {
          throw new Error('Verification code has expired. Please request a new code.');
        } else {
          throw new Error(`Verification failed: ${error.message}`);
        }
      }

      // Double-check that we have a valid session after verification
      if (!data.session || !data.user) {
        throw new Error('Verification failed. Please try again.');
      }

      console.log('✅ OTP verification successful!');
      console.log('👤 User ID:', data.user?.id);
      console.log('🔐 Session created:', !!data.session);
      
      // Now update the user's password since OTP doesn't set a password (async to not block UI)
      if (data.user && tempSignupData.password) {
        console.log('🔑 Setting user password asynchronously...');
        
        // Don't await this - let it run in background
        supabase.auth.updateUser({
          password: tempSignupData.password
        }).then(({ error: updateError }) => {
          if (updateError) {
            console.error('❌ Password update error:', updateError);
            console.log('⚠️ Password update failed, but user is verified');
          } else {
            console.log('✅ Password set successfully');
          }
        }).catch((passwordError) => {
          console.error('❌ Password update exception:', passwordError);
          console.log('⚠️ Password update failed, but user is verified');
        });
      }
      
      // Clear temporary signup data
      setTempSignupData(null);
      
      // Hide verification modal
      hideVerificationModal();
      
      // Show success message
      showSuccess('Account Created!', 'Your account has been successfully created and verified.');
      
      // Show welcome modal after successful verification
      console.log('📱 About to show welcome modal in 1 second...');
      console.log('🔍 Current showWelcomeModal state:', showWelcomeModal);
      
      // Clear the verification flag to allow normal auth flow
      setIsVerifyingSignup(false);
      await AsyncStorage.removeItem('is_verifying_signup');
      
      // Test: Show modal immediately first
      console.log('🧪 TEST: Showing welcome modal immediately...');
      showWelcomeModalHandler();
      
      setTimeout(() => {
        console.log('🎊 Calling showWelcomeModalHandler again after delay...');
        console.log('🔍 showWelcomeModal state before calling handler:', showWelcomeModal);
        showWelcomeModalHandler();
        console.log('🔍 showWelcomeModal state after calling handler:', showWelcomeModal);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error during verification:', error);
      showError('Verification Failed', error.message || 'An error occurred during verification. Please try again.');
      
      // Clear the verification flag on error
      setIsVerifyingSignup(false);
      await AsyncStorage.removeItem('is_verifying_signup');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Validation function
  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      password.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      password === confirmPassword &&
      password.length >= 6 &&
      validateEmail(email) &&
      agreeToTerms
    );
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      showError('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (!agreeToTerms) {
      showWarning('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    if (!validateEmail(email)) {
      showError('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedPhoneNumber = phoneNumber ? sanitizeInput(phoneNumber) : '';
      const sanitizedCompanyId = companyId ? sanitizeInput(companyId) : '';

      // Sanitize and validate email
      const sanitizedEmail = sanitizeEmail(email);
      console.log('🚀 Sending OTP verification code...');
      console.log('📧 Original email:', email);
      console.log('📧 Sanitized email:', sanitizedEmail);
      console.log('📱 Phone:', sanitizedPhoneNumber);
      console.log('🏢 Company ID:', sanitizedCompanyId);

      // Validate email format again after sanitization
      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format. Please check your email address.');
      }

      // Send OTP verification code (this will create the account if it doesn't exist)
      const { data, error } = await supabase.auth.signInWithOtp({
        email: sanitizedEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: '',
            phone_number: sanitizedPhoneNumber,
            company_id: sanitizedCompanyId
          }
        }
      });

      if (error) {
        console.error('❌ Supabase OTP error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
          throw new Error('Invalid email address. Please check your email and try again.');
        } else if (error.message?.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else {
          throw new Error(`Failed to send verification code: ${error.message}`);
        }
      }

      console.log('✅ OTP verification code sent successfully!');
      console.log('📧 Verification code sent to:', sanitizedEmail);
      
      // Store signup data for verification step
      setTempSignupData({
        email: sanitizedEmail,
        password: password,
        phoneNumber: phoneNumber,
        companyId: companyId
      });
      
      // Show verification modal
      showVerificationModalHandler();
      showSuccess('Verification Code Sent!', 'A 6-digit verification code has been sent to your email. Please enter it to complete signup.');
      
    } catch (error: any) {
      console.error('Error during signup:', error);
      showError('Signup Failed', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>∞</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.title}>Famora</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, subtitleAnimatedStyle]}>
          <Text style={styles.subtitle}>Register Using Your Credentials</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#17f196" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter Your Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number (optional)</Text>
            <View style={styles.inputContainer}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCode}>INA</Text>
                <Text style={styles.countryArrow}>▼</Text>
              </View>
              <Phone size={20} color="#17f196" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="+62 0000 0000 0000"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Company ID Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company ID (optional)</Text>
            <View style={styles.inputContainer}>
              <Building size={20} color="#17f196" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter Company ID"
                placeholderTextColor="#999"
                value={companyId}
                onChangeText={setCompanyId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#17f196" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="My Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <Eye size={20} color="#17f196" strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color="#17f196" strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#17f196" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm My Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <Eye size={20} color="#17f196" strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color="#17f196" strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Pressable
              style={styles.checkboxContainer}
              onPress={handleCheckboxPress}
            >
              <Animated.View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked, checkboxAnimatedStyle]}>
                {agreeToTerms && (
                  <Animated.View style={checkmarkAnimatedStyle}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </Animated.View>
                )}
              </Animated.View>
              <Text style={styles.termsText}>
                I agree with{' '}
                <Text style={styles.termsLink}>terms & conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>privacy policy</Text>
              </Text>
            </Pressable>
          </View>
        </Animated.View>

         {/* Sign Up Button */}
         <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
           <AnimatedPressable
             style={[
               styles.signUpButton, 
               signUpButtonAnimatedStyle,
               (!isFormValid() || loading) && styles.signUpButtonDisabled
             ]}
             onPress={handleSignUp}
             onPressIn={handleSignUpPressIn}
             onPressOut={handleSignUpPressOut}
             disabled={!isFormValid() || loading}
           >
             <Text style={[
               styles.signUpButtonText,
               (!isFormValid() || loading) && styles.signUpButtonTextDisabled
             ]}>
               {loading ? 'Creating Account...' : 'Sign Up'}
             </Text>
           </AnimatedPressable>
         </Animated.View>

        {/* Sign In Link */}
        <Animated.View style={[styles.linkContainer, linkAnimatedStyle]}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <AnimatedPressable
              onPress={() => router.push('/(onboarding)/signin')}
              onPressIn={handleSignInLinkPressIn}
              onPressOut={handleSignInLinkPressOut}
              style={signInLinkAnimatedStyle}
            >
              <Text style={styles.signInLink}>Sign in here</Text>
            </AnimatedPressable>
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <View style={styles.modalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>
                 Terms & Conditions and Privacy Policy
               </Text>
             </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalText}>
                Terms and Conditions:

Acceptance: By using the Re-Dus app, you agree to comply with all applicable terms and conditions.

Usage: This app is for personal use only and may not be used for commercial purposes without permission.

Account: You are responsible for the security of your account and all activities that occur within it.

Content: You must not upload content that violates copyright, privacy, or applicable laws.

Changes: We reserve the right to change the terms and conditions at any time and will notify you of these changes through the app or via email.

Privacy Policy:

Data Collection: We collect personal data such as name, email, and location to process transactions and improve our services.

Data Usage: Your data is used for internal purposes such as account management, usage analysis, and service offerings.

Security: We protect your data with appropriate security measures to prevent unauthorized access.

Data Sharing: We do not share your personal data with third parties without your consent, except as required by law.

Your Rights: You can access, update, or delete your personal data at any time through the app settings or by contacting us.
              </Text>
            </ScrollView>
            
            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <Pressable onPress={handleAgree} style={styles.agreeButton}>
                <Text style={styles.agreeButtonText}>I Agree</Text>
              </Pressable>
              <Pressable onPress={handleDecline} style={styles.declineButton}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Email Verification Modal */}
      {showVerificationModal && (
        <View style={styles.verificationModalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <Animated.View style={[styles.verificationModalContainer, verificationModalAnimatedStyle]}>
            {/* Icon */}
            <View style={styles.verificationIconContainer}>
              <View style={styles.verificationIcon}>
                <Text style={styles.verificationIconText}>✉</Text>
                <View style={styles.verificationIconDot} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.verificationTitle}>Email Verification Required!</Text>

            {/* Description */}
            <Text style={styles.verificationDescription}>
              A 6-digit verification code has been sent to{' '}
              <Text style={styles.verificationEmail}>{email}</Text>{' '}
              to complete your account creation.
            </Text>

            {/* Verification Code Input */}
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
                  placeholder="0"
                  placeholderTextColor="#CCCCCC"
                  selectTextOnFocus={true}
                />
              ))}
            </View>

            {/* Resend Link */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Haven't received the verification code?{' '}
                <Text style={styles.resendLink} onPress={handleResendVerification}>
                  Resend it.
                </Text>
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable 
              style={[
                styles.verificationSubmitButton,
                (verificationCode.join('').length !== 6 || verificationLoading) && styles.verificationSubmitButtonDisabled
              ]}
              onPress={handleSubmitVerification}
              disabled={verificationCode.join('').length !== 6 || verificationLoading}
            >
              <Text style={[
                styles.verificationSubmitButtonText,
                (verificationCode.join('').length !== 6 || verificationLoading) && styles.verificationSubmitButtonTextDisabled
              ]}>
                {verificationLoading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <View style={styles.welcomeModalOverlay}>
          <Animated.View style={[styles.welcomeModalContainer, welcomeModalAnimatedStyle]}>
            {/* Icon */}
            <View style={styles.welcomeIconContainer}>
              <Animated.View style={[styles.welcomeIcon, welcomeIconAnimatedStyle]}>
                <Text style={styles.welcomeIconText}>👤</Text>
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={styles.welcomeTitle}>Welcome To Work Mate!</Text>

            {/* Description */}
            <Text style={styles.welcomeDescription}>
              To enhance your user experience, please set up your profile first. This will help us tailor the app to your needs and ensure you get the most out of our features!
            </Text>

            {/* Buttons */}
            <View style={styles.welcomeButtonContainer}>
              <Pressable 
                style={styles.welcomePrimaryButton}
                onPress={handleSetUpProfile}
              >
                <Text style={styles.welcomePrimaryButtonText}>Set Up My Profile</Text>
              </Pressable>
              
              <Pressable 
                style={styles.welcomeSecondaryButton}
                onPress={handleExploreApp}
              >
                <Text style={styles.welcomeSecondaryButtonText}>Explore The App First</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#17f196',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#17f196',
    marginRight: 4,
  },
  countryArrow: {
    fontSize: 12,
    color: '#17f196',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  eyeButton: {
    padding: 4,
  },
  termsContainer: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#17f196',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  termsLink: {
    color: '#17f196',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  signUpButton: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
   signUpButtonText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#FFFFFF',
     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
   },
   signUpButtonDisabled: {
     backgroundColor: '#CCCCCC',
     shadowColor: '#CCCCCC',
     shadowOpacity: 0.2,
   },
   signUpButtonTextDisabled: {
     color: '#999999',
   },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  signInLink: {
    color: '#17f196',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: 24,
     paddingVertical: 20,
   },
   modalTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#000000',
     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
   },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '90%',
    backgroundColor: '#F5F5F5',
    marginHorizontal: '5%',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  modalButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    alignItems: 'center',
  },
  declineButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  agreeButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  agreeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  
  // Verification Modal Styles
  verificationModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 2000,
  },
  verificationModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '40%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
  },
  verificationIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  verificationIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verificationIconText: {
    fontSize: 50,
    color: '#FFFFFF',
  },
  verificationIconDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  verificationDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  verificationEmail: {
    fontWeight: 'bold',
    color: '#17f196',
  },
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  verificationCodeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#F8F8F8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  resendLink: {
    color: '#17f196',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  verificationSubmitButton: {
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verificationSubmitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  verificationSubmitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowColor: '#CCCCCC',
    shadowOpacity: 0.2,
  },
  verificationSubmitButtonTextDisabled: {
    color: '#999999',
  },
  
  // Welcome Modal Styles
  welcomeModalOverlay: {
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
  welcomeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '50%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  welcomeIconContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 16,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#17f196',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeIconText: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  welcomeButtonContainer: {
    gap: 16,
  },
  welcomePrimaryButton: {
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomePrimaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  welcomeSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
