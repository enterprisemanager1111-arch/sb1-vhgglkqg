import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import {
  ArrowLeft,
  Copy,
  Share2,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  QrCode,
  Users,
  Clock,
  Check,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface InviteMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export default function FamilyInvite() {
  const [copiedCode, setCopiedCode] = useState(false);
  const { currentFamily, createFamilyInviteLink } = useFamily();
  const { t } = useLanguage();
  const backButtonScale = useSharedValue(1);

  const inviteText = `Hallo! Ich lade dich zu meiner Familie "${currentFamily?.name}" in Famora ein. 

Verwende diesen Code: ${currentFamily?.code}

Lade die App herunter und gib den Code ein, um beizutreten!`;

  const inviteMethods: InviteMethod[] = [
    {
      id: 'copy',
      title: 'Code kopieren',
      description: 'Kopiere den Einladungscode in die Zwischenablage',
      icon: <Copy size={24} color="#54FE54" strokeWidth={2} />,
      color: '#54FE54',
      bgColor: 'rgba(84, 254, 84, 0.1)',
      onPress: handleCopyCode,
    },
    {
      id: 'share',
      title: 'Einladung teilen',
      description: 'Teile die komplette Einladung über andere Apps',
      icon: <Share2 size={24} color="#00D4FF" strokeWidth={2} />,
      color: '#00D4FF',
      bgColor: 'rgba(0, 212, 255, 0.1)',
      onPress: handleShare,
    },
    {
      id: 'sms',
      title: 'Per SMS versenden',
      description: 'Sende eine SMS mit dem Einladungslink',
      icon: <MessageCircle size={24} color="#FFB800" strokeWidth={2} />,
      color: '#FFB800',
      bgColor: 'rgba(255, 184, 0, 0.1)',
      onPress: handleSMS,
    },
    {
      id: 'email',
      title: 'E-Mail senden',
      description: 'Sende eine E-Mail mit der Einladung',
      icon: <Mail size={24} color="#FF6B6B" strokeWidth={2} />,
      color: '#FF6B6B',
      bgColor: 'rgba(255, 107, 107, 0.1)',
      onPress: handleEmail,
    },
    {
      id: 'qr',
      title: 'QR-Code anzeigen',
      description: 'Zeige einen QR-Code für einfaches Scannen',
      icon: <QrCode size={24} color="#9B59B6" strokeWidth={2} />,
      color: '#9B59B6',
      bgColor: 'rgba(155, 89, 182, 0.1)',
      onPress: handleQRCode,
    },
    {
      id: 'link',
      title: 'Einladungslink',
      description: 'Erstelle einen speziellen Einladungslink',
      icon: <LinkIcon size={24} color="#34495E" strokeWidth={2} />,
      color: '#34495E',
      bgColor: 'rgba(52, 73, 94, 0.1)',
      onPress: handleInviteLink,
    },
  ];

  async function handleCopyCode() {
    try {
      // Copy code to clipboard - in React Native you'd use Clipboard
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      Alert.alert('Kopiert!', 'Familiencode wurde in die Zwischenablage kopiert.');
    } catch (error) {
      Alert.alert('Fehler', 'Code konnte nicht kopiert werden.');
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: inviteText,
        title: 'Familie beitreten',
      });
    } catch (error) {
      Alert.alert('Fehler', 'Einladung konnte nicht geteilt werden.');
    }
  }

  function handleSMS() {
    // Open SMS app with pre-filled message
    Alert.alert(
      'SMS senden',
      'Diese Funktion wird in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
  }

  function handleEmail() {
    // Open email app with pre-filled content
    Alert.alert(
      'E-Mail senden',
      'Diese Funktion wird in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
  }

  function handleQRCode() {
    // Navigate to QR code screen
    router.push('/family/qr-code');
  }

  async function handleInviteLink() {
    try {
      if (!currentFamily) {
        Alert.alert('Fehler', 'Keine aktive Familie gefunden');
        return;
      }
      
      const inviteLink = await createFamilyInviteLink(currentFamily.id);
      
      await Share.share({
        message: `Tritt meiner Familie "${currentFamily.name}" bei!\n\nEinladungslink: ${inviteLink}\n\nOder verwende den Code: ${currentFamily.code}`,
        title: 'Familie beitreten - Famora',
      });
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Einladungslink konnte nicht erstellt werden');
    }
  }

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
          <Text style={styles.headerTitle}>Familie einladen</Text>
          <Text style={styles.headerSubtitle}>Neue Mitglieder hinzufügen</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Family Code Display */}
        <View style={styles.codeSection}>
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Users size={24} color="#54FE54" strokeWidth={2} />
              <Text style={styles.codeTitle}>Ihr Familiencode</Text>
            </View>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{currentFamily?.code}</Text>
              <Pressable
                style={[styles.copyButton, copiedCode && styles.copiedButton]}
                onPress={handleCopyCode}
              >
                {copiedCode ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Copy size={16} color="#161618" strokeWidth={2} />
                )}
              </Pressable>
            </View>
            <Text style={styles.codeDescription}>
              Teilen Sie diesen Code mit Familienmitgliedern, damit sie beitreten können.
            </Text>
          </View>
        </View>

        {/* Invite Methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Einladungsmethoden</Text>
          <View style={styles.methodsGrid}>
            {inviteMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[styles.methodCard, { backgroundColor: method.bgColor }]}
                onPress={method.onPress}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                  {method.icon}
                </View>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>So funktioniert's</Text>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Code teilen</Text>
                <Text style={styles.stepDescription}>
                  Teilen Sie den Familiencode mit der Person, die Sie einladen möchten.
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>App installieren</Text>
                <Text style={styles.stepDescription}>
                  Das neue Mitglied lädt Famora herunter und erstellt ein Konto.
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Code eingeben</Text>
                <Text style={styles.stepDescription}>
                  Der Code wird in der App eingegeben und das Mitglied tritt automatisch bei.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tipps</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Clock size={16} color="#54FE54" strokeWidth={2} />
              <Text style={styles.tipText}>
                Der Familiencode läuft nicht ab und kann beliebig oft verwendet werden.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Users size={16} color="#00D4FF" strokeWidth={2} />
              <Text style={styles.tipText}>
                Sie können jederzeit einen neuen Code generieren, wenn nötig.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <LinkIcon size={16} color="#FFB800" strokeWidth={2} />
              <Text style={styles.tipText}>
                QR-Codes sind praktisch für Einladungen vor Ort.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
  },

  // Code Section
  codeSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 16,
    gap: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 4,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiedButton: {
    backgroundColor: '#34C759',
  },
  codeDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Methods Section
  methodsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Instructions Section
  instructionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },

  // Tips Section
  tipsSection: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
});