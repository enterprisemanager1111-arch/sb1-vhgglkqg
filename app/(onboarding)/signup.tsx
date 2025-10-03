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
import { Mail, Phone, Building, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sanitizeInput, validateEmail, sanitizeEmail } from '@/utils/sanitization';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';


export default function SignUp() {
  const router = useRouter()
  const { session, user } = useAuth();
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
  const [shouldShowWelcomeModal, setShouldShowWelcomeModal] = useState(false);
  const [welcomeModalDismissed, setWelcomeModalDismissed] = useState(false);
  const [navigatingToProfile, setNavigatingToProfile] = useState(false);
  
  // Use ref to track verification state to prevent race conditions
  const isVerifyingRef = useRef(false);
  const showWelcomeModalRef = useRef(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [generatedVerificationCode, setGeneratedVerificationCode] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);
  const [companyIdFocused, setCompanyIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
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
  const { t } = useLanguage();

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

  
  







  // Checkbox handlers
  const handleCheckboxPress = () => {
    if (!agreeToTerms) {
      // Show modal if checkbox is not checked
      showModal('privacy');
    } else {
      // Uncheck the checkbox if it's already checked
      setAgreeToTerms(false);
    }
  };

  // Modal handlers
  const showModal = (type: 'terms' | 'privacy') => {
    setModalType(type);
    setShowTermsModal(true);
  };

  const hideModal = () => {
    setShowTermsModal(false);
    setModalType(null);
  };

  const handleAgree = () => {
    // Check the checkbox
    setAgreeToTerms(true);
    
    hideModal();
  };

  const handleDecline = () => {
    // Don't check the checkbox, just close the modal
    hideModal();
  };





  // Check if user is already authenticated (but not during signup verification)
  useEffect(() => {
    const checkAuth = async () => {
      if (session && user) {
        // Check if we're in the middle of signup verification using refs for immediate access
        if (isVerifyingRef.current || showWelcomeModalRef.current || shouldShowWelcomeModal || !welcomeModalDismissed || navigatingToProfile) {
          console.log('🔄 Signup verification in progress or welcome modal showing, not redirecting yet');
          console.log('🔍 DEBUG: isVerifyingRef.current:', isVerifyingRef.current);
          console.log('🔍 DEBUG: showWelcomeModalRef.current:', showWelcomeModalRef.current);
          console.log('🔍 DEBUG: shouldShowWelcomeModal:', shouldShowWelcomeModal);
          console.log('🔍 DEBUG: welcomeModalDismissed:', welcomeModalDismissed);
          console.log('🔍 DEBUG: navigatingToProfile:', navigatingToProfile);
          console.log('🔍 DEBUG: isVerifyingSignup state:', isVerifyingSignup);
          console.log('🔍 DEBUG: showWelcomeModal state:', showWelcomeModal);
          return; // Don't redirect during verification or when welcome modal is shown
        }
        
        // Only redirect if we're not in any signup flow
        console.log('User is already authenticated and not in signup flow, redirecting to main app');
        router.replace('/(tabs)');
      }
    };
    
    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [session, user, isVerifyingSignup, showWelcomeModal, shouldShowWelcomeModal, welcomeModalDismissed, navigatingToProfile]);

  // Note: Using React state only for verification flag management
  // No AsyncStorage flags are used anymore

  // Welcome modal handlers
  const showWelcomeModalHandler = () => {
    console.log('🎊 showWelcomeModalHandler called');
    console.log('🔍 Current showWelcomeModal state before setState:', showWelcomeModal);
    
    // Set ref immediately to prevent race conditions
    showWelcomeModalRef.current = true;
    setShowWelcomeModal(true);
    
    console.log('✅ showWelcomeModal state set to true');
    console.log('✅ showWelcomeModalRef.current set to true');
    console.log('🔍 showWelcomeModal state after setState (may not be updated yet):', showWelcomeModal);
    
    console.log('🎬 Starting welcome modal...');
    console.log('✅ Welcome modal started');
    
    // Debug: Check flag status when showing modal
    setTimeout(() => {
      console.log('🔍 DEBUG: isVerifyingSignup state when showing welcome modal:', isVerifyingSignup);
      console.log('🔍 DEBUG: showWelcomeModalRef.current when showing welcome modal:', showWelcomeModalRef.current);
    }, 100);
  };

  const hideWelcomeModal = () => {
    setShowWelcomeModal(false);
    showWelcomeModalRef.current = false;
    setShouldShowWelcomeModal(false);
    setWelcomeModalDismissed(true);
  };


  const handleSetUpProfile = async () => {
    console.log('🎯 Set Up Profile button clicked!');
    hideWelcomeModal();
    
    // Set flag to prevent auth redirect during profile navigation
    setNavigatingToProfile(true);
    console.log('🔒 Setting navigatingToProfile flag to prevent auth redirect');
    
    // Clear the verification flag now that user has made a choice
    setIsVerifyingSignup(false);
    isVerifyingRef.current = false;
    console.log('🔓 Verification flag cleared in handleSetUpProfile, allowing normal auth flow');
    
    console.log('🔄 Navigating to /myProfile/edit...');
    
    // Navigate to profile edit page (replace to exit onboarding stack)
    // router.replace('/myProfile/edit');
    window.location = '/myProfile/edit';
    console.log('✅ Navigation call completed');
  };

  const handleExploreApp = async () => {
    console.log('🎯 Explore App button clicked!');
    hideWelcomeModal();
    
    // Clear the verification flag now that user has made a choice
    setIsVerifyingSignup(false);
    isVerifyingRef.current = false;
    console.log('🔓 Verification flag cleared in handleExploreApp, allowing normal auth flow');
    
    // Navigate to main app (account already created)
    router.replace('/(tabs)');
  };


  // Verification modal handlers
  const showVerificationModalHandler = () => {
    console.log('🔧 showVerificationModalHandler called, setting modal to true');
    setShowVerificationModal(true);
    
  };

  const hideVerificationModal = () => {
    setShowVerificationModal(false);
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
      showSuccess(
        t('onboarding.auth.success.codeResent') || 'Code Resent!',
        t('onboarding.auth.success.codeResentMessage') || 'A new 6-digit verification code has been sent to your email.'
      );
      
    } catch (error: any) {
      console.error('❌ Error resending verification:', error);
      showError(
        t('onboarding.auth.errors.resendFailed') || 'Resend Failed',
        error.message || 'Failed to resend verification code. Please try again.'
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      showError(
        t('onboarding.auth.errors.incompleteCode') || 'Incomplete Code',
        t('onboarding.auth.errors.incompleteCodeMessage') || 'Please enter the complete 6-digit verification code'
      );
      return;
    }
    
    try {
      setVerificationLoading(true);
      setIsVerifyingSignup(true); // Set flag to prevent auth redirect
      isVerifyingRef.current = true; // Set ref for immediate access
      
      // Set welcome modal flags BEFORE verification to prevent race condition
      console.log('📱 Setting welcome modal flags BEFORE verification...');
      showWelcomeModalRef.current = true;
      setShowWelcomeModal(true);
      setShouldShowWelcomeModal(true);
      setWelcomeModalDismissed(false);
      
      // Force a state update to ensure flags are set
      setTimeout(() => {
        showWelcomeModalRef.current = true;
        setShowWelcomeModal(true);
        setShouldShowWelcomeModal(true);
        setWelcomeModalDismissed(false);
        console.log('🔒 Welcome modal flags reinforced');
      }, 50);
      
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
      
      // Welcome modal flags already set before verification
      console.log('📱 Welcome modal flags already set, modal should be visible');
      
      // Force update modal state to ensure it's visible
      setTimeout(() => {
        console.log('🔍 DEBUG: Force updating welcome modal state...');
        showWelcomeModalRef.current = true;
        setShowWelcomeModal(true);
        setShouldShowWelcomeModal(true);
        setWelcomeModalDismissed(false);
        console.log('🔍 showWelcomeModal state after force update:', showWelcomeModal);
        console.log('🔍 showWelcomeModalRef.current after force update:', showWelcomeModalRef.current);
        console.log('🔍 shouldShowWelcomeModal after force update:', shouldShowWelcomeModal);
        console.log('🔍 welcomeModalDismissed after force update:', welcomeModalDismissed);
      }, 100);
      
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
      showSuccess(
        t('onboarding.auth.success.accountCreatedSuccess') || 'Account Created!',
        t('onboarding.auth.success.accountCreatedMessage') || 'Your account has been successfully created and verified.'
      );
      
      // Show welcome modal after successful verification
      console.log('📱 Welcome modal flags already set, modal should be visible');
      
      // Keep the verification flag active until user interacts with welcome modal
      // This prevents AuthContext from redirecting to home page
      console.log('🔒 Keeping verification flag active to prevent auto-redirect');
      
      // Debug: Check if modal state actually updated
      setTimeout(() => {
        console.log('🔍 DEBUG: showWelcomeModal state after 500ms:', showWelcomeModal);
        console.log('🔍 DEBUG: isVerifyingSignup state after 500ms:', isVerifyingSignup);
        console.log('🔍 DEBUG: showWelcomeModalRef.current after 500ms:', showWelcomeModalRef.current);
        console.log('🔍 DEBUG: isVerifyingRef.current after 500ms:', isVerifyingRef.current);
      }, 500);
      
    } catch (error: any) {
      console.error('Error during verification:', error);
      showError(
        t('onboarding.auth.errors.verificationFailed') || 'Verification Failed',
        error.message || 'An error occurred during verification. Please try again.'
      );
      
      // Clear the verification flag on error
      setIsVerifyingSignup(false);
      isVerifyingRef.current = false;
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
      showError(
        t('onboarding.auth.errors.missingInformation') || 'Missing Information',
        t('onboarding.auth.errors.missingInformationMessage') || 'Please fill in all required fields'
      );
      return;
    }

    if (password !== confirmPassword) {
      showError(
        t('onboarding.auth.errors.passwordMismatch') || 'Password Mismatch',
        t('onboarding.auth.errors.passwordMismatchMessage') || 'Passwords do not match'
      );
      return;
    }

    if (password.length < 6) {
      showError(
        t('onboarding.auth.errors.weakPassword') || 'Weak Password',
        t('onboarding.auth.errors.weakPasswordMessage') || 'Password must be at least 6 characters'
      );
      return;
    }

    if (!agreeToTerms) {
      showWarning(
        t('onboarding.auth.errors.termsRequired') || 'Terms Required',
        t('onboarding.auth.errors.termsRequiredMessage') || 'Please agree to the terms and conditions'
      );
      return;
    }

    if (!validateEmail(email)) {
      showError(
        t('onboarding.auth.errors.invalidEmail') || 'Invalid Email',
        t('onboarding.auth.errors.invalidEmail') || 'Please enter a valid email address'
      );
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
      showSuccess(
        t('onboarding.auth.success.verificationCodeSent') || 'Verification Code Sent!',
        t('onboarding.auth.success.verificationCodeSentMessage') || 'A 6-digit verification code has been sent to your email. Please enter it to complete signup.'
      );
      
    } catch (error: any) {
      console.error('Error during signup:', error);
      showError(
        t('onboarding.auth.errors.signupFailed') || 'Signup Failed',
        error.message || 'An unexpected error occurred. Please try again.'
      );
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
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <RNImage 
              source={require('@/assets/images/newImg/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('onboarding.auth.signup.title') || 'Famora'}</Text>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>{t('onboarding.auth.signup.subtitle') || 'Register Using Your Credentials'}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.auth.signup.form.email') || 'Email'}</Text>
            <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
              <RNImage 
                source={require('@/assets/images/icon/email_address.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.auth.signup.form.emailPlaceholder') || 'Enter Your Email'}
                placeholderTextColor="#888888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Phone Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.auth.signup.form.phoneNumber') || 'Phone Number (optional)'}</Text>
            <View style={[styles.inputContainer, phoneNumberFocused && styles.inputContainerFocused]}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCode}>INA</Text>
                <Text style={styles.countryArrow}>▼</Text>
              </View>
              <Phone size={20} color="#88faca" strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.auth.signup.form.phonePlaceholder') || '+62 0000 0000 0000'}
                placeholderTextColor="#888888"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                onFocus={() => setPhoneNumberFocused(true)}
                onBlur={() => setPhoneNumberFocused(false)}
              />
            </View>
          </View>

          {/* Company ID Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.auth.signup.form.companyId') || 'Company ID (optional)'}</Text>
            <View style={[styles.inputContainer, companyIdFocused && styles.inputContainerFocused]}>
              <RNImage 
                source={require('@/assets/images/icon/email_address.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.auth.signup.form.companyPlaceholder') || 'Enter Company ID'}
                placeholderTextColor="#888888"
                value={companyId}
                onChangeText={setCompanyId}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setCompanyIdFocused(true)}
                onBlur={() => setCompanyIdFocused(false)}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.auth.signup.form.password') || 'Password'}</Text>
            <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
              <RNImage 
                source={require('@/assets/images/icon/password.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.auth.signup.form.passwordPlaceholder') || 'My Password'}
                placeholderTextColor="#888888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <Eye size={20} color="#88faca" strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color="#88faca" strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('onboarding.auth.signup.form.confirmPassword') || 'Confirm Password'}</Text>
            <View style={[styles.inputContainer, confirmPasswordFocused && styles.inputContainerFocused]}>
              <RNImage 
                source={require('@/assets/images/icon/password.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.auth.signup.form.confirmPasswordPlaceholder') || 'Confirm My Password'}
                placeholderTextColor="#888888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <Eye size={20} color="#88faca" strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color="#88faca" strokeWidth={2} />
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
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.termsText}>
                {t('onboarding.auth.signup.terms.agreeText') || 'I agree with'}{' '}
                <Text style={styles.termsLink}>{t('onboarding.auth.signup.terms.termsLink') || 'terms & conditions'}</Text>
                {' '}{t('onboarding.auth.signup.terms.and') || 'and'}{' '}
                <Text style={styles.termsLink}>{t('onboarding.auth.signup.terms.privacyLink') || 'privacy policy'}</Text>
              </Text>
            </Pressable>
          </View>
        </View>

         {/* Sign Up Button */}
         <View style={styles.buttonContainer}>
           <Pressable
             style={[
               styles.signUpButton, 
               (!isFormValid() || loading) && styles.signUpButtonDisabled
             ]}
             onPress={handleSignUp}
             disabled={!isFormValid() || loading}
           >
             <Text style={[
               styles.signUpButtonText,
               (!isFormValid() || loading) && styles.signUpButtonTextDisabled
             ]}>
               {loading ? (t('onboarding.auth.signup.buttons.creatingAccount') || 'Creating Account...') : (t('onboarding.auth.signup.buttons.signUp') || 'Sign Up')}
             </Text>
           </Pressable>
         </View>

        {/* Sign In Link */}
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>
            {t('onboarding.auth.signup.buttons.alreadyHaveAccount') || 'Already have an account?'}{' '}
            <Pressable
              onPress={() => router.push('/(onboarding)/signin')}
            >
              <Text style={styles.signInLink}>{t('onboarding.auth.signup.buttons.signInHere') || 'Sign in here'}</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <View style={styles.modalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <View style={styles.modalContainer}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>
                 {t('onboarding.auth.signup.modals.terms.title') || 'Terms & Conditions and\nPrivacy Policy'}
               </Text>
             </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalText}>
                {t('onboarding.auth.signup.modals.terms.content') || 'Terms and Conditions:\nAcceptance: By using the Re-Dus app, you agree to comply with all applicable terms and conditions.\n\nUsage: This app is for personal use only and may not be used for commercial purposes without permission.\n\nAccount: You are responsible for the security of your account and all activities that occur within it.\n\nContent: You must not upload content that violates copyright, privacy, or applicable laws.\n\nChanges: We reserve the right to change the terms and conditions at any time and will notify you of these changes through the app or via email.\n\nPrivacy Policy:\nData Collection: We collect personal data such as name, email, and location to process transactions and improve our services.\n\nData Usage: Your data is used for internal purposes such as account management, usage analysis, and service offerings.\n\nSecurity: We protect your data with appropriate security measures to prevent unauthorized access.\n\nData Sharing: We do not share your personal data with third parties without your consent, except as required by law.\n\nYour Rights: You can access, update, or delete your personal data at any time through the app settings or by contacting us.'}
              </Text>
            </ScrollView>
            
            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <Pressable onPress={handleAgree} style={styles.agreeButton}>
                <Text style={styles.agreeButtonText}>{t('onboarding.auth.signup.modals.terms.agree') || 'I Agree'}</Text>
              </Pressable>
              <Pressable onPress={handleDecline} style={styles.declineButton}>
                <Text style={styles.declineButtonText}>{t('onboarding.auth.signup.modals.terms.decline') || 'Decline'}</Text>
              </Pressable>
            </View>
          </View>
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
          <View style={styles.verificationModalContainer}>
            {/* Icon */}
            <View style={styles.verificationIconContainer}>
                <View style={styles.verificationIcon}>
                  <RNImage 
                    source={require('@/assets/images/icon/sms-notification.png')}
                    style={styles.verificationIconImage}
                    resizeMode="contain"
                  />
                </View>
            </View>

            {/* Title */}
            <Text style={styles.verificationTitle}>{t('onboarding.auth.signup.modals.verification.title') || 'Email Verification Sent!'}</Text>

            {/* Description */}
            <Text style={styles.verificationDescription}>
            {t('onboarding.auth.signup.modals.verification.description') || 'A verification code will be sent to the email'}{' '}
              {email}{' '}
              {t('onboarding.auth.signup.modals.verification.forVerification') || 'for your account verification process.'}
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
                {t('onboarding.auth.signup.modals.verification.resendText') || "Haven't received the verification code?"}{' '}
                <Text style={styles.resendLink} onPress={handleResendVerification}>
                  {t('onboarding.auth.signup.modals.verification.resendLink') || 'Resend it.'}
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
                {verificationLoading ? (t('onboarding.auth.signup.modals.verification.verifying') || 'Verifying...') : (t('onboarding.auth.signup.modals.verification.verifyButton') || 'Verify Code')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Welcome Modal */}
      {(showWelcomeModal || shouldShowWelcomeModal) && !welcomeModalDismissed && (() => {
        console.log('🎭 DEBUG: Welcome modal is rendering! showWelcomeModal =', showWelcomeModal);
        console.log('🎭 DEBUG: shouldShowWelcomeModal =', shouldShowWelcomeModal);
        console.log('🎭 DEBUG: welcomeModalDismissed =', welcomeModalDismissed);
        console.log('🎭 DEBUG: showWelcomeModalRef.current =', showWelcomeModalRef.current);
        return (
          <View style={styles.welcomeModalOverlay}>
            <BlurView
              style={styles.welcomeBlurOverlay}
              intensity={80}
              tint="dark"
            />
            <View style={styles.welcomeModalContainer}>
            {/* Icon */}
            <View style={styles.welcomeIconContainer}>
              <View style={styles.welcomeIcon}>
                  <RNImage 
                    source={require('@/assets/images/icon/welcom_modal.png')}
                    style={styles.welcomeIconImage}
                    resizeMode="contain"
                  />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.welcomeTitle}>{t('onboarding.auth.signup.modals.welcome.title') || 'Welcome To Work Mate!'}</Text>

            {/* Description */}
            <Text style={styles.welcomeDescription}>
              {t('onboarding.auth.signup.modals.welcome.description') || 'To enhance your user experience, please set up your profile first. This will help us tailor the app to your needs and ensure you get the most out of our features!'}
            </Text>

            {/* Buttons */}
            <View style={styles.welcomeButtonContainer}>
              <Pressable 
                style={styles.welcomePrimaryButton}
                onPress={handleSetUpProfile}
              >
                <Text style={styles.welcomePrimaryButtonText}>{t('onboarding.auth.signup.modals.welcome.setUpProfile') || 'Set Up My Profile'}</Text>
              </Pressable>
              
              <Pressable 
                style={styles.welcomeSecondaryButton}
                onPress={handleExploreApp}
              >
                <Text style={styles.welcomeSecondaryButtonText}>{t('onboarding.auth.signup.modals.welcome.exploreApp') || 'Explore The App First'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
        );
      })()}
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
    marginTop: 24,
    marginBottom: 12,
  },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: '#17f196',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#000000',
    fontFamily: 'Helvetica',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'Medium',
    color: '#393b41',
    fontFamily: 'Helvetica',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
    color: '#475467',
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
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
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  eyeButton: {
    paddingHorizontal: 4,
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
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#58f6b4',
    backgroundColor: '#f3f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    // backgroundColor: '#17f196',
  },
  checkmark: {
    color: '#58f6b4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    fontFamily: 'Helvetica',
  },
  termsLink: {
    color: '#58f6b4',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  signUpButton: {
    width: '100%',
    height: 50,
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
   signUpButtonText: {
     fontSize: 14,
     fontStyle: 'medium',
     fontWeight: '500',
     color: '#FFFFFF',
     fontFamily: 'Helvetica',
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
    bottom: 30,
    width: 'calc(100% - 48px)',
    position: 'absolute',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#030407',
    fontFamily: 'Helvetica',
  },
  signInLink: {
    fontSize: 12,
    fontStyle: 'medium',
    color: '#37eba0',
    fontFamily: 'Helvetica',
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
     paddingVertical: 40,
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: '600',
     fontStyle: 'Semi Bold',
     color: '#101828',
     textAlign: 'center',
     marginBottom: 8,
     fontFamily: 'Helvetica',
   },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '90%',
    backgroundColor: '#f9fafb',
    marginHorizontal: '5%',
  },
  modalText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
    lineHeight: 22,
    color: '#344054',
    fontFamily: 'Helvetica',
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
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
  agreeButton: {
    width: '100%',
    height: 50,
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
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
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
    paddingHorizontal: 32,
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
  verificationIconImage: {
    width: 48,
    height: 48,
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
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  verificationDescription: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  verificationEmail: {
    fontWeight: 'bold',
    color: '#17f196',
  },
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    fontStyle: 'Semi Bold',
    color: '#000000',
    backgroundColor: '#fefefe',
    fontFamily: 'Helvetica',
  },
  resendContainer: {
    alignItems: 'left',
    marginBottom: 14,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
    color: '#666666',
    fontFamily: 'Helvetica',
  },
  resendLink: {
    color: '#58f6b4',
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
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 3000,
  },
  welcomeBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  welcomeModalContainer: {
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
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 30,
  },
  welcomeIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  welcomeIcon: {
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
  welcomeIconHexagon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeIconImage: {
    width: 48,
    height: 48,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  welcomeDescription: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'Medium',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  welcomeButtonContainer: {
    gap: 16,
  },
  welcomePrimaryButton: {
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomePrimaryButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  welcomeSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSecondaryButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
});
