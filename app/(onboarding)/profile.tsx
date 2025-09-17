import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Camera, User, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { isFeatureAvailable, showFeatureUnavailableAlert } from '@/utils/expoGoCompatibility';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { formatBirthDate, calculateAge } from '@/utils/birthdaySystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileCompletion() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user, profile, updateProfile } = useAuth();
  const { onboardingData, clearOnboardingData, completeStep } = useOnboarding();
  const buttonScale = useSharedValue(1);

  const handleAvatarUpload = async () => {
    if (!isFeatureAvailable('imageLibrary')) {
      showFeatureUnavailableAlert('Image Selection');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'We need access to your photos to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!isFeatureAvailable('camera')) {
      showFeatureUnavailableAlert('Camera');
      return;
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!cameraPermission.granted) {
      Alert.alert('Permission Required', 'We need access to your camera to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const profileUpdates: any = {};
      
      if (avatarUri) {
        profileUpdates.avatar_url = avatarUri;
      }
      
      if (onboardingData.personalInfo.birthDate) {
        profileUpdates.birth_date = onboardingData.personalInfo.birthDate;
      }
      
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
      }

      await completeStep('profile-picture', {
        hasAvatar: !!avatarUri,
        profileCompleted: true
      });

      router.replace('/(onboarding)/family');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Profile could not be updated. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(onboarding)/family');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/auth');
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

  // FIXED: Vereinfachte Username-Logik
  const userName = (() => {
    // 1. Erste Priorität: Direkt aus Onboarding-Daten
    const onboardingName = onboardingData?.personalInfo?.name;
    if (onboardingName && onboardingName.trim() && onboardingName.length > 0) {
      return onboardingName.trim();
    }
    
    // 2. Fallback: Auth metadata
    const metadataName = user?.user_metadata?.full_name;
    if (metadataName && metadataName.trim() && metadataName !== 'Familie Mitglied') {
      return metadataName.trim();
    }
    
    // 3. Fallback: Profil
    const profileName = profile?.name;
    if (profileName && profileName.trim() && profileName !== 'Familie Mitglied') {
      return profileName.trim();
    }
    
    return 'User';
  })();

  const userBirthday = onboardingData?.personalInfo?.birthDate || profile?.birth_date;
  const userRole = onboardingData?.personalInfo?.role;
  const userInterests = onboardingData?.personalInfo?.interests || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 4 of 5</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome, {userName}!</Text>
            <Text style={styles.subtitle}>
              Complete your profile to get started
            </Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri || profile?.avatar_url ? (
                <Image 
                  source={{ uri: avatarUri || profile?.avatar_url || undefined }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <User size={40} color="#666666" strokeWidth={1.5} />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={16} color="#161618" strokeWidth={2} />
              </View>
            </View>

            <Text style={styles.avatarLabel}>Add profile picture (optional)</Text>
            
            <View style={styles.avatarActions}>
              <Pressable style={styles.avatarActionButton} onPress={takePhoto}>
                <Camera size={18} color="#54FE54" strokeWidth={2} />
                <Text style={styles.avatarActionText}>Take Photo</Text>
              </Pressable>
              
              <Pressable style={styles.avatarActionButton} onPress={handleAvatarUpload}>
                <User size={18} color="#54FE54" strokeWidth={2} />
                <Text style={styles.avatarActionText}>From Gallery</Text>
              </Pressable>
            </View>
          </View>

          {/* Profile Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Your Profile</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Name</Text>
                <Text style={styles.summaryValue}>{userName}</Text>
              </View>
              
              {userBirthday && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Birthday</Text>
                  <Text style={styles.summaryValue}>
                    {formatBirthDate(userBirthday, false)} ({calculateAge(userBirthday)} years old)
                  </Text>
                </View>
              )}
              
              {userRole && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Role</Text>
                  <Text style={styles.summaryValue}>
                    {userRole === 'parent' ? 'Parent' :
                     userRole === 'child' ? 'Child' :
                     userRole === 'teen' ? 'Teenager' :
                     userRole === 'grandparent' ? 'Grandparent' :
                     'Other'}
                  </Text>
                </View>
              )}

              {userInterests.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Interests</Text>
                  <Text style={styles.summaryValue}>
                    {userInterests.slice(0, 3).join(', ')}
                    {userInterests.length > 3 && '...'}
                  </Text>
                </View>
              )}
              
              {user?.email && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Email</Text>
                  <Text style={styles.summaryValue}>{user.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <Check size={24} color="#54FE54" strokeWidth={2.5} />
            </View>
            <Text style={styles.successTitle}>Profile created successfully!</Text>
            <Text style={styles.successText}>
              Your account is ready. Next, we'll set up your family.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Überspringen</Text>
        </Pressable>
        
        <AnimatedPressable
          style={[styles.continueButton, buttonAnimatedStyle]}
          onPress={handleComplete}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
        >
          <Text style={styles.continueText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
          {!loading && <ChevronRight size={20} color="#161618" strokeWidth={2} />}
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
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

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  
  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 16,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },

  // Summary Section
  summarySection: {
    marginBottom: 40,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    flex: 1,
    textAlign: 'right',
  },

  // Success Section
  successSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F3F3F5',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
});