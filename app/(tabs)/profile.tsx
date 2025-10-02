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
import Animated, { 
  useSharedValue, 
  withSpring, 
  withDelay, 
  useAnimatedStyle, 
  withTiming,
} from 'react-native-reanimated';
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
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomToggleSwitch from '@/components/CustomToggleSwitch';
import ProfileDetailIcon from '@/components/ProfileDetailIcon';

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

const AnimatedView = Animated.createAnimatedComponent(View);

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { user, profile, signOut, updateProfile, loading: authLoading } = useAuth();
  const { currentFamily, userRole } = useFamily();
  const { showSnackbar } = useSnackbar();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
  }, []);

  const userName = profile?.name || user?.user_metadata?.full_name || 'Tonald Drump';
  const userEmail = user?.email || '';
  const userRoleDisplay = userRole === 'admin' ? 'Family Admin' : 'Family Teenager';

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.name) {
      const names = profile.name.split(' ');
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
      const darkMode = await AsyncStorage.getItem('@dark_mode_enabled');
      const biometrics = await AsyncStorage.getItem('@biometrics_enabled');
      
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
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
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      Alert.alert('Success', `Language changed to ${getLanguageName(languageCode)}.`);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language');
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
    const subject = `Help needed - Famora App`;
    const body = `Hello Famora Team,\n\nI need help with:\n\n[Please describe your problem here]\n\nMy App Version: 1.0.0\nMy Device: ${Platform.OS}\nMy Family ID: ${currentFamily?.id || 'No Family'}\n\nThank you!`;
    
    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      Alert.alert(
        'Contact Support',
        `Email sent to ${supportEmail}`,
        [
          { text: 'Copy Email', onPress: () => copyToClipboard(supportEmail) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to contact support');
    }
  };

  const copyToClipboard = async (text: string) => {
    Alert.alert('Success', 'Email copied to clipboard');
  };

  const clearAppCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and temporary files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('@cache_') || 
                key.startsWith('@temp_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(onboarding)');
    } catch (error) {
      console.error('Sign out error:', error);
      router.replace('/(onboarding)');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion feature is not yet implemented.');
          }
        }
      ]
    );
  };

  // Settings sections matching the image
  const settingsSections: SettingsSection[] = [
    {
      id: 'security',
      title: 'Security & Privacy',
      subtitle: 'See in your Security & Privacy settings',
      badge: '3',
      items: [
        {
          id: 'two-factor',
          title: 'Two-Factor authentication (2FA)',
          description: 'Setup your Authentication for your Account',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/fingerprinter.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert('2FA', 'Two-factor authentication setup coming soon'),
        },
        {
          id: 'manage-sessions',
          title: 'Manage sessions',
          description: 'View active logins on devices & log out',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/session-timeout.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert('Sessions', 'Session management coming soon'),
        },
        {
          id: 'privacy-settings',
          title: 'Privacy settings',
          description: 'See statistics, visibility of activities',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/user-lock.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon'),
        },
      ],
    },
    {
      id: 'personalization',
      title: 'Personalization',
      subtitle: 'See in your personalization Settings',
      badge: '4',
      items: [
        {
          id: 'edit-account',
          title: 'Edit Account',
          description: 'Name, Date of Birth and Profile picture',
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
          title: 'Change Password',
          description: 'Update your password',
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
          title: 'Language',
          description: 'Select your preferred Language',
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
          title: 'Dark Mode',
          description: 'Customize app appearance',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/moon.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'toggle',
          value: darkModeEnabled,
          onToggle: async (value) => {
            setDarkModeEnabled(value);
            await savePreference('@dark_mode_enabled', value);
          },
        },
      ],
    },
    {
      id: 'communication',
      title: 'Communication',
      subtitle: 'See in your Communication Settings',
      badge: '3',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Push notifications for family activities',
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
                  Alert.alert('Permission Required', 'Notification permission is required for this feature');
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
          title: 'Give feedback',
          description: 'How much do you like the app',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/satisfaction-bar.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert('Feedback', 'Feedback feature coming soon'),
        },
        {
          id: 'faq-help',
          title: 'FAQ & Help',
          description: 'Do you need help with something',
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
      title: 'General Settings',
      subtitle: 'See in your General Settings',
      badge: '4',
      items: [
        {
          id: 'app-version',
          title: 'APP Version',
          description: 'Shows your current app version',
          icon: (
            <Image
              source={require('@/assets/images/icon/profile/apps.png')}
              style={{ width: 12, height: 12, resizeMode: 'contain' }}
            />
          ),
          type: 'navigation',
          onPress: () => Alert.alert('App Version', 'Version 1.0.0\nBuild 2025.1'),
        },
        {
          id: 'manage-storage',
          title: 'Manage storage',
          description: 'Clear your Cache to clean everything up',
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
          title: 'Log out with Account',
          description: 'Log out with your current account',
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
          title: 'Delete Account',
          description: 'Delete or deactivate your account',
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no user is found
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error</Text>
          <Text style={styles.errorSubtext}>No user data found. Please sign in again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Fixed Header Section */}
      <AnimatedView style={[styles.fixedHeader, headerAnimatedStyle]}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
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
      </AnimatedView>

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
         <AnimatedView style={[styles.section, contentAnimatedStyle]}>
           <View style={styles.workSummaryBanner}>
             <View style={styles.workSummaryContent}>
               <View style={styles.workSummaryText}>
                 <Text style={styles.workSummaryTitle}>Setup & Settings</Text>
                 <Text style={styles.workSummarySubtitle}>Give your Profile the best settings</Text>
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
         </AnimatedView>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <AnimatedView key={section.id} style={[styles.section, contentAnimatedStyle]}>
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
                          onValueChange={item.onToggle || (() => {})}
                        />
                      ) : (
                        <ProfileDetailIcon size={20} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </AnimatedView>
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
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm New Password"
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
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalConfirmText}>Change Password</Text>
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
            <Text style={styles.modalTitle}>Select Language</Text>
            
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
              <Text style={styles.modalCancelText}>Cancel</Text>
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
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to update your profile picture</Text>
            
            <View style={styles.imagePickerOptions}>
              <Pressable
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('camera')}
              >
                <View style={styles.imagePickerIcon}>
                  <Camera size={24} color="#17F196" strokeWidth={2} />
                </View>
                <Text style={styles.imagePickerOptionText}>Take Photo</Text>
                <Text style={styles.imagePickerOptionSubtext}>Use camera to take a new photo</Text>
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
                <Text style={styles.imagePickerOptionText}>Choose from Library</Text>
                <Text style={styles.imagePickerOptionSubtext}>Select from your photo library</Text>
              </Pressable>
            </View>
            
            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Overlay */}
      {isUploadingImage && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadText}>Uploading...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f8',
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
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#2d2d2d',
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
    color: '#000000',
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
    color: '#2d2d2d',
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
    backgroundColor: '#FFFFFF',
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
    color: '#040404',
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
    color: '#466759',
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
    paddingVertical : 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FEFEFE',
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
    color: '#2b2b2b'
  },
  destructiveText: {
    color: '#FF6B6B',
  },
  settingsDescription: {
    fontSize: 10,
    color: '#2b2b2b',
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
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
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
    fontWeight: '500',
    color: '#666666',
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
    backgroundColor: '#F3F3F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#2D2D2D',
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
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#2D2D2D',
    marginBottom: 2,
  },
  imagePickerOptionSubtext: {
    flex: 1,
    fontSize: 14,
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
    fontWeight: '500',
    color: '#2D2D2D',
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
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});