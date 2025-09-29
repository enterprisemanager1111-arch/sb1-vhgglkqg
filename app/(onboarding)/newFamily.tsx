import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import { Users, UserPlus, Search } from 'lucide-react-native';

export default function NewFamily() {
  const [selectedOption, setSelectedOption] = useState<'create' | 'join'>('create');

  const handleNext = () => {
    if (selectedOption === 'create') {
      router.push('/(onboarding)/newFamily/workProfileEmpty');
    } else {
      router.push('/(onboarding)/newFamily/joinFamily');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)');
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

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.whitePanel}>
        <View style={styles.contentCard}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Start with a Family</Text>
            <Text style={styles.description}>
              Let's talk about a family, so you can adapt individually.
            </Text>
          </View>

          {/* Question Section */}
          <View style={styles.questionSection}>
            <View style={styles.questionIcon}>
              <Users size={24} color="#17f196" />
            </View>
            <Text style={styles.questionText}>How would you like to start?</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Create New Family Option */}
            <Pressable
              style={[
                styles.optionCard,
                selectedOption === 'create' && styles.optionCardSelected
              ]}
              onPress={() => setSelectedOption('create')}
            >
              <View style={styles.optionIcon}>
                <UserPlus size={24} color={selectedOption === 'create' ? '#17f196' : '#666666'} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedOption === 'create' && styles.optionTitleSelected
                ]}>
                  Create a new family
                </Text>
                <Text style={styles.optionSubtitle}>
                  Make a brand new Family
                </Text>
              </View>
            </Pressable>

            {/* Join Existing Family Option */}
            <Pressable
              style={[
                styles.optionCard,
                selectedOption === 'join' && styles.optionCardSelected
              ]}
              onPress={() => setSelectedOption('join')}
            >
              <View style={styles.optionIcon}>
                <Search size={24} color={selectedOption === 'join' ? '#17f196' : '#666666'} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedOption === 'join' && styles.optionTitleSelected
                ]}>
                  Join an existing family
                </Text>
                <Text style={styles.optionSubtitle}>
                  Visit an existing family
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
          
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
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
  upperSection: {
    height: 450,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  whitePanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 40,
    marginTop: -80,
  },
  contentCard: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d2d2d',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Helvetica',
  },
  description: {
    fontSize: 13,
    color: '#98a2b3',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Helvetica',
  },
  questionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 30,
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9fff6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    fontFamily: 'Helvetica',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
    paddingHorizontal: 35,
    // maxWidth: 326,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12.5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#59f6b5',
    borderWidth: 1,
    shadowColor: '#41ffb0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
    fontFamily: 'Helvetica',
  },
  optionTitleSelected: {
    // color: '#17f196',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#98a2b3',
    fontWeight: '300',
    fontStyle: 'light',
    fontFamily: 'Helvetica',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
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
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
});
