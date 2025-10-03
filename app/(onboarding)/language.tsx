import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { supportedLanguages, useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';


export default function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  

  // Initialize with current language
  React.useEffect(() => {
    setSelectedLanguage(currentLanguage.code);
  }, [currentLanguage]);

  const handleContinue = async () => {
    showLoading(t('common.redirecting') || 'Redirecting...');
    
    try {
      // Language is already saved when selected - just navigate
      // Don't save any onboarding data to avoid overwriting personal info
      console.log('DEBUG: Language page - navigating to personal without saving onboarding data');
      hideLoading();
      router.push('/(onboarding)/personal');
    } catch (error) {
      console.error('Error navigating to personal page:', error);
      hideLoading();
      alert('Navigation error');
    }
  };

  const handleBack = () => {
    router.back();
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

      {/* Full Screen Background Image */}
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('onboarding.language.title') || 'Choose your Language'}</Text>
          </View>

          {/* Subtitle */}
          <View>
            <Text style={styles.subtitle}>{t('onboarding.language.subtitle') || 'Select your preferred language for Famora, for the perfect experience.'}</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDash} />
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <View>
              <RNImage 
                source={require('@/assets/images/icon/language-exchange.png')}
                style={styles.questionIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.questionText}>{t('onboarding.language.question') || 'What language do you speak?'}</Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Language Options */}
              <View style={styles.languagesContainer}>
            {supportedLanguages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.selectedLanguageOption
                ]}
                onPress={async () => {
                  setSelectedLanguage(language.code);
                  // Change language immediately for preview
                  if (language.code !== currentLanguage.code) {
                    await changeLanguage(language.code);
                  }
                }}
              >
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.selectedLanguageName
                ]}>
                  {language.nativeName}
                </Text>
                <Text style={[
                  styles.languageSubtitle,
                  selectedLanguage === language.code && styles.selectedLanguageSubtitle
                ]}>
                  {language.name}
                </Text>
              </Pressable>
            ))}
          </View>

            </View>
          </ScrollView>

          {/* Button Container */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.nextButton}
              onPress={handleContinue}
            >
              <Text style={styles.nextButtonText}>{t('onboarding.language.next') || 'Next'}</Text>
            </Pressable>
            
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>{t('onboarding.language.back') || 'Back'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102118',
  },

  // Upper Section (Solid Background)
  upperSection: {
    height: 200,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#102118',
    opacity: 0.87,
    zIndex: 1,
  },

  // Lower Section (White Card)
  lowerSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 40,
    marginTop: -30,
  },
  contentCard: {
    flex: 1,
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
    paddingVertical: 16,
    gap: 8,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eafff6',
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
    alignItems: 'center',
    marginBottom: 8,
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

  // Languages
  languagesContainer: {
    gap: 12,
    marginBottom: 8,
  },
  languageOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 25,
    borderWidth: 2,
    borderColor: '#eaecf0',
    elevation: 1,
    alignItems: 'flex-start',
  },
  selectedLanguageOption: {
    borderColor: '#59f6b5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#41ffb0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202020',
    fontFamily: 'Helvetica',
    textAlign: 'left',
    marginBottom: 4,
  },
  selectedLanguageName: {
    color: '#202020',
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
    textAlign: 'left',
    lineHeight: 18,
  },
  selectedLanguageSubtitle: {
    color: '#666666',
  },
  languageRight: {
    alignItems: 'center',
    width: 32,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
    paddingTop: 50,
  },
  nextButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  backButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  questionIconContainer: {
    // No margin needed, using gap instead
  },
  questionText: {
    fontSize: 16,
    marginLeft: 10,
    fontStyle: 'Semi Bold',
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Helvetica',
  },
  questionIcon: {
    width: 20,
    height: 20,
  },
});