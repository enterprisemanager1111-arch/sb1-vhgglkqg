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
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sanitizeInput, validateEmail } from '@/utils/sanitization';


export default function SignIn() {
  const { signIn, profile } = useAuth();
  const { completeStep, updateAuthInfo } = useOnboarding();
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError, showWarning } = useCustomAlert();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldCheckProfile, setShouldCheckProfile] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Check profile when it's loaded and we need to check it
  useEffect(() => {
    if (shouldCheckProfile && profile !== undefined) {
      console.log('🔄 Profile loaded, checking if name exists...');
      
      // Check if profile exists and has a name
      if (!profile || !profile.name || profile.name.trim() === '') {
        console.log('🔄 User profile missing name, redirecting to profile edit page');
        router.replace('/myProfile/edit');
      } else {
        console.log('✅ User profile has name, redirecting to main app');
        router.replace('/(tabs)');
      }
      
      // Reset the flag
      setShouldCheckProfile(false);
    }
  }, [profile, shouldCheckProfile]);

  // Add timeout mechanism for profile checking
  useEffect(() => {
    if (shouldCheckProfile) {
      console.log('🔄 Profile check initiated, setting timeout...');
      
      const profileTimeout = setTimeout(() => {
        if (shouldCheckProfile) {
          console.log('⚠️ Profile check timeout reached, proceeding with default navigation');
          console.log('⚠️ Profile value after timeout:', profile);
          
          // If profile is still undefined after timeout, assume no profile exists
          if (profile === undefined) {
            console.log('🔄 Profile still undefined after timeout, redirecting to profile edit page');
            router.replace('/myProfile/edit');
          } else if (!profile || !profile.name || profile.name.trim() === '') {
            console.log('🔄 Profile exists but no name after timeout, redirecting to profile edit page');
            router.replace('/myProfile/edit');
          } else {
            console.log('✅ Profile has name after timeout, redirecting to main app');
            router.replace('/(tabs)');
          }
          
          // Reset the flag
          setShouldCheckProfile(false);
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(profileTimeout);
    }
  }, [shouldCheckProfile, profile]);
  
  // Individual button scales


  // Checkbox handlers
  const handleCheckboxPress = () => {
    setRememberMe(!rememberMe);
  };





  const handleSignIn = async () => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedEmail || !sanitizedPassword) {
      showError(
        t('onboarding.auth.errors.missingInformation') || 'Missing Information',
        t('onboarding.auth.errors.missingInformationMessage') || 'Please fill in all fields'
      );
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      showError(
        t('onboarding.auth.errors.invalidEmail') || 'Invalid Email',
        t('onboarding.auth.errors.invalidEmail') || 'Please enter a valid email address'
      );
      return;
    }

    if (sanitizedPassword.length < 6) {
      showError(
        t('onboarding.auth.errors.weakPassword') || 'Weak Password',
        t('onboarding.auth.errors.weakPasswordMessage') || 'Password must be at least 6 characters'
      );
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    showLoading('Signing in...');
    
    try {
      console.log('🔐 Attempting signin with:', { email: sanitizedEmail });
      console.log('🔐 Password length:', sanitizedPassword.length);
      
      await updateAuthInfo({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      await signIn(sanitizedEmail, sanitizedPassword);
      
      await completeStep('authentication', {
        email: sanitizedEmail,
        method: 'login'
      });
      
      showSuccess(
        t('onboarding.auth.success.welcomeBack') || 'Welcome Back!',
        t('onboarding.auth.success.signInSuccess') || 'Successfully signed in!'
      );
      
      // Set flag to check profile when it's loaded
      console.log('🔐 Sign-in successful, setting shouldCheckProfile to true');
      console.log('🔐 Current profile value:', profile);
      console.log('🔐 Profile type:', typeof profile);
      setShouldCheckProfile(true);
      
    } catch (error: any) {
      let errorMessage = t('onboarding.auth.errors.generalError') || 'An error occurred';
      
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        errorMessage = t('onboarding.auth.errors.userAlreadyExists') || 'This email is already registered. Try signing in.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = t('onboarding.auth.errors.invalidCredentials') || 'Email or password is incorrect. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = t('onboarding.auth.errors.emailNotConfirmed') || 'Please confirm your email address via the link in the email.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = t('onboarding.auth.errors.tooManyRequests') || 'Too many attempts. Please wait a moment and try again.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = t('onboarding.auth.errors.passwordRequirement') || 'Password must be at least 6 characters.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = t('onboarding.auth.errors.emailInvalid') || 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(
        t('onboarding.auth.errors.signInFailed') || 'Sign In Failed',
        errorMessage
      );
    } finally {
      setLoading(false);
      hideLoading();
    }
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

      {/* Custom Alert Banner */}

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('onboarding.auth.buttons.login') || 'Sign In'}</Text>
            </View>
            
            {/* Subtitle */}
            <View>
              <Text style={styles.subtitle}>{t('onboarding.auth.subtitle.login') || 'Sign in to your account'}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('onboarding.auth.form.email') || 'Email'}</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
                <View >
                  <RNImage 
                    source={require('@/assets/images/icon/email_address.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.auth.form.emailPlaceholder') || 'My Email'}
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

            {/* Password Input */}
            <View style={[styles.inputGroup, ]}>
              <Text style={styles.inputLabel}>{t('onboarding.auth.form.password') || 'Password'}</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
                <View >
                  <RNImage 
                    source={require('@/assets/images/icon/password.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder={t('onboarding.auth.form.passwordPlaceholder') || 'My Password'}
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <View >
                    {showPassword ? (
                      <EyeOff size={20} color="#88faca" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#88faca" strokeWidth={1.5} />
                    )}
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Options Row */}
            <View style={[styles.optionsRow, ]}>
              <Pressable 
                style={styles.checkboxContainer}
                onPress={handleCheckboxPress}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked, ]}>
                  {rememberMe && (
                    <Text style={[styles.checkmark, ]}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{t('onboarding.auth.options.rememberMe') || 'Remember Me'}</Text>
              </Pressable>
              
              <Pressable onPress={() => router.push('/(onboarding)/resetPwd')}>
                <Text style={styles.forgotPassword}>{t('onboarding.auth.options.forgotPassword') || 'Forgot Password'}</Text>
              </Pressable>
            </View>

            {/* Sign In Button */}
            <View >
              <Pressable
                style={[
                  styles.signInButton, 
,
                  loading && styles.signInButtonLoading
                ]}
                onPress={handleSignIn}
                disabled={loading}
              >
              <Text style={[
                styles.signInButtonText,
                loading && styles.signInButtonTextLoading
              ]}>
                {loading ? (t('onboarding.auth.buttons.loggingIn') || 'Signing In...') : (t('onboarding.auth.buttons.login') || 'Sign In')}
              </Text>
              </Pressable>
            </View>

            {/* Separator */}
            <View style={[styles.separator, ]}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>{t('onboarding.auth.separator') || 'OR'}</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Social Sign In Buttons */}
            <View style={[styles.socialButtons, ]}>
              <Pressable
                style={[styles.socialButton, ]}
              >
                <View >
                  <RNImage 
                    source={require('@/assets/images/icon/apple.png')}
                    style={styles.appleIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.socialButtonText}>{t('onboarding.auth.social.signInWithApple') || 'Sign in With Apple ID'}</Text>
              </Pressable>

              <Pressable
                style={[styles.socialButton, ]}
              >
                <View style={[styles.googleIcon, ]}>
                  <RNImage 
                    source={require('@/assets/images/icon/google.png')}
                    style={styles.googleIconImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.socialButtonText}>{t('onboarding.auth.social.signInWithGoogle') || 'Sign in With Google'}</Text>
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View style={[styles.signUpContainer, ]}>
              <Text style={styles.signUpText}>{t('onboarding.auth.toggle.toSignup') || "Don't have an account? "}</Text>
              <Pressable onPress={() => router.push('/(onboarding)/signup')}>
                <Text style={styles.signUpLink}>{t('onboarding.auth.toggle.signupLink') || 'Sign Up Here'}</Text>
              </Pressable>
            </View>
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
    justifyContent: 'flex-end',
  },

  // Upper Section (40% of screen)
  upperSection: {
    height: 170,
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

  // Lower Section (White Card)
  lowerSection: {
    flex: 0.85,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30,
    marginTop: -30,
    position: 'relative',
  },
  contentCard: {
    flex: 1,
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontStyle: 'Semi Bold',
    color: '#161618',
    fontFamily: 'Helvetica',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'Medium',
    color: '#475467',
    fontFamily: 'Helvetica',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
     marginBottom: 20,
    alignSelf: 'center',
  },

  // Form
  form: {
    flex: 1,
     gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  inputGroup: {
    gap: 8,
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
  checkboxLabel: {
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: 'Helvetica',
    fontWeight: '450',
  },


  // Sign In Button
  signInButton: {
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
  signInButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
  },

  // Social Buttons
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconImage: {
    width: 16,
    height: 16,
  },
  appleIcon: {
    width: 20,
    height: 20,
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    marginLeft: 15,
    fontFamily: 'Helvetica',
  },

  // Sign Up Link
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpText: {
    fontSize: 12,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#263238',
    fontFamily: 'Helvetica',
  },
  signUpLink: {
    fontSize: 12,
    fontStyle: 'medium',
    color: '#37eba0',
    fontFamily: 'Helvetica',
    fontWeight: '500',
  },
});
