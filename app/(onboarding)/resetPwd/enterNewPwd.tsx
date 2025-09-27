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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

export default function EnterNewPassword() {
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError } = useCustomAlert();
  const params = useLocalSearchParams();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);

  useEffect(() => {
    // Get the current user's email from the session
    const loadUserEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          console.log('📧 Loaded email from session:', session.user.email);
        } else {
          // If no session, redirect back to resetPwd
          showError('Session Expired', 'Please start the password reset process again.');
          router.replace('/(onboarding)/resetPwd');
        }
      } catch (error) {
        console.error('❌ Error loading user email:', error);
        showError('Error', 'Failed to load user data.');
        router.replace('/(onboarding)/resetPwd');
      }
    };

    loadUserEmail();
  }, []);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', showPasswordSuccessModal);
  }, [showPasswordSuccessModal]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change in enterNewPwd:', event, session?.user?.id);
      
      if (event === 'USER_UPDATED' && passwordLoading) {
        console.log('🎉 Password update detected via auth state change');
        // Password was updated successfully, show modal
        setTimeout(() => {
          setPasswordLoading(false);
          hideLoading();
          setShowPasswordSuccessModal(true);
          console.log('🎉 Modal shown after auth state change');
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, [passwordLoading]);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      showError('Password Required', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords Do Not Match', 'Please make sure both passwords are the same.');
      return;
    }

    if (passwordLoading) {
      return;
    }

    setPasswordLoading(true);
    showLoading('Updating password...');
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Password update timeout - forcing cleanup');
      setPasswordLoading(false);
      hideLoading();
      showError('Timeout', 'Password update is taking too long. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      console.log('🔧 Starting password update process...');
      console.log('🔐 New password length:', newPassword.length);
      console.log('📧 Email:', email);
      
      // Update the password using Supabase
      console.log('🔄 Calling supabase.auth.updateUser...');
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('📊 Update result - data:', data);
      console.log('📊 Update result - error:', error);

      if (error) {
        console.error('❌ Password update error:', error);
        throw new Error(`Failed to update password: ${error.message}`);
      }
      
      console.log('✅ Password update API call successful');
      
      console.log('🎉 Password update completed - waiting for auth state change...');
      
      // Clear the timeout since we succeeded
      clearTimeout(timeoutId);
      
      // Backup: If auth state change doesn't trigger, show modal after 2 seconds
      setTimeout(() => {
        if (passwordLoading) {
          console.log('🔄 Backup: Showing modal after timeout');
          setPasswordLoading(false);
          hideLoading();
          setShowPasswordSuccessModal(true);
        }
      }, 2000);
      
      // Note: The modal will be shown by the auth state change listener
      
    } catch (error: any) {
      console.error('❌ Error updating password:', error);
      showError('Update Failed', error.message || 'Failed to update password. Please try again.');
      setPasswordLoading(false);
      hideLoading();
      
      // Clear the timeout since we handled the error
      clearTimeout(timeoutId);
    }
  };

  const handleBackPress = () => {
    router.back();
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
        onPress={handleBackPress}
      >
        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
      </Pressable>

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
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
            <View style={styles.header}>
              <Text style={styles.title}>Set New Password</Text>
            </View>
            
            {/* Subtitle */}
            <View>
              <Text style={styles.subtitle}>
                Please set a new password to secure your Famora account.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputContainer, newPasswordFocused && styles.inputContainerFocused]}>
                  <RNImage 
                    source={require('@/assets/images/icon/password.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Input Password"
                    placeholderTextColor="#888888"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => setNewPasswordFocused(false)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#17f196" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#17f196" strokeWidth={1.5} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={[styles.inputContainer, showConfirmPassword && styles.inputContainerFocused]}>
                  <RNImage 
                    source={require('@/assets/images/icon/password.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Re Enter Your Password"
                    placeholderTextColor="#888888"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onFocus={() => setShowConfirmPassword(true)}
                    onBlur={() => setShowConfirmPassword(false)}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#17f196" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#17f196" strokeWidth={1.5} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <View>
                <Pressable
                  style={[
                    styles.sendButton, 
                    (passwordLoading || !newPassword.trim() || !confirmPassword.trim()) && styles.sendButtonDisabled
                  ]}
                  onPress={handleUpdatePassword}
                  disabled={passwordLoading || !newPassword.trim() || !confirmPassword.trim()}
                >
                  <Text style={[
                    styles.sendButtonText,
                    (passwordLoading || !newPassword.trim() || !confirmPassword.trim()) && styles.sendButtonTextDisabled
                  ]}>
                    {passwordLoading ? 'Updating...' : 'Submit'}
                  </Text>
                </Pressable>
              </View>

            </View>
        </View>
      </View>

      {/* Password Success Modal */}
      {showPasswordSuccessModal && (
        <View style={styles.successModalOverlay}>
          <BlurView
            style={styles.blurOverlay}
            intensity={80}
            tint="dark"
          />
          <View style={styles.successModalContainer}>
            {/* Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <RNImage 
                  source={require('@/assets/images/icon/security-safe.png')}
                  style={styles.successIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.successTitle}>Password Has Been Created</Text>

            {/* Description */}
            <Text style={styles.successDescription}>
              To log in to your account, click the Sign in button and enter your email along with your new password.
            </Text>

            {/* Button */}
            <View style={styles.successButtonContainer}>
              <Pressable
                style={styles.successPrimaryButton}
                onPress={() => {
                  setShowPasswordSuccessModal(false);
                  router.replace('/(onboarding)/signin');
                }}
              >
                <Text style={styles.successPrimaryButtonText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    height: '50%',
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
    gap: 16,
    paddingBottom: 8,
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

  // Success Modal Styles - Same as profile edit page
  successModalOverlay: {
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
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    height: '30%',
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
  successIconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  successIcon: {
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
  successIconImage: {
    width: 48,
    height: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  successDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  successButtonContainer: {
    gap: 16,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  successPrimaryButton: {
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
  successPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
});
