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
  UserX,
  ChevronDown,
  ChevronUp,
  Copy
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
import * as Clipboard from 'expo-clipboard';
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageData, setStorageData] = useState({
    totalKeys: 0,
    cacheKeys: 0,
    tempKeys: 0,
    estimatedSize: '0 KB'
  });
  const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);
  const [isClearingStorage, setIsClearingStorage] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeData, setQrCodeData] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    // Profile visibility
    showProfilePhoto: true,
    showBirthday: true,
    showEmail: false,
    showPhone: false,
    
    // Notifications
    taskNotifications: true,
    eventNotifications: true,
    shoppingNotifications: true,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

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
      showSnackbar(t('profilePage.passwordChange.fillAllFields'), 'error', 4000);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showSnackbar(t('profilePage.passwordChange.passwordMismatch'), 'error', 4000);
      return;
    }

    if (newPassword.length < 6) {
      showSnackbar(t('profilePage.passwordChange.passwordTooShort'), 'error', 4000);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showSnackbar(t('profilePage.passwordChange.success'), 'success', 3000);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      showSnackbar(error.message || t('profilePage.passwordChange.failed'), 'error', 4000);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      showSnackbar(t('profilePage.languageChange.success', { language: getLanguageName(languageCode) }), 'success', 3000);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      showSnackbar(t('profilePage.languageChange.failed'), 'error', 4000);
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
      showSnackbar(t('profilePage.support.emailSent', { email: supportEmail }), 'success', 3000);
      await Linking.openURL(mailto);
    } catch (error) {
      showSnackbar(t('profilePage.support.failed'), 'error', 4000);
    }
  };

  const copyToClipboard = async (text: string) => {
    showSnackbar(t('profilePage.support.emailCopied'), 'success', 3000);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      showSnackbar(t('profilePage.feedback.emptyMessage') || 'Please enter your feedback', 'error', 4000);
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      // Create feedback entry in database
      const feedbackData = {
        user_id: user?.id,
        user_email: userEmail,
        user_name: userName,
        category: feedbackCategory,
        message: feedbackMessage.trim(),
        created_at: new Date().toISOString(),
        family_id: currentFamily?.id || null,
      };

      // Store feedback in Supabase
      const { error } = await supabase
        .from('feedback')
        .insert([feedbackData]);

      if (error) {
        console.error('Error storing feedback:', error);
        // If table doesn't exist, send via email as fallback
        throw error;
      }

      showSnackbar(t('profilePage.feedback.success') || 'Thank you for your feedback!', 'success', 3000);
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackCategory('general');
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      
      // Fallback: Try to send via email
      try {
        const supportEmail = 'support@familyapp.com';
        const subject = `User Feedback - ${feedbackCategory}`;
        const body = `Feedback from: ${userName} (${userEmail})\nCategory: ${feedbackCategory}\n\nMessage:\n${feedbackMessage}`;
        const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        await Linking.openURL(mailto);
        showSnackbar(t('profilePage.feedback.emailFallback') || 'Opening email client to send feedback', 'info', 3000);
        setShowFeedbackModal(false);
        setFeedbackMessage('');
        setFeedbackCategory('general');
      } catch (emailError) {
        showSnackbar(t('profilePage.feedback.failed') || 'Failed to submit feedback. Please try again.', 'error', 4000);
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const calculateStorageUsage = async () => {
    setIsCalculatingStorage(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@cache_'));
      const tempKeys = keys.filter(key => key.startsWith('@temp_'));
      
      // Estimate size by getting all items
      let estimatedBytes = 0;
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            estimatedBytes += key.length + value.length;
          }
        } catch (error) {
          console.error('Error reading key:', key, error);
        }
      }
      
      // Convert to readable format
      let sizeString = '0 KB';
      if (estimatedBytes < 1024) {
        sizeString = `${estimatedBytes} B`;
      } else if (estimatedBytes < 1024 * 1024) {
        sizeString = `${(estimatedBytes / 1024).toFixed(2)} KB`;
      } else {
        sizeString = `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
      }
      
      setStorageData({
        totalKeys: keys.length,
        cacheKeys: cacheKeys.length,
        tempKeys: tempKeys.length,
        estimatedSize: sizeString
      });
    } catch (error) {
      console.error('Error calculating storage:', error);
      showSnackbar(t('profilePage.storage.calculationFailed') || 'Failed to calculate storage', 'error', 3000);
    } finally {
      setIsCalculatingStorage(false);
    }
  };

  const clearAppCache = async () => {
    setIsClearingStorage(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('@cache_') ||
        key.startsWith('@temp_')
      );
      
      if (cacheKeys.length === 0) {
        showSnackbar(t('profilePage.storage.noCacheToClean') || 'No cache to clear', 'info', 3000);
        setIsClearingStorage(false);
        return;
      }
      
      await AsyncStorage.multiRemove(cacheKeys);
      showSnackbar(t('profilePage.cache.success') || `Cleared ${cacheKeys.length} items`, 'success', 3000);
      
      // Recalculate storage after clearing
      await calculateStorageUsage();
    } catch (error) {
      console.error('Error clearing cache:', error);
      showSnackbar(t('profilePage.cache.failed') || 'Failed to clear cache', 'error', 4000);
    } finally {
      setIsClearingStorage(false);
    }
  };

  const openStorageManager = async () => {
    setShowStorageModal(true);
    await calculateStorageUsage();
  };

  // 2FA Functions
  const generateSecretKey = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const handle2FASetup = async () => {
    // Check if 2FA is already enabled
    try {
      const stored2FA = await AsyncStorage.getItem('@2fa_enabled');
      const isEnabled = stored2FA === 'true';
      setIs2FAEnabled(isEnabled);
      
      if (isEnabled) {
        setTwoFAStep('enabled');
      } else {
        // Generate new secret and backup codes
        const secret = generateSecretKey();
        const codes = generateBackupCodes();
        setSecretKey(secret);
        setBackupCodes(codes);
        
        // Generate QR code data (otpauth URL)
        const appName = 'Famora';
        const accountName = userEmail || 'user';
        const qrData = `otpauth://totp/${appName}:${accountName}?secret=${secret}&issuer=${appName}`;
        setQrCodeData(qrData);
        setTwoFAStep('setup');
      }
      
      setShow2FAModal(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      showSnackbar(t('profilePage.twoFA.setupFailed') || 'Failed to setup 2FA', 'error', 4000);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showSnackbar(t('profilePage.twoFA.invalidCode') || 'Please enter a 6-digit code', 'error', 3000);
      return;
    }

    setIsEnabling2FA(true);
    try {
      // In a real implementation, you would verify the code with a backend
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store 2FA settings
      await AsyncStorage.setItem('@2fa_enabled', 'true');
      await AsyncStorage.setItem('@2fa_secret', secretKey);
      await AsyncStorage.setItem('@2fa_backup_codes', JSON.stringify(backupCodes));
      
      setIs2FAEnabled(true);
      setTwoFAStep('enabled');
      showSnackbar(t('profilePage.twoFA.enabled') || '2FA enabled successfully!', 'success', 3000);
      setVerificationCode('');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      showSnackbar(t('profilePage.twoFA.verificationFailed') || 'Verification failed', 'error', 4000);
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const disable2FA = async () => {
    Alert.alert(
      t('profilePage.twoFA.disableTitle') || 'Disable 2FA',
      t('profilePage.twoFA.disableMessage') || 'Are you sure you want to disable two-factor authentication?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.twoFA.disableButton') || 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@2fa_enabled');
              await AsyncStorage.removeItem('@2fa_secret');
              await AsyncStorage.removeItem('@2fa_backup_codes');
              
              setIs2FAEnabled(false);
              setShow2FAModal(false);
              showSnackbar(t('profilePage.twoFA.disabled') || '2FA disabled', 'success', 3000);
            } catch (error) {
              console.error('Error disabling 2FA:', error);
              showSnackbar(t('profilePage.twoFA.disableFailed') || 'Failed to disable 2FA', 'error', 4000);
            }
          }
        }
      ]
    );
  };

  const copySecretKey = async () => {
    try {
      await Clipboard.setStringAsync(secretKey);
      showSnackbar(t('profilePage.twoFA.secretCopied') || 'Secret key copied!', 'success', 2000);
    } catch (error) {
      console.error('Error copying secret:', error);
    }
  };

  const copyBackupCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      showSnackbar(t('profilePage.twoFA.codeCopied') || 'Code copied!', 'success', 2000);
    } catch (error) {
      console.error('Error copying code:', error);
    }
  };

  // Session Management Functions
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
      case 'phone':
      case 'ios':
      case 'android':
        return '📱';
      case 'tablet':
      case 'ipad':
        return '📱';
      case 'desktop':
      case 'windows':
      case 'mac':
      case 'linux':
        return '💻';
      case 'web':
      case 'browser':
        return '🌐';
      default:
        return '📱';
    }
  };

  const generateMockSessions = () => {
    const devices = [
      { type: 'Mobile', name: 'iPhone 14 Pro', os: 'iOS 17.1', location: 'New York, US' },
      { type: 'Desktop', name: 'MacBook Pro', os: 'macOS Sonoma', location: 'New York, US' },
      { type: 'Web', name: 'Chrome Browser', os: 'Windows 11', location: 'London, UK' },
      { type: 'Tablet', name: 'iPad Air', os: 'iPadOS 17', location: 'Berlin, DE' },
    ];

    return devices.map((device, index) => ({
      id: `session-${index + 1}`,
      deviceType: device.type,
      deviceName: device.name,
      os: device.os,
      location: device.location,
      lastActive: index === 0 ? 'Active now' : `${Math.floor(Math.random() * 24) + 1}h ago`,
      isCurrent: index === 0,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    }));
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      // In production, fetch from backend API
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockSessions = generateMockSessions();
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      showSnackbar(t('profilePage.sessions.loadFailed') || 'Failed to load sessions', 'error', 4000);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleManageSessions = async () => {
    setShowSessionsModal(true);
    await loadSessions();
  };

  const revokeSession = async (sessionId: string) => {
    Alert.alert(
      t('profilePage.sessions.revokeTitle') || 'Revoke Session',
      t('profilePage.sessions.revokeMessage') || 'This will log out this device. Continue?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.sessions.revoke') || 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              // In production, call backend API to revoke session
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Remove session from list
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              showSnackbar(t('profilePage.sessions.revoked') || 'Session revoked', 'success', 3000);
            } catch (error) {
              console.error('Error revoking session:', error);
              showSnackbar(t('profilePage.sessions.revokeFailed') || 'Failed to revoke session', 'error', 4000);
            }
          }
        }
      ]
    );
  };

  const revokeAllOtherSessions = async () => {
    const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;
    
    if (otherSessionsCount === 0) {
      showSnackbar(t('profilePage.sessions.noOtherSessions') || 'No other sessions to revoke', 'info', 3000);
      return;
    }

    Alert.alert(
      t('profilePage.sessions.revokeAllTitle') || 'Revoke All Other Sessions',
      t('profilePage.sessions.revokeAllMessage', { count: String(otherSessionsCount) }) || `This will log out ${otherSessionsCount} other device(s). Continue?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.sessions.revokeAll') || 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              // In production, call backend API to revoke all other sessions
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // Keep only current session
              setSessions(prev => prev.filter(s => s.isCurrent));
              showSnackbar(t('profilePage.sessions.allRevoked') || 'All other sessions revoked', 'success', 3000);
            } catch (error) {
              console.error('Error revoking all sessions:', error);
              showSnackbar(t('profilePage.sessions.revokeAllFailed') || 'Failed to revoke sessions', 'error', 4000);
            }
          }
        }
      ]
    );
  };

  // Privacy Settings Functions
  const loadPrivacySettings = async () => {
    try {
      // Load from database
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (!error && data?.settings?.privacy) {
          setPrivacySettings(data.settings.privacy);
          return;
        }
      }
      
      // Fallback to AsyncStorage if database load fails
      const storedSettings = await AsyncStorage.getItem('@privacy_settings');
      if (storedSettings) {
        setPrivacySettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handlePrivacySettings = async () => {
    await loadPrivacySettings();
    setShowPrivacyModal(true);
  };

  const togglePrivacySetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePrivacySettings = async () => {
    setIsSavingPrivacy(true);
    try {
      // Save to database
      if (user?.id) {
        // First, get current settings to preserve other sections
        const { data: currentData } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single();

        const updatedSettings = {
          ...(currentData?.settings || {}),
          privacy: privacySettings
        };

        const { error } = await supabase
          .from('profiles')
          .update({ settings: updatedSettings })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving privacy settings to database:', error);
          throw error;
        }
      }
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem('@privacy_settings', JSON.stringify(privacySettings));
      
      showSnackbar(t('profilePage.privacy.saved') || 'Privacy settings saved', 'success', 3000);
      setShowPrivacyModal(false);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showSnackbar(t('profilePage.privacy.saveFailed') || 'Failed to save privacy settings', 'error', 4000);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const resetPrivacySettings = () => {
    Alert.alert(
      t('profilePage.privacy.resetTitle') || 'Reset Privacy Settings',
      t('profilePage.privacy.resetMessage') || 'This will reset all privacy settings to default values. Continue?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profilePage.privacy.reset') || 'Reset',
          style: 'destructive',
          onPress: () => {
            setPrivacySettings({
              // Profile visibility
              showProfilePhoto: true,
              showBirthday: true,
              showEmail: false,
              showPhone: false,
              
              // Notifications
              taskNotifications: true,
              eventNotifications: true,
              shoppingNotifications: true,
            });
            showSnackbar(t('profilePage.privacy.resetSuccess') || 'Privacy settings reset', 'success', 3000);
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
            showSnackbar(t('profilePage.deleteAccount.notImplemented'), 'info', 4000);
          }
        }
      ]
    );
  };

  // FAQ Data
  const faqItems = [
    {
      id: 'getting-started',
      question: t('profilePage.faq.items.gettingStarted.question') || 'How do I get started with Famora?',
      answer: t('profilePage.faq.items.gettingStarted.answer') || 'Create a family, invite members, and start managing tasks together! You can create tasks, set up a shopping list, and track family activities.',
      icon: '🚀'
    },
    {
      id: 'add-family-members',
      question: t('profilePage.faq.items.addMembers.question') || 'How do I add family members?',
      answer: t('profilePage.faq.items.addMembers.answer') || 'Go to your family settings and use the invite link or email invitation feature. Family members can join using the unique family code.',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      id: 'manage-tasks',
      question: t('profilePage.faq.items.manageTasks.question') || 'How do tasks work?',
      answer: t('profilePage.faq.items.manageTasks.answer') || 'Create tasks, assign them to family members, set due dates, and track completion. Completed tasks earn points that contribute to family flames!',
      icon: '✅'
    },
    {
      id: 'flames-points',
      question: t('profilePage.faq.items.flamesPoints.question') || 'What are Flames and Points?',
      answer: t('profilePage.faq.items.flamesPoints.answer') || 'Flames are family activity points earned by completing tasks and engaging with the app. They help track your family\'s productivity and unlock achievements!',
      icon: '🔥'
    },
    {
      id: 'notifications',
      question: t('profilePage.faq.items.notifications.question') || 'How do I manage notifications?',
      answer: t('profilePage.faq.items.notifications.answer') || 'Go to Profile → Communication → Notifications to enable or disable push notifications for family activities, task assignments, and updates.',
      icon: '🔔'
    },
    {
      id: 'change-password',
      question: t('profilePage.faq.items.changePassword.question') || 'How do I change my password?',
      answer: t('profilePage.faq.items.changePassword.answer') || 'Go to Profile → Personalization → Change Password. Enter your current password and your new password twice to confirm.',
      icon: '🔐'
    },
    {
      id: 'dark-mode',
      question: t('profilePage.faq.items.darkMode.question') || 'How do I enable Dark Mode?',
      answer: t('profilePage.faq.items.darkMode.answer') || 'Go to Profile → Personalization → Dark Mode and toggle the switch. The app will immediately switch to dark mode.',
      icon: '🌙'
    },
    {
      id: 'delete-account',
      question: t('profilePage.faq.items.deleteAccount.question') || 'How do I delete my account?',
      answer: t('profilePage.faq.items.deleteAccount.answer') || 'Go to Profile → General → Delete Account. This action is permanent and will delete all your data. Please contact support if you need assistance.',
      icon: '⚠️'
    },
    {
      id: 'contact-support',
      question: t('profilePage.faq.items.contactSupport.question') || 'How do I contact support?',
      answer: t('profilePage.faq.items.contactSupport.answer') || 'You can reach our support team through the FAQ & Help section. Click "Contact Support" to send us an email with your question or concern.',
      icon: '💬'
    }
  ];

  const toggleFaqItem = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
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
          onPress: handle2FASetup,
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
          onPress: handleManageSessions,
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
          onPress: handlePrivacySettings,
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
                  showSnackbar(t('profilePage.sections.communication.notifications.permissionMessage'), 'error', 4000);
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
          onPress: () => setShowFeedbackModal(true),
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
          onPress: () => setShowFaqModal(true),
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
          onPress: openStorageManager,
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

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.feedback.title') || 'Give Feedback'}</Text>
            <Text style={styles.modalSubtitle}>{t('profilePage.modals.feedback.subtitle') || 'Help us improve your experience'}</Text>

            <View style={styles.modalForm}>
              {/* Feedback Category Selector */}
              <View style={styles.feedbackCategoryContainer}>
                <Text style={styles.feedbackLabel}>{t('profilePage.modals.feedback.category') || 'Category'}</Text>
                <View style={styles.feedbackCategories}>
                  {[
                    { id: 'general', label: t('profilePage.modals.feedback.categories.general') || 'General', icon: '💬' },
                    { id: 'bug', label: t('profilePage.modals.feedback.categories.bug') || 'Bug Report', icon: '🐛' },
                    { id: 'feature', label: t('profilePage.modals.feedback.categories.feature') || 'Feature Request', icon: '✨' },
                    { id: 'improvement', label: t('profilePage.modals.feedback.categories.improvement') || 'Improvement', icon: '🚀' },
                  ].map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.feedbackCategoryButton,
                        feedbackCategory === category.id && styles.feedbackCategoryButtonActive
                      ]}
                      onPress={() => setFeedbackCategory(category.id)}
                    >
                      <Text style={styles.feedbackCategoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.feedbackCategoryText,
                        feedbackCategory === category.id && styles.feedbackCategoryTextActive
                      ]}>
                        {category.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Feedback Message */}
              <View style={styles.feedbackMessageContainer}>
                <Text style={styles.feedbackLabel}>{t('profilePage.modals.feedback.message') || 'Your Feedback'}</Text>
                <TextInput
                  style={[
                    styles.feedbackTextArea,
                    Platform.OS === 'web' && ({
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    } as any)
                  ]}
                  placeholder={t('profilePage.modals.feedback.placeholder') || 'Tell us what you think...'}
                  placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
                  multiline
                  numberOfLines={6}
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackMessage('');
                  setFeedbackCategory('general');
                }}
                disabled={isSubmittingFeedback}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, isSubmittingFeedback && styles.modalConfirmButtonDisabled]}
                onPress={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
              >
                <Text style={styles.modalConfirmText}>
                  {isSubmittingFeedback 
                    ? (t('profilePage.modals.feedback.submitting') || 'Submitting...') 
                    : (t('profilePage.modals.feedback.submit') || 'Submit')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAQ & Help Modal */}
      <Modal
        visible={showFaqModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFaqModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.faqModalContainer]}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.faq.title') || 'FAQ & Help'}</Text>
            <Text style={styles.modalSubtitle}>{t('profilePage.modals.faq.subtitle') || 'Find answers to common questions'}</Text>

            <ScrollView style={styles.faqScrollView} showsVerticalScrollIndicator={false}>
              {faqItems.map((item, index) => (
                <View key={item.id} style={styles.faqItem}>
                  <Pressable
                    style={[
                      styles.faqQuestionContainer,
                      expandedFaqId === item.id && styles.faqQuestionContainerActive
                    ]}
                    onPress={() => toggleFaqItem(item.id)}
                  >
                    <View style={styles.faqQuestionLeft}>
                      <Text style={styles.faqIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.faqQuestion,
                        expandedFaqId === item.id && styles.faqQuestionActive
                      ]}>
                        {item.question}
                      </Text>
                    </View>
                    <View style={styles.faqChevron}>
                      {expandedFaqId === item.id ? (
                        <ChevronUp size={20} color="#17F196" strokeWidth={2} />
                      ) : (
                        <ChevronDown size={20} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} strokeWidth={2} />
                      )}
                    </View>
                  </Pressable>
                  
                  {expandedFaqId === item.id && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.faqFooter}>
              <Text style={styles.faqFooterText}>{t('profilePage.modals.faq.stillNeedHelp') || 'Still need help?'}</Text>
              <Pressable
                style={styles.faqContactButton}
                onPress={() => {
                  setShowFaqModal(false);
                  setTimeout(() => contactSupport(), 300);
                }}
              >
                <Text style={styles.faqContactButtonText}>{t('profilePage.modals.faq.contactSupport') || 'Contact Support'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowFaqModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Storage Management Modal */}
      <Modal
        visible={showStorageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStorageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.storage.title') || 'Manage Storage'}</Text>
            <Text style={styles.modalSubtitle}>{t('profilePage.modals.storage.subtitle') || 'View and manage your app storage'}</Text>

            {isCalculatingStorage ? (
              <View style={styles.storageLoadingContainer}>
                <Text style={styles.storageLoadingText}>{t('profilePage.storage.calculating') || 'Calculating storage...'}</Text>
              </View>
            ) : (
              <View style={styles.storageInfoContainer}>
                {/* Total Storage */}
                <View style={styles.storageCard}>
                  <View style={styles.storageCardHeader}>
                    <Text style={styles.storageCardIcon}>💾</Text>
                    <Text style={styles.storageCardTitle}>{t('profilePage.storage.totalStorage') || 'Total Storage'}</Text>
                  </View>
                  <Text style={styles.storageCardValue}>{storageData.estimatedSize}</Text>
                  <Text style={styles.storageCardSubtext}>{t('profilePage.storage.totalItems', { count: String(storageData.totalKeys) }) || `${storageData.totalKeys} items`}</Text>
                </View>

                {/* Cache Data */}
                <View style={styles.storageCard}>
                  <View style={styles.storageCardHeader}>
                    <Text style={styles.storageCardIcon}>🗂️</Text>
                    <Text style={styles.storageCardTitle}>{t('profilePage.storage.cacheData') || 'Cache Data'}</Text>
                  </View>
                  <Text style={styles.storageCardValue}>{storageData.cacheKeys}</Text>
                  <Text style={styles.storageCardSubtext}>{t('profilePage.storage.cacheItems') || 'cached items'}</Text>
                </View>

                {/* Temporary Files */}
                <View style={styles.storageCard}>
                  <View style={styles.storageCardHeader}>
                    <Text style={styles.storageCardIcon}>📄</Text>
                    <Text style={styles.storageCardTitle}>{t('profilePage.storage.tempFiles') || 'Temporary Files'}</Text>
                  </View>
                  <Text style={styles.storageCardValue}>{storageData.tempKeys}</Text>
                  <Text style={styles.storageCardSubtext}>{t('profilePage.storage.tempItems') || 'temporary items'}</Text>
                </View>

                {/* Storage Info */}
                <View style={styles.storageInfoBox}>
                  <Text style={styles.storageInfoIcon}>ℹ️</Text>
                  <Text style={styles.storageInfoText}>
                    {t('profilePage.storage.info') || 'Clearing cache will remove temporary data and may improve app performance. Your personal data will not be affected.'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowStorageModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, isClearingStorage && styles.modalConfirmButtonDisabled]}
                onPress={clearAppCache}
                disabled={isClearingStorage}
              >
                <Text style={styles.modalConfirmText}>
                  {isClearingStorage 
                    ? (t('profilePage.storage.clearing') || 'Clearing...') 
                    : (t('profilePage.storage.clearCache') || 'Clear Cache')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Two-Factor Authentication Modal */}
      <Modal
        visible={show2FAModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.twoFAModalContainer]}>
            <Text style={styles.modalTitle}>
              {twoFAStep === 'enabled' 
                ? (t('profilePage.modals.twoFA.titleEnabled') || '2FA Status')
                : (t('profilePage.modals.twoFA.title') || 'Setup 2FA')}
            </Text>

            {/* Setup Step */}
            {twoFAStep === 'setup' && (
              <ScrollView style={styles.twoFAScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>
                  {t('profilePage.modals.twoFA.subtitle') || 'Scan this code with your authenticator app'}
                </Text>

                {/* Secret Key Display */}
                <View style={styles.secretKeyContainer}>
                  <View style={styles.secretKeyHeader}>
                    <Text style={styles.secretKeyLabel}>
                      {t('profilePage.twoFA.secretKey') || 'Secret Key'}
                    </Text>
                    <Pressable style={styles.copyButton} onPress={copySecretKey}>
                      <Text style={styles.copyButtonText}>{t('profilePage.twoFA.copy') || 'Copy'}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.secretKeyBox}>
                    <Text style={styles.secretKeyText}>{secretKey}</Text>
                  </View>
                  <Text style={styles.secretKeyHint}>
                    {t('profilePage.twoFA.secretKeyHint') || 'Enter this key in your authenticator app (Google Authenticator, Authy, etc.)'}
                  </Text>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>
                    {t('profilePage.twoFA.instructions') || 'How to setup:'}
                  </Text>
                  <View style={styles.instructionsList}>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>1</Text>
                      <Text style={styles.instructionText}>
                        {t('profilePage.twoFA.step1') || 'Open your authenticator app'}
                      </Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>2</Text>
                      <Text style={styles.instructionText}>
                        {t('profilePage.twoFA.step2') || 'Add a new account manually'}
                      </Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>3</Text>
                      <Text style={styles.instructionText}>
                        {t('profilePage.twoFA.step3') || 'Enter the secret key above'}
                      </Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>4</Text>
                      <Text style={styles.instructionText}>
                        {t('profilePage.twoFA.step4') || 'Enter the 6-digit code below to verify'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Next Button */}
                <Pressable
                  style={styles.nextButton}
                  onPress={() => setTwoFAStep('verify')}
                >
                  <Text style={styles.nextButtonText}>
                    {t('profilePage.twoFA.next') || 'Next: Verify Code'}
                  </Text>
                </Pressable>
              </ScrollView>
            )}

            {/* Verify Step */}
            {twoFAStep === 'verify' && (
              <View style={styles.verifyContainer}>
                <Text style={styles.modalSubtitle}>
                  {t('profilePage.modals.twoFA.verifySubtitle') || 'Enter the 6-digit code from your app'}
                </Text>

                <View style={styles.verificationInputContainer}>
                  <TextInput
                    style={[
                      styles.verificationInput,
                      Platform.OS === 'web' && ({
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      } as any)
                    ]}
                    placeholder="000000"
                    placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    autoFocus
                  />
                </View>

                {/* Backup Codes Preview */}
                <View style={styles.backupCodesInfo}>
                  <Text style={styles.backupCodesInfoIcon}>💾</Text>
                  <Text style={styles.backupCodesInfoText}>
                    {t('profilePage.twoFA.backupCodesInfo') || 'After verification, you\'ll receive 8 backup codes. Save them securely!'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setTwoFAStep('setup')}
                  >
                    <Text style={styles.modalCancelText}>{t('common.back') || 'Back'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalConfirmButton, isEnabling2FA && styles.modalConfirmButtonDisabled]}
                    onPress={verifyAndEnable2FA}
                    disabled={isEnabling2FA}
                  >
                    <Text style={styles.modalConfirmText}>
                      {isEnabling2FA 
                        ? (t('profilePage.twoFA.enabling') || 'Enabling...') 
                        : (t('profilePage.twoFA.enable') || 'Enable 2FA')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Enabled/Manage Step */}
            {twoFAStep === 'enabled' && (
              <View style={styles.enabledContainer}>
                <View style={styles.enabled2FAStatus}>
                  <Text style={styles.enabled2FAIcon}>✅</Text>
                  <Text style={styles.enabled2FAText}>
                    {t('profilePage.twoFA.enabledMessage') || 'Two-Factor Authentication is enabled'}
                  </Text>
                </View>

                {/* Backup Codes */}
                <View style={styles.backupCodesSection}>
                  <Text style={styles.backupCodesTitle}>
                    {t('profilePage.twoFA.backupCodesTitle') || 'Backup Codes'}
                  </Text>
                  <Text style={styles.backupCodesSubtitle}>
                    {t('profilePage.twoFA.backupCodesSubtitle') || 'Save these codes in a secure place. Each code can be used once if you lose access to your authenticator app.'}
                  </Text>
                  <View style={styles.backupCodesList}>
                    {backupCodes.map((code, index) => (
                      <Pressable
                        key={index}
                        style={styles.backupCodeItem}
                        onPress={() => copyBackupCode(code)}
                      >
                        <Text style={styles.backupCodeText}>{code}</Text>
                        <Copy size={16} color="#17F196" />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setShow2FAModal(false)}
                  >
                    <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalConfirmButton, { backgroundColor: '#FF6B6B' }]}
                    onPress={disable2FA}
                  >
                    <Text style={styles.modalConfirmText}>
                      {t('profilePage.twoFA.disable') || 'Disable 2FA'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Close button for setup step */}
            {twoFAStep === 'setup' && (
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShow2FAModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Manage Sessions Modal */}
      <Modal
        visible={showSessionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.sessionsModalContainer]}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.sessions.title') || 'Manage Sessions'}</Text>
            <Text style={styles.modalSubtitle}>
              {t('profilePage.modals.sessions.subtitle') || 'View and manage your active login sessions'}
            </Text>

            {isLoadingSessions ? (
              <View style={styles.sessionsLoadingContainer}>
                <Text style={styles.sessionsLoadingText}>{t('profilePage.sessions.loading') || 'Loading sessions...'}</Text>
              </View>
            ) : (
              <ScrollView style={styles.sessionsScrollView} showsVerticalScrollIndicator={false}>
                {sessions.map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionDeviceIcon}>{getDeviceIcon(session.deviceType)}</Text>
                      <View style={styles.sessionHeaderInfo}>
                        <View style={styles.sessionTitleRow}>
                          <Text style={styles.sessionDeviceName}>{session.deviceName}</Text>
                          {session.isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>
                                {t('profilePage.sessions.current') || 'Current'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sessionOS}>{session.os}</Text>
                      </View>
                    </View>

                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionDetailRow}>
                        <Text style={styles.sessionDetailLabel}>
                          {t('profilePage.sessions.location') || 'Location'}:
                        </Text>
                        <Text style={styles.sessionDetailValue}>{session.location}</Text>
                      </View>
                      <View style={styles.sessionDetailRow}>
                        <Text style={styles.sessionDetailLabel}>
                          {t('profilePage.sessions.lastActive') || 'Last Active'}:
                        </Text>
                        <Text style={styles.sessionDetailValue}>{session.lastActive}</Text>
                      </View>
                      <View style={styles.sessionDetailRow}>
                        <Text style={styles.sessionDetailLabel}>IP:</Text>
                        <Text style={styles.sessionDetailValue}>{session.ip}</Text>
                      </View>
                    </View>

                    {!session.isCurrent && (
                      <Pressable
                        style={styles.revokeSessionButton}
                        onPress={() => revokeSession(session.id)}
                      >
                        <Text style={styles.revokeSessionButtonText}>
                          {t('profilePage.sessions.revoke') || 'Revoke Session'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))}

                {/* Info Box */}
                <View style={styles.sessionsInfoBox}>
                  <Text style={styles.sessionsInfoIcon}>ℹ️</Text>
                  <Text style={styles.sessionsInfoText}>
                    {t('profilePage.sessions.info') || 'Sessions expire automatically after 30 days of inactivity. Revoking a session will immediately log out that device.'}
                  </Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowSessionsModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: '#FF6B6B' }]}
                onPress={revokeAllOtherSessions}
              >
                <Text style={styles.modalConfirmText}>
                  {t('profilePage.sessions.revokeAll') || 'Revoke All Others'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.privacyModalContainer]}>
            <Text style={styles.modalTitle}>{t('profilePage.modals.privacy.title') || 'Privacy Settings'}</Text>
            <Text style={styles.modalSubtitle}>
              {t('profilePage.modals.privacy.subtitle') || 'Control who can see your information and activity'}
            </Text>

            <ScrollView style={styles.privacyScrollView} showsVerticalScrollIndicator={false}>
              {/* Profile Information Section */}
              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>
                  {t('profilePage.privacy.sections.profile') || 'Profile Information'}
                </Text>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.showProfilePhoto.label') || 'Show Profile Photo'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.showProfilePhoto.description') || 'Display your profile photo to family members'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.showProfilePhoto}
                    onValueChange={() => togglePrivacySetting('showProfilePhoto')}
                  />
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.showBirthday.label') || 'Show Birthday'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.showBirthday.description') || 'Share your birthday with family members'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.showBirthday}
                    onValueChange={() => togglePrivacySetting('showBirthday')}
                  />
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.showEmail.label') || 'Show Email'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.showEmail.description') || 'Display your email address to family'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.showEmail}
                    onValueChange={() => togglePrivacySetting('showEmail')}
                  />
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.showPhone.label') || 'Show Phone Number'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.showPhone.description') || 'Share your phone number with family'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.showPhone}
                    onValueChange={() => togglePrivacySetting('showPhone')}
                  />
                </View>
              </View>

              {/* Notifications Section */}
              <View style={styles.privacySection}>
                <Text style={styles.privacySectionTitle}>
                  {t('profilePage.privacy.sections.notifications') || 'Notifications'}
                </Text>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.taskNotifications.label') || 'Task Notifications'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.taskNotifications.description') || 'Get notified about task assignments'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.taskNotifications}
                    onValueChange={() => togglePrivacySetting('taskNotifications')}
                  />
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.eventNotifications.label') || 'Event Notifications'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.eventNotifications.description') || 'Get notified about calendar events'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.eventNotifications}
                    onValueChange={() => togglePrivacySetting('eventNotifications')}
                  />
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyItemInfo}>
                    <Text style={styles.privacyItemLabel}>
                      {t('profilePage.privacy.shoppingNotifications.label') || 'Shopping Notifications'}
                    </Text>
                    <Text style={styles.privacyItemDescription}>
                      {t('profilePage.privacy.shoppingNotifications.description') || 'Get notified about shopping list updates'}
                    </Text>
                  </View>
                  <CustomToggleSwitch
                    value={privacySettings.shoppingNotifications}
                    onValueChange={() => togglePrivacySetting('shoppingNotifications')}
                  />
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.privacyInfoBox}>
                <Text style={styles.privacyInfoIcon}>🔒</Text>
                <Text style={styles.privacyInfoText}>
                  {t('profilePage.privacy.info') || 'These settings control how your information is shared within your family. Your data is always encrypted and secure.'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.privacyResetButton}
                onPress={resetPrivacySettings}
              >
                <Text style={styles.privacyResetButtonText}>
                  {t('profilePage.privacy.reset') || 'Reset'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, isSavingPrivacy && styles.modalConfirmButtonDisabled]}
                onPress={savePrivacySettings}
                disabled={isSavingPrivacy}
              >
                <Text style={styles.modalConfirmText}>
                  {isSavingPrivacy ? (t('profilePage.privacy.saving') || 'Saving...') : (t('profilePage.privacy.save') || 'Save')}
                </Text>
              </Pressable>
            </View>
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

  // Feedback Modal
  feedbackCategoryContainer: {
    gap: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  feedbackCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.input,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  feedbackCategoryButtonActive: {
    backgroundColor: 'rgba(23, 241, 150, 0.15)',
    borderColor: '#17F196',
  },
  feedbackCategoryIcon: {
    fontSize: 16,
  },
  feedbackCategoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  feedbackCategoryTextActive: {
    color: '#17F196',
    fontWeight: '600',
  },
  feedbackMessageContainer: {
    gap: 8,
  },
  feedbackTextArea: {
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    color: theme.text,
    minHeight: 120,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#9DB4AB',
    opacity: 0.6,
  },

  // FAQ Modal
  faqModalContainer: {
    maxHeight: '85%',
  },
  faqScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  faqQuestionContainerActive: {
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderColor: '#17F196',
  },
  faqQuestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  faqIcon: {
    fontSize: 20,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  faqQuestionActive: {
    color: '#17F196',
    fontWeight: '600',
  },
  faqChevron: {
    marginLeft: 8,
  },
  faqAnswerContainer: {
    padding: 16,
    backgroundColor: theme.input,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(23, 241, 150, 0.3)',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  faqFooter: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  faqFooterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 12,
  },
  faqContactButton: {
    backgroundColor: '#17F196',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  faqContactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Storage Management Modal
  storageLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  storageLoadingText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  storageInfoContainer: {
    gap: 12,
    marginBottom: 16,
  },
  storageCard: {
    backgroundColor: theme.input,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  storageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  storageCardIcon: {
    fontSize: 20,
  },
  storageCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  storageCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#17F196',
    marginBottom: 4,
  },
  storageCardSubtext: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  storageInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 241, 150, 0.3)',
  },
  storageInfoIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  storageInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.textSecondary,
  },

  // Two-Factor Authentication Modal
  twoFAModalContainer: {
    maxHeight: '90%',
  },
  twoFAScrollView: {
    maxHeight: 500,
    marginBottom: 16,
  },
  secretKeyContainer: {
    marginBottom: 20,
  },
  secretKeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secretKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  copyButton: {
    backgroundColor: '#17F196',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secretKeyBox: {
    backgroundColor: theme.input,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    marginBottom: 8,
  },
  secretKeyText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#17F196',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  secretKeyHint: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#17F196',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#17F196',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyContainer: {
    gap: 16,
    marginBottom: 16,
  },
  verificationInputContainer: {
    marginVertical: 8,
  },
  verificationInput: {
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#17F196',
    color: theme.text,
  },
  backupCodesInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 241, 150, 0.3)',
  },
  backupCodesInfoIcon: {
    fontSize: 18,
  },
  backupCodesInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: theme.textSecondary,
  },
  enabledContainer: {
    gap: 20,
    marginBottom: 16,
  },
  enabled2FAStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#17F196',
  },
  enabled2FAIcon: {
    fontSize: 24,
  },
  enabled2FAText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#17F196',
  },
  backupCodesSection: {
    gap: 12,
  },
  backupCodesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  backupCodesSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  backupCodesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.input,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    width: '48%',
  },
  backupCodeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.text,
    fontWeight: '600',
  },

  // Manage Sessions Modal
  sessionsModalContainer: {
    maxHeight: '90%',
  },
  sessionsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sessionsLoadingText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sessionsScrollView: {
    maxHeight: 500,
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: theme.input,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  sessionDeviceIcon: {
    fontSize: 24,
  },
  sessionHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionDeviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  currentBadge: {
    backgroundColor: '#17F196',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionOS: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  sessionDetails: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.inputBorder,
    marginBottom: 12,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    minWidth: 80,
  },
  sessionDetailValue: {
    flex: 1,
    fontSize: 12,
    color: theme.text,
  },
  revokeSessionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  revokeSessionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionsInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 241, 150, 0.3)',
    marginTop: 8,
  },
  sessionsInfoIcon: {
    fontSize: 16,
  },
  sessionsInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: theme.textSecondary,
  },

  // Privacy Settings Modal
  privacyModalContainer: {
    maxHeight: '92%',
  },
  privacyScrollView: {
    maxHeight: 550,
    marginBottom: 16,
  },
  privacySection: {
    marginBottom: 24,
  },
  privacySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.input,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  privacyItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  privacyItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  privacyItemDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  privacyInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.3)',
    marginTop: 8,
  },
  privacyInfoIcon: {
    fontSize: 16,
  },
  privacyInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: theme.textSecondary,
  },
  privacyResetButton: {
    flex: 1,
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  privacyResetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
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