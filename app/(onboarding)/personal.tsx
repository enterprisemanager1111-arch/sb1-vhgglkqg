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
import { validateBirthDate, formatBirthDate, calculateAge, getZodiacSign } from '@/utils/birthdaySystem';
import { useOnboarding } from '@/contexts/OnboardingContext';

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  
  const generateDateOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    const months = [];
    const days = [];
    
    // Generate years (1900 to current year)
    for (let year = currentYear; year >= 1920; year--) {
      years.push(year);
    }
    
    // Generate months
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
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
          <Text style={styles.datePickerTitle}>Geburtsdatum auswählen</Text>
          
          <View style={styles.datePickerContent}>
            {/* Year Selector */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>Jahr</Text>
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
              <Text style={styles.dateSectionLabel}>Monat</Text>
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
              <Text style={styles.dateSectionLabel}>Tag</Text>
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
              <Text style={styles.datePickerCancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={styles.datePickerConfirm} onPress={handleConfirm}>
              <Text style={styles.datePickerConfirmText}>Bestätigen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PersonalInfoScreen() {
  const { onboardingData, updatePersonalInfo, completeStep } = useOnboarding();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);

  const roleOptions = [
    { id: 'parent', label: 'Elternteil', icon: '👨‍👩‍👧‍👦' },
    { id: 'child', label: 'Kind', icon: '🧒' },
    { id: 'teen', label: 'Teenager', icon: '🧑‍🎓' },
    { id: 'grandparent', label: 'Großeltern', icon: '👴👵' },
    { id: 'other', label: 'Andere', icon: '👤' },
  ];

  const interestOptions = [
    'Sport', 'Musik', 'Kochen', 'Lesen', 'Reisen', 
    'Filme', 'Gaming', 'Kunst', 'Natur', 'Technik'
  ];

  // Load existing data on mount
  React.useEffect(() => {
    const personalInfo = onboardingData.personalInfo;
    if (personalInfo.name) setName(personalInfo.name);
    if (personalInfo.birthDate) setBirthDate(personalInfo.birthDate);
    if (personalInfo.role) setRole(personalInfo.role);
    if (personalInfo.interests.length > 0) setInterests(personalInfo.interests);
  }, [onboardingData]);

  const handleContinue = async () => {
    const validation = validateName(name);
    
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    if (birthDate) {
      const birthValidation = validateBirthDate(birthDate);
      if (!birthValidation.isValid) {
        alert(birthValidation.error);
        return;
      }
    }

    const sanitizedName = sanitizeText(name, 50);

    try {
      // Save personal info to onboarding context
      await updatePersonalInfo({
        name: sanitizedName,
        birthDate: birthDate,
        role: role,
        interests: interests,
      });

      // Mark step as completed
      await completeStep('personal-info', {
        name: sanitizedName,
        birthDate: birthDate,
        role: role,
        interests: interests.join(', ')
      });

      router.push('/(onboarding)/preferences');
    } catch (error) {
      console.error('Error saving personal info:', error);
      alert('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
    }
  };

  const handleDateSelection = (selectedDate: Date) => {
    const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    setBirthDate(dateString);
    setShowDatePicker(false);
  };

  const getAgeDisplay = () => {
    if (!birthDate) return '';
    const age = calculateAge(birthDate);
    const zodiac = getZodiacSign(birthDate);
    if (!age || !zodiac) {
      return '';
    }

    return `${age} Jahre • ${zodiac}`;
  };

  const t = (key: string) => {
    // Placeholder translation function
    const translations: { [key: string]: string } = {
      'onboarding.personal.title': 'Erzählen Sie uns von sich',
      'onboarding.personal.subtitle': 'Diese Informationen helfen uns, Ihre Familien-App zu personalisieren',
      'common.continue': 'Weiter'
    };
    return translations[key] || key;
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>Schritt 2 von 5</Text>
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
                <Text style={styles.inputLabel}>Wie möchten Sie genannt werden?</Text>
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
                  Verwenden Sie den Namen, den Ihre Familie normalerweise verwendet.
                </Text>
              </View>
            )}
            <TextInput
              style={styles.textInput}
              placeholder="Ihr Vorname oder Nickname"
              placeholderTextColor="#888888"
              value={name}
              onChangeText={setName}
              autoComplete="given-name"
            />
          </View>

          {/* Birth Date Input */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <Calendar size={20} color="#54FE54" strokeWidth={2} />
                <Text style={styles.inputLabel}>Wann ist dein Geburtstag? (optional)</Text>
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
                  Wir verwenden dein Geburtsdatum nur für Geburtstags-Benachrichtigungen. 
                  Deine Daten bleiben privat und sicher.
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
                {birthDate ? formatBirthDate(birthDate, true) : 'Geburtsdatum auswählen'}
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
                <Text style={styles.inputLabel}>Was ist Ihre Rolle in der Familie?</Text>
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
                  Dies hilft uns, passende Funktionen und Berechtigungen zu empfehlen.
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
                  onPress={() => setRole(option.id)}
                >
                  <Text style={styles.roleEmoji}>{option.icon}</Text>
                  <Text style={[
                    styles.roleLabel,
                    role === option.id && styles.selectedRoleLabel
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Interests Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Was sind Ihre Interessen? (optional)</Text>
            <Text style={styles.inputDescription}>
              Wählen Sie bis zu 5 Bereiche, die Sie interessieren
            </Text>
            <View style={styles.interestGrid}>
              {interestOptions.map((interest) => (
                <Pressable
                  key={interest}
                  style={[
                    styles.interestChip,
                    interests.includes(interest) && styles.selectedInterest
                  ]}
                  onPress={() => toggleInterest(interest)}
                  disabled={interests.length >= 5 && !interests.includes(interest)}
                >
                  <Text style={[
                    styles.interestText,
                    interests.includes(interest) && styles.selectedInterestText
                  ]}>
                    {interest}
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
          disabled={!isValid}
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