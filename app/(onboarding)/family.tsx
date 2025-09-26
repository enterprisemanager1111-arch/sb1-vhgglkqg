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
  Image as RNImage,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Users, Plus, Hash, Copy, Check, CircleHelp as HelpCircle, Search } from 'lucide-react-native';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { sanitizeText, validateName, validateFamilyCode } from '@/utils/sanitization';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useNotifications } from '@/components/NotificationSystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FamilySetup() {
  const { t } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  
  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };
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
  const [familyNameFocused, setFamilyNameFocused] = useState(false);
  const [searchTermFocused, setSearchTermFocused] = useState(false);
  const [joinCodeFocused, setJoinCodeFocused] = useState(false);

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

  // Reset search state when mode changes
  useEffect(() => {
    if (mode === 'search') {
      // Reset search state when entering search mode
      setSearchResults([]);
      setSearchLoading(false);
      hideLoading();
    }
  }, [mode]);

  const handleCreateFamily = async () => {
    const validation = validateName(familyName);
    
    if (!validation.isValid) {
      Alert.alert('Error', validation.error);
      return;
    }
    
    // Prevent double submission
    if (loading) {
      return;
    }
    setLoading(true);
    showLoading(t('family.onboarding.creating'));
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
          description: `Family "${sanitizedName}" created`,
          points_earned: 50,
          metadata: {
            family_name: sanitizedName,
            family_code: result.code,
            action: 'created'
          },
        });
        
        showPointsEarned(20, `Family "${sanitizedName}" created!`);
      } catch (pointsError) {
        console.error('Error awarding points for family creation:', pointsError);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not create family');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleJoinFamily = async () => {
    console.log('Starting join family process...');
    
    const codeValidation = validateFamilyCode(joinCode.trim());
    
    if (!codeValidation.isValid) {
      Alert.alert('Error', codeValidation.error);
      return;
    }
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setLoading(true);
    showLoading(t('family.onboarding.joining'));
    
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
          description: 'Joined family',
          points_earned: 30,
          metadata: {
            family_code: codeValidation.sanitized,
            action: 'joined'
          },
        });
        
        showPointsEarned(20, 'Family joined!');
        showMemberActivity('A new member', 'joined the family');
      } catch (pointsError) {
        console.error('Error awarding points for joining family:', pointsError);
      }
      
      Alert.alert(
        t('family.onboarding.joinSuccess'),
        t('family.onboarding.joinSuccessMessage'),
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('family.onboarding.joinError'));
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleSearchFamilies = async () => {
    if (searchTerm.trim().length < 2) {
      Alert.alert('Error', 'Search term must be at least 2 characters');
      return;
    }

    // Prevent multiple simultaneous searches
    if (searchLoading) {
      console.log('🔍 Search already in progress, ignoring request');
      return;
    }

    console.log('🔍 Starting family search for:', searchTerm);
    setSearchLoading(true);
    showLoading(getTranslation('family.onboarding.searching', 'Searching...'));
    
    try {
      // Add timeout to prevent hanging
      const searchPromise = searchFamilies(searchTerm);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 10000)
      );
      
      const results = await Promise.race([searchPromise, timeoutPromise]);
      console.log('🔍 Search completed, results:', results.length);
      setSearchResults(results);
    } catch (error: any) {
      console.error('🔍 Search failed:', error);
      if (error.message === 'Search timeout') {
        Alert.alert('Error', 'Search timed out. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Search failed');
      }
      setSearchResults([]); // Clear previous results on error
    } finally {
      console.log('🔍 Search finished, hiding loading');
      setSearchLoading(false);
      hideLoading();
    }
  };

  const handleJoinSearchedFamily = async (family: any) => {
    try {
      await joinFamily(family.code);
      Alert.alert(
        t('family.onboarding.joinSuccess'),
        t('family.onboarding.joinSuccessMessageWithName', { name: family.name }),
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('family.onboarding.joinError'));
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

  const copyCodeToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(createdCode);
      Alert.alert('Code copied!', 'The family code has been copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy code:', error);
      Alert.alert('Error', 'Failed to copy code to clipboard.');
    }
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
        <RNImage 
          source={require('@/assets/images/newImg/background.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#161618" strokeWidth={2} />
          </Pressable>
          <Text style={styles.stepIndicator}>{t('onboarding.stepIndicator', { current: '4', total: '5' }) || 'Step 4 of 5'}</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={40} color="#55ffb8" strokeWidth={2.5} />
          </View>

          <Text style={styles.successTitle}>Family created successfully!</Text>
          <Text style={styles.successSubtitle}>
            Share this code with your family members so they can join.
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your family code:</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{createdCode}</Text>
              <Pressable style={styles.copyButton} onPress={copyCodeToClipboard}>
                <Copy size={20} color="#55ffb8" strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.infoText}>
              💡 Tip: Your family members can enter this code in the app 
              to join your family. You can find the code anytime in settings.
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
      <Image 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>{t('onboarding.stepIndicator', { current: '4', total: '4' }) || 'Step 4 of 4'}</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDash} />
        <View style={styles.progressDash} />
        <View style={styles.progressDash} />
        <View style={[styles.progressDash, styles.activeDash]} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Family Setup</Text>
            <Text style={styles.subtitle}>
              {mode === 'choose' 
                ? 'Create a new family, join an existing one, or search for families'
                : mode === 'create'
                ? 'Give your family a name'
                : mode === 'search'
                ? 'Search for a family by name, code, or ID'
                : 'Enter the family code'
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
                  <Plus size={32} color="#55ffb8" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Create Family</Text>
                <Text style={styles.choiceDescription}>
                  Start a new family and invite members
                </Text>
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => setMode('join')}
              >
                <View style={styles.choiceIcon}>
                  <Hash size={32} color="#55ffb8" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Join Family</Text>
                <Text style={styles.choiceDescription}>
                  Join an existing family with a code
                </Text>
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => setMode('search')}
              >
                <View style={styles.choiceIcon}>
                  <Search size={32} color="#55ffb8" strokeWidth={2} />
                </View>
                <Text style={styles.choiceTitle}>Search Family</Text>
                <Text style={styles.choiceDescription}>
                  Search for families by name, code, or ID
                </Text>
              </Pressable>

              <Pressable
                style={styles.skipLink}
                onPress={handleFinish}
              >
                <Text style={styles.skipText}>Set up later</Text>
              </Pressable>
            </View>
          )}

          {mode === 'create' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Users size={20} color="#55ffb8" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Family Name</Text>
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
                      Choose a name that all family members will recognize, 
                      e.g. "The Smiths" or "The Johnsons".
                    </Text>
                  </View>
                )}
                <TextInput
                  style={[styles.textInput, familyNameFocused && styles.textInputFocused]}
                  placeholder="e.g. The Smiths"
                  placeholderTextColor="#888888"
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoCapitalize="words"
                  onFocus={() => setFamilyNameFocused(true)}
                  onBlur={() => setFamilyNameFocused(false)}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>What happens next?</Text>
                <Text style={styles.infoText}>
                  After creation, you will receive a 6-digit code 
                  that you can share with your family members.
                </Text>
              </View>
            </View>
          )}

          {mode === 'search' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Search size={20} color="#55ffb8" strokeWidth={2} />
                  <Text style={styles.inputLabel}>
                    {getTranslation('family.onboarding.searchFamily', 'Search Family')}
                  </Text>
                </View>
                <Text style={styles.inputDescription}>
                  {getTranslation('family.onboarding.searchFamilyDescription', 'Search for a family by name, code, or ID')}
                </Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.textInput, searchTermFocused && styles.textInputFocused]}
                    placeholder={getTranslation('family.onboarding.searchPlaceholder', 'Enter family name, code, or ID...')}
                    placeholderTextColor="#888888"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setSearchTermFocused(true)}
                    onBlur={() => setSearchTermFocused(false)}
                  />
                  <Pressable 
                    style={[styles.searchButton, searchTerm.length < 2 && styles.searchButtonDisabled]}
                    onPress={handleSearchFamilies}
                    disabled={searchTerm.length < 2 || searchLoading}
                  >
                    <Search size={18} color={searchTerm.length >= 2 ? "#161618" : "#999999"} strokeWidth={2} />
                  </Pressable>
                </View>
                <Text style={styles.searchHint}>
                  {getTranslation('family.onboarding.searchHint', 'You can search by family name, 6-character code, or family ID')}
                </Text>
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <Text style={styles.resultsTitle}>
                    {getTranslation('family.onboarding.searchResults', 'Search Results')}
                  </Text>
                  {searchResults.map((family) => (
                    <Pressable
                      key={family.id}
                      style={styles.familyResultCard}
                      onPress={() => handleJoinSearchedFamily(family)}
                    >
                      <View style={styles.familyResultInfo}>
                        <Text style={styles.familyResultName}>{family.name}</Text>
                        <View style={styles.familyResultDetails}>
                          <Text style={styles.familyResultCode}>Code: {family.code}</Text>
                          <Text style={styles.familyResultId}>ID: {family.id.substring(0, 8)}...</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#55ffb8" strokeWidth={2} />
                    </Pressable>
                  ))}
                </View>
              )}

              {searchLoading && (
                <View style={styles.searchLoadingContainer}>
                  <Text style={styles.searchLoadingText}>{t('family.onboarding.searching')}</Text>
                </View>
              )}

              {searchTerm.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsTitle}>
                    {getTranslation('family.onboarding.noResults', 'No families found')}
                  </Text>
                  <Text style={styles.noResultsText}>
                    No family found with "{searchTerm}". 
                    Try a different search term or use an invitation code.
                  </Text>
                </View>
              )}
            </View>
          )}

          {mode === 'join' && (
            <View style={styles.formContainer}>
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Hash size={20} color="#55ffb8" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Family Code</Text>
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
                      The 6-digit code was sent to you by a family member 
                      who is already part of the family.
                    </Text>
                  </View>
                )}
                <TextInput
                  style={[styles.textInput, styles.codeInput, joinCodeFocused && styles.textInputFocused]}
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
                  onFocus={() => setJoinCodeFocused(true)}
                  onBlur={() => setJoinCodeFocused(false)}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>{t('family.onboarding.didntReceiveCode')}</Text>
                <Text style={styles.infoText}>
                  {t('family.onboarding.askFamilyMember')}
                </Text>
                <Pressable 
                  style={styles.testCodeButton}
                  onPress={() => {
                    // For testing - this will create a test family code
                    setJoinCode('TEST01');
                  }}
                >
                  <Text style={styles.testCodeText}>{t('family.onboarding.useTestCode')}</Text>
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
                ? (mode === 'create' ? 'Creating...' : 
                   mode === 'join' ? 'Joining...' : 'Searching...') 
                : (mode === 'create' ? 'Create Family' : 
                   mode === 'join' ? 'Join Family' : 'Search Family')
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    fontFamily: 'Helvetica',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eafff6',
    marginHorizontal: 4,
  },
  activeDash: {
    backgroundColor: '#55ffb8',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontStyle: 'Semi Bold',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
  },

  // Choice Mode
  choiceContainer: {
    gap: 20,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 25,
    borderWidth: 2,
    borderColor: '#eaecf0',
    elevation: 1,
    alignItems: 'flex-start',
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
    fontFamily: 'Helvetica',
    marginBottom: 12,
    textAlign: 'center',
  },
  choiceDescription: {
    fontSize: 15,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
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
    marginBottom: 16,
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Helvetica',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textInputFocused: {
    borderColor: '#17f196',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    fontFamily: 'Helvetica',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
    marginBottom: 12,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
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
    fontFamily: 'Helvetica',
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
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 50,
    gap: 8,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
    marginBottom: 2,
  },
  familyResultCode: {
    fontSize: 14,
    color: '#54FE54',
    fontFamily: 'Helvetica',
  },
  searchLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchLoadingText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17f196',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 20,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  
  // Enhanced Search Styles
  inputDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
    marginBottom: 16,
    lineHeight: 20,
  },
  searchHint: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Helvetica',
    marginTop: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  familyResultDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  familyResultId: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Helvetica',
  },
});