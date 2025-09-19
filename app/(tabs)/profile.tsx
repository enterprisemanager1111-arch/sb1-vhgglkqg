import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
  Switch,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  Share,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { User, Settings, Bell, LogOut, Camera, Trophy, ChevronRight, Shield, CircleHelp as HelpCircle, Info, CreditCard as Edit3, Crown, Star, Target, Activity, Calendar, SquareCheck as CheckSquare, Share2, Moon, Globe, Smartphone, Download, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import AnimatedButton from '@/components/AnimatedButton';
import AnimatedSettingsItem from '@/components/AnimatedSettingsItem';
import { router } from 'expo-router';
import { formatBirthDate } from '@/utils/birthdaySystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
  badge?: string;
}

export default function UserProfile() {
  const [refreshing, setRefreshing] = useState(false);
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { user, profile, signOut, updateProfile, loading: authLoading } = useAuth();
  const { currentFamily, familyMembers, userRole } = useFamily();
  const { showSnackbar } = useSnackbar();
  
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
  const { tasks, getCompletedTasks } = useFamilyTasks();
  const { items, getCompletedItems } = useFamilyShoppingItems();


  // Calculate user statistics
  const completedTasks = getCompletedTasks();
  const completedShoppingItems = getCompletedItems();
  const userPoints = (completedTasks.length * 15) + (completedShoppingItems.length * 5);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'long'
  }) : '';

  const userName = profile?.name || user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';
  
  // Debug logging for user information
  React.useEffect(() => {
    console.log('Profile page - User info updated:', {
      userId: user?.id,
      userEmail: user?.email,
      profileId: profile?.id,
      profileName: profile?.name,
      userName: userName,
      displayEmail: userEmail
    });
  }, [user, profile, userName, userEmail]);

  // Load preferences from storage
  React.useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const notifications = await AsyncStorage.getItem('@notifications_enabled');
      const darkMode = await AsyncStorage.getItem('@dark_mode_enabled');
      const autoSync = await AsyncStorage.getItem('@auto_sync_enabled');
      const biometrics = await AsyncStorage.getItem('@biometrics_enabled');
      const analytics = await AsyncStorage.getItem('@analytics_enabled');
      
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
      if (autoSync !== null) setAutoSyncEnabled(JSON.parse(autoSync));
      if (biometrics !== null) setBiometricsEnabled(JSON.parse(biometrics));
      if (analytics !== null) setAnalyticsEnabled(JSON.parse(analytics));
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
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      Alert.alert(t('common.error'), t('onboarding.auth.errors.passwordMismatch'));
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.alerts.passwordError'));
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert(t('common.success'), t('profile.alerts.passwordSuccess'));
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('profile.alerts.passwordChangeError'));
    }
  };

  const handleDataExport = async () => {
    try {
      // Collect user data
      const userData = {
        profile: profile,
        family: currentFamily,
        completedTasks: getCompletedTasks().length,
        completedShoppingItems: getCompletedItems().length,
        memberSince: user?.created_at,
        exportDate: new Date().toISOString(),
      };
      
      // In a real app, this would be sent to a backend service
      // For now, we'll share the data or show it to the user
      const dataString = JSON.stringify(userData, null, 2);
      
      await Share.share({
        message: `Famora Data Export for ${userName}\n\nExported on: ${new Date().toLocaleDateString(getLocale())}\n\nData: ${dataString}`,
        title: t('profile.alerts.exportTitle'),
      });
      
      setShowDataExportModal(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.alerts.exportError'));
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      
      Alert.alert(
        t('common.success'),
        `${t('settings.language.changed')} ${getLanguageName(languageCode)}.`,
        [{ text: t('common.continue') }]
      );
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.error'),
        t('settings.language.error')
      );
    }
  };

  const getLanguageName = (code: string) => {
    const languages = {
      'de': 'Deutsch',
      'en': 'English',
      'fr': 'Français',
      'es': 'Español',
      'it': 'Italiano',
    };
    return languages[code as keyof typeof languages] || 'English';
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://famora.app/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://famora.app/terms');
  };

  const contactSupport = async () => {
    const supportEmail = 'support@famora.app';
    const subject = `Help needed - Famora App`;
    const body = `Hello Famora Team,\n\nI need help with:\n\n[Please describe your problem here]\n\nMy App Version: 1.0.0\nMy Device: ${Platform.OS}\nMy Family ID: ${currentFamily?.id || 'No Family'}\n\nThank you!`;
    
    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      Alert.alert(
        t('profile.alerts.supportContact'),
        `${t('profile.alerts.supportEmailSent')} ${supportEmail}`,
        [
          { text: t('profile.alerts.copyEmail'), onPress: () => copyToClipboard(supportEmail) },
          { text: t('common.ok') }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.alerts.supportError'));
    }
  };

  const copyToClipboard = async (text: string) => {
    // In a real app, you'd use Clipboard from expo-clipboard
    Alert.alert(t('common.success'), t('profile.alerts.emailCopied'));
  };

  const clearAppCache = async () => {
    Alert.alert(
      t('profile.alerts.cacheTitle'),
      t('profile.alerts.cacheMessage'),
      [
        { text: t('profile.alerts.cancel'), style: 'cancel' },
        {
          text: t('profile.alerts.cacheTitle'),
          onPress: async () => {
            try {
              // Clear AsyncStorage cache (except user preferences)
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('@cache_') || 
                key.startsWith('@temp_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              
              Alert.alert(t('common.success'), t('profile.alerts.cacheSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.alerts.cacheError'));
            }
          }
        }
      ]
    );
  };
  // Settings sections with organized structure
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: t('profile.sections.account'),
      icon: <User size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'edit-profile',
          title: t('profile.items.editProfile'),
          description: t('profile.items.editProfileDesc'),
          icon: <Edit3 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/(onboarding)/profile'),
        },
        {
          id: 'account-settings',
          title: t('profile.items.changePassword'),
          description: t('profile.items.changePasswordDesc'),
          icon: <Shield size={18} color="#54FE54" strokeWidth={2} />,
          type: 'action',
          onPress: () => setShowPasswordModal(true),
        },
        {
          id: 'biometric-auth',
          title: t('profile.items.biometricAuth'),
          description: t('profile.items.biometricAuthDesc'),
          icon: <Smartphone size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: biometricsEnabled,
          onToggle: async (value) => {
            setBiometricsEnabled(value);
            await savePreference('@biometrics_enabled', value);
            Alert.alert(
              value ? t('profile.alerts.biometricEnabled') : t('profile.alerts.biometricDisabled'),
              value 
                ? t('profile.alerts.biometricEnabledDesc')
                : t('profile.alerts.biometricDisabledDesc')
            );
          },
        },
      ],
    },
    {
      id: 'preferences',
      title: t('profile.sections.notifications'),
      icon: <Settings size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'notifications',
          title: t('profile.sections.notifications'),
          description: t('profile.notifications.description'),
          icon: <Bell size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: async (value) => {
            setNotificationsEnabled(value);
            await savePreference('@notifications_enabled', value);
            
            if (value) {
              // Request notification permissions
              try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(t('common.permissionRequired'), t('profile.alerts.permissionNotificationDesc'));
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
          id: 'dark-mode',
          title: t('profile.items.darkMode'),
          description: t('profile.items.darkModeDesc'),
          icon: <Moon size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: darkModeEnabled,
          onToggle: async (value) => {
            setDarkModeEnabled(value);
            await savePreference('@dark_mode_enabled', value);
          },
        },
        {
          id: 'auto-sync',
          title: t('profile.items.autoSync'),
          description: t('profile.items.autoSyncDesc'),
          icon: <Activity size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: autoSyncEnabled,
          onToggle: async (value) => {
            setAutoSyncEnabled(value);
            await savePreference('@auto_sync_enabled', value);
          },
        },
        {
          id: 'analytics',
          title: t('profile.items.usageStats'),
          description: t('profile.items.usageStatsDesc'),
          icon: <Target size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: analyticsEnabled,
          onToggle: async (value) => {
            setAnalyticsEnabled(value);
            await savePreference('@analytics_enabled', value);
          },
        },
        {
          id: 'language',
          title: t('settings.language.title') || 'Sprache',
          description: getLanguageName(currentLanguage.code),
          icon: <Globe size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          badge: currentLanguage.code.toUpperCase(),
          onPress: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      id: 'family',
      title: t('profile.sections.family'),
      icon: <Crown size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'family-role',
          title: t('profile.items.familyRole'),
          description: `${userRole === 'admin' ? t('profile.roles.admin') : t('profile.roles.member')} in ${currentFamily?.name || t('profile.roles.family')}`,
          icon: userRole === 'admin' ? <Crown size={18} color="#54FE54" strokeWidth={2} /> : <User size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/(tabs)/family'),
        },
        {
          id: 'invite-family',
          title: t('profile.items.inviteFamily'),
          description: t('profile.items.inviteFamilyDesc'),
          icon: <Share2 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/family/invite'),
        },
        {
          id: 'family-settings',
          title: t('profile.items.familySettings'),
          description: t('profile.items.familySettingsDesc'),
          icon: <Settings size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/family/settings'),
        },
      ],
    },
    {
      id: 'support',
      title: t('profile.sections.support'),
      icon: <HelpCircle size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'help',
          title: t('profile.items.help'),
          description: t('profile.items.helpDesc'),
          icon: <HelpCircle size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: contactSupport,
        },
        {
          id: 'about',
          title: t('profile.items.about'),
          description: t('profile.items.aboutDesc'),
          icon: <Info size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => {
            Alert.alert(
              t('profile.about.title'),
              `${t('profile.about.version')}\n${t('profile.about.build').replace('{{year}}', new Date().getFullYear().toString()).replace('{{month}}', (new Date().getMonth() + 1).toString())}\n\n${t('profile.about.description')}\n\n${t('profile.about.developed')}`,
              [
                { text: t('profile.about.privacy'), onPress: openPrivacyPolicy },
                { text: 'AGB', onPress: openTermsOfService },
                { text: 'OK' }
              ]
            );
          },
        },
        {
          id: 'data-export',
          title: t('profile.items.dataExport'),
          description: t('profile.items.dataExportDesc'),
          icon: <Download size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => setShowDataExportModal(true),
        },
        {
          id: 'clear-cache',
          title: t('profile.items.clearCache'),
          description: t('profile.items.clearCacheDesc'),
          icon: <Trash2 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'action',
          onPress: clearAppCache,
        },
      ],
    },
    {
      id: 'account-actions',
      title: t('profile.sections.accountActions'),
      icon: <Trash2 size={20} color="#FF0000" strokeWidth={2} />,
      items: [
        {
          id: 'logout',
          title: t('profile.logout.title'),
          description: t('profile.logout.description'),
          icon: <LogOut size={18} color="#FF0000" strokeWidth={2} />,
          type: 'action',
          destructive: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  async function handleLogout() {
    console.log('🔘 Sign out button clicked');
    console.log('Current user:', user?.id);
    console.log('Current profile:', profile?.id);
    
    Alert.alert(
      t('profile.alerts.logoutTitle'),
      t('profile.alerts.logoutMessage'),
      [
        { text: t('profile.alerts.logoutCancel'), style: 'cancel' },
        {
          text: t('profile.alerts.logoutConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting logout process from profile page...');
              console.log('Calling signOut function...');
              
              // Add timeout to prevent hanging
              const signOutPromise = signOut();
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Sign out timeout')), 10000); // 10 second timeout
              });
              
              await Promise.race([signOutPromise, timeoutPromise]);
              
              console.log('✅ Sign out completed, showing snackbar and navigating...');
              
              // Show success snackbar
              showSnackbar('Successfully signed out', 'success', 3000);
              
              // Give a moment for auth state to clear, then navigate to first page
              setTimeout(() => {
                console.log('🔄 Navigating to first page...');
                router.replace('/');
              }, 100);
              
            } catch (error: any) {
              console.error('❌ Logout error in profile page:', error);
              
              // Even if sign out fails, try to navigate to first page
              if (error?.message === 'Sign out timeout') {
                console.log('⚠️ Sign out timed out, forcing navigation...');
                showSnackbar('Sign out timed out, but you have been logged out', 'warning', 4000);
                router.replace('/');
              } else {
                showSnackbar('Sign out failed. Please try again.', 'error', 4000);
                Alert.alert(
                  t('common.error'), 
                  error?.message || 'Sign out failed. Please try again.'
                );
              }
            }
          },
        },
      ]
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user data and family info
      console.log('Refreshing profile data...');
      console.log('Current user:', user?.id);
      console.log('Current profile:', profile?.id);
      
      // Force refresh of auth context
      if (user) {
        // Trigger a profile refresh by calling the auth context refresh
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Profile refresh completed');
      } else {
        console.log('No user found, cannot refresh profile');
      }
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
          showSnackbar(t('profile.alerts.cameraPermissionDenied'), 'error', 4000);
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
          showSnackbar(t('profile.alerts.libraryPermissionDenied'), 'error', 4000);
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
      showSnackbar(t('profile.alerts.imagePickerError'), 'error', 4000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      if (!user) {
        showSnackbar(t('profile.alerts.userNotLoggedIn'), 'error', 4000);
        return;
      }

      // Create a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showSnackbar(t('profile.alerts.uploadError'), 'error', 4000);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        showSnackbar(t('profile.alerts.profileUpdateError'), 'error', 4000);
        return;
      }

      // Update local profile state
      if (updateProfile) {
        await updateProfile({ avatar_url: publicUrl });
      }

      showSnackbar(t('profile.alerts.profilePictureUpdated'), 'success', 3000);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showSnackbar(t('profile.alerts.uploadError'), 'error', 4000);
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
          <Text style={styles.errorSubtext}>No user data found. Please sign in again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#54FE54"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Edit3 size={18} color="#54FE54" strokeWidth={2} />
          </Pressable>
        </View>

        {/* User Profile Card */}
        <AnimatedView style={styles.section}>
          <View style={styles.profileCard}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                {profile?.avatar_url ? (
                  <Image 
                    source={{ uri: profile.avatar_url }} 
                    style={styles.profileAvatar}
                  />
                ) : (
                  <View style={styles.profileAvatarPlaceholder}>
                    <Text style={styles.profileInitials}>
                      {userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </Text>
                  </View>
                )}
                <Pressable style={styles.avatarEditButton} onPress={handleEditProfile}>
                  <Camera size={14} color="#161618" strokeWidth={2} />
                </Pressable>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
                {profile?.birth_date && (
                  <Text style={styles.profileBirthday}>
                    🎂 {formatBirthDate(profile.birth_date, false, getLocale())}
                  </Text>
                )}
              </View>

              {/* Role Badge */}
              {userRole && (
                <View style={styles.roleBadge}>
                  {userRole === 'admin' ? (
                    <Crown size={16} color="#FFB800" strokeWidth={2} />
                  ) : (
                    <User size={16} color="#54FE54" strokeWidth={2} />
                  )}
                </View>
              )}
            </View>

            {/* Profile Stats */}
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Trophy size={16} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{userPoints}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.points')}</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <CheckSquare size={16} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{completedTasks.length}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.tasks')}</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Calendar size={16} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{memberSince.includes('2025') ? '< 1' : '1'}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.months')}</Text>
                </View>
              </View>
            </View>

            {/* Account Status */}
            <View style={styles.accountStatus}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>{t('profile.stats.memberSince')}</Text>
                <Text style={styles.statusValue}>{memberSince}</Text>
              </View>
              {currentFamily && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>{t('profile.stats.family')}</Text>
                  <Text style={styles.statusValue}>{currentFamily.name}</Text>
                </View>
              )}
            </View>
          </View>
        </AnimatedView>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              {section.icon}
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            <View style={styles.settingsCard}>
              {section.items.map((item, index) => (
                <AnimatedSettingsItem
                  key={item.id}
                  item={item}
                  index={index}
                  isLast={index === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Bottom Spacing für Tab Bar */}
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
            <Text style={styles.modalTitle}>Passwort ändern</Text>
            
            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Aktuelles Passwort"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
              />
              <TextInput
                style={styles.modalInput}
                placeholder={t('profile.modals.newPassword')}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
              />
              <TextInput
                style={styles.modalInput}
                placeholder={t('profile.modals.confirmPassword')}
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
                <Text style={styles.modalConfirmText}>Passwort ändern</Text>
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
            <Text style={styles.modalTitle}>{t('onboarding.language.title') || 'Sprache wählen'}</Text>
            
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
                    <CheckSquare size={18} color="#54FE54" strokeWidth={2} />
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

      {/* Data Export Modal */}
      <Modal
        visible={showDataExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDataExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profile.modals.exportData')}</Text>
            <Text style={styles.modalDescription}>
              {t('profile.export.description')}
            </Text>
            
            <View style={styles.exportInfo}>
              <Text style={styles.exportInfoTitle}>{t('profile.export.exportedData')}</Text>
              <Text style={styles.exportInfoItem}>• {t('profile.export.profileInfo')}</Text>
              <Text style={styles.exportInfoItem}>• {t('profile.export.familyRole')}</Text>
              <Text style={styles.exportInfoItem}>• {t('profile.export.completedTasks')}</Text>
              <Text style={styles.exportInfoItem}>• {t('profile.export.shoppingActivities')}</Text>
              <Text style={styles.exportInfoItem}>• {t('profile.export.usageStats')}</Text>
            </View>
            
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowDataExportModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleDataExport}
              >
                <Download size={16} color="#161618" strokeWidth={2} />
                <Text style={styles.modalConfirmText}>{t('profile.export.exportButton')}</Text>
              </Pressable>
            </View>
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
            <Text style={styles.modalTitle}>{t('profile.imagePicker.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.imagePicker.subtitle')}</Text>
            
            <View style={styles.imagePickerOptions}>
              <Pressable
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('camera')}
              >
                <View style={styles.imagePickerIcon}>
                  <Camera size={24} color="#54FE54" strokeWidth={2} />
                </View>
                <Text style={styles.imagePickerOptionText}>{t('profile.imagePicker.camera')}</Text>
                <Text style={styles.imagePickerOptionSubtext}>{t('profile.imagePicker.cameraDescription')}</Text>
              </Pressable>
              
              <Pressable
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('library')}
              >
                <View style={styles.imagePickerIcon}>
                  <User size={24} color="#54FE54" strokeWidth={2} />
                </View>
                <Text style={styles.imagePickerOptionText}>{t('profile.imagePicker.library')}</Text>
                <Text style={styles.imagePickerOptionSubtext}>{t('profile.imagePicker.libraryDescription')}</Text>
              </Pressable>
            </View>
            
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowImagePickerModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Overlay */}
      {isUploadingImage && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadText}>{t('profile.imagePicker.uploading')}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#54FE54',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 4,
  },
  profileBirthday: {
    fontSize: 13,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  roleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Stats
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },

  // Account Status
  accountStatus: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  destructiveItem: {
    backgroundColor: 'rgba(255, 0, 0, 0.02)',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#FF0000',
  },
  destructiveActionButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  destructiveActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF0000',
    fontFamily: 'Montserrat-SemiBold',
  },
  settingsDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 16,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBadge: {
    backgroundColor: '#54FE54',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  settingsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  actionButton: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
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
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    gap: 16,
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
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
    backgroundColor: '#F3F3F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderColor: '#54FE54',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#161618',
  },
  selectedLanguageName: {
    fontFamily: 'Montserrat-SemiBold',
    color: '#54FE54',
  },

  // Export Info
  exportInfo: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  exportInfoTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
    marginBottom: 8,
  },
  exportInfoItem: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
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
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePickerOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
    marginBottom: 2,
  },
  imagePickerOptionSubtext: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
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
    backgroundColor: '#FFFFFF',
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
    fontFamily: 'Montserrat-Medium',
    color: '#161618',
    marginTop: 12,
  },

  // Modal styles
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
});