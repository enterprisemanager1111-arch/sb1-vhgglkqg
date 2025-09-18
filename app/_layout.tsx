import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import CustomSplashScreen from '@/components/SplashScreen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  useEffect(() => {
    // Hide the Expo splash screen once fonts are loaded
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      
      // If fonts failed to load, continue anyway after a short delay
      if (fontError) {
        console.warn('Font loading failed, continuing with system fonts:', fontError);
      }
    }
  }, [fontsLoaded, fontError]);

  // Show loading for a maximum of 3 seconds, then continue anyway
  const [forceRender, setForceRender] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceRender(true);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Don't render the app until fonts are loaded or timeout reached
  if (!fontsLoaded && !fontError && !forceRender) {
    return null;
  }

  // Show custom splash screen
  if (showCustomSplash) {
    return <CustomSplashScreen onFinish={() => setShowCustomSplash(false)} />;
  }

  return (
    <LanguageProvider>
      <LoadingProvider>
        <OnboardingProvider>
          <AuthProvider>
            <FamilyProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
            </FamilyProvider>
          </AuthProvider>
        </OnboardingProvider>
      </LoadingProvider>
    </LanguageProvider>
  );
}