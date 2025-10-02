import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          router.replace('/(onboarding)/signin');
          return;
        }
        
        if (data.session?.user) {
          console.log('✅ Email verification successful, user:', data.session.user.email);
          
          // Check if this is a new user verification (from signup)
          const isVerifyingSignup = await AsyncStorage.getItem('is_verifying_signup');
          
          if (isVerifyingSignup === 'true') {
            console.log('🔄 New user verification detected, redirecting to signup page');
            // Redirect back to signup page
            router.replace('/(onboarding)/signup');
          } else {
            console.log('🔄 Existing user verification, redirecting to main app');
            // Navigate to main app for existing users
            router.replace('/(tabs)');
          }
        } else {
          console.log('⚠️ No session found, redirecting to signin');
          router.replace('/(onboarding)/signin');
        }
      } catch (error) {
        console.error('❌ Auth callback failed:', error);
        router.replace('/(onboarding)/signin');
      }
    };
    
    handleAuthCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#17f196" />
      <Text style={styles.text}>Verifying your email...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Arial',
  },
});
