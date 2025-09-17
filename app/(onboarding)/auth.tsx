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
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
  
  const { signUp, signIn } = useAuth();
  const buttonScale = useSharedValue(1);
  const { onboardingData, updateAuthInfo } = useOnboarding();
  const { completeStep } = useOnboarding();

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
    
    if (!sanitizedEmail || !sanitizedPassword) {
      showNotification('error', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      showNotification('error', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    if (!isLogin && sanitizedPassword.length < 6) {
      showNotification('error', 'Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    
    if (!isLogin && sanitizedPassword.length > 128) {
      showNotification('error', 'Passwort darf maximal 128 Zeichen haben');
      return;
    }

    if (!isLogin && sanitizedPassword !== sanitizedConfirmPassword) {
      showNotification('error', 'Passwörter stimmen nicht überein');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    
    try {
      await updateAuthInfo({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (isLogin) {
        await signIn(sanitizedEmail, sanitizedPassword);
        showNotification('success', 'Erfolgreich angemeldet!');
        
        await completeStep('authentication', {
          email: sanitizedEmail,
          method: 'login'
        });
        
        setTimeout(() => {
          router.replace('/(onboarding)/profile');
        }, 1000);
      } else {
        // Get the actual name from onboarding data
        const actualName = onboardingData.personalInfo.name || 'Familie Mitglied';
        console.log('Using name for signup:', actualName);
        
        await signUp(sanitizedEmail, sanitizedPassword, actualName);
        showNotification('success', 'Konto wurde erfolgreich erstellt!');
        
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
      let errorMessage = 'Ein Fehler ist aufgetreten';
      
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        errorMessage = 'Diese E-Mail ist bereits registriert. Versuchen Sie sich anzumelden.';
        setIsLogin(true);
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'E-Mail-Adresse oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in der E-Mail.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Das Passwort muss mindestens 6 Zeichen haben.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

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
            {isLogin ? t('onboarding.auth.title.login') : t('onboarding.auth.title.signup')}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Bei Ihrem Konto anmelden'
              : 'Erstellen Sie Ihr Famora-Konto'
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
              placeholder="E-Mail-Adresse"
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
              placeholder="Passwort"
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
                placeholder="Passwort bestätigen"
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
            style={[styles.authButton, buttonAnimatedStyle]}
            onPress={handleAuth}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading 
                ? (isLogin ? 'Anmelden...' : 'Registrieren...') 
                : (isLogin ? 'Anmelden' : 'Registrieren')
              }
            </Text>
          </AnimatedPressable>

          {/* Toggle Login/Signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? 'Noch kein Konto? ' : 'Bereits ein Konto? '}
            </Text>
            <Pressable onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Registrieren' : 'Anmelden'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
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
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
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
    fontFamily: 'Montserrat-Regular',
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
    fontFamily: 'Montserrat-SemiBold',
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
    fontFamily: 'Montserrat-Regular',
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Notification
  notification: {
    position: 'absolute',
    top: 80,
    left: 24,
    right: 24,
    borderRadius: 16,
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
    fontFamily: 'Montserrat-SemiBold',
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