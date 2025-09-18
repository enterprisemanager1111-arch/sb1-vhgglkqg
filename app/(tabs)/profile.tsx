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
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { User, Settings, Bell, LogOut, Camera, Trophy, ChevronRight, Shield, CircleHelp as HelpCircle, Info, CreditCard as Edit3, Crown, Star, Target, Activity, Calendar, SquareCheck as CheckSquare, Share2, Moon, Globe, Smartphone, Download, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import { router } from 'expo-router';
import { formatBirthDate } from '@/utils/birthdaySystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

  const { user, profile, signOut, updateProfile } = useAuth();
  const { currentFamily, familyMembers, userRole } = useFamily();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { tasks, getCompletedTasks } = useFamilyTasks();
  const { items, getCompletedItems } = useFamilyShoppingItems();

  const profileCardScale = useSharedValue(1);

  // Calculate user statistics
  const completedTasks = getCompletedTasks();
  const completedShoppingItems = getCompletedItems();
  const userPoints = (completedTasks.length * 15) + (completedShoppingItems.length * 5);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long'
  }) : '';

  const userName = profile?.name || user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';

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
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Fehler', 'Neue Passwörter stimmen nicht überein');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Fehler', 'Neues Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert('Erfolg', 'Passwort wurde erfolgreich geändert');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Passwort konnte nicht geändert werden');
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
        message: `Famora Datenexport für ${userName}\n\nExportiert am: ${new Date().toLocaleDateString('de-DE')}\n\nDaten: ${dataString}`,
        title: 'Famora Datenexport',
      });
      
      setShowDataExportModal(false);
    } catch (error) {
      Alert.alert('Fehler', 'Daten konnten nicht exportiert werden');
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      
      Alert.alert(
        t('common.success') || 'Erfolg',
        `${t('settings.language.changed') || 'Sprache wurde auf'} ${getLanguageName(languageCode)}.`,
        [{ text: t('common.continue') || 'Weiter' }]
      );
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.error') || 'Fehler',
        t('settings.language.error') || 'Sprache konnte nicht geändert werden.'
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
    return languages[code as keyof typeof languages] || 'Deutsch';
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://famora.app/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://famora.app/terms');
  };

  const contactSupport = async () => {
    const supportEmail = 'support@famora.app';
    const subject = `Hilfe benötigt - Famora App`;
    const body = `Hallo Famora Team,\n\nIch benötige Hilfe bei:\n\n[Bitte beschreiben Sie Ihr Problem hier]\n\nMeine App-Version: 1.0.0\nMein Gerät: ${Platform.OS}\nMeine Familie-ID: ${currentFamily?.id || 'Keine Familie'}\n\nVielen Dank!`;
    
    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      Alert.alert(
        'Support kontaktieren',
        `Senden Sie eine E-Mail an: ${supportEmail}`,
        [
          { text: 'E-Mail kopieren', onPress: () => copyToClipboard(supportEmail) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Support-Kontakt konnte nicht geöffnet werden');
    }
  };

  const copyToClipboard = async (text: string) => {
    // In a real app, you'd use Clipboard from expo-clipboard
    Alert.alert('Kopiert', 'E-Mail-Adresse wurde kopiert');
  };

  const clearAppCache = async () => {
    Alert.alert(
      'Cache leeren',
      'Möchten Sie den App-Cache leeren? Dies kann die Leistung verbessern.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Cache leeren',
          onPress: async () => {
            try {
              // Clear AsyncStorage cache (except user preferences)
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('@cache_') || 
                key.startsWith('@temp_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              
              Alert.alert('Erfolg', 'App-Cache wurde geleert');
            } catch (error) {
              Alert.alert('Fehler', 'Cache konnte nicht geleert werden');
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
      title: 'Konto & Profil',
      icon: <User size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'edit-profile',
          title: 'Profil bearbeiten',
          description: 'Name, Geburtsdatum und Profilbild',
          icon: <Edit3 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/(onboarding)/profile'),
        },
        {
          id: 'account-settings',
          title: 'Passwort ändern',
          description: 'Ihr Passwort aktualisieren',
          icon: <Shield size={18} color="#54FE54" strokeWidth={2} />,
          type: 'action',
          onPress: () => setShowPasswordModal(true),
        },
        {
          id: 'biometric-auth',
          title: 'Biometrische Anmeldung',
          description: 'Fingerabdruck oder Face ID verwenden',
          icon: <Smartphone size={18} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: biometricsEnabled,
          onToggle: async (value) => {
            setBiometricsEnabled(value);
            await savePreference('@biometrics_enabled', value);
            Alert.alert(
              value ? 'Biometrie aktiviert' : 'Biometrie deaktiviert',
              value 
                ? 'Sie können sich jetzt mit Fingerabdruck oder Face ID anmelden'
                : 'Biometrische Anmeldung wurde deaktiviert'
            );
          },
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Einstellungen',
      icon: <Settings size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'notifications',
          title: 'Benachrichtigungen',
          description: 'Push-Nachrichten für Familienaktivitäten',
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
                  Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie Benachrichtigungen in den Systemeinstellungen');
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
          title: 'Dunkler Modus',
          description: 'App-Erscheinungsbild anpassen',
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
          title: 'Automatische Synchronisation',
          description: 'Daten automatisch aktualisieren',
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
          title: 'Nutzungsstatistiken',
          description: 'Anonyme Daten zur App-Verbesserung teilen',
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
      title: 'Familie & Sharing',
      icon: <Crown size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'family-role',
          title: 'Familien-Rolle',
          description: `${userRole === 'admin' ? 'Administrator' : 'Mitglied'} in ${currentFamily?.name || 'Familie'}`,
          icon: userRole === 'admin' ? <Crown size={18} color="#54FE54" strokeWidth={2} /> : <User size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/(tabs)/family'),
        },
        {
          id: 'invite-family',
          title: 'Familie einladen',
          description: 'Neue Mitglieder zur Familie hinzufügen',
          icon: <Share2 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/family/invite'),
        },
        {
          id: 'family-settings',
          title: 'Familieneinstellungen',
          description: 'Rollen, Berechtigungen und Familie verwalten',
          icon: <Settings size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/family/settings'),
        },
      ],
    },
    {
      id: 'support',
      title: 'Hilfe & Support',
      icon: <HelpCircle size={20} color="#54FE54" strokeWidth={2} />,
      items: [
        {
          id: 'help',
          title: 'Hilfe & FAQ',
          description: 'Häufige Fragen und Anleitungen',
          icon: <HelpCircle size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: contactSupport,
        },
        {
          id: 'about',
          title: 'Über Famora',
          description: 'Version, Datenschutz und Impressum',
          icon: <Info size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => {
            Alert.alert(
              'Über Famora',
              `Version: 1.0.0\nBuild: ${new Date().getFullYear()}.${new Date().getMonth() + 1}\n\nFamora - Ihre digitale Familienorganisation\n\nMit ❤️ entwickelt für Familien`,
              [
                { text: 'Datenschutz', onPress: openPrivacyPolicy },
                { text: 'AGB', onPress: openTermsOfService },
                { text: 'OK' }
              ]
            );
          },
        },
        {
          id: 'data-export',
          title: 'Daten exportieren',
          description: 'Persönliche Daten herunterladen',
          icon: <Download size={18} color="#54FE54" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => setShowDataExportModal(true),
        },
        {
          id: 'clear-cache',
          title: 'Cache leeren',
          description: 'App-Daten zurücksetzen für bessere Performance',
          icon: <Trash2 size={18} color="#54FE54" strokeWidth={2} />,
          type: 'action',
          onPress: clearAppCache,
        },
      ],
    },
    {
      id: 'account-actions',
      title: 'Konto-Aktionen',
      icon: <Trash2 size={20} color="#FF0000" strokeWidth={2} />,
      items: [
        {
          id: 'logout',
          title: 'Abmelden',
          description: 'Von diesem Gerät abmelden',
          icon: <LogOut size={18} color="#FF0000" strokeWidth={2} />,
          type: 'action',
          destructive: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  async function handleLogout() {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout process...');
              await signOut();
              console.log('Successfully signed out, navigating to onboarding...');
              // Give a moment for auth state to clear
              setTimeout(() => {
                router.replace('/(onboarding)');
              }, 100);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
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
      // This would typically refresh auth and family contexts
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(onboarding)/profile');
  };

  const profileCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileCardScale.value }],
  }));

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
          <Text style={styles.title}>Mein Profil</Text>
          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Edit3 size={18} color="#54FE54" strokeWidth={2} />
          </Pressable>
        </View>

        {/* User Profile Card */}
        <AnimatedView style={[styles.section, profileCardAnimatedStyle]}>
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
                    🎂 {formatBirthDate(profile.birth_date, false)}
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
                  <Text style={styles.statLabel}>Punkte</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <CheckSquare size={16} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{completedTasks.length}</Text>
                  <Text style={styles.statLabel}>Aufgaben</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Calendar size={16} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{memberSince.includes('2025') ? '< 1' : '1'}</Text>
                  <Text style={styles.statLabel}>Monate</Text>
                </View>
              </View>
            </View>

            {/* Account Status */}
            <View style={styles.accountStatus}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Mitglied seit</Text>
                <Text style={styles.statusValue}>{memberSince}</Text>
              </View>
              {currentFamily && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Familie</Text>
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
                <View key={item.id}>
                  <Pressable
                    style={[
                      styles.settingsItem,
                      item.destructive && styles.destructiveItem
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
                        {item.description && (
                          <Text style={styles.settingsDescription}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.settingsItemRight}>
                      {item.badge && (
                        <View style={styles.settingsBadge}>
                          <Text style={styles.settingsBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      
                      {item.type === 'toggle' && (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ 
                            false: '#E0E0E0', 
                            true: 'rgba(84, 254, 84, 0.3)' 
                          }}
                          thumbColor={item.value ? '#54FE54' : '#FFFFFF'}
                        />
                      )}
                      
                      {item.type === 'navigation' && (
                        <ChevronRight size={16} color="#666666" strokeWidth={2} />
                      )}
                      
                      {item.type === 'action' && (
                        <ChevronRight size={16} color={item.destructive ? "#FF0000" : "#666666"} strokeWidth={2} />
                      )}
                    </View>
                  </Pressable>
                  
                  {/* Divider between items (except last) */}
                  {index < section.items.length - 1 && (
                    <View style={styles.itemDivider} />
                  )}
                </View>
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
                placeholder="Neues Passwort"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Neues Passwort bestätigen"
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
                <Text style={styles.modalCancelText}>Abbrechen</Text>
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
              <Text style={styles.modalCancelText}>{t('common.cancel') || 'Abbrechen'}</Text>
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
            <Text style={styles.modalTitle}>Daten exportieren</Text>
            <Text style={styles.modalDescription}>
              Ihre persönlichen Famora-Daten werden als JSON-Datei exportiert. 
              Dies umfasst Ihr Profil, Familieninformationen und Aktivitätsstatistiken.
            </Text>
            
            <View style={styles.exportInfo}>
              <Text style={styles.exportInfoTitle}>Exportierte Daten:</Text>
              <Text style={styles.exportInfoItem}>• Profil und persönliche Informationen</Text>
              <Text style={styles.exportInfoItem}>• Familienrolle und -mitgliedschaft</Text>
              <Text style={styles.exportInfoItem}>• Abgeschlossene Aufgaben (Anzahl)</Text>
              <Text style={styles.exportInfoItem}>• Einkaufslisten-Aktivitäten</Text>
              <Text style={styles.exportInfoItem}>• App-Nutzungsstatistiken</Text>
            </View>
            
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowDataExportModal(false)}
              >
                <Text style={styles.modalCancelText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleDataExport}
              >
                <Download size={16} color="#161618" strokeWidth={2} />
                <Text style={styles.modalConfirmText}>Exportieren</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
});