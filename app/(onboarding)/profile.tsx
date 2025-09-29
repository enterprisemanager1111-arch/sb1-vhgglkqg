import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image as RNImage,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Camera, User, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { isFeatureAvailable, showFeatureUnavailableAlert } from '@/utils/expoGoCompatibility';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatBirthDate, calculateAge } from '@/utils/birthdaySystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileCompletion() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user, profile, updateProfile } = useAuth();
  const { onboardingData, clearOnboardingData, completeStep } = useOnboarding();
  const { t, currentLanguage } = useLanguage();
  
  // Get locale for date formatting
  const getLocale = () => {
    switch (currentLanguage.code) {
      case 'de': return 'de-DE';
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'it': return 'it-IT';
      case 'nl': return 'nl-NL';
      default: return 'en-US';
    }
  };
  const buttonScale = useSharedValue(1);

  // Debug onboarding data on component mount
  React.useEffect(() => {
    const checkStorageAndData = async () => {
      console.log('DEBUG: ProfileCompletion mounted');
      console.log('DEBUG: Onboarding data from context:', onboardingData);
      console.log('DEBUG: Personal info from context:', onboardingData?.personalInfo);
      console.log('DEBUG: User profile:', profile);
      
      // Also check AsyncStorage directly
      try {
        const storedData = await AsyncStorage.getItem('@famora_onboarding_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          console.log('DEBUG: Data directly from AsyncStorage:', parsed.personalInfo);
        } else {
          console.log('DEBUG: No data found in AsyncStorage');
        }
      } catch (error) {
        console.log('DEBUG: Error reading from AsyncStorage:', error);
      }
    };
    
    checkStorageAndData();
  }, [onboardingData, profile]);

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
      console.log('DEBUG: Starting profile completion process');
      console.log('DEBUG: Current onboarding data:', onboardingData.personalInfo);
      
      const profileUpdates: any = {};
      
      if (avatarUri) {
        profileUpdates.avatar_url = avatarUri;
      }
      
      if (onboardingData.personalInfo.birthDate) {
        profileUpdates.birth_date = onboardingData.personalInfo.birthDate;
      }
      
      // Always save the name from personal info if it exists
      if (onboardingData.personalInfo.name) {
        profileUpdates.name = onboardingData.personalInfo.name;
      }
      
      // Update role and interests if available (in case they weren't set during initial profile creation)
      if (onboardingData.personalInfo.role) {
        profileUpdates.role = onboardingData.personalInfo.role;
      }
      
      if (onboardingData.personalInfo.interests && onboardingData.personalInfo.interests.length > 0) {
        profileUpdates.interests = onboardingData.personalInfo.interests;
      }
      
      if (Object.keys(profileUpdates).length > 0) {
        console.log('DEBUG: Updating profile with complete data:', profileUpdates);
        await updateProfile(profileUpdates);
        console.log('DEBUG: Profile update completed successfully');
      } else {
        console.log('DEBUG: No profile updates needed');
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

  // Get username from onboarding data with proper fallbacks
  const userName = (() => {
    // 1. First priority: Data from personal page (onboarding context)
    const onboardingName = onboardingData?.personalInfo?.name;
    if (onboardingName && onboardingName.trim().length > 0) {
      console.log('DEBUG: Using onboarding name:', onboardingName);
      return onboardingName.trim();
    }
    
    // 2. Fallback: Auth metadata
    const metadataName = user?.user_metadata?.full_name;
    if (metadataName && metadataName.trim() && metadataName !== 'Familie Mitglied') {
      console.log('DEBUG: Using metadata name:', metadataName);
      return metadataName.trim();
    }
    
    // 3. Fallback: Profile
    const profileName = profile?.name;
    if (profileName && profileName.trim() && profileName !== 'Familie Mitglied') {
      console.log('DEBUG: Using profile name:', profileName);
      return profileName.trim();
    }
    
    console.log('DEBUG: No name found, using default');
    return 'User';
  })();

  const userBirthday = onboardingData?.personalInfo?.birthDate || profile?.birth_date;
  const userRole = onboardingData?.personalInfo?.role;
  const userInterests = onboardingData?.personalInfo?.interests || [];

  return (
    <SafeAreaView style={styles.container}>
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
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
        <View style={styles.progressDash} />
        <View style={styles.progressDash} />
        <View style={styles.progressDash} />
        <View style={[styles.progressDash, styles.activeDash]} />
        <View style={styles.progressDash} />
        <View style={styles.progressDash} />
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
                  <RNImage
                    source={require('@/assets/images/icon/user_input.png')}
                    style={styles.profileIconImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={16} color="#161618" strokeWidth={2} />
              </View>
            </View>

            <Text style={styles.avatarLabel}>Add profile picture (optional)</Text>
            
            <View style={styles.avatarActions}>
              <Pressable style={styles.avatarActionButton} onPress={takePhoto}>
                <Camera size={18} color="#55ffb8" strokeWidth={2} />
                <Text style={styles.avatarActionText}>Take Photo</Text>
              </Pressable>
              
              <Pressable style={styles.avatarActionButton} onPress={handleAvatarUpload}>
                <RNImage
                  source={require('@/assets/images/icon/user_input.png')}
                  style={styles.inputIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.avatarActionText}>From Gallery</Text>
              </Pressable>
            </View>
          </View>

          {/* Profile Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>{t('profile.title') || 'Your Profile'}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('common.name') || 'Name'}</Text>
                <Text style={styles.summaryValue}>{userName}</Text>
              </View>
              
              {userBirthday && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('common.birthday') || 'Birthday'}</Text>
                  <Text style={styles.summaryValue}>
                    {formatBirthDate(userBirthday, false, getLocale())} ({calculateAge(userBirthday)} {t('common.yearsOld') || 'years old'})
                  </Text>
                </View>
              )}
              
              {userRole && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('common.role') || 'Role'}</Text>
                  <Text style={styles.summaryValue}>
                    {t(`profile.roles.${userRole}`) || 
                     (userRole === 'parent' ? 'Parent' :
                      userRole === 'child' ? 'Child' :
                      userRole === 'teenager' ? 'Teenager' :
                      userRole === 'grandparent' ? 'Grandparent' :
                      'Other')}
                  </Text>
                </View>
              )}

              {userInterests.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('common.interests') || 'Interests'}</Text>
                  <Text style={styles.summaryValue}>
                    {userInterests.slice(0, 3).join(', ')}
                    {userInterests.length > 3 && '...'}
                  </Text>
                </View>
              )}
              
              {user?.email && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('common.email') || 'Email'}</Text>
                  <Text style={styles.summaryValue}>{user.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <Check size={24} color="#55ffb8" strokeWidth={2.5} />
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
          <Text style={styles.skipText}>{t('common.skip')}</Text>
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    fontFamily: 'Helvetica',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eafff6',
    marginHorizontal: 4,
  },
  activeDash: {
    backgroundColor: '#55ffb8',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontStyle: 'Semi Bold',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
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
  profileIconImage: {
    width: 40,
    height: 40,
  },
  inputIconImage: {
    width: 18,
    height: 18,
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
    borderRadius: 25,
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
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
  },

  // Summary Section
  summarySection: {
    marginBottom: 40,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Helvetica',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
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
    fontFamily: 'Helvetica',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Helvetica',
    flex: 1,
    textAlign: 'right',
  },

  // Success Section
  successSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 25,
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
    fontFamily: 'Helvetica',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 50,
    gap: 8,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
});