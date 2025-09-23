import React, { useState, useEffect } from 'react';
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
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, User, Calendar, Heart, CircleHelp as HelpCircle, ChevronDown } from 'lucide-react-native';
import { sanitizeText, validateName } from '@/utils/sanitization';
import { validateBirthDate, formatBirthDate, calculateAge, getZodiacSignKey } from '@/utils/birthdaySystem';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useLocalizedDate } from '@/utils/dateLocalization';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { t, currentLanguage } = useLanguage();
  
  // Debug logging for date picker modal
  console.log('DatePickerModal rendered with language:', currentLanguage.code);
  console.log('Cancel button text:', t('common.cancel'));
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
    
    // Generate months with translations
    const monthNames = [
      currentLanguage.code === 'en' ? 'January' : 
      currentLanguage.code === 'de' ? 'Januar' : 
      currentLanguage.code === 'nl' ? 'Januari' : 
      currentLanguage.code === 'fr' ? 'Janvier' : 
      currentLanguage.code === 'es' ? 'Enero' : 
      currentLanguage.code === 'it' ? 'Gennaio' : 'January',

      currentLanguage.code === 'en' ? 'February' : 
      currentLanguage.code === 'de' ? 'Februar' : 
      currentLanguage.code === 'nl' ? 'Februari' : 
      currentLanguage.code === 'fr' ? 'Février' : 
      currentLanguage.code === 'es' ? 'Febrero' : 
      currentLanguage.code === 'it' ? 'Febbraio' : 'February',

      currentLanguage.code === 'en' ? 'March' : 
      currentLanguage.code === 'de' ? 'März' : 
      currentLanguage.code === 'nl' ? 'Maart' : 
      currentLanguage.code === 'fr' ? 'Mars' : 
      currentLanguage.code === 'es' ? 'Marzo' : 
      currentLanguage.code === 'it' ? 'Marzo' : 'March',

      currentLanguage.code === 'en' ? 'April' : 
      currentLanguage.code === 'de' ? 'April' : 
      currentLanguage.code === 'nl' ? 'April' : 
      currentLanguage.code === 'fr' ? 'Avril' : 
      currentLanguage.code === 'es' ? 'Abril' : 
      currentLanguage.code === 'it' ? 'Aprile' : 'April',

      currentLanguage.code === 'en' ? 'May' : 
      currentLanguage.code === 'de' ? 'Mai' : 
      currentLanguage.code === 'nl' ? 'Mei' : 
      currentLanguage.code === 'fr' ? 'Mai' : 
      currentLanguage.code === 'es' ? 'Mayo' : 
      currentLanguage.code === 'it' ? 'Maggio' : 'May',

      currentLanguage.code === 'en' ? 'June' : 
      currentLanguage.code === 'de' ? 'Juni' : 
      currentLanguage.code === 'nl' ? 'Juni' : 
      currentLanguage.code === 'fr' ? 'Juin' : 
      currentLanguage.code === 'es' ? 'Junio' : 
      currentLanguage.code === 'it' ? 'Giugno' : 'June',

      currentLanguage.code === 'en' ? 'July' : 
      currentLanguage.code === 'de' ? 'Juli' : 
      currentLanguage.code === 'nl' ? 'Juli' : 
      currentLanguage.code === 'fr' ? 'Juillet' : 
      currentLanguage.code === 'es' ? 'Julio' : 
      currentLanguage.code === 'it' ? 'Luglio' : 'July',

      currentLanguage.code === 'en' ? 'August' : 
      currentLanguage.code === 'de' ? 'August' : 
      currentLanguage.code === 'nl' ? 'Augustus' : 
      currentLanguage.code === 'fr' ? 'Août' : 
      currentLanguage.code === 'es' ? 'Agosto' : 
      currentLanguage.code === 'it' ? 'Agosto' : 'August',

      currentLanguage.code === 'en' ? 'September' : 
      currentLanguage.code === 'de' ? 'September' : 
      currentLanguage.code === 'nl' ? 'September' : 
      currentLanguage.code === 'fr' ? 'Septembre' : 
      currentLanguage.code === 'es' ? 'Septiembre' : 
      currentLanguage.code === 'it' ? 'Settembre' : 'September',

      currentLanguage.code === 'en' ? 'October' : 
      currentLanguage.code === 'de' ? 'Oktober' : 
      currentLanguage.code === 'nl' ? 'Oktober' : 
      currentLanguage.code === 'fr' ? 'Octobre' : 
      currentLanguage.code === 'es' ? 'Octubre' : 
      currentLanguage.code === 'it' ? 'Ottobre' : 'October',

      currentLanguage.code === 'en' ? 'November' : 
      currentLanguage.code === 'de' ? 'November' : 
      currentLanguage.code === 'nl' ? 'November' : 
      currentLanguage.code === 'fr' ? 'Novembre' : 
      currentLanguage.code === 'es' ? 'Noviembre' : 
      currentLanguage.code === 'it' ? 'Novembre' : 'November',

      currentLanguage.code === 'en' ? 'December' : 
      currentLanguage.code === 'de' ? 'Dezember' : 
      currentLanguage.code === 'nl' ? 'December' : 
      currentLanguage.code === 'fr' ? 'Décembre' : 
      currentLanguage.code === 'es' ? 'Diciembre' : 
      currentLanguage.code === 'it' ? 'Dicembre' : 'December'
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
          <Text style={styles.datePickerTitle}>
            {currentLanguage.code === 'en' ? 'Select birth date' : 
             currentLanguage.code === 'nl' ? 'Selecteer geboortedatum' : 
             currentLanguage.code === 'de' ? 'Geburtsdatum auswählen' : 
             currentLanguage.code === 'fr' ? 'Sélectionner la date de naissance' : 
             currentLanguage.code === 'es' ? 'Seleccionar fecha de nacimiento' : 
             currentLanguage.code === 'it' ? 'Seleziona data di nascita' : 
             t('onboarding.personal.datePicker.title') || 'Select birth date'}
          </Text>
          
          <View style={styles.datePickerContent}>
            {/* Year Selector */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>
                {currentLanguage.code === 'en' ? 'Year' : 
                 currentLanguage.code === 'nl' ? 'Jaar' : 
                 currentLanguage.code === 'de' ? 'Jahr' : 
                 currentLanguage.code === 'fr' ? 'Année' : 
                 currentLanguage.code === 'es' ? 'Año' : 
                 currentLanguage.code === 'it' ? 'Anno' : 
                 t('onboarding.personal.datePicker.year') || 'Year'}
              </Text>
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
              <Text style={styles.dateSectionLabel}>
                {currentLanguage.code === 'en' ? 'Month' : 
                 currentLanguage.code === 'nl' ? 'Maand' : 
                 currentLanguage.code === 'de' ? 'Monat' : 
                 currentLanguage.code === 'fr' ? 'Mois' : 
                 currentLanguage.code === 'es' ? 'Mes' : 
                 currentLanguage.code === 'it' ? 'Mese' : 
                 t('onboarding.personal.datePicker.month') || 'Month'}
              </Text>
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
              <Text style={styles.dateSectionLabel}>
                {currentLanguage.code === 'en' ? 'Day' : 
                 currentLanguage.code === 'nl' ? 'Dag' : 
                 currentLanguage.code === 'de' ? 'Tag' : 
                 currentLanguage.code === 'fr' ? 'Jour' : 
                 currentLanguage.code === 'es' ? 'Día' : 
                 currentLanguage.code === 'it' ? 'Giorno' : 
                 t('onboarding.personal.datePicker.day') || 'Day'}
              </Text>
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
              <Text style={styles.datePickerCancelText}>
                {currentLanguage.code === 'en' ? 'Cancel' : 
                 currentLanguage.code === 'nl' ? 'Annuleren' : 
                 currentLanguage.code === 'de' ? 'Abbrechen' : 
                 currentLanguage.code === 'fr' ? 'Annuler' : 
                 currentLanguage.code === 'es' ? 'Cancelar' : 
                 currentLanguage.code === 'it' ? 'Annulla' : 
                 t('common.cancel') || 'Cancel'}
              </Text>
            </Pressable>
            <Pressable style={styles.datePickerConfirm} onPress={handleConfirm}>
              <Text style={styles.datePickerConfirmText}>
                {currentLanguage.code === 'en' ? 'Confirm' : 
                 currentLanguage.code === 'nl' ? 'Bevestigen' : 
                 currentLanguage.code === 'de' ? 'Bestätigen' : 
                 currentLanguage.code === 'fr' ? 'Confirmer' : 
                 currentLanguage.code === 'es' ? 'Confirmar' : 
                 currentLanguage.code === 'it' ? 'Conferma' : 
                 t('onboarding.personal.datePicker.confirm') || 'Confirm'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PersonalInfoScreen() {
  console.log('DEBUG: PersonalInfoScreen component mounted/re-rendered');
  
  const { onboardingData, updatePersonalInfo, completeStep, loading } = useOnboarding();
  
  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const nameInputOpacity = useSharedValue(0);
  const nameInputTranslateX = useSharedValue(-50);
  const dateInputOpacity = useSharedValue(0);
  const dateInputTranslateX = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  
  // Continuous animations
  const iconFloat = useSharedValue(0);
  const buttonPulse = useSharedValue(1);
  
  // Individual button animations for roles
  const roleButtonScales = useSharedValue<Record<string, any>>({});
  
  // Individual button animations for interests
  const interestButtonScales = useSharedValue<Record<string, any>>({});
  
  // Animation trigger function
  const triggerAnimations = () => {
    // Title animation - bounce in from top
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Subtitle animation - fade in with slight delay
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));

    // Name input - slide in from left
    nameInputOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    nameInputTranslateX.value = withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }));

    // Date input - slide in from right
    dateInputOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    dateInputTranslateX.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Button - fade in from bottom
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(800, withSpring(0, { damping: 10, stiffness: 100 }));

    // Icon floating animation - continuous gentle float
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Button pulse animation - subtle pulse effect
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  };

  // Debug component mounting
  React.useEffect(() => {
    console.log('DEBUG: PersonalInfoScreen useEffect - Component mounted');
    console.log('DEBUG: Initial onboarding data:', onboardingData);
    
    // Check what's currently in AsyncStorage
    const checkCurrentStorage = async () => {
      try {
        const currentData = await AsyncStorage.getItem('@famora_onboarding_data');
        if (currentData) {
          const parsed = JSON.parse(currentData);
          console.log('DEBUG: Current AsyncStorage data on mount:', parsed);
          console.log('DEBUG: Current personalInfo in storage:', parsed.personalInfo);
        } else {
          console.log('DEBUG: No data in AsyncStorage on mount');
        }
      } catch (error) {
        console.log('DEBUG: Error reading AsyncStorage on mount:', error);
      }
    };
    
    checkCurrentStorage();
    triggerAnimations();
  }, []);

  // Load existing data from context when it becomes available
  React.useEffect(() => {
    console.log('DEBUG: Context data changed, updating form state');
    console.log('DEBUG: Context personalInfo:', onboardingData.personalInfo);
    
    if (onboardingData.personalInfo.name && !name) {
      console.log('DEBUG: Loading name from context:', onboardingData.personalInfo.name);
      setName(onboardingData.personalInfo.name);
    }
    if (onboardingData.personalInfo.birthDate && !birthDate) {
      console.log('DEBUG: Loading birthDate from context:', onboardingData.personalInfo.birthDate);
      setBirthDate(onboardingData.personalInfo.birthDate);
    }
    if (onboardingData.personalInfo.role && !role) {
      console.log('DEBUG: Loading role from context:', onboardingData.personalInfo.role);
      setRole(onboardingData.personalInfo.role);
    }
    if (onboardingData.personalInfo.interests && onboardingData.personalInfo.interests.length > 0 && interests.length === 0) {
      console.log('DEBUG: Loading interests from context:', onboardingData.personalInfo.interests);
      setInterests(onboardingData.personalInfo.interests);
    }
  }, [onboardingData.personalInfo]);
  const { t, currentLanguage } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  // Temporarily simplified - removed useLocalizedDate to test if it's causing issues
  const getLocale = () => 'en-US';
  
  // Initialize state with logging
  const [name, setName] = useState(() => {
    console.log('DEBUG: Initializing name state with:', onboardingData.personalInfo.name || '');
    return onboardingData.personalInfo.name || '';
  });
  const [birthDate, setBirthDate] = useState(() => {
    console.log('DEBUG: Initializing birthDate state with:', onboardingData.personalInfo.birthDate || '');
    return onboardingData.personalInfo.birthDate || '';
  });
  const [role, setRole] = useState(() => {
    console.log('DEBUG: Initializing role state with:', onboardingData.personalInfo.role || '');
    return onboardingData.personalInfo.role || '';
  });
  const [interests, setInterests] = useState<string[]>(() => {
    console.log('DEBUG: Initializing interests state with:', onboardingData.personalInfo.interests || []);
    return onboardingData.personalInfo.interests || [];
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
    // Update the ref whenever state changes
    stateRef.current = { name, birthDate, role, interests };
  }, [name, birthDate, role, interests]);

  // Add a ref to track if state is being properly maintained
  const stateRef = React.useRef({ name, birthDate, role, interests });
  
  React.useEffect(() => {
    stateRef.current = { name, birthDate, role, interests };
    console.log('DEBUG: State ref updated:', stateRef.current);
    // Removed setForceUpdateCounter to prevent infinite loop
  }, [name, birthDate, role, interests]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);

  const roleOptions = [
    { id: 'parent', label: 'Parent' },
    { id: 'child', label: 'Child' },
    { id: 'teenager', label: 'Teenager' },
    { id: 'grandparent', label: 'Grandparent' },
    { id: 'other', label: 'Other' },
  ];

  const interestOptions = [
    { id: 'sports', label: 'Sports' },
    { id: 'music', label: 'Music' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'reading', label: 'Reading' },
    { id: 'travel', label: 'Travel' },
    { id: 'nature', label: 'Nature' },
    { id: 'gaming', label: 'Gaming' },
  ];

  // Load existing data on mount - but only once to avoid overwriting user input
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  React.useEffect(() => {
    if (!hasLoadedInitialData) {
      console.log('DEBUG: Loading initial personal info from onboarding context:', onboardingData.personalInfo);
      const personalInfo = onboardingData.personalInfo;
      
      // Only load if there's actual data (not empty defaults) AND user hasn't entered data yet
      if (personalInfo.name && personalInfo.name.trim() !== '' && name === '') {
        console.log('DEBUG: Loading existing name:', personalInfo.name);
        setName(personalInfo.name);
      }
      if (personalInfo.birthDate && personalInfo.birthDate !== '' && birthDate === '') {
        console.log('DEBUG: Loading existing birth date:', personalInfo.birthDate);
        setBirthDate(personalInfo.birthDate);
      }
      if (personalInfo.role && personalInfo.role !== '' && role === '') {
        console.log('DEBUG: Loading existing role:', personalInfo.role);
        setRole(personalInfo.role);
      }
      if (personalInfo.interests && personalInfo.interests.length > 0 && interests.length === 0) {
        console.log('DEBUG: Loading existing interests:', personalInfo.interests);
        setInterests(personalInfo.interests);
      }
      
      setHasLoadedInitialData(true);
      console.log('DEBUG: Initial data loading complete');
    }
  }, [hasLoadedInitialData]); // Remove onboardingData dependency to prevent re-runs



  const handleDateSelection = (selectedDate: Date) => {
    const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('DEBUG: Date selected:', selectedDate, '-> formatted:', dateString);
    console.log('DEBUG: Previous birthDate state:', `"${birthDate}"`);
    setBirthDate(dateString);
    console.log('DEBUG: setBirthDate called with:', dateString);
    // Force update ref immediately
    stateRef.current.birthDate = dateString;
    console.log('DEBUG: Updated stateRef.current.birthDate to:', dateString);
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
    console.log('DEBUG: Toggling interest:', interest);
    console.log('DEBUG: Previous interests state:', interests);
    setInterests(prev => {
      const newInterests = prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      console.log('DEBUG: New interests array:', newInterests);
      // Force update ref immediately
      stateRef.current.interests = newInterests;
      console.log('DEBUG: Updated stateRef.current.interests to:', newInterests);
      return newInterests;
    });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Component animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const nameInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameInputOpacity.value,
    transform: [{ translateX: nameInputTranslateX.value }],
  }));

  const dateInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateInputOpacity.value,
    transform: [{ translateX: dateInputTranslateX.value }],
  }));

  const buttonContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Additional cool animated styles
  const iconFloatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(iconFloat.value, [0, 1], [-3, 3], Extrapolate.CLAMP)
    }],
  }));

  const buttonPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  // Role button animated style
  const getRoleButtonAnimatedStyle = (roleId: string) => {
    return useAnimatedStyle(() => ({
      transform: [{ 
        scale: roleButtonScales.value[roleId] || 1 
      }],
    }));
  };

  // Interest button animated style
  const getInterestButtonAnimatedStyle = (interestId: string) => {
    return useAnimatedStyle(() => ({
      transform: [{ 
        scale: interestButtonScales.value[interestId] || 1 
      }],
    }));
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Role button handlers
  const handleRolePressIn = (roleId: string) => {
    'worklet';
    roleButtonScales.value = {
      ...roleButtonScales.value,
      [roleId]: withSpring(0.95, { damping: 15, stiffness: 300 })
    };
  };

  const handleRolePressOut = (roleId: string) => {
    'worklet';
    roleButtonScales.value = {
      ...roleButtonScales.value,
      [roleId]: withSpring(1, { damping: 15, stiffness: 300 })
    };
  };

  // Interest button handlers
  const handleInterestPressIn = (interestId: string) => {
    'worklet';
    interestButtonScales.value = {
      ...interestButtonScales.value,
      [interestId]: withSpring(0.95, { damping: 15, stiffness: 300 })
    };
  };

  const handleInterestPressOut = (interestId: string) => {
    'worklet';
    interestButtonScales.value = {
      ...interestButtonScales.value,
      [interestId]: withSpring(1, { damping: 15, stiffness: 300 })
    };
  };

  const isValid = role;

  // Debug function to check current form state
  const logCurrentState = () => {
    console.log('DEBUG: Current form state check:', {
      name: `"${name}"` + ` (length: ${name.length})`,
      birthDate: `"${birthDate}"`,
      role: `"${role}"`,
      interests: interests,
      stateRef: stateRef.current,
      isValid: isValid
    });
  };

  // Function to verify if data was saved correctly
  const verifyDataSaved = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@famora_onboarding_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('DEBUG: Current stored personal info:', parsed.personalInfo);
        return parsed.personalInfo;
      } else {
        console.log('DEBUG: No data found in storage');
        return null;
      }
    } catch (error) {
      console.error('DEBUG: Error reading saved data:', error);
      return null;
    }
  };

  // Emergency direct save function (bypasses context completely)
  const saveDirectToStorage = async (personalInfo: any) => {
    console.log('DEBUG: Direct storage save called with:', personalInfo);
    
    const STORAGE_KEY = '@famora_onboarding_data';
    
    try {
      // Get existing data
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      let fullData = {
        personalInfo: { name: '', birthDate: '', role: '', interests: [] },
        preferences: { goals: [] },
        authInfo: { email: '', password: '' },
        completedSteps: [],
        currentStepIndex: 0
      };
      
      if (existingData) {
        fullData = JSON.parse(existingData);
      }
      
      // Update personal info
      fullData.personalInfo = personalInfo;
      
      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
      console.log('DEBUG: Direct storage save completed:', fullData);
      
      return true;
    } catch (error) {
      console.error('DEBUG: Direct storage save failed:', error);
      return false;
    }
  };

  // Test function to verify AsyncStorage is working
  const testAsyncStorage = async () => {
    console.log('=== TESTING ASYNC STORAGE ===');
    const testKey = '@test_key';
    const testData = { test: 'data', timestamp: Date.now() };
    
    try {
      // Test write
      await AsyncStorage.setItem(testKey, JSON.stringify(testData));
      console.log('DEBUG: Test write successful');
      
      // Test read
      const readData = await AsyncStorage.getItem(testKey);
      if (readData) {
        const parsed = JSON.parse(readData);
        console.log('DEBUG: Test read successful:', parsed);
        
        // Clean up
        await AsyncStorage.removeItem(testKey);
        console.log('DEBUG: Test cleanup successful');
        return true;
      } else {
        console.log('DEBUG: Test read failed - no data returned');
        return false;
      }
    } catch (error) {
      console.error('DEBUG: AsyncStorage test failed:', error);
      return false;
    }
  };


  const handleContinue = async () => {
    console.log('=== DEBUG: Continue button clicked ===');
    console.log('DEBUG: Current context loading state:', loading);
    console.log('DEBUG: Current onboardingData from context:', onboardingData);
    
    // Use ref values as backup if state values are empty
    const currentName = name || stateRef.current.name;
    const currentBirthDate = birthDate || stateRef.current.birthDate;
    const currentRole = role || stateRef.current.role;
    const currentInterests = interests.length > 0 ? interests : stateRef.current.interests;
    
    console.log('DEBUG: Final values to save:', {
      currentName,
      currentBirthDate, 
      currentRole,
      currentInterests
    });
    
    // Basic validation for required fields
    if (!currentRole) {
      alert(t('onboarding.personal.validation.roleRequired') || 'Please select your role to continue');
      return;
    }
    
    console.log('DEBUG: Validation passed, proceeding to save personal info');
    
    // Show full-screen loading
    showLoading(t('common.saving') || 'Saving...');

    // Use the exact name you typed (with basic sanitization for safety) or empty string if not provided
    const finalName = currentName ? sanitizeText(currentName, 50) : '';

    try {
      console.log('DEBUG: Saving personal info exactly as entered:', {
        originalName: currentName,
        finalName: finalName,
        birthDate: currentBirthDate,
        role: currentRole,
        interests: currentInterests,
      });
      
      const personalInfoToSave = {
        name: finalName,
        birthDate: currentBirthDate,
        role: currentRole,
        interests: currentInterests,
      };
      
      console.log('DEBUG: Saving personal info:', personalInfoToSave);
      
      // Primary save: Use context to save to AsyncStorage
      console.log('DEBUG: Attempting to save via context...');
      console.log('DEBUG: updatePersonalInfo function available:', typeof updatePersonalInfo);
      
      // Check if context is still loading
      if (loading) {
        console.log('DEBUG: Context is still loading, waiting for it to complete...');
        // Wait for context to finish loading
        let attempts = 0;
        while (loading && attempts < 50) { // Max 5 seconds
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        console.log('DEBUG: Loading wait completed, attempts:', attempts, 'still loading:', loading);
      }
      
      await updatePersonalInfo(personalInfoToSave);
      console.log('DEBUG: Context save completed successfully');
      
      // Verify the save worked by checking AsyncStorage directly
      console.log('DEBUG: Verifying save...');
      const savedData = await AsyncStorage.getItem('@famora_onboarding_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('DEBUG: Verified saved personal info:', parsed.personalInfo);
        
        // Double-check that the data matches what we tried to save
        if (parsed.personalInfo.name === finalName && 
            parsed.personalInfo.role === currentRole) {
          console.log('DEBUG: Save verification successful - data matches');
        } else {
          console.warn('DEBUG: Save verification failed - data mismatch');
          throw new Error('Data verification failed after save');
        }
      } else {
        console.warn('DEBUG: No data found in AsyncStorage after save');
        throw new Error('No data found after save');
      }

      // Mark step as completed
      console.log('DEBUG: Marking step as completed...');
      await completeStep('personal-info', {
        name: finalName,
        birthDate: currentBirthDate,
        role: currentRole,
        interests: currentInterests.join(', ')
      });

      console.log('DEBUG: All saves completed successfully, navigating to preferences');
      hideLoading();
      router.push('/(onboarding)/preferences');
    } catch (error: any) {
      console.error('ERROR: Failed to save personal info:', error);
      console.error('ERROR details:', error.message, error.stack);
      
      hideLoading();
      
      // Test if it's an AsyncStorage issue
      console.log('DEBUG: Testing AsyncStorage again after error...');
      const storageWorking2 = await testAsyncStorage();
      console.log('DEBUG: AsyncStorage test result after error:', storageWorking2);
      
      // Emergency fallback: Direct save to AsyncStorage
      console.log('DEBUG: Context save failed, attempting emergency direct save...');
      try {
        const currentData = await AsyncStorage.getItem('@famora_onboarding_data');
        let baseData = {
          personalInfo: { name: '', birthDate: '', role: '', interests: [] },
          preferences: { goals: [] },
          authInfo: { email: '', password: '' },
          completedSteps: [],
          currentStepIndex: 0
        };
        
        if (currentData) {
          baseData = JSON.parse(currentData);
        }
        
        const emergencyData = {
          ...baseData,
          personalInfo: {
            name: finalName,
            birthDate: currentBirthDate,
            role: currentRole,
            interests: currentInterests,
          }
        };
        
        await AsyncStorage.setItem('@famora_onboarding_data', JSON.stringify(emergencyData));
        console.log('DEBUG: Emergency save completed successfully:', emergencyData.personalInfo);
        
        // Try to complete the step again
        await completeStep('personal-info', {
          name: finalName,
          birthDate: currentBirthDate,
          role: currentRole,
          interests: currentInterests.join(', ')
        });
        
        console.log('DEBUG: Emergency save successful, navigating to preferences');
        hideLoading();
        router.push('/(onboarding)/preferences');
      } catch (emergencyError) {
        console.error('ERROR: Emergency save also failed:', emergencyError);
        hideLoading();
        alert(`Error saving information: ${error.message || error}. Please try again.`);
      }
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

      {/* Upper Section with Background Image */}
      <View style={styles.upperSection}>
        <RNImage 
          source={require('@/assets/images/newImg/background.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Dark Translucent Overlay */}
        <View style={styles.darkOverlay} />
      </View>

        {/* Lower Section - White Card */}
        <View style={styles.lowerSection}>
          <View style={styles.contentCard}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.title}>
              {currentLanguage.code === 'en' ? 'Tell us about yourself' : 
               currentLanguage.code === 'de' ? 'Erzählen Sie uns von sich' : 
               currentLanguage.code === 'nl' ? 'Vertel ons over jezelf' : 
               currentLanguage.code === 'fr' ? 'Parlez-nous de vous' : 
               currentLanguage.code === 'es' ? 'Cuéntanos sobre ti' : 
               currentLanguage.code === 'it' ? 'Parlaci di te' : 
               t('onboarding.personal.title') || 'Tell us about yourself'}
            </Text>
            <Animated.View style={subtitleAnimatedStyle}>
              <Text style={styles.subtitle}>
              {currentLanguage.code === 'en' ? 'This information helps us find to build the perfect app for your experience.' : 
               currentLanguage.code === 'de' ? 'Diese Informationen helfen uns, die perfekte App für Ihre Erfahrung zu erstellen.' : 
               currentLanguage.code === 'nl' ? 'Deze informatie helpt ons de perfecte app voor jouw ervaring te bouwen.' : 
               currentLanguage.code === 'fr' ? 'Ces informations nous aident à créer l\'application parfaite pour votre expérience.' : 
               currentLanguage.code === 'es' ? 'Esta información nos ayuda a construir la aplicación perfecta para tu experiencia.' : 
               currentLanguage.code === 'it' ? 'Queste informazioni ci aiutano a costruire l\'app perfetta per la tua esperienza.' : 
               t('onboarding.personal.subtitle') || 'This information helps us find to build the perfect app for your experience.'}
              </Text>
            </Animated.View>
          </Animated.View>





          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDash} />
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
          </View>

          {/* Role Selection */}
          <Animated.View style={[styles.inputSection, nameInputAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#17f196" strokeWidth={2} />
              <Text style={styles.sectionTitle}>
                {currentLanguage.code === 'en' ? 'What is your role in the family?' : 
                 currentLanguage.code === 'de' ? 'Was ist Ihre Rolle in der Familie?' : 
                 currentLanguage.code === 'nl' ? 'Wat is je rol in de familie?' : 
                 currentLanguage.code === 'fr' ? 'Quel est votre rôle dans la famille?' : 
                 currentLanguage.code === 'es' ? '¿Cuál es tu papel en la familia?' : 
                 currentLanguage.code === 'it' ? 'Qual è il tuo ruolo nella famiglia?' : 
                 t('onboarding.personal.role.label') || 'What is your role in the family?'}
              </Text>
            </View>
            <View style={styles.roleGrid}>
              {roleOptions.map((option) => (
                <AnimatedPressable
                  key={option.id}
                  style={[
                    styles.roleOption,
                    role === option.id && styles.selectedRole,
                    getRoleButtonAnimatedStyle(option.id)
                  ]}
                  onPress={() => {
                    console.log('DEBUG: Role button pressed, option.id:', option.id);
                    console.log('DEBUG: Previous role state:', `"${role}"`);
                    setRole(option.id);
                    console.log('DEBUG: setRole called with:', option.id);
                    // Force update ref immediately
                    stateRef.current.role = option.id;
                    console.log('DEBUG: Updated stateRef.current.role to:', option.id);
                  }}
                  onPressIn={() => handleRolePressIn(option.id)}
                  onPressOut={() => handleRolePressOut(option.id)}
                >
                  <Text style={[
                    styles.roleLabel,
                    role === option.id && styles.selectedRoleLabel
                  ]}>
                    {option.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </Animated.View>

          {/* Interests Selection */}
          <View style={styles.inputSection}>
            <View style={styles.sectionHeader}>
              <Heart size={20} color="#17f196" strokeWidth={2} />
              <Text style={styles.sectionTitle}>
                {currentLanguage.code === 'en' ? 'What are your interests?' : 
                 currentLanguage.code === 'de' ? 'Was sind deine Interessen?' : 
                 currentLanguage.code === 'nl' ? 'Wat zijn je interesses?' : 
                 currentLanguage.code === 'fr' ? 'Quels sont vos centres d\'intérêt?' : 
                 currentLanguage.code === 'es' ? '¿Cuáles son tus intereses?' : 
                 currentLanguage.code === 'it' ? 'Quali sono i tuoi interessi?' : 
                 t('onboarding.personal.interests.label') || 'What are your interests?'}
              </Text>
            </View>
            <View style={styles.interestGrid}>
              {interestOptions.map((interest) => (
                <AnimatedPressable
                  key={interest.id}
                  style={[
                    styles.interestChip,
                    interests.includes(interest.id) && styles.selectedInterest,
                    getInterestButtonAnimatedStyle(interest.id)
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                  onPressIn={() => handleInterestPressIn(interest.id)}
                  onPressOut={() => handleInterestPressOut(interest.id)}
                  disabled={interests.length >= 5 && !interests.includes(interest.id)}
                >
                  <Text style={[
                    styles.interestText,
                    interests.includes(interest.id) && styles.selectedInterestText
                  ]}>
                    {interest.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Date Picker Modal */}
      <DatePickerModal 
        key={`date-picker-${currentLanguage.code}`}
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelection}
      />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <AnimatedPressable
            style={[styles.nextButton, buttonAnimatedStyle]}
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.nextButtonText}>
              {currentLanguage.code === 'en' ? 'Next' : 
               currentLanguage.code === 'de' ? 'Weiter' : 
               currentLanguage.code === 'nl' ? 'Volgende' : 
               currentLanguage.code === 'fr' ? 'Suivant' : 
               currentLanguage.code === 'es' ? 'Siguiente' : 
               currentLanguage.code === 'it' ? 'Avanti' : 
               t('common.next') || 'Next'}
            </Text>
          </AnimatedPressable>
          
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>
              {currentLanguage.code === 'en' ? 'Back' : 
               currentLanguage.code === 'de' ? 'Zurück' : 
               currentLanguage.code === 'nl' ? 'Terug' : 
               currentLanguage.code === 'fr' ? 'Retour' : 
               currentLanguage.code === 'es' ? 'Atrás' : 
               currentLanguage.code === 'it' ? 'Indietro' : 
               t('common.back') || 'Back'}
            </Text>
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
    backgroundColor: '#102118',
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
    marginTop: -30,
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
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
    fontFamily: 'Montserrat-Medium',
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
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#404040',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '450',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Input Sections
  inputSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
    color: '#202020',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  inputDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Inter',
    fontWeight: '500',
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
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EfEfEf',
    elevation: 1,
  },
  selectedRole: {
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
  },
  selectedRoleLabel: {
    color: '#404040',
    fontWeight: '750',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Interests
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    width: '23%',
    alignItems: 'center',
  },
  selectedInterest: {
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  interestText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
  },
  selectedInterestText: {
    color: '#404040',
    fontWeight: '700',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    justifyContent: 'flex-end',
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
    marginBottom: 0,
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

  // New Button Styles
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  nextButton: {
    width: '100%',
    height: 56,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  backButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});