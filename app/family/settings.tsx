import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ArrowLeft, CreditCard as Edit3, Share2, Shield, Trash2, Bell, Lock, Users, Settings as SettingsIcon, Copy, RefreshCw, Eye, EyeOff, Crown, UserX, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
  requiresAdmin?: boolean;
}

export default function FamilySettings() {
  const { t } = useLanguage();
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  
  const { currentFamily, userRole, generateNewCode, leaveFamily } = useFamily();
  const backButtonScale = useSharedValue(1);

  const isAdmin = userRole === 'admin';

  const settingSections: SettingSection[] = [
    {
      id: 'general',
      title: 'General',
      items: [
        {
          id: 'edit-name',
          title: 'Edit Name',
          description: 'Change your family name',
          icon: <Edit3 size={20} color="#54FE54" strokeWidth={2} />,
          type: 'action',
          onPress: () => {
            setNewFamilyName(currentFamily?.name || '');
            setShowNameEditModal(true);
          },
          requiresAdmin: true,
        },
        {
          id: 'family-code',
          title: 'Show Code',
          description: `Code: ${showFamilyCode ? currentFamily?.code : '••••••'}`,
          icon: showFamilyCode ? <Eye size={20} color="#00D4FF" strokeWidth={2} /> : <EyeOff size={20} color="#666666" strokeWidth={2} />,
          type: 'action',
          onPress: () => setShowFamilyCode(!showFamilyCode),
        },
        {
          id: 'copy-code',
          title: 'Copy Code',
          description: 'Copy family code to clipboard',
          icon: <Copy size={20} color="#FFB800" strokeWidth={2} />,
          type: 'action',
          onPress: handleCopyCode,
        },
        {
          id: 'regenerate-code',
          title: 'Regenerate Code',
          description: 'Generate a new family code',
          icon: <RefreshCw size={20} color="#FF6B6B" strokeWidth={2} />,
          type: 'action',
          onPress: handleRegenerateCode,
          requiresAdmin: true,
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Manage family notifications',
          icon: <Bell size={20} color="#54FE54" strokeWidth={2} />,
          type: 'toggle',
          value: true,
          onToggle: (value) => console.log('Notifications:', value),
        },
        {
          id: 'privacy-mode',
          title: 'Privacy Mode',
          description: 'Control family data visibility',
          icon: <Shield size={20} color="#00D4FF" strokeWidth={2} />,
          type: 'toggle',
          value: false,
          onToggle: (value) => console.log('Privacy mode:', value),
        },
        {
          id: 'admin-approval',
          title: 'Admin Approval',
          description: 'Require admin approval for new members',
          icon: <Crown size={20} color="#FFB800" strokeWidth={2} />,
          type: 'toggle',
          value: false,
          onToggle: (value) => console.log('Admin approval:', value),
          requiresAdmin: true,
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      items: [
        {
          id: 'member-permissions',
          title: 'Member Permissions',
          description: 'Manage member access levels',
          icon: <Users size={20} color="#666666" strokeWidth={2} />,
          type: 'navigation',
          onPress: () => router.push('/(tabs)/family'),
          requiresAdmin: true,
        },
        {
          id: 'data-export',
          title: 'Data Export',
          description: 'Export family data',
          icon: <Share2 size={20} color="#666666" strokeWidth={2} />,
          type: 'action',
          onPress: handleDataExport,
          requiresAdmin: true,
        },
      ],
    },
    {
      id: 'danger',
      title: 'Danger Zone',
      items: [
        {
          id: 'leave-family',
          title: 'Leave Family',
          description: 'Leave this family',
          icon: <UserX size={20} color="#FF0000" strokeWidth={2} />,
          type: 'action',
          onPress: () => setShowLeaveModal(true),
          destructive: true,
        },
        {
          id: 'delete-family',
          title: 'Delete Family',
          description: 'Permanently delete this family',
          icon: <Trash2 size={20} color="#FF0000" strokeWidth={2} />,
          type: 'action',
          onPress: () => setShowDeleteModal(true),
          destructive: true,
          requiresAdmin: true,
        },
      ],
    },
  ];

  async function handleCopyCode() {
    // Copy family code to clipboard
    Alert.alert('Copied!', 'Family code copied to clipboard');
  }

  async function handleRegenerateCode() {
    Alert.alert(
      'Regenerate Code',
      'Are you sure you want to generate a new family code? The old code will no longer work.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const newCode = await generateNewCode();
              Alert.alert('New Code', `Your new family code is: ${newCode}`);
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
          },
        },
      ]
    );
  }

  function handleDataExport() {
    Alert.alert(
      'Data Export',
      'Data export feature is coming soon!',
      [{ text: t('common.ok') }]
    );
  }

  const handleEditFamilyName = async () => {
    if (newFamilyName.trim() && newFamilyName.trim() !== currentFamily?.name) {
      // Update family name logic
      Alert.alert('Saved', 'Family name updated successfully');
    }
    setShowNameEditModal(false);
  };

  const handleLeaveFamily = async () => {
    try {
      await leaveFamily();
      Alert.alert('Leave Family', 'You have successfully left the family');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      'Delete Family',
      'Are you sure you want to permanently delete this family? This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete family logic
            Alert.alert('Deleted', 'Family has been permanently deleted');
          },
        },
      ]
    );
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const handleBackPress = () => {
    backButtonScale.value = withSpring(0.95, {}, () => {
      backButtonScale.value = withSpring(1);
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={[styles.backButton, backButtonAnimatedStyle]}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color="#161618" strokeWidth={2} />
        </AnimatedPressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Family Settings</Text>
          <Text style={styles.headerSubtitle}>{currentFamily?.name}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Settings */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items
                .filter(item => !item.requiresAdmin || isAdmin)
                .map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.settingItem,
                      item.destructive && styles.destructiveItem
                    ]}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[
                        styles.settingIcon,
                        item.destructive && styles.destructiveIcon
                      ]}>
                        {item.icon}
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={[
                          styles.settingTitle,
                          item.destructive && styles.destructiveText
                        ]}>
                          {item.title}
                        </Text>
                        {item.description && (
                          <Text style={styles.settingDescription}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.settingRight}>
                      {item.type === 'toggle' && (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: '#E0E0E0', true: '#54FE54' }}
                          thumbColor="#FFFFFF"
                        />
                      )}
                      {item.type === 'action' && (
                        <Pressable
                          style={[
                            styles.actionButton,
                            item.destructive && styles.destructiveButton
                          ]}
                          onPress={item.onPress}
                        >
                          <Text style={[
                            styles.actionButtonText,
                            item.destructive && styles.destructiveButtonText
                          ]}>
                            Execute
                          </Text>
                        </Pressable>
                      )}
                      {item.type === 'navigation' && (
                        <Pressable style={styles.navigationButton} onPress={item.onPress}>
                          <Text style={styles.navigationButtonText}>Open</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Family Name Edit Modal */}
      <Modal
        visible={showNameEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              placeholder="New Family Name"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowNameEditModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={handleEditFamilyName}
              >
                <Text style={styles.primaryModalButtonText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave Family Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.warningIcon}>
              <AlertTriangle size={32} color="#FF6B6B" strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Leave Family</Text>
            <Text style={styles.modalText}>
              Are you sure you want to leave this family? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.destructiveModalButton]}
                onPress={() => {
                  setShowLeaveModal(false);
                  handleLeaveFamily();
                }}
              >
                <Text style={styles.destructiveModalButtonText}>Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Family Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.warningIcon}>
              <Trash2 size={32} color="#FF0000" strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>{t('family.settings.deleteFamily')}</Text>
            <Text style={styles.modalText}>
              {t('family.settings.deleteFamilyConfirmation')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.destructiveModalButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  handleDeleteFamily();
                }}
              >
                <Text style={styles.destructiveModalButtonText}>{t('family.settings.delete')}</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  headerRight: {
    width: 40,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  destructiveItem: {
    backgroundColor: 'rgba(255, 0, 0, 0.02)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destructiveIcon: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#FF0000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },
  settingRight: {
    alignItems: 'flex-end',
  },

  // Buttons
  actionButton: {
    backgroundColor: '#54FE54',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  destructiveButton: {
    backgroundColor: '#FF0000',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  navigationButton: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navigationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryModalButton: {
    backgroundColor: '#54FE54',
  },
  destructiveModalButton: {
    backgroundColor: '#FF0000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Montserrat-SemiBold',
  },
  primaryModalButtonText: {
    color: '#161618',
  },
  destructiveModalButtonText: {
    color: '#FFFFFF',
  },
});