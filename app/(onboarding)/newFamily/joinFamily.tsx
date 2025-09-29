import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image as RNImage,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useNotifications } from '@/components/NotificationSystem';
import { validateFamilyCode } from '@/utils/sanitization';

export default function JoinFamily() {
  const { t } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  const { joinFamily } = useFamily();
  const { completeStep } = useOnboarding();
  const { awardPoints } = useFamilyPoints();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  
  const [familyCode, setFamilyCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  // Refs for family code inputs
  const familyCodeInputRefs = useRef<(TextInput | null)[]>([]);

  const handleFamilyCodeChange = (index: number, value: string) => {
    // Handle paste of full code (6 characters - letters and numbers)
    if (value.length === 6 && /^[A-Z0-9]{6}$/i.test(value)) {
      const newCode = value.toUpperCase().split('');
      setFamilyCode(newCode);
      console.log('🔍 Full family code pasted:', newCode.join(''));
      // Focus the last input after paste
      setTimeout(() => {
        familyCodeInputRefs.current[5]?.focus();
      }, 100);
      return;
    }
    
    // Handle single character input
    const newCode = [...familyCode];
    // Convert to uppercase and take only the last character
    const sanitizedValue = value.toUpperCase().slice(-1);
    newCode[index] = sanitizedValue;
    setFamilyCode(newCode);
    
    // Auto-focus next input if current input has a value
    if (sanitizedValue && index < 5) {
      setTimeout(() => {
        familyCodeInputRefs.current[index + 1]?.focus();
      }, 100);
    }
    
    // Debug logging
    console.log('🔍 Family code input change:', { index, value: sanitizedValue, newCode: newCode.join('') });
  };

  const handleFamilyCodeKeyPress = (index: number, key: string) => {
    // Handle backspace - focus previous input if current is empty
    if (key === 'Backspace' && !familyCode[index] && index > 0) {
      setTimeout(() => {
        familyCodeInputRefs.current[index - 1]?.focus();
      }, 100);
    }
  };

  const handleJoinFamily = async () => {
    const code = familyCode.join('');
    
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit family code');
      return;
    }

    const codeValidation = validateFamilyCode(code);
    
    if (!codeValidation.isValid) {
      Alert.alert('Error', codeValidation.error);
      return;
    }
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setLoading(true);
    showLoading(t('family.onboarding.joining') || 'Joining family...');
    
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
        t('family.onboarding.joinSuccess') || 'Success!',
        t('family.onboarding.joinSuccessMessage') || 'You have successfully joined the family!',
        [{ text: t('common.ok') || 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error') || 'Error', error.message || t('family.onboarding.joinError') || 'Failed to join family');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };


  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/newFamily');
    }
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

      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={handleBack}
      >
        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
      </Pressable>

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        {/* Teal Icon with Shield - Overlapping the white card */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Shield size={48} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>
        
        <View style={styles.contentCard}>
          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Join a Family</Text>
          </View>
          
          {/* Subtitle */}
          <View>
            <Text style={styles.subtitle}>
              If you want to join a family, you need a <Text style={styles.boldText}>Family code</Text>, which users can find in the family under the family panel.
            </Text>
          </View>

          {/* Family Code Input */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.familyCodeContainer}>
                {familyCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { familyCodeInputRefs.current[index] = ref; }}
                    style={styles.familyCodeInput}
                    value={digit}
                    onChangeText={(value) => handleFamilyCodeChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleFamilyCodeKeyPress(index, nativeEvent.key)}
                    keyboardType="default"
                    maxLength={6} // Allow paste of full code
                    textAlign="center"
                    placeholder="A"
                    placeholderTextColor="#CCCCCC"
                    selectTextOnFocus={true}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                  />
                ))}
              </View>
            </View>

            {/* Ask your Family Link */}
            <View style={styles.askFamilyContainer}>
              <Text style={styles.askFamilyText}>Haven't received the Family code? </Text>
              <Pressable onPress={() => Alert.alert('Ask Your Family', 'Please contact a family member to get the family code.')}>
                <Text style={styles.askFamilyLink}>Ask your Family.</Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <View>
              <Pressable
                style={[
                  styles.submitButton, 
                  loading && styles.submitButtonLoading
                ]}
                onPress={handleJoinFamily}
                disabled={loading}
              >
                <Text style={[
                  styles.submitButtonText,
                  loading && styles.submitButtonTextLoading
                ]}>
                  {loading ? 'Joining...' : 'Submit'}
                </Text>
              </Pressable>
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
    backgroundColor: '#102118',
    justifyContent: 'flex-end',
  },

  // Upper Section (40% of screen)
  upperSection: {
    flex: 1,
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
    zIndex: -1,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Icon Container
  iconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },

  // Lower Section (White Card)
  lowerSection: {
    height: '43%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  contentCard: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#161618',
  },

  // Form
  form: {
    flex: 1,
    gap: 16,
    paddingBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  familyCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  familyCodeInput: {
    width: 50,
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#fefefe',
    fontFamily: 'Helvetica',
  },
  askFamilyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  askFamilyText: {
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  askFamilyLink: {
    fontSize: 14,
    color: '#17f196',
    fontFamily: 'Helvetica',
    fontWeight: '500',
  },

  // Submit Button
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  submitButtonTextLoading: {
    opacity: 0.8,
  },
});
