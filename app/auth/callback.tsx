import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

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
          // Navigate to main app
          router.replace('/(tabs)');
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
