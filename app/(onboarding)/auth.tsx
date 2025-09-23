import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const { width: screenWidth } = Dimensions.get('window');

interface NotificationProps {
  type: 'error' | 'success';
  message: string;
  visible: boolean;
  onClose: () => void;
}

function Notification({ type, message, visible, onClose }: NotificationProps) {
  const opacity = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : -50);
  
  React.useEffect(() => {
    opacity.value = withSpring(visible ? 1 : 0);
    translateY.value = withSpring(visible ? 0 : -50);
    
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <AnimatedView style={[styles.notification, type === 'error' ? styles.notificationError : styles.notificationSuccess, animatedStyle]}>
      {type === 'error' ? (
        <AlertCircle size={16} color="#FFFFFF" strokeWidth={2} />
      ) : (
        <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
      )}
      <Text style={styles.notificationText}>{message}</Text>
      <Pressable onPress={onClose} style={styles.notificationClose}>
        <X size={16} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </AnimatedView>
  );
}

export default function OnboardingAuth() {
  const { t, loading: languageLoading } = useLanguage();
  const { onboardingData, completeStep, updateAuthInfo, loading: onboardingLoading, updatePersonalInfo } = useOnboarding();
  const { signIn, signUp } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string; visible: boolean }>({
    type: 'error',
    message: '',
    visible: false
  });
  
  const buttonScale = useSharedValue(1);

  const showNotification = (type: 'error' | 'success', message: string) => {
    setNotification({ type, message, visible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // Load existing auth data on mount
  React.useEffect(() => {
    const authInfo = onboardingData.authInfo;
    if (authInfo.email) setEmail(authInfo.email);
  }, [onboardingData]);

  const handleAuth = async () => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    if (!sanitizedEmail || !sanitizedPassword || (!isLogin && !sanitizedConfirmPassword)) {
      showNotification('error', t('common.fillAllFields') || 'Please fill in all fields');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      showNotification('error', t('onboarding.auth.errors.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    if (!isLogin && sanitizedPassword.length < 6) {
      showNotification('error', t('onboarding.auth.errors.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }
    
    if (!isLogin && sanitizedPassword.length > 128) {
      showNotification('error', t('onboarding.auth.errors.passwordTooLong') || 'Password can be at most 128 characters');
      return;
    }

    if (!isLogin && sanitizedPassword !== sanitizedConfirmPassword) {
      showNotification('error', t('onboarding.auth.errors.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    showLoading(isLogin ? (t('onboarding.auth.buttons.loggingIn') || 'Signing in...') : (t('onboarding.auth.buttons.signingUp') || 'Signing up...'));
    
    try {
      await updateAuthInfo({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (isLogin) {
        await signIn(sanitizedEmail, sanitizedPassword);
        showNotification('success', 'Successfully signed in!');
        
        await completeStep('authentication', {
          email: sanitizedEmail,
          method: 'login'
        });
        
        setTimeout(() => {
          router.replace('/(onboarding)/profile');
        }, 1000);
      } else {
        // Wait for onboarding data to load first
        if (onboardingLoading) {
          console.log('DEBUG: Onboarding data still loading, waiting...');
          showNotification('error', 'Loading your information, please wait...');
          return;
        }
        
        // Get the actual name from onboarding data
        const actualName = onboardingData.personalInfo.name;
        console.log('DEBUG: Using name for signup:', actualName);
        console.log('DEBUG: Full onboarding data:', JSON.stringify(onboardingData, null, 2));
        console.log('DEBUG: Onboarding loading state:', onboardingLoading);
        
        // If no name is provided, redirect to personal info step first
        if (!actualName || actualName.trim() === '') {
          console.log('DEBUG: Name is empty, redirecting to personal info');
          showNotification('error', 'Please complete your personal information first');
          router.replace('/(onboarding)/personal');
          return;
        }
        
        // Get all personal info from onboarding data
        const birthDate = onboardingData.personalInfo.birthDate;
        const role = onboardingData.personalInfo.role;
        const interests = onboardingData.personalInfo.interests;
        console.log('DEBUG: Using complete personal info for signup:', { birthDate, role, interests });
        
        await signUp(sanitizedEmail, sanitizedPassword, actualName, birthDate, role, interests);
        showNotification('success', 'Account created successfully!');
        alert(`🎉 Signup successful! Welcome to Famora!\nName used: "${actualName}"`);
        
        await completeStep('authentication', {
          email: sanitizedEmail,
          method: 'signup',
          nameUsed: actualName
        });

        setTimeout(() => {
          router.replace('/(onboarding)/profile');
        }, 1000);
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred';
      
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        errorMessage = 'This email is already registered. Try signing in.';
        setIsLogin(true);
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
      
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Don't render until language is loaded
  if (languageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

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
          {/* Notification */}
          <Notification
            type={notification.type}
            message={notification.message}
            visible={notification.visible}
            onClose={hideNotification}
          />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to your account'
              : 'Create your Famora account'
            }
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color="#666666" strokeWidth={1.5} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('common.email')}
              placeholderTextColor="#888888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color="#666666" strokeWidth={1.5} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t('common.password')}
              placeholderTextColor="#888888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666666" strokeWidth={1.5} />
              ) : (
                <Eye size={20} color="#666666" strokeWidth={1.5} />
              )}
            </Pressable>
          </View>

          {/* Confirm Password Input (only for signup) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666666" strokeWidth={1.5} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor="#888888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666666" strokeWidth={1.5} />
                ) : (
                  <Eye size={20} color="#666666" strokeWidth={1.5} />
                )}
              </Pressable>
            </View>
          )}

          {/* Auth Button */}
          <AnimatedPressable
            style={[
              styles.authButton, 
              buttonAnimatedStyle,
              loading && styles.authButtonLoading
            ]}
            onPress={handleAuth}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
          >
            {loading && (
              <ActivityIndicator 
                size="small" 
                color="#161618" 
                style={styles.loadingSpinner} 
              />
            )}
            <Text style={[
              styles.authButtonText,
              loading && styles.authButtonTextLoading
            ]}>
              {loading 
                ? (isLogin ? t('onboarding.auth.buttons.loggingIn') || 'Signing in...' : t('onboarding.auth.buttons.signingUp') || 'Signing up...') 
                : (isLogin ? t('onboarding.auth.buttons.login') || 'Sign In' : t('onboarding.auth.buttons.signup') || 'Sign Up')
              }
            </Text>
          </AnimatedPressable>

          {/* Toggle Login/Signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </Text>
            </Pressable>
          </View>

        </View>
        </View>
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

  // Upper Section (Solid Background)
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
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
  },
  
  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#54FE54',
    width: 24,
    borderRadius: 12,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  form: {
    gap: 16,
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
  authButton: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  authButtonLoading: {
    opacity: 0.8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonTextLoading: {
    marginLeft: 8,
  },
  loadingSpinner: {
    marginRight: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Notification
  notification: {
    position: 'absolute',
    top: 80,
    left: 24,
    right: 24,
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    backdropFilter: 'blur(20px)',
  },
  notificationError: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#FF3B30',
  },
  notificationSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#34C759',
  },
  notificationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  notificationClose: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 4,
  },
});