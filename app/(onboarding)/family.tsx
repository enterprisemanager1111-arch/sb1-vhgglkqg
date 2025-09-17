import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Users, Plus, Hash, Copy, Check, CircleHelp as HelpCircle, Search } from 'lucide-react-native';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { sanitizeText, validateName, validateFamilyCode } from '@/utils/sanitization';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useNotifications } from '@/components/NotificationSystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FamilySetup() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'choose' | 'create' | 'join' | 'search'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const { createFamily, joinFamily, searchFamilies, isInFamily, loading: familyLoading } = useFamily();
  const buttonScale = useSharedValue(1);
  const { completeStep } = useOnboarding();
  const { awardPoints } = useFamilyPoints();
  const { showPointsEarned, showMemberActivity } = useNotifications();

  // Redirect if user is already in a family
  useEffect(() => {
    if (!familyLoading && isInFamily) {
      router.replace('/(tabs)');
    }
  }, [familyLoading, isInFamily]);

  const handleCreateFamily = async () => {
    const validation = validateName(familyName);
    
    if (!validation.isValid) {
      Alert.alert('Fehler', validation.error);
      return;
    }
    
    // Prevent double submission
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const sanitizedName = sanitizeText(familyName, 50);
      const result = await createFamily(sanitizedName);
      
      // Mark family setup step as completed
      await completeStep('family-setup', {
        action: 'created',
        familyName: sanitizedName,
        familyCode: result.code
      });
      
      setCreatedCode(result.code);
      setShowCode(true);
      
      // Award points for creating family
      try {
        await awardPoints({
          activity_type: 'member_added',
          description: `Familie "${sanitizedName}" erstellt`,
          metadata: {
            family_name: sanitizedName,
            family_code: result.code,
            action: 'created'
          },
        });
        
        showPointsEarned(20, `Familie "${sanitizedName}" erstellt!`);
      } catch (pointsError) {
        console.error('Error awarding points for family creation:', pointsError);
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Familie konnte nicht erstellt werden');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    console.log('Starting join family process...');
    
    const codeValidation = validateFamilyCode(joinCode.trim());
    
    if (!codeValidation.isValid) {
      Alert.alert('Fehler', codeValidation.error);
      return;
    }
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    try {
      await joinFamily(codeValidation.sanitized);
      
      // Mark family setup step as completed
      await completeStep('family-setup', {
        action: 'joined',
        familyCode: codeValidation.sanitized
      });
      
      // Award points for joining family
      try {
        await awardPoints({
          activity_type: 'member_added',
          description: 'Der Familie beigetreten',
          metadata: {
            family_code: codeValidation.sanitized,
            action: 'joined'
          },
        });
        
        showPointsEarned(20, 'Familie beigetreten!');
        showMemberActivity('Ein neues Mitglied', 'ist der Familie beigetreten');
      } catch (pointsError) {
        console.error('Error awarding points for joining family:', pointsError);
      }
      
      Alert.alert(
        'Erfolgreich beigetreten!',
        'Sie sind nun Mitglied der Familie.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Konnte der Familie nicht beitreten');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFamilies = async () => {
    if (searchTerm.trim().length < 2) {
      Alert.alert('Fehler', 'Suchbegriff muss mindestens 2 Zeichen haben');
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchFamilies(searchTerm);
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Suche fehlgeschlagen');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoinSearchedFamily = async (family: any) => {
    try {
      await joinFamily(family.code);
      Alert.alert(
        'Erfolgreich beigetreten!',
        `Sie sind nun Mitglied von "${family.name}".`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Konnte der Familie nicht beitreten');
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (mode === 'choose') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(onboarding)');
      }
    } else if (showCode) {
      setShowCode(false);
    } else {
      setMode('choose');
      setFamilyName('');
      setJoinCode('');
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const copyCodeToClipboard = () => {
    // In a real app, you'd use Clipboard from react-native or expo-clipboard
    Alert.alert('Code kopiert!', 'Der Familiencode wurde in die Zwischenablage kopiert.');
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

  if (showCode) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#161618" strokeWidth={2} />
          </Pressable>
          <Text style={styles.stepIndicator}>Familie erstellt!</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={40} color="#54FE54" strokeWidth={2.5} />
          </View>

          <Text style={styles.successTitle}>Familie erfolgreich erstellt!</Text>
          <Text style={styles.successSubtitle}>
            Teilen Sie diesen Code mit Ihren Familienmitgliedern, damit sie beitreten können.
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Ihr Familiencode:</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{createdCode}</Text>
              <Pressable style={styles.copyButton} onPress={copyCodeToClipboard}>
                <Copy size={20} color="#54FE54" strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <View style={styles.codeInfo}>
            <Text style={styles.infoText}>
              💡 Tipp: Ihre Familienmitglieder können diesen Code in der App eingeben, 
              um Ihrer Familie beizutreten. Sie finden den Code jederzeit in den Einstellungen.
            </Text>
          </View>

          <AnimatedPressable
            style={[styles.finishButton, buttonAnimatedStyle]}
            onPress={handleFinish}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.finishButtonText}>Famora starten</Text>
            <ChevronRight size={20} color="#161618" strokeWidth={2} />
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>Schritt 4 von 4</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.activeDot]} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('onboarding.family.title')}</Text>
            <Text style={styles.subtitle}>
              {mode === 'choose' 
                ? 'Erstellen Sie eine neue Familie, treten Sie einer bei oder suchen Sie nach bestehenden Familien'
                : mode === 'create'
                ? 'Geben Sie Ihrer Familie einen Namen'
                : mode === 'search'
                ? 'Suchen Sie nach einer Familie zum Beitreten'
                : 'Geben Sie den Familiencode ein'
              }
            </Text>
          </View>

          {mode === 'choose' && (
            <View style={styles.choiceContainer}>
              <Pressable
                style={styles.choiceCard}
                onPress={() => setMode('create')}
              >
                <View style={styles.choiceIcon}>
                  <Plus size={32} color="#54FE54" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Familie erstellen</Text>
                <Text style={styles.choiceDescription}>
                  Erstellen Sie eine neue Familie und laden Sie andere Mitglieder ein
                </Text>
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => setMode('join')}
              >
                <View style={styles.choiceIcon}>
                  <Hash size={32} color="#54FE54" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Familie beitreten</Text>
                <Text style={styles.choiceDescription}>
                  Treten Sie einer bestehenden Familie mit einem Einladungscode bei
                </Text>
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => setMode('search')}
              >
                <View style={styles.choiceIcon}>
                  <Search size={32} color="#54FE54" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Familie suchen</Text>
                <Text style={styles.choiceDescription}>
                  Suchen Sie nach Familien anhand des Namens oder Codes
                </Text>
              </Pressable>

              <Pressable
                style={styles.skipLink}
                onPress={handleFinish}
              >
                <Text style={styles.skipText}>Später einrichten</Text>
              </Pressable>
            </View>
          )}

          {mode === 'create' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Users size={20} color="#54FE54" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Familienname</Text>
                  <Pressable 
                    style={styles.tooltipButton}
                    onPress={() => setShowTooltip(showTooltip === 'name' ? null : 'name')}
                  >
                    <HelpCircle size={16} color="#666666" strokeWidth={2} />
                  </Pressable>
                </View>
                {showTooltip === 'name' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Wählen Sie einen Namen, den alle Familienmitglieder erkennen, 
                      z.B. "Familie Schmidt" oder "Die Müllers".
                    </Text>
                  </View>
                )}
                <TextInput
                  style={styles.textInput}
                  placeholder="z.B. Familie Schmidt"
                  placeholderTextColor="#888888"
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Was passiert als nächstes?</Text>
                <Text style={styles.infoText}>
                  Nach der Erstellung erhalten Sie einen 6-stelligen Code, 
                  den Sie mit Ihren Familienmitgliedern teilen können.
                </Text>
              </View>
            </View>
          )}

          {mode === 'search' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Search size={20} color="#54FE54" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Familie suchen</Text>
                </View>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Familienname oder Code eingeben..."
                    placeholderTextColor="#888888"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                  <Pressable 
                    style={[styles.searchButton, searchTerm.length < 2 && styles.searchButtonDisabled]}
                    onPress={handleSearchFamilies}
                    disabled={searchTerm.length < 2 || searchLoading}
                  >
                    <Search size={18} color={searchTerm.length >= 2 ? "#161618" : "#999999"} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <Text style={styles.resultsTitle}>Gefundene Familien:</Text>
                  {searchResults.map((family) => (
                    <Pressable
                      key={family.id}
                      style={styles.familyResultCard}
                      onPress={() => handleJoinSearchedFamily(family)}
                    >
                      <View style={styles.familyResultInfo}>
                        <Text style={styles.familyResultName}>{family.name}</Text>
                        <Text style={styles.familyResultCode}>#{family.code}</Text>
                      </View>
                      <ChevronRight size={20} color="#54FE54" strokeWidth={2} />
                    </Pressable>
                  ))}
                </View>
              )}

              {searchLoading && (
                <View style={styles.searchLoadingContainer}>
                  <Text style={styles.searchLoadingText}>Suche läuft...</Text>
                </View>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsTitle}>Keine Familien gefunden</Text>
                  <Text style={styles.noResultsText}>
                    Keine Familie mit "{searchTerm}" gefunden. 
                    Versuchen Sie einen anderen Suchbegriff oder verwenden Sie einen Einladungscode.
                  </Text>
                </View>
              )}
            </View>
          )}

          {mode === 'join' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Hash size={20} color="#54FE54" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Familiencode</Text>
                  <Pressable 
                    style={styles.tooltipButton}
                    onPress={() => setShowTooltip(showTooltip === 'code' ? null : 'code')}
                  >
                    <HelpCircle size={16} color="#666666" strokeWidth={2} />
                  </Pressable>
                </View>
                {showTooltip === 'code' && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Der 6-stellige Code wurde Ihnen von einem Familienmitglied 
                      gesendet, das bereits Teil der Familie ist.
                    </Text>
                  </View>
                )}
                <TextInput
                  style={[styles.textInput, styles.codeInput]}
                  placeholder="ABC123"
                  placeholderTextColor="#888888"
                  value={joinCode}
                  onChangeText={(text) => {
                    // Remove spaces and limit to 6 characters
                    const cleanText = text.replace(/\s/g, '').toUpperCase().substring(0, 6);
                    setJoinCode(cleanText);
                  }}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                  autoComplete="off"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Keinen Code erhalten?</Text>
                <Text style={styles.infoText}>
                  Bitten Sie ein Familienmitglied, Ihnen den Familiencode 
                  aus den Einstellungen zu senden.
                </Text>
                <Pressable 
                  style={styles.testCodeButton}
                  onPress={() => {
                    // For testing - this will create a test family code
                    setJoinCode('TEST01');
                  }}
                >
                  <Text style={styles.testCodeText}>Test-Code verwenden (TEST01)</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {(mode === 'create' || mode === 'join' || mode === 'search') && !showCode && (
        <View style={styles.bottomNav}>
          <AnimatedPressable
            style={[
              styles.actionButton,
              (mode === 'create' && !familyName.trim()) || 
              (mode === 'join' && !joinCode.trim()) ||
              (mode === 'search' && searchTerm.length < 2)
                ? styles.disabledButton : null,
              buttonAnimatedStyle
            ]}
            onPress={mode === 'create' ? handleCreateFamily : 
                     mode === 'join' ? handleJoinFamily : 
                     handleSearchFamilies}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading || 
                     (mode === 'create' && !familyName.trim()) || 
                     (mode === 'join' && !joinCode.trim()) ||
                     (mode === 'search' && searchTerm.length < 2)}
          >
            <Text style={[
              styles.actionButtonText,
              ((mode === 'create' && !familyName.trim()) || 
               (mode === 'join' && !joinCode.trim()) ||
               (mode === 'search' && searchTerm.length < 2))
                ? styles.disabledText : null
            ]}>
              {loading 
                ? (mode === 'create' ? 'Familie wird erstellt...' : 
                   mode === 'join' ? 'Beitritt läuft...' : 'Suche läuft...') 
                : (mode === 'create' ? 'Familie erstellen' : 
                   mode === 'join' ? 'Familie beitreten' : 'Familie suchen')
              }
            </Text>
            {!loading && mode !== 'search' && <ChevronRight size={20} color="#161618" strokeWidth={2} />}
          </AnimatedPressable>
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
    fontFamily: 'Montserrat-Medium',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#54FE54',
    width: 24,
    borderRadius: 12,
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
    marginBottom: 40,
    alignItems: 'center',
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

  // Choice Mode
  choiceContainer: {
    gap: 20,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  choiceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  choiceDescription: {
    fontSize: 15,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // Form
  formContainer: {
    gap: 32,
  },
  inputSection: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  tooltipButton: {
    padding: 4,
  },
  tooltip: {
    backgroundColor: '#161618',
    borderRadius: 8,
    padding: 12,
  },
  tooltipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  // Info Box
  infoBox: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },

  // Success Screen
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  codeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 12,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#54FE54',
    gap: 16,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 4,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
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
  actionButton: {
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  disabledText: {
    color: '#999999',
  },
  
  // Search Mode Styles
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  searchResults: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  familyResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  familyResultInfo: {
    flex: 1,
  },
  familyResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  familyResultCode: {
    fontSize: 14,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  searchLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchLoadingText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 12,
    marginTop: 16,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  testCodeButton: {
    marginTop: 12,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  testCodeText: {
    fontSize: 12,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 20,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
});