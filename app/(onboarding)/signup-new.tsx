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
import { sanitizeInput, validateEmail } from '@/utils/sanitization';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// Type declarations for global temporary data
declare global {
  var tempSignupData: {
    email: string;
    password: string;
    phoneNumber: string;
    companyId: string;
  } | undefined;
}

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
  
  const { signUp } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError, showWarning } = useCustomAlert();

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

  // Modal animations
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(50);

  // Welcome modal animations
  const welcomeModalOpacity = useSharedValue(0);
  const welcomeModalScale = useSharedValue(0.8);
  const welcomeModalTranslateY = useSharedValue(50);
  const welcomeIconScale = useSharedValue(0);
  const welcomeIconRotation = useSharedValue(0);

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

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));

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

  // Start animations on mount
  useEffect(() => {
    // Logo animation
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    logoRotation.value = withSpring(360, { damping: 8, stiffness: 100 });

    // Title animation
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 8, stiffness: 100 }));

    // Subtitle animation
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    subtitleTranslateY.value = withDelay(400, withSpring(0, { damping: 8, stiffness: 100 }));

    // Form animation
    formOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(600, withSpring(0, { damping: 8, stiffness: 100 }));

    // Button animation
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    buttonTranslateY.value = withDelay(800, withSpring(0, { damping: 8, stiffness: 100 }));

    // Link animation
    linkOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    linkTranslateY.value = withDelay(1000, withSpring(0, { damping: 8, stiffness: 100 }));
  }, []);

  // Modal handlers
  const showModal = (type: 'terms' | 'privacy') => {
    setModalType(type);
    if (type === 'terms') {
      setShowTermsModal(true);
    } else {
      setShowPrivacyModal(true);
    }
    
    // Modal entrance animation
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    modalTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
  };

  const hideModal = () => {
    // Modal exit animation
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.8, { duration: 200 });
    modalTranslateY.value = withTiming(50, { duration: 200 });
    
    // Hide modal after animation
    setTimeout(() => {
      setShowTermsModal(false);
      setShowPrivacyModal(false);
      setModalType(null);
    }, 200);
  };

  const handleAgree = () => {
    setAgreeToTerms(true);
    hideModal();
  };

  const handleDecline = () => {
    // Don't check the checkbox, just close the modal
    hideModal();
  };

  // Welcome modal handlers
  const showWelcomeModalHandler = () => {
    setShowWelcomeModal(true);
    
    // Welcome modal entrance animation
    welcomeModalOpacity.value = withTiming(1, { duration: 300 });
    welcomeModalScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    welcomeModalTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });
    
    // Icon animation
    welcomeIconScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 100 }));
    welcomeIconRotation.value = withDelay(200, withSpring(360, { damping: 8, stiffness: 100 }));
  };

  const hideWelcomeModal = () => {
    // Welcome modal exit animation
    welcomeModalOpacity.value = withTiming(0, { duration: 200 });
    welcomeModalScale.value = withTiming(0.8, { duration: 200 });
    welcomeModalTranslateY.value = withTiming(50, { duration: 200 });
    
    // Hide modal after animation
    setTimeout(() => {
      setShowWelcomeModal(false);
    }, 200);
  };

  const handleSetUpProfile = () => {
    hideWelcomeModal();
    // Navigate to profile setup
    router.push('/(onboarding)/profile');
  };

  const handleExploreApp = () => {
    hideWelcomeModal();
    // Navigate to main app
    router.push('/(tabs)');
  };

  // Form validation
  const isFormValid = 
    email.trim() !== '' &&
    password !== '' &&
    confirmPassword !== '' &&
    password === confirmPassword &&
    password.length >= 6 &&
    validateEmail(email) &&
    agreeToTerms
  ;

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

      console.log('🚀 Creating account with Supabase email verification:', {
        email: email.trim(),
        phoneNumber: sanitizedPhoneNumber,
        companyId: sanitizedCompanyId
      });

      // Store the signup data for later use after email confirmation
      global.tempSignupData = {
        email: email.trim(),
        password: password,
        phoneNumber: sanitizedPhoneNumber,
        companyId: sanitizedCompanyId
      };

      // Create account with Supabase - this will automatically send verification email
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: '', // Empty display name as requested
            phone_number: sanitizedPhoneNumber,
            company_id: sanitizedCompanyId
          },
        },
      });

      if (error) {
        console.error('Account creation error:', error);
        throw new Error(`Account creation failed: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('Account creation failed: No user returned');
      }

      console.log('✅ Account created successfully, verification email sent to:', email.trim());

      // Show success message
      showSuccess('Verification Email Sent!', 'Please check your email and click the verification link to complete your registration.');
      
      // Navigate to a confirmation page or show instructions
      // For now, we'll show a simple success state
      
    } catch (error: any) {
      console.error('Error during signup:', error);
      showError('Signup Failed', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/(onboarding)/signin');
  };

  // Button press animations
  const handleSignUpPress = () => {
    signUpButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
  };

  const handleSignInLinkPress = () => {
    signInLinkScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
  };

  const handleCheckboxPress = () => {
    checkboxScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
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
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Mail size={20} color="#666666" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Email Address"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Phone size={20} color="#666666" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Phone Number (Optional)"
              placeholderTextColor="#999999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Company ID Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Building size={20} color="#666666" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Company ID (Optional)"
              placeholderTextColor="#999999"
              value={companyId}
              onChangeText={setCompanyId}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color="#666666" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeIconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666666" />
              ) : (
                <Eye size={20} color="#666666" />
              )}
            </Pressable>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color="#666666" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeIconContainer}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#666666" />
              ) : (
                <Eye size={20} color="#666666" />
              )}
            </Pressable>
          </View>

          {/* Terms and Conditions */}
          <Animated.View style={[styles.termsContainer, checkboxAnimatedStyle]}>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => {
                handleCheckboxPress();
                setAgreeToTerms(!agreeToTerms);
              }}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Check size={16} color="#FFFFFF" />}
              </View>
            </Pressable>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => showModal('terms')}
              >
                Terms and Conditions
              </Text>
              {' '}and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => showModal('privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Sign Up Button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <AnimatedPressable
            style={[
              styles.signUpButton,
              signUpButtonAnimatedStyle,
              !isFormValid && styles.signUpButtonDisabled
            ]}
            onPress={handleSignUp}
            onPressIn={handleSignUpPress}
            disabled={!isFormValid || loading}
          >
            <Text style={[
              styles.signUpButtonText,
              !isFormValid && styles.signUpButtonTextDisabled
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
              onPress={handleSignIn}
              onPressIn={handleSignInLinkPress}
            >
              <Text style={styles.linkButton}>Sign In</Text>
            </AnimatedPressable>
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Terms Modal */}
      {(showTermsModal || showPrivacyModal) && (
        <View style={styles.modalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
            <Text style={styles.modalTitle}>
              {modalType === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
            </Text>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalText}>
                {modalType === 'terms' 
                  ? 'By using Famora, you agree to our terms and conditions. This includes but is not limited to proper use of the application, data privacy, and user responsibilities.'
                  : 'We respect your privacy and are committed to protecting your personal information. We collect only necessary data to provide our services and never share your information with third parties without consent.'
                }
              </Text>
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <Pressable 
                style={styles.modalButton}
                onPress={handleDecline}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.agreeButton]}
                onPress={handleAgree}
              >
                <Text style={styles.agreeButtonText}>Agree</Text>
              </Pressable>
            </View>
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
            <Text style={styles.welcomeTitle}>Welcome To Famora!</Text>

            {/* Description */}
            <Text style={styles.welcomeDescription}>
              Your account has been created successfully! Please check your email and click the verification link to complete your registration.
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17f196',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
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
    color: '#333333',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 16,
  },
  eyeIconContainer: {
    padding: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#17f196',
    borderColor: '#17f196',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#17f196',
    fontWeight: '600',
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpButtonTextDisabled: {
    color: '#999999',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  linkButton: {
    color: '#17f196',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  agreeButton: {
    backgroundColor: '#17f196',
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  declineButtonText: {
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  welcomeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeIconContainer: {
    marginBottom: 20,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIconText: {
    fontSize: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  welcomeButtonContainer: {
    width: '100%',
  },
  welcomePrimaryButton: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomePrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  welcomeSecondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#17f196',
  },
  welcomeSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17f196',
  },
});
