import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronRight, Camera, Bell, Image as ImageIcon, Shield, Check, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { isFeatureAvailable } from '@/utils/expoGoCompatibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  granted: boolean;
}

export default function PermissionsScreen() {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'camera',
      title: 'Kamera',
      description: 'Für Profilbilder und das Teilen von Momenten',
      icon: <Camera size={24} color="#54FE54" strokeWidth={2} />,
      required: false,
      granted: false,
    },
    {
      id: 'photos',
      title: 'Fotos',
      description: 'Zum Auswählen von Bildern aus Ihrer Galerie',
      icon: <ImageIcon size={24} color="#54FE54" strokeWidth={2} />,
      required: false,
      granted: false,
    },
    {
      id: 'notifications',
      title: 'Benachrichtigungen',
      description: 'Für wichtige Familienerinnerungen und Updates',
      icon: <Bell size={24} color="#54FE54" strokeWidth={2} />,
      required: false,
      granted: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const buttonScale = useSharedValue(1);

  const requestPermission = async (permissionId: string) => {
    let granted = false;

    try {
      switch (permissionId) {
        case 'camera':
          if (isFeatureAvailable('camera')) {
            const result = await ImagePicker.requestCameraPermissionsAsync();
            granted = result.granted;
          }
          break;
        case 'photos':
          if (isFeatureAvailable('imageLibrary')) {
            const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
            granted = result.granted;
          }
          break;
        case 'notifications':
          const result = await Notifications.requestPermissionsAsync();
          granted = result.granted;
          break;
      }
    } catch (error) {
      console.error(`Error requesting ${permissionId} permission:`, error);
    }

    setPermissions(prev =>
      prev.map(p =>
        p.id === permissionId ? { ...p, granted } : p
      )
    );

    return granted;
  };

  const handlePermissionRequest = async (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;

    if (permission.granted) {
      // Permission already granted, nothing to do
      return;
    }

    const granted = await requestPermission(permissionId);
    
    if (!granted) {
      Alert.alert(
        'Berechtigung verweigert',
        `Die ${permission.title}-Berechtigung wurde verweigert. Sie können diese später in den Einstellungen aktivieren.`,
        [{ text: 'OK' }]
      );
    }
  };

  const requestAllPermissions = async () => {
    setLoading(true);
    
    for (const permission of permissions) {
      if (!permission.granted) {
        await requestPermission(permission.id);
        // Small delay between requests to avoid overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setLoading(false);
  };

  const handleContinue = () => {
    router.replace('/(onboarding)/family');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={32} color="#54FE54" strokeWidth={2} />
            </View>
            <Text style={styles.title}>Berechtigungen</Text>
            <Text style={styles.subtitle}>
              Erlauben Sie Famora Zugriff auf diese Funktionen für die beste Erfahrung
            </Text>
          </View>

          {/* Permissions List */}
          <View style={styles.permissionsList}>
            {permissions.map((permission) => (
              <View key={permission.id} style={styles.permissionCard}>
                <View style={styles.permissionHeader}>
                  <View style={styles.permissionIcon}>
                    {permission.icon}
                  </View>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionTitle}>{permission.title}</Text>
                    <Text style={styles.permissionDescription}>
                      {permission.description}
                    </Text>
                  </View>
                  <View style={styles.permissionStatus}>
                    {permission.granted ? (
                      <View style={styles.grantedBadge}>
                        <Check size={16} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    ) : (
                      <Pressable
                        style={styles.requestButton}
                        onPress={() => handlePermissionRequest(permission.id)}
                      >
                        <Text style={styles.requestButtonText}>Erlauben</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                
                {permission.required && !permission.granted && (
                  <View style={styles.requiredNotice}>
                    <Text style={styles.requiredText}>
                      Diese Berechtigung ist für die App-Funktionalität erforderlich
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Warum brauchen wir diese Berechtigungen?</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                📷 <Text style={styles.infoText}>Kamera & Fotos für Profilbilder und das Teilen von Familienmomenten</Text>
              </Text>
              <Text style={styles.infoItem}>
                🔔 <Text style={styles.infoText}>Benachrichtigungen für wichtige Termine und Erinnerungen</Text>
              </Text>
            </View>
            <Text style={styles.infoFooter}>
              Sie können diese Berechtigungen jederzeit in den Einstellungen ändern.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Pressable
              style={styles.allowAllButton}
              onPress={requestAllPermissions}
              disabled={loading}
            >
              <Text style={styles.allowAllText}>
                {loading ? 'Berechtigungen werden angefragt...' : 'Alle Berechtigungen erlauben'}
              </Text>
            </Pressable>
            
            <Pressable style={styles.skipButton} onPress={handleContinue}>
              <Text style={styles.skipText}>Später einrichten</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <AnimatedPressable
          style={[styles.continueButton, buttonAnimatedStyle]}
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.continueText}>Continue</Text>
          <ChevronRight size={20} color="#161618" strokeWidth={2} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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

  // Permissions List
  permissionsList: {
    gap: 16,
    marginBottom: 32,
  },
  permissionCard: {
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
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  permissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },
  permissionStatus: {
    alignItems: 'center',
  },
  grantedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButton: {
    backgroundColor: '#54FE54',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  requiredNotice: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  requiredText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },

  // Info Section
  infoSection: {
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
  infoText: {
    color: '#666666',
  },
  infoFooter: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Montserrat-Regular',
    fontStyle: 'italic',
  },

  // Action Section
  actionSection: {
    gap: 16,
  },
  allowAllButton: {
    backgroundColor: '#54FE54',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  allowAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
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
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
});