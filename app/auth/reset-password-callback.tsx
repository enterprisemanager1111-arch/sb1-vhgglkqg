import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useCustomAlert } from '@/contexts/CustomAlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResetPasswordCallback() {
  const { showSuccess, showError } = useCustomAlert();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const params = useLocalSearchParams();

  useEffect(() => {
    // Load the stored password from the reset flow
    const loadStoredPassword = async () => {
      try {
        const storedPassword = await AsyncStorage.getItem('temp_new_password');
        const storedEmail = await AsyncStorage.getItem('temp_reset_email');
        
        if (storedPassword) {
          console.log('💾 Loaded stored password for reset');
          setNewPassword(storedPassword);
          setConfirmPassword(storedPassword);
        }
        
        if (storedEmail) {
          console.log('📧 Reset email:', storedEmail);
        }
      } catch (error) {
        console.error('❌ Error loading stored password:', error);
      }
    };

    loadStoredPassword();

    // Check if we have the necessary parameters for password reset
    if (params.access_token && params.refresh_token) {
      console.log('🔗 Password reset callback received');
      
      // Set the session using the tokens from the URL
      supabase.auth.setSession({
        access_token: params.access_token as string,
        refresh_token: params.refresh_token as string,
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ Error setting session:', error);
          showError('Reset Failed', 'Invalid reset link. Please try again.');
          router.replace('/(onboarding)/resetPwd');
        } else {
          console.log('✅ Session set successfully');
          setSession(data.session);
        }
      });
    } else {
      console.log('❌ Missing reset parameters');
      showError('Invalid Link', 'This reset link is invalid or expired.');
      router.replace('/(onboarding)/resetPwd');
    }
  }, [params]);

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

    if (loading) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Updating password...');
      console.log('🔐 New password length:', newPassword.length);
      
      // Update the password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        throw error;
      }

      console.log('✅ Password updated successfully');
      console.log('🔐 Password has been changed in Supabase');
      
      // Clean up stored data
      await AsyncStorage.removeItem('temp_new_password');
      await AsyncStorage.removeItem('temp_reset_email');
      console.log('🧹 Cleaned up temporary data');
      
      showSuccess('Password Updated!', 'Your password has been successfully updated. You can now sign in with your new password.');
      
      // Navigate to sign-in page
      setTimeout(() => {
        router.replace('/(onboarding)/signin');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error updating password:', error);
      showError('Update Failed', error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          Please enter your new password below
        </Text>

        <View style={styles.form}>
          {/* New Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Update Button */}
          <Pressable
            style={[styles.updateButton, loading && styles.updateButtonLoading]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={[styles.updateButtonText, loading && styles.updateButtonTextLoading]}>
              {loading ? 'Updating...' : 'Update Password'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 4,
  },
  updateButton: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonLoading: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonTextLoading: {
    color: '#999',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
