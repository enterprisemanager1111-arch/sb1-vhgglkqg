import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  Share,
  StatusBar,
} from 'react-native';
import {
  User,
  Settings,
  Bell,
  LogOut,
  Camera,
  Shield,
  CircleHelp as HelpCircle,
  Info,
  CreditCard as Edit3,
  Crown,
  Star,
  Target,
  Activity,
  Calendar,
  SquareCheck as CheckSquare,
  Share2,
  Moon,
  Globe,
  Smartphone,
  Download,
  Trash2,
  Fingerprint,
  Clock,
  Users,
  Heart,
  Grid3X3,
  Folder,
  UserX
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomToggleSwitch from '@/components/CustomToggleSwitch';
import ProfileDetailIcon from '@/components/ProfileDetailIcon';
import { colors as themeColors, brandColors, getTheme } from '@/constants/theme';

// Custom verification icon component
const VerificationIcon = ({ size = 16 }: { size?: number }) => (
  <Image
    source={require('@/assets/images/icon/verification.png')}
    style={{
      width: size,
      height: size,
      resizeMode: 'contain'
    }}
  />
);

// Use shared theme colors
const colors = themeColors;


interface SettingsSection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function UserProfile() {
  const [refreshing, setRefreshing] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode, setDarkMode } = useDarkMode();
  const styles = createStyles(isDarkMode);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showAppVersionModal, setShowAppVersionModal] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [buildDate, setBuildDate] = useState('2025.1');

  const { user, profile, signOut, updateProfile, loading: authLoading, session } = useAuth();
  const { currentFamily, userRole } = useFamily();
  const { showSnackbar } = useSnackbar();

  // Removed redundant profile API call - using profile from AuthContext


  // Use profile from AuthContext directly
  const currentProfile = profile;

  const userName = currentProfile?.name || user?.user_metadata?.full_name || 'Tonald Drump';
  const userEmail = user?.email || '';
  const userRoleDisplay = userRole === 'admin' ? t('profilePage.role.admin') : t('profilePage.role.teenager');

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentProfile?.name) {
      const names = currentProfile.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return 'TD';
  };

  // Load preferences from storage
  React.useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const notifications = await AsyncStorage.getItem('@notifications_enabled');
      const biometrics = await AsyncStorage.getItem('@biometrics_enabled');

      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (biometrics !== null) setBiometricsEnabled(JSON.parse(biometrics));
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreference = async (key: string, value: boolean | string) => {
    try {
      await AsyncStorage.setItem(key, typeof value === 'boolean' ? JSON.stringify(value) : value);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(t('common.error'), t('profilePage.passwordChange.fillAllFields'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(t('common.error'), t('profilePage.passwordChange.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profilePage.passwordChange.passwordTooShort'));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert(t('common.success'), t('profilePage.passwordChange.success'));
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('profilePage.passwordChange.failed'));
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      Alert.alert(t('common.success'), t('profilePage.languageChange.success', { language: getLanguageName(languageCode) }));
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('profilePage.languageChange.failed'));
    }
  };

  const getLanguageName = (code: string) => {
    const languages = {
      'de': 'Deutsch',
      'en': 'English',
      'fr': 'Français',
      'es': 'Español',
      'it': 'Italiano',
      'nl': 'Nederlands',
    };
    return languages[code as keyof typeof languages] || 'English';
  };

  const contactSupport = async () => {
    const supportEmail = 'support@famora.app';
    const subject = t('profilePage.support.subject');
    const body = t('profilePage.support.body', { 
      version: '1.0.0', 
      device: Platform.OS, 
      familyId: currentFamily?.id || t('profilePage.support.noFamily') 
    });

    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      Alert.alert(
        t('profilePage.support.title'),
        t('profilePage.support.emailSent', { email: supportEmail }),
        [
          { text: t('profilePage.support.copyEmail'), onPress: () => copyToClipboard(supportEmail) },
          { text: t('common.ok') }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('profilePage.support.failed'));
    }
  };

  const copyToClipboard = async (text: string) => {
    Alert.alert(t('common.success'), t('profilePage.support.emailCopied'));
  };

  const clearAppCache = async () => {
    Alert.alert(
      t('profilePage.cache.title'),
      t('profilePage.cache.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.cache.clearButton'),
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key =>
                key.startsWith('@cache_') ||
                key.startsWith('@temp_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert(t('common.success'), t('profilePage.cache.success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('profilePage.cache.failed'));
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    console.log('🚪 Logout button pressed - starting direct logout process...');

    console.log('🚪 Starting complete bypass logout process...');

    // Skip Supabase signOut entirely to avoid GoTrueClient lock issues
    console.log('🔄 Bypassing all Supabase methods to avoid GoTrueClient locks...');

    // Note: Auth context state will be cleared when AsyncStorage is cleared

    // Force clear all auth data regardless of signOut result
    try {
      console.log('🧹 Force clearing all auth data...');

      // First, specifically target the exact token mentioned
      const specificToken = 'sb-eqaxmxbqqiuiwkhjwvvz-auth-token';
      try {
        await AsyncStorage.removeItem(specificToken);
        console.log('✅ Specific token removed:', specificToken);
      } catch (tokenError) {
        console.log('⚠️ Could not remove specific token:', tokenError);
      }

      // Clear AsyncStorage manually
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys before cleanup:', keys);

      const authKeys = keys.filter(key =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('sb-') ||
        key.includes('eqaxmxbqqiuiwkhjwvvz') ||
        key.includes('family') ||
        key.includes('user')
      );

      console.log('🎯 Auth keys to remove:', authKeys);

      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log('✅ All auth keys force cleared:', authKeys);
      }

      // Verify the specific token is gone
      const remainingKeys = await AsyncStorage.getAllKeys();
      const stillHasToken = remainingKeys.includes(specificToken);
      console.log('🔍 Remaining keys after cleanup:', remainingKeys);
      console.log('🔍 Specific token still exists:', stillHasToken);

      // If the specific token still exists, try to clear everything
      if (stillHasToken) {
        console.log('⚠️ Specific token still exists, clearing entire AsyncStorage...');
        try {
          await AsyncStorage.clear();
          console.log('✅ AsyncStorage completely cleared');
        } catch (clearError) {
          console.log('⚠️ Could not clear entire AsyncStorage:', clearError);
        }
      }

      // Additional cleanup for any GoTrueClient locks or state
      try {
        console.log('🧹 Additional cleanup for GoTrueClient locks...');
        // Try to clear any potential lock-related data
        const lockKeys = remainingKeys.filter(key =>
          key.includes('lock') ||
          key.includes('GoTrue') ||
          key.includes('acquireLock') ||
          key.includes('_lock')
        );

        if (lockKeys.length > 0) {
          await AsyncStorage.multiRemove(lockKeys);
          console.log('✅ GoTrueClient lock keys cleared:', lockKeys);
        }
      } catch (lockError) {
        console.log('⚠️ Could not clear lock keys:', lockError);
      }

    } catch (clearError) {
      console.error('❌ Error force clearing auth data:', clearError);
    }

    // Force a hard reset by clearing everything and using window.location for web
    console.log('🔄 Performing hard reset logout...');

    // Additional cleanup for web platform
    if (Platform.OS === 'web') {
      console.log('🔄 Web platform detected - clearing all web storage...');
      try {
        // Clear all possible web storage
        localStorage.clear();
        sessionStorage.clear();
        // Clear IndexedDB if it exists
        if (window.indexedDB) {
          indexedDB.databases().then(databases => {
            databases.forEach(db => {
              if (db.name) {
                indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
        console.log('✅ All web storage cleared');
      } catch (webError) {
        console.log('⚠️ Error clearing web storage:', webError);
      }
    }

    // For web platform, use window.location to completely reset the app
    if (Platform.OS === 'web') {
      console.log('🔄 Web platform detected - using window.location for hard reset...');
      setTimeout(() => {
        // Force reload the entire page
        window.location.href = '/';
      }, 500);
    } else {
      // For native platforms, use router with a longer delay
      console.log('🔄 Native platform - using router with delay...');
      setTimeout(() => {
        console.log('🔄 Navigating to onboarding start page...');
        router.replace('/(onboarding)');
      }, 2000);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profilePage.deleteAccount.title'),
      t('profilePage.deleteAccount.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.deleteAccount.deleteButton'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('profilePage.deleteAccount.title'), t('profilePage.deleteAccount.notImplemented'));
          }
        }
      ]
    );
  };

  // Settings sections matching the image
  const settingsSections: SettingsSection[] = [
    {
      id: 'security',
      title: t('profilePage.sections.security.title'),
      subtitle: t('profilePage.sections.security.subtitle'),
      badge: '3',
      items: [
        {
          id: 'two-factor',
          title: t('profilePage.sections.security.twoFactor.title'),
          description: t('profilePage.sections.security.twoFactor.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/fingerprinter.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert(t('profilePage.sections.security.twoFactor.alertTitle'), t('profilePage.sections.security.twoFactor.comingSoon')),
        },
        {
          id: 'manage-sessions',
          title: t('profilePage.sections.security.manageSessions.title'),
          description: t('profilePage.sections.security.manageSessions.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/session-timeout.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert(t('profilePage.sections.security.manageSessions.alertTitle'), t('profilePage.sections.security.manageSessions.comingSoon')),
        },
        {
          id: 'privacy-settings',
          title: t('profilePage.sections.security.privacy.title'),
          description: t('profilePage.sections.security.privacy.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/user-lock.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert(t('profilePage.sections.security.privacy.alertTitle'), t('profilePage.sections.security.privacy.comingSoon')),
        },
      ],
    },
    {
      id: 'personalization',
      title: t('profilePage.sections.personalization.title'),
      subtitle: t('profilePage.sections.personalization.subtitle'),
      badge: '4',
      items: [
        {
          id: 'edit-account',
          title: t('profilePage.sections.personalization.editAccount.title'),
          description: t('profilePage.sections.personalization.editAccount.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/user.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => router.push('/myProfile/edit'),
        },
        {
          id: 'change-password',
          title: t('profilePage.sections.personalization.changePassword.title'),
          description: t('profilePage.sections.personalization.changePassword.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/shield.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'action',
          onPress: () => setShowPasswordModal(true),
        },
        {
          id: 'language',
          title: t('profilePage.sections.personalization.language.title'),
          description: t('profilePage.sections.personalization.language.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/language-exchange.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => setShowLanguageModal(true),
        },
        {
          id: 'dark-mode',
          title: t('profilePage.sections.personalization.darkMode.title'),
          description: t('profilePage.sections.personalization.darkMode.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/moon.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'toggle',
          value: isDarkMode,
          onToggle: async (value) => {
            await setDarkMode(value);
          },
        },
      ],
    },
    {
      id: 'communication',
      title: t('profilePage.sections.communication.title'),
      subtitle: t('profilePage.sections.communication.subtitle'),
      badge: '3',
      items: [
        {
          id: 'notifications',
          title: t('profilePage.sections.communication.notifications.title'),
          description: t('profilePage.sections.communication.notifications.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/bell.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: async (value) => {
            setNotificationsEnabled(value);
            await savePreference('@notifications_enabled', value);

            if (value) {
              try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(t('common.permissionRequired'), t('profilePage.sections.communication.notifications.permissionMessage'));
                  setNotificationsEnabled(false);
                  await savePreference('@notifications_enabled', false);
                }
              } catch (error) {
                console.error('Error requesting notification permissions:', error);
              }
            }
          },
        },
        {
          id: 'give-feedback',
          title: t('profilePage.sections.communication.feedback.title'),
          description: t('profilePage.sections.communication.feedback.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/satisfaction-bar.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert(t('profilePage.sections.communication.feedback.alertTitle'), t('profilePage.sections.communication.feedback.comingSoon')),
        },
        {
          id: 'faq-help',
          title: t('profilePage.sections.communication.faq.title'),
          description: t('profilePage.sections.communication.faq.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/interrogation.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: contactSupport,
        },
      ],
    },
    {
      id: 'general',
      title: t('profilePage.sections.general.title'),
      subtitle: t('profilePage.sections.general.subtitle'),
      badge: '4',
      items: [
        {
          id: 'app-version',
          title: t('profilePage.sections.general.appVersion.title'),
          description: t('profilePage.sections.general.appVersion.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/apps.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => setShowAppVersionModal(true),
        },
        {
          id: 'manage-storage',
          title: t('profilePage.sections.general.manageStorage.title'),
          description: t('profilePage.sections.general.manageStorage.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/folder-open.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'action',
          onPress: clearAppCache,
        },
        {
          id: 'log-out',
          title: t('profilePage.sections.general.logOut.title'),
          description: t('profilePage.sections.general.logOut.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/user-logout.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'action',
          onPress: handleLogout,
        },
        {
          id: 'delete-account',
          title: t('profilePage.sections.general.deleteAccount.title'),
          description: t('profilePage.sections.general.deleteAccount.description'),
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/delete-user.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'action',
          destructive: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing profile data...');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    setShowImagePickerModal(true);
  };

  const handleImagePicker = async (source: 'camera' | 'library') => {
    try {
      setShowImagePickerModal(false);
      setIsUploadingImage(true);

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showSnackbar('Camera permission denied', 'error', 4000);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showSnackbar('Library permission denied', 'error', 4000);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showSnackbar('Failed to pick image', 'error', 4000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      if (!user) {
        showSnackbar('User not logged in', 'error', 4000);
        return;
      }

      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showSnackbar('Failed to upload image', 'error', 4000);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        showSnackbar('Failed to update profile', 'error', 4000);
        return;
      }

      if (updateProfile) {
        await updateProfile({ avatar_url: publicUrl });
      }

      showSnackbar('Profile picture updated', 'success', 3000);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showSnackbar('Failed to upload image', 'error', 4000);
    }
  };

  // Show loading state if auth is still loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no user is found
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Text style={styles.errorSubtext}>{t('profilePage.error.noUserData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? colors.dark.surface : colors.light.surface} 
      />

      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {currentProfile?.avatar_url ? (
                <Image
                  source={{ uri: currentProfile.avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{userName}</Text>
                <VerificationIcon size={16} />
              </View>
              <Text style={styles.userRole}>{userRoleDisplay}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#17F196"
          />
        }
      >

        {/* Setup & Settings Banner */}
        <View style={styles.section}>
          <View style={styles.workSummaryBanner}>
            <View style={styles.workSummaryContent}>
              <View style={styles.workSummaryText}>
                <Text style={styles.workSummaryTitle}>{t('profilePage.banner.title')}</Text>
                <Text style={styles.workSummarySubtitle}>{t('profilePage.banner.subtitle')}</Text>
              </View>
              <View style={styles.workSummaryIcon}>
                <Image
                  source={require('@/assets/images/icon/sparkling_camera.png')}
                  style={{
                    width: 117,
                    height: 85,
                    resizeMode: 'contain'
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.futuresElementsPanel}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{section.badge}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>

              <View style={styles.settingsCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.settingsItem,
                      item.destructive && styles.destructiveItem,
                      index === section.items.length - 1 && styles.lastItem
                    ]}
                    onPress={item.onPress}
                    disabled={false}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.settingsItemLeft}>
                      <View style={[
                        styles.settingsIcon,
                        item.destructive && styles.destructiveIcon
                      ]}>
                        {item.icon}
                      </View>
                      <View style={styles.settingsContent}>
                        <Text style={[
                          styles.settingsTitle,
                          item.destructive && styles.destructiveText
                        ]}>
                          {item.title}
                        </Text>
                        <Text style={styles.settingsDescription}>
                          {item.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.settingsItemRight}>
                      {item.type === 'toggle' ? (
                        <CustomToggleSwitch
                          value={item.value || false}
                          onValueChange={item.onToggle || (() => { })}
                        />
                      ) : (
                        <ProfileDetailIcon size={20} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.changePassword.title')}</Text>

            <View style={styles.modalForm}>
              <TextInput
                style={[
                  styles.modalInput,
                  Platform.OS === 'web' && ({
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  } as any)
                ]}
                placeholder={t('profilePage.modals.changePassword.currentPassword')}
                placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
              />
              <TextInput
                style={[
                  styles.modalInput,
                  Platform.OS === 'web' && ({
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  } as any)
                ]}
                placeholder={t('profilePage.modals.changePassword.newPassword')}
                placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
              />
              <TextInput
                style={[
                  styles.modalInput,
                  Platform.OS === 'web' && ({
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  } as any)
                ]}
                placeholder={t('profilePage.modals.changePassword.confirmNewPassword')}
                placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
                secureTextEntry
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                autoComplete="new-password"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalConfirmText}>{t('profilePage.modals.changePassword.button')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.selectLanguage.title')}</Text>

            <View style={styles.languageList}>
              {supportedLanguages.map((language) => (
                <Pressable
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage.code === language.code && styles.selectedLanguageOption
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    currentLanguage.code === language.code && styles.selectedLanguageName
                  ]}>
                    {language.nativeName}
                  </Text>
                  {currentLanguage.code === language.code && (
                    <CheckSquare size={18} color="#17F196" strokeWidth={2} />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.changeProfilePicture.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('profilePage.modals.changeProfilePicture.subtitle')}</Text>

            <View style={styles.imagePickerOptions}>
              <Pressable
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('camera')}
              >
                <View style={styles.imagePickerIcon}>
                  <Camera size={24} color="#17F196" strokeWidth={2} />
                </View>
                <Text style={styles.imagePickerOptionText}>{t('profilePage.modals.changeProfilePicture.takePhoto')}</Text>
                <Text style={styles.imagePickerOptionSubtext}>{t('profilePage.modals.changeProfilePicture.useCamera')}</Text>
              </Pressable>

              <Pressable
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('library')}
              >
                <View style={styles.imagePickerIcon}>
                  <Image
                    source={require('@/assets/images/icon/user_input.png')}
                    style={styles.inputIconImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.imagePickerOptionText}>{t('profilePage.modals.changeProfilePicture.chooseLibrary')}</Text>
                <Text style={styles.imagePickerOptionSubtext}>{t('profilePage.modals.changeProfilePicture.selectLibrary')}</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Overlay */}
      {isUploadingImage && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadText}>{t('profilePage.uploading')}</Text>
          </View>
        </View>
      )}

      {/* App Version Modal */}
      <Modal
        visible={showAppVersionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAppVersionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.appVersion.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('profilePage.modals.appVersion.version', { version: '1.0.0', build: '2025.1' })}</Text>
            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowAppVersionModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('profilePage.modals.appVersion.gotIt')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (isDarkMode: boolean) => {
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 108, // Add padding to account for fixed header (44 + 20 + 20 + 24 for safe area)
  },

  // Fixed Header Section
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.surface,
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDarkMode ? '#FFFFFF' : '#000000',
  },
  profileDetails: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  userRole: {
    fontSize: 12,
    color: '#17f196',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Work Summary Banner (matching home page)
  workSummaryBanner: {
    backgroundColor: '#17F196',
    marginHorizontal: 0,
    marginVertical: 12,
    borderRadius: 12,
    padding: 20,
  },
  workSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workSummaryText: {
    flex: 1,
  },
  workSummaryTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  workSummarySubtitle: {
    color: '#EDEAFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  workSummaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Styling
  section: {
    paddingHorizontal: 10,
  },
  futuresElementsPanel: {
    backgroundColor: theme.surface,
    marginHorizontal: 0,
    marginVertical: 12,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  badge: {
    backgroundColor: '#e9fff6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#17f196',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textTertiary,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 6,
  },

  // Settings Card
  settingsCard: {
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: theme.surfaceSecondary,
  },
  destructiveItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.02)',
  },
  lastItem: {
    // borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 28,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#17F196',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FF6B6B',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text
  },
  destructiveText: {
    color: '#FF6B6B',
  },
  settingsDescription: {
    fontSize: 10,
    color: theme.text,
    fontWeight: '300',
  },
  settingsItemRight: {
    marginLeft: 12,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalForm: {
    gap: 16,
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    color: theme.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#17F196',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Language Modal
  languageList: {
    gap: 12,
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.input,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderColor: '#17F196',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  selectedLanguageName: {
    fontWeight: '600',
    color: '#17F196',
  },

  // Image Picker Modal
  imagePickerOptions: {
    gap: 16,
    marginBottom: 24,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  imagePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputIconImage: {
    width: 24,
    height: 24,
  },
  imagePickerOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  imagePickerOptionSubtext: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Upload Overlay
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginTop: 12,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
};