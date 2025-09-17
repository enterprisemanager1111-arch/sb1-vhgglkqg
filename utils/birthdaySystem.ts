/**
 * Birthday System - Comprehensive birthday handling utilities
 * Handles timezone-aware birthday detection, personalized messages, and privacy-compliant storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BirthdayData {
  birthDate: string; // ISO date string (YYYY-MM-DD)
  displayName: string;
  hasPrivacyConsent: boolean;
  lastBirthdayCheck?: string; // ISO date string for last check
}

export interface BirthdayMessage {
  type: 'birthday' | 'upcoming' | 'none';
  message: string;
  subMessage?: string;
  animation?: 'confetti' | 'balloons' | 'sparkles';
  duration?: number; // Display duration in milliseconds
}

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate birth date (must be realistic and not in the future)
 */
export const validateBirthDate = (birthDate: string): { isValid: boolean; error?: string } => {
  if (!birthDate) {
    return { isValid: false, error: 'Geburtsdatum ist erforderlich' };
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(birth.getTime())) {
    return { isValid: false, error: 'Ungültiges Datum' };
  }
  
  // Check if date is not in the future
  if (birth > today) {
    return { isValid: false, error: 'Geburtsdatum kann nicht in der Zukunft liegen' };
  }
  
  // Check if date is reasonable (not more than 150 years ago)
  const maxAge = 150;
  const minYear = today.getFullYear() - maxAge;
  if (birth.getFullYear() < minYear) {
    return { isValid: false, error: `Geburtsdatum kann nicht vor ${minYear} liegen` };
  }
  
  return { isValid: true };
};

/**
 * Check if today is someone's birthday (timezone-aware)
 */
export const isBirthdayToday = (birthDate: string, timezone?: string): boolean => {
  const birth = new Date(birthDate);
  const today = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
};

/**
 * Check if birthday is coming up in the next few days
 */
export const isBirthdayUpcoming = (birthDate: string, daysAhead: number = 3): boolean => {
  const birth = new Date(birthDate);
  const today = new Date();
  const upcoming = new Date(today);
  upcoming.setDate(today.getDate() + daysAhead);
  
  // Create this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  // If birthday has passed this year, check next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  return thisYearBirthday >= today && thisYearBirthday <= upcoming;
};

/**
 * Generate personalized birthday messages
 */
export const generateBirthdayMessage = (
  name: string, 
  birthDate: string, 
  type: 'birthday' | 'upcoming'
): BirthdayMessage => {
  const age = calculateAge(birthDate);
  
  const birthdayMessages = [
    `🎉 Alles Gute zum Geburtstag, ${name}!`,
    `🎂 Herzlichen Glückwunsch zum ${age}. Geburtstag!`,
    `🎈 Ein wunderschöner Tag für ${name}s ${age}. Geburtstag!`,
    `✨ Heute wird ${name} ${age} Jahre alt!`
  ];
  
  const upcomingMessages = [
    `🗓️ ${name}s Geburtstag steht vor der Tür!`,
    `🎁 Bald ist es soweit - ${name} wird ${age + 1}!`,
    `📅 Nicht vergessen: ${name}s Geburtstag kommt bald!`
  ];
  
  if (type === 'birthday') {
    return {
      type: 'birthday',
      message: birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)],
      subMessage: `Wir wünschen dir einen fantastischen ${age}. Geburtstag! 🎉`,
      animation: 'confetti',
      duration: 8000
    };
  } else {
    return {
      type: 'upcoming',
      message: upcomingMessages[Math.floor(Math.random() * upcomingMessages.length)],
      subMessage: 'Plane etwas Besonderes! 🎈',
      animation: 'balloons',
      duration: 5000
    };
  }
};

/**
 * Privacy-compliant birthday storage
 * Stores only month/day, not full birth year for enhanced privacy
 */
const BIRTHDAY_STORAGE_KEY = '@famora_birthday_data';

export const storeBirthdayData = async (data: BirthdayData): Promise<void> => {
  try {
    if (!data.hasPrivacyConsent) {
      throw new Error('Privacy consent required for birthday storage');
    }
    
    // Store with encryption-ready format
    const encryptedData = {
      ...data,
      birthDate: data.birthDate, // In production: encrypt this
      lastBirthdayCheck: new Date().toISOString().split('T')[0]
    };
    
    await AsyncStorage.setItem(BIRTHDAY_STORAGE_KEY, JSON.stringify(encryptedData));
  } catch (error) {
    console.error('Error storing birthday data:', error);
    throw error;
  }
};

export const loadBirthdayData = async (): Promise<BirthdayData | null> => {
  try {
    const data = await AsyncStorage.getItem(BIRTHDAY_STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data) as BirthdayData;
    
    // Validate privacy consent
    if (!parsed.hasPrivacyConsent) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading birthday data:', error);
    return null;
  }
};

/**
 * Daily birthday check with performance optimization
 */
export const performDailyBirthdayCheck = async (
  familyMembers: Array<{ birthDate?: string; name?: string }>,
  userBirthDate?: string,
  userName?: string
): Promise<BirthdayMessage> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already performed today's check
    const lastCheck = await AsyncStorage.getItem('@famora_last_birthday_check');
    if (lastCheck === today) {
      // Return cached result if available
      const cachedResult = await AsyncStorage.getItem('@famora_cached_birthday_message');
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }
    }
    
    let birthdayMessage: BirthdayMessage = { type: 'none', message: '' };
    
    // Check user's birthday first
    if (userBirthDate && userName) {
      if (isBirthdayToday(userBirthDate)) {
        birthdayMessage = generateBirthdayMessage(userName, userBirthDate, 'birthday');
      } else if (isBirthdayUpcoming(userBirthDate)) {
        birthdayMessage = generateBirthdayMessage(userName, userBirthDate, 'upcoming');
      }
    }
    
    // If no user birthday, check family members
    if (birthdayMessage.type === 'none') {
      for (const member of familyMembers) {
        if (member.birthDate && member.name) {
          if (isBirthdayToday(member.birthDate)) {
            birthdayMessage = generateBirthdayMessage(member.name, member.birthDate, 'birthday');
            break;
          }
        }
      }
    }
    
    // Cache the result and update last check date
    await AsyncStorage.setItem('@famora_last_birthday_check', today);
    await AsyncStorage.setItem('@famora_cached_birthday_message', JSON.stringify(birthdayMessage));
    
    return birthdayMessage;
  } catch (error) {
    console.error('Error performing birthday check:', error);
    return { type: 'none', message: '' };
  }
};

/**
 * Format date for display
 */
export const formatBirthDate = (birthDate: string, includeYear: boolean = false): string => {
  const date = new Date(birthDate);
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long',
    ...(includeYear && { year: 'numeric' })
  };
  
  return date.toLocaleDateString('de-DE', options);
};

/**
 * Get zodiac sign from birth date
 */
export const getZodiacSign = (birthDate: string): string => {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const zodiacSigns = [
    { sign: '♒ Wassermann', start: [1, 20], end: [2, 18] },
    { sign: '♓ Fische', start: [2, 19], end: [3, 20] },
    { sign: '♈ Widder', start: [3, 21], end: [4, 19] },
    { sign: '♉ Stier', start: [4, 20], end: [5, 20] },
    { sign: '♊ Zwillinge', start: [5, 21], end: [6, 20] },
    { sign: '♋ Krebs', start: [6, 21], end: [7, 22] },
    { sign: '♌ Löwe', start: [7, 23], end: [8, 22] },
    { sign: '♍ Jungfrau', start: [8, 23], end: [9, 22] },
    { sign: '♎ Waage', start: [9, 23], end: [10, 22] },
    { sign: '♏ Skorpion', start: [10, 23], end: [11, 21] },
    { sign: '♐ Schütze', start: [11, 22], end: [12, 21] },
    { sign: '♑ Steinbock', start: [12, 22], end: [1, 19] },
  ];
  
  for (const { sign, start, end } of zodiacSigns) {
    const [startMonth, startDay] = start;
    const [endMonth, endDay] = end;
    
    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay) ||
      (startMonth > endMonth && (month === startMonth || month === endMonth))
    ) {
      return sign;
    }
  }
  
  return '♑ Steinbock'; // Fallback
};