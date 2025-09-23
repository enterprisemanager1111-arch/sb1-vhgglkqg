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
import { Mail, Lock, Eye, EyeOff, Apple } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLoading } from '@/contexts/LoadingContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignIn() {
  const { signIn } = useAuth();
  const { completeStep, updateAuthInfo } = useOnboarding();
  const { showLoading, hideLoading } = useLoading();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom Alert State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    message: '',
    type: 'error' // 'error', 'success', 'warning'
  });
  
  // Individual button scales
  const signInButtonScale = useSharedValue(1);
  const appleButtonScale = useSharedValue(1);
  const googleButtonScale = useSharedValue(1);

  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const emailInputOpacity = useSharedValue(0);
  const emailInputTranslateX = useSharedValue(-50);
  const passwordInputOpacity = useSharedValue(0);
  const passwordInputTranslateX = useSharedValue(50);
  const optionsOpacity = useSharedValue(0);
  const optionsScale = useSharedValue(0.8);
  const signInButtonOpacity = useSharedValue(0);
  const signInButtonContainerScale = useSharedValue(0.8);
  const separatorOpacity = useSharedValue(0);
  const separatorScale = useSharedValue(0);
  const socialButtonsOpacity = useSharedValue(0);
  const socialButtonsTranslateY = useSharedValue(30);
  const signUpLinkOpacity = useSharedValue(0);
  const signUpLinkTranslateY = useSharedValue(20);

  // Additional cool animations
  const iconFloat = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  const handleSignInPressIn = () => {
    signInButtonScale.value = withSpring(0.95);
  };

  const handleSignInPressOut = () => {
    signInButtonScale.value = withSpring(1);
  };

  const handleApplePressIn = () => {
    appleButtonScale.value = withSpring(0.95);
  };

  const handleApplePressOut = () => {
    appleButtonScale.value = withSpring(1);
  };

  const handleGooglePressIn = () => {
    googleButtonScale.value = withSpring(0.95);
  };

  const handleGooglePressOut = () => {
    googleButtonScale.value = withSpring(1);
  };

  const showCustomAlert = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setCustomAlert({
      visible: true,
      message,
      type
    });
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setCustomAlert(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const hideCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  // Animation trigger function
  const triggerAnimations = () => {
    // Title animation - bounce in from top
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Subtitle animation - fade in with slight delay
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));

    // Email input - slide in from left
    emailInputOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    emailInputTranslateX.value = withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }));

    // Password input - slide in from right
    passwordInputOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    passwordInputTranslateX.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Options - scale in with bounce
    optionsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    optionsScale.value = withDelay(800, withSpring(1, { damping: 8, stiffness: 120 }));

    // Sign In button - scale in with bounce
    signInButtonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    signInButtonContainerScale.value = withDelay(1000, withSpring(1, { damping: 8, stiffness: 120 }));

    // Separator - scale in
    separatorOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    separatorScale.value = withDelay(1200, withSpring(1, { damping: 10, stiffness: 100 }));

    // Social buttons - slide up with fade
    socialButtonsOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
    socialButtonsTranslateY.value = withDelay(1400, withSpring(0, { damping: 12, stiffness: 120 }));

    // Sign up link - fade in from bottom
    signUpLinkOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));
    signUpLinkTranslateY.value = withDelay(1600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Icon floating animation - continuous gentle float
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

  const handleSignIn = async () => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmail || !sanitizedPassword) {
      showCustomAlert('Please fill in all fields', 'error');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      showCustomAlert('Please enter a valid email address', 'error');
      return;
    }

    if (sanitizedPassword.length < 6) {
      showCustomAlert('Password must be at least 6 characters', 'error');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    showLoading('Signing in...');
    
    try {
      await updateAuthInfo({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      await signIn(sanitizedEmail, sanitizedPassword);
      
      await completeStep('authentication', {
        email: sanitizedEmail,
        method: 'login'
      });
      
      showCustomAlert('Successfully signed in!', 'success');
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
      
    } catch (error: any) {
      let errorMessage = 'An error occurred';
      
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        errorMessage = 'This email is already registered. Try signing in.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email or password is incorrect. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address via the link in the email.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showCustomAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  // Individual animated styles for buttons
  const signInButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signInButtonScale.value }],
  }));

  const appleButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appleButtonScale.value }],
  }));

  const googleButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleButtonScale.value }],
  }));

  // Component animated styles
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

  const passwordInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: passwordInputOpacity.value,
    transform: [{ translateX: passwordInputTranslateX.value }],
  }));

  const optionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: optionsOpacity.value,
    transform: [{ scale: optionsScale.value }],
  }));

  const signInButtonContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: signInButtonOpacity.value,
    transform: [{ scale: signInButtonContainerScale.value }],
  }));

  const separatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: separatorOpacity.value,
    transform: [{ scale: separatorScale.value }],
  }));

  const socialButtonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: socialButtonsOpacity.value,
    transform: [{ translateY: socialButtonsTranslateY.value }],
  }));

  const signUpLinkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: signUpLinkOpacity.value,
    transform: [{ translateY: signUpLinkTranslateY.value }],
  }));

  // Additional cool animated styles
  const iconFloatAnimatedStyle = useAnimatedStyle(() => ({
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

      {/* Custom Alert Banner */}
      {customAlert.visible && (
        <View style={[
          styles.alertBanner,
          customAlert.type === 'error' && styles.alertBannerError,
          customAlert.type === 'success' && styles.alertBannerSuccess,
          customAlert.type === 'warning' && styles.alertBannerWarning
        ]}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>!</Text>
          </View>
          <Text style={styles.alertText}>{customAlert.message}</Text>
          <Pressable onPress={hideCustomAlert} style={styles.alertCloseButton}>
            <Text style={styles.alertCloseText}>×</Text>
          </Pressable>
        </View>
      )}

      {/* Upper Section with Background Image */}
      <View style={styles.upperSection}>
        <RNImage 
          source={require('@/assets/images/newImg/background.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Dark Translucent Overlay */}
        <View style={styles.darkOverlay} />
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Animated.View style={[styles.header, titleAnimatedStyle]}>
              <Text style={styles.title}>Sign In</Text>
            </Animated.View>
            
            {/* Subtitle */}
            <Animated.View style={subtitleAnimatedStyle}>
              <Text style={styles.subtitle}>Sign in to my account</Text>
            </Animated.View>

            {/* Form */}
            <View style={styles.form}>
            {/* Email Input */}
            <Animated.View style={[styles.inputGroup, emailInputAnimatedStyle]}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Animated.View style={iconFloatAnimatedStyle}>
                  <Mail size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                </Animated.View>
                <TextInput
                  style={styles.input}
                  placeholder="My Email"
                  placeholderTextColor="#888888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View style={[styles.inputGroup, passwordInputAnimatedStyle]}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Animated.View style={iconFloatAnimatedStyle}>
                  <Lock size={20} color="#17f196" strokeWidth={1.5} style={styles.inputIcon} />
                </Animated.View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="My Password"
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Animated.View style={iconFloatAnimatedStyle}>
                    {showPassword ? (
                      <EyeOff size={20} color="#17f196" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#17f196" strokeWidth={1.5} />
                    )}
                  </Animated.View>
                </Pressable>
              </View>
            </Animated.View>

            {/* Options Row */}
            <Animated.View style={[styles.optionsRow, optionsAnimatedStyle]}>
              <Pressable 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </Pressable>
              
              <Pressable>
                <Text style={styles.forgotPassword}>Forgot Password</Text>
              </Pressable>
            </Animated.View>

            {/* Sign In Button */}
            <Animated.View style={signInButtonContainerAnimatedStyle}>
              <AnimatedPressable
                style={[
                  styles.signInButton, 
                  signInButtonAnimatedStyle,
                  loading && styles.signInButtonLoading
                ]}
                onPress={handleSignIn}
                onPressIn={handleSignInPressIn}
                onPressOut={handleSignInPressOut}
                disabled={loading}
              >
              <Text style={[
                styles.signInButtonText,
                loading && styles.signInButtonTextLoading
              ]}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
              </AnimatedPressable>
            </Animated.View>

            {/* Separator */}
            <Animated.View style={[styles.separator, separatorAnimatedStyle]}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.separatorLine} />
            </Animated.View>

            {/* Social Sign In Buttons */}
            <Animated.View style={[styles.socialButtons, socialButtonsAnimatedStyle]}>
              <AnimatedPressable
                style={[styles.socialButton, appleButtonAnimatedStyle]}
                onPressIn={handleApplePressIn}
                onPressOut={handleApplePressOut}
              >
                <Animated.View style={iconFloatAnimatedStyle}>
                  <Apple size={20} color="#17f196" strokeWidth={2} />
                </Animated.View>
                <Text style={styles.socialButtonText}>Sign in With Apple ID</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.socialButton, googleButtonAnimatedStyle]}
                onPressIn={handleGooglePressIn}
                onPressOut={handleGooglePressOut}
              >
                <Animated.View style={[styles.googleIcon, iconFloatAnimatedStyle]}>
                  <Text style={styles.googleIconText}>G</Text>
                </Animated.View>
                <Text style={styles.socialButtonText}>Sign in With Google</Text>
              </AnimatedPressable>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View style={[styles.signUpContainer, signUpLinkAnimatedStyle]}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(onboarding)/final')}>
                <Text style={styles.signUpLink}>Sign Up Here</Text>
              </Pressable>
            </Animated.View>
            </View>
          </ScrollView>
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

  // Upper Section (40% of screen)
  upperSection: {
    height: 200,
    backgroundColor: '#102118',
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
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#102118',
    opacity: 0.87,
    zIndex: 1,
  },

  // Lower Section (White Card)
  lowerSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    position: 'relative',
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 16,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
  },

  // Form
  form: {
    flex: 1,
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#17f196',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '450',
  },

  // Custom Alert Banner Styles
  alertBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertBannerError: {
    backgroundColor: '#ff4444',
  },
  alertBannerSuccess: {
    backgroundColor: '#17f196',
  },
  alertBannerWarning: {
    backgroundColor: '#ff9500',
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 18,
  },
  alertCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  alertCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    lineHeight: 20,
  },

  // Sign In Button
  signInButton: {
    width: '100%',
    height: 56,
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
  signInButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  signInButtonLoading: {
    opacity: 0.8,
  },
  signInButtonTextLoading: {
    opacity: 0.8,
  },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Social Buttons
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#17f196',
    marginLeft: 15,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Sign Up Link
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpText: {
    fontSize: 14,
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  signUpLink: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '450',
  },
});
