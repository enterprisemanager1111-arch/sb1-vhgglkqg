import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ArrowLeft, Share2, Copy, Download, Camera } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth } = Dimensions.get('window');

export default function FamilyQRCode() {
  const [copySuccess, setCopySuccess] = useState(false);
  const { currentFamily } = useFamily();
  const backButtonScale = useSharedValue(1);
  const qrCodeSize = Math.min(screenWidth - 80, 280);

  const familyCode = currentFamily?.code || 'ABC123';
  const familyName = currentFamily?.name || 'Familie';

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(familyCode);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = familyCode;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
    } catch (error) {
      Alert.alert('Fehler', 'Code konnte nicht kopiert werden');
    }
  };

  const handleShare = async () => {
    const shareContent = {
      message: `Tritt meiner Familie "${familyName}" in Famora bei!\n\nFamiliencode: ${familyCode}\n\nLade die Famora App herunter und gib diesen Code ein.`,
      title: 'Familie beitreten - Famora',
    };

    try {
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Fehler', 'QR-Code konnte nicht geteilt werden');
    }
  };

  const handleSaveImage = () => {
    // In a real app, this would save the QR code image to the device
    Alert.alert(
      'QR-Code speichern',
      'Diese Funktion wird in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
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
          <Text style={styles.headerTitle}>QR-Code</Text>
          <Text style={styles.headerSubtitle}>Familie einladen</Text>
        </View>
        <Pressable style={styles.shareHeaderButton} onPress={handleShare}>
          <Share2 size={20} color="#54FE54" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <View style={styles.qrCodeWrapper}>
              {/* Placeholder QR Code */}
              <View style={styles.qrCodePlaceholder}>
                <View style={styles.qrPattern} />
                <View style={styles.qrCenterLogo}>
                  <Text style={styles.qrLogoText}>F</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.qrInfo}>
              <Text style={styles.qrTitle}>{familyName}</Text>
              <Text style={styles.qrCode}>#{familyCode}</Text>
              <Text style={styles.qrDescription}>
                Scannen Sie diesen QR-Code oder verwenden Sie den Code oben, 
                um der Familie beizutreten.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsGrid}>
            <Pressable
              style={[styles.actionButton, copySuccess && styles.actionButtonSuccess]}
              onPress={handleCopyCode}
            >
              <Copy size={20} color={copySuccess ? "#FFFFFF" : "#54FE54"} strokeWidth={2} />
              <Text style={[styles.actionButtonText, copySuccess && styles.actionButtonTextSuccess]}>
                {copySuccess ? 'Kopiert!' : 'Code kopieren'}
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color="#54FE54" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Teilen</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleSaveImage}>
              <Download size={20} color="#54FE54" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Bild speichern</Text>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'QR-Code scannen',
                  'Diese Funktion wird in einer zukünftigen Version verfügbar sein.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Camera size={20} color="#54FE54" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Scannen</Text>
            </Pressable>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>So funktioniert's</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Zeigen Sie diesen QR-Code der Person, die beitreten möchte
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Sie scannen den Code in der Famora App oder geben den Code manuell ein
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Das neue Mitglied wird automatisch zur Familie hinzugefügt
              </Text>
            </View>
          </View>
        </View>
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
  shareHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // QR Section
  qrSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  qrContainer: {
    alignItems: 'center',
    gap: 24,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  qrPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    opacity: 0.1,
  },
  qrCenterLogo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    marginLeft: -20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  qrLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  qrCode: {
    fontSize: 20,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: 2,
    marginBottom: 16,
  },
  qrDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Actions
  actionsSection: {
    paddingVertical: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonSuccess: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    marginTop: 8,
    textAlign: 'center',
  },
  actionButtonTextSuccess: {
    color: '#FFFFFF',
  },

  // Instructions
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsList: {
    gap: 16,
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
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
});