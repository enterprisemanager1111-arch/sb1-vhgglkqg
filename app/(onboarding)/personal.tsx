import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, User, Calendar, Heart, CircleHelp as HelpCircle, ChevronDown } from 'lucide-react-native';
import { sanitizeText, validateName } from '@/utils/sanitization';
import { validateBirthDate, formatBirthDate, calculateAge, getZodiacSignKey } from '@/utils/birthdaySystem';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedDate } from '@/utils/dateLocalization';

// Date Picker Modal Component
const DatePickerModal = ({ 
  visible, 
  onClose, 
  onDateSelect 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateSelect: (date: Date) => void; 
}) => {
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  
  const generateDateOptions = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    const months: Array<{label: string, value: number}> = [];
    const days: number[] = [];
    
    // Generate years (1900 to current year)
    for (let year = currentYear; year >= 1920; year--) {
      years.push(year);
    }
    
    // Generate months
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index + 1 });
    });
    
    // Generate days (1-31)
    for (let day = 1; day <= 31; day++) {
      days.push(day);
    }
    
    return { years, months, days };
  };
  
  const { years, months, days } = generateDateOptions();
  
  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onDateSelect(selectedDate);
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <Text style={styles.datePickerTitle}>{t('onboarding.personal.datePicker.title')}</Text>
          
          <View style={styles.datePickerContent}>
            {/* Year Selector */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>{t('onboarding.personal.datePicker.year')}</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {years.map(year => (
                  <Pressable
                    key={year}
                    style={[styles.dateOption, selectedYear === year && styles.selectedDateOption]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.dateOptionText, selectedYear === year && styles.selectedDateOptionText]}>
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            
            {/* Month Selector */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>{t('onboarding.personal.datePicker.month')}</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {months.map(month => (
                  <Pressable
                    key={month.value}
                    style={[styles.dateOption, selectedMonth === month.value && styles.selectedDateOption]}
                    onPress={() => setSelectedMonth(month.value)}
                  >
                    <Text style={[styles.dateOptionText, selectedMonth === month.value && styles.selectedDateOptionText]}>
                      {month.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            
            {/* Day Selector */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>{t('onboarding.personal.datePicker.day')}</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {days.map(day => (
                  <Pressable
                    key={day}
                    style={[styles.dateOption, selectedDay === day && styles.selectedDateOption]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dateOptionText, selectedDay === day && styles.selectedDateOptionText]}>
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.datePickerButtons}>
            <Pressable style={styles.datePickerCancel} onPress={onClose}>
              <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable style={styles.datePickerConfirm} onPress={handleConfirm}>
              <Text style={styles.datePickerConfirmText}>{t('onboarding.personal.datePicker.confirm')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PersonalInfoScreen() {
  console.log('DEBUG: PersonalInfoScreen component mounted/re-rendered');
  
  const { onboardingData, updatePersonalInfo, completeStep } = useOnboarding();
  const { t } = useLanguage();
  // Temporarily simplified - removed useLocalizedDate to test if it's causing issues
  const getLocale = () => 'en-US';
  
  // Initialize state with logging
  const [name, setName] = useState(() => {
    console.log('DEBUG: Initializing name state with empty string');
    return '';
  });
  const [birthDate, setBirthDate] = useState(() => {
    console.log('DEBUG: Initializing birthDate state with empty string');
    return '';
  });
  const [role, setRole] = useState(() => {
    console.log('DEBUG: Initializing role state with empty string');
    return '';
  });
  const [interests, setInterests] = useState<string[]>(() => {
    console.log('DEBUG: Initializing interests state with empty array');
    return [];
  });
  
  // Debug state changes - log whenever form data changes
  React.useEffect(() => {
    console.log('DEBUG: Form state updated:', {
      name: `"${name}"`,
      birthDate: `"${birthDate}"`, 
      role: `"${role}"`,
      interests: interests,
      nameLength: name.length,
      hasRole: !!role
    });
  }, [name, birthDate, role, interests]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);

  const roleOptions = [
    { id: 'parent', labelKey: 'onboarding.personal.roles.parent', icon: '👨‍👩‍👧‍👦' },
    { id: 'child', labelKey: 'onboarding.personal.roles.child', icon: '🧒' },
    { id: 'teenager', labelKey: 'onboarding.personal.roles.teenager', icon: '🧑‍🎓' },
    { id: 'grandparent', labelKey: 'onboarding.personal.roles.grandparent', icon: '👴👵' },
    { id: 'other', labelKey: 'onboarding.personal.roles.other', icon: '👤' },
  ];

  const interestOptions = [
    { id: 'sport', labelKey: 'onboarding.personal.interests.sport' },
    { id: 'music', labelKey: 'onboarding.personal.interests.music' },
    { id: 'cooking', labelKey: 'onboarding.personal.interests.cooking' },
    { id: 'reading', labelKey: 'onboarding.personal.interests.reading' },
    { id: 'travel', labelKey: 'onboarding.personal.interests.travel' },
    { id: 'movies', labelKey: 'onboarding.personal.interests.movies' },
    { id: 'gaming', labelKey: 'onboarding.personal.interests.gaming' },
    { id: 'art', labelKey: 'onboarding.personal.interests.art' },
    { id: 'nature', labelKey: 'onboarding.personal.interests.nature' },
    { id: 'tech', labelKey: 'onboarding.personal.interests.tech' }
  ];

  // Load existing data on mount - but only once to avoid overwriting user input
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  React.useEffect(() => {
    if (!hasLoadedInitialData) {
      console.log('DEBUG: Loading initial personal info from onboarding context:', onboardingData.personalInfo);
      const personalInfo = onboardingData.personalInfo;
      
      // Only load if there's actual data (not empty defaults)
      if (personalInfo.name && personalInfo.name.trim() !== '') {
        console.log('DEBUG: Loading existing name:', personalInfo.name);
        setName(personalInfo.name);
      }
      if (personalInfo.birthDate && personalInfo.birthDate !== '') {
        console.log('DEBUG: Loading existing birth date:', personalInfo.birthDate);
        setBirthDate(personalInfo.birthDate);
      }
      if (personalInfo.role && personalInfo.role !== '') {
        console.log('DEBUG: Loading existing role:', personalInfo.role);
        setRole(personalInfo.role);
      }
      if (personalInfo.interests && personalInfo.interests.length > 0) {
        console.log('DEBUG: Loading existing interests:', personalInfo.interests);
        setInterests(personalInfo.interests);
      }
      
      setHasLoadedInitialData(true);
      console.log('DEBUG: Initial data loading complete');
    }
  }, [onboardingData, hasLoadedInitialData]);



  const handleDateSelection = (selectedDate: Date) => {
    const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    setBirthDate(dateString);
    setShowDatePicker(false);
  };

  const getAgeDisplay = () => {
    if (!birthDate) return '';
    const age = calculateAge(birthDate);
    const zodiacKey = getZodiacSignKey(birthDate);
    const zodiac = t(`zodiac.${zodiacKey}`);
    if (!age || !zodiac) {
      return '';
    }

    return t('onboarding.personal.ageDisplay', { age: age.toString(), zodiac });
  };


  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const handleBack = () => {
    router.back();
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
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

  const isValid = name.trim().length > 0 && role;

  const handleContinue = async () => {
    console.log('DEBUG: Continue button clicked!');
    console.log('DEBUG: Current form data:', { name, birthDate, role, interests });
    console.log('DEBUG: Validation state - name length:', name.trim().length, 'role selected:', !!role);
    
    // Always attempt to save whatever data is entered
    // Basic validation for required fields
    if (!name || name.trim().length < 1) {
      console.log('DEBUG: Name validation failed');
      alert('Please enter your name to continue');
      return;
    }
    
    if (!role) {
      console.log('DEBUG: Role validation failed');
      alert('Please select your role to continue');
      return;
    }
    
    console.log('DEBUG: Validation passed, proceeding to save personal info');

    // Use the exact name you typed (with basic sanitization for safety)
    const finalName = sanitizeText(name, 50);

    try {
      console.log('DEBUG: Saving personal info exactly as entered:', {
        originalName: name,
        finalName: finalName,
        birthDate: birthDate,
        role: role,
        interests: interests,
      });
      
      const personalInfoToSave = {
        name: finalName,
        birthDate: birthDate,
        role: role,
        interests: interests,
      };
      
      console.log('DEBUG: About to save to personalInfo in local storage:', personalInfoToSave);
      
      // Save personal info to local storage exactly as you entered it
      await updatePersonalInfo(personalInfoToSave);
      
      console.log('DEBUG: Personal info successfully saved to local storage!');

      // Mark step as completed
      await completeStep('personal-info', {
        name: finalName,
        birthDate: birthDate,
        role: role,
        interests: interests.join(', ')
      });

      router.push('/(onboarding)/preferences');
    } catch (error: any) {
      console.error('ERROR: Failed to save personal info:', error);
      console.error('ERROR details:', error.message, error.stack);
      alert(`Error saving information: ${error.message || error}. Please try again.`);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>{t('onboarding.stepIndicator', { current: '2', total: '5' })}</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('onboarding.personal.title')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.personal.subtitle')}
            </Text>
          </View>


          {/* Name Input */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <User size={20} color="#54FE54" strokeWidth={2} />
                <Text style={styles.inputLabel}>{t('onboarding.personal.name.label')}</Text>
              </View>
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
                  {t('onboarding.personal.name.tooltip')}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.textInput}
              placeholder={t('onboarding.personal.name.placeholder')}
              placeholderTextColor="#888888"
              value={name}
              onChangeText={(text) => {
                console.log('DEBUG: Name input changed to:', `"${text}"`);
                setName(text);
              }}
              autoComplete="given-name"
            />
          </View>

          {/* Birth Date Input */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <Calendar size={20} color="#54FE54" strokeWidth={2} />
                <Text style={styles.inputLabel}>{t('onboarding.personal.birthdate.label')}</Text>
              </View>
              <Pressable 
                style={styles.tooltipButton}
                onPress={() => setShowTooltip(showTooltip === 'birthday' ? null : 'birthday')}
              >
                <HelpCircle size={16} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>
            {showTooltip === 'birthday' && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  {t('onboarding.personal.birthdate.tooltip')}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[
                styles.datePickerButtonText,
                !birthDate && styles.placeholderText
              ]}>
                {birthDate ? formatBirthDate(birthDate, true, getLocale()) : t('onboarding.personal.datePicker.placeholder')}
              </Text>
              <ChevronDown size={20} color="#666666" strokeWidth={2} />
            </Pressable>
            
            {birthDate && (
              <View style={styles.ageDisplay}>
                <Text style={styles.ageDisplayText}>{getAgeDisplay()}</Text>
              </View>
            )}
          </View>

          {/* Role Selection */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <Heart size={20} color="#54FE54" strokeWidth={2} />
                <Text style={styles.inputLabel}>{t('onboarding.personal.role.label')}</Text>
              </View>
              <Pressable 
                style={styles.tooltipButton}
                onPress={() => setShowTooltip(showTooltip === 'role' ? null : 'role')}
              >
                <HelpCircle size={16} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>
            {showTooltip === 'role' && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  {t('onboarding.personal.role.tooltip')}
                </Text>
              </View>
            )}
            <View style={styles.roleGrid}>
              {roleOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.roleOption,
                    role === option.id && styles.selectedRole
                  ]}
                  onPress={() => {
                    console.log('DEBUG: Role selected:', option.id);
                    setRole(option.id);
                  }}
                >
                  <Text style={styles.roleEmoji}>{option.icon}</Text>
                  <Text style={[
                    styles.roleLabel,
                    role === option.id && styles.selectedRoleLabel
                  ]}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Interests Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('onboarding.personal.interests.label')}</Text>
            <Text style={styles.inputDescription}>
              {t('onboarding.personal.interests.subtitle')}
            </Text>
            <View style={styles.interestGrid}>
              {interestOptions.map((interest) => (
                <Pressable
                  key={interest.id}
                  style={[
                    styles.interestChip,
                    interests.includes(interest.id) && styles.selectedInterest
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                  disabled={interests.length >= 5 && !interests.includes(interest.id)}
                >
                  <Text style={[
                    styles.interestText,
                    interests.includes(interest.id) && styles.selectedInterestText
                  ]}>
                    {t(interest.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Date Picker Modal */}
      <DatePickerModal 
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelection}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <AnimatedPressable
          style={[
            styles.continueButton,
            !isValid && styles.disabledButton,
            buttonAnimatedStyle
          ]}
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[
            styles.continueText,
            !isValid && styles.disabledText
          ]}>
{t('common.continue')}
          </Text>
          <ChevronRight size={20} color={isValid ? "#161618" : "#999999"} strokeWidth={2} />
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
    marginBottom: 32,
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

  // Input Sections
  inputSection: {
    marginBottom: 32,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  inputDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  tooltipButton: {
    padding: 4,
  },
  tooltip: {
    backgroundColor: '#161618',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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

  // Role Selection
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedRole: {
    borderColor: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  selectedRoleLabel: {
    color: '#54FE54',
    fontWeight: '600',
  },

  // Interests
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedInterest: {
    backgroundColor: '#54FE54',
    borderColor: '#54FE54',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  selectedInterestText: {
    color: '#161618',
  },

  // Date Picker
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
  },
  placeholderText: {
    color: '#888888',
  },
  ageDisplay: {
    marginTop: 8,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ageDisplayText: {
    fontSize: 12,
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  datePickerContent: {
    flexDirection: 'row',
    height: 200,
    gap: 16,
  },
  dateSection: {
    flex: 1,
    alignItems: 'center',
  },
  dateSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  dateScroll: {
    flex: 1,
    width: '100%',
  },
  dateOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  selectedDateOption: {
    backgroundColor: '#54FE54',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
  },
  selectedDateOptionText: {
    color: '#161618',
    fontWeight: '600',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  datePickerCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  datePickerConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#54FE54',
    alignItems: 'center',
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  disabledText: {
    color: '#999999',
  },
});