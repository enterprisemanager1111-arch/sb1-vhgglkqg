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
  Image as RNImage,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { User, Calendar, Briefcase, Upload, ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomAlert } from '@/contexts/CustomAlertContext';

export default function EditProfile() {
  const { profile, updateProfile } = useAuth();
  const { showSuccess, showError } = useCustomAlert();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (profile) {
      // Split the name into first and last name
      const nameParts = profile.name ? profile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setDateOfBirth(profile.birth_date || '');
      setPosition(profile.role || '');
      
      // Set selectedDate if birth_date exists
      if (profile.birth_date) {
        setSelectedDate(new Date(profile.birth_date));
      }
    }
  }, [profile]);

  const handleDatePickerOpen = () => {
    setShowDatePicker(true);
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setDateOfBirth(formattedDate);
    }
    // Only close modal for native date picker (mobile), not for web
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('Validation Error', 'Please fill in both first name and last name.');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile({
        name: fullName,
        birth_date: dateOfBirth || undefined,
        role: position || undefined,
      });
      
      showSuccess('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#17f196" />
        </Pressable>
        <Text style={styles.headerTitle}>My Work Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Personal Data Information</Text>
          <Text style={styles.sectionSubtitle}>Your personal data information</Text>

          {/* Profile Photo Upload Section */}
          <View style={styles.photoUploadSection}>
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoIcon}>
                <User size={40} color="#17f196" />
              </View>
              <Pressable style={styles.uploadButton}>
                <Upload size={16} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={styles.uploadLabel}>Upload Photo</Text>
            <Text style={styles.uploadGuidelines}>
              Format should be in .jpeg .png atleast 800×800px and less than 5MB
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputFieldsContainer}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#17f196" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#CCCCCC"
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#17f196" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#CCCCCC"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <Pressable style={styles.inputContainer} onPress={handleDatePickerOpen}>
                <Calendar size={20} color="#17f196" style={styles.inputIcon} />
                <Text style={[styles.textInput, !dateOfBirth && styles.placeholderText]}>
                  {dateOfBirth || 'Date of Birth'}
                </Text>
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </Pressable>
            </View>

            {/* Position */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Position</Text>
              <View style={styles.inputContainer}>
                <Briefcase size={20} color="#17f196" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Select Position"
                  placeholderTextColor="#CCCCCC"
                />
                <ChevronDown size={20} color="#17f196" style={styles.inputChevron} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Profile Button */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={styles.updateButtonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Text>
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDatePickerClose}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Pressable onPress={handleDatePickerClose} style={styles.datePickerCancelButton}>
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <Pressable onPress={handleDatePickerClose} style={styles.datePickerDoneButton}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerContent}>
              {Platform.OS === 'web' ? (
                <View style={styles.webDatePicker}>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Year</Text>
                      <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 125 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <Pressable
                            key={year}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getFullYear() === year && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setFullYear(year);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getFullYear() === year && styles.datePickerOptionTextSelected
                            ]}>
                              {year}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Month</Text>
                      <ScrollView style={styles.monthScrollView} showsVerticalScrollIndicator={true}>
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <Pressable
                            key={month}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getMonth() === index && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(index);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getMonth() === index && styles.datePickerOptionTextSelected
                            ]}>
                              {month}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.datePickerColumn}>
                      <Text style={styles.datePickerLabel}>Day</Text>
                      <ScrollView style={styles.dayScrollView} showsVerticalScrollIndicator={true}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <Pressable
                            key={day}
                            style={[
                              styles.datePickerOption,
                              selectedDate.getDate() === day && styles.datePickerOptionSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(day);
                              handleDateChange(null, newDate);
                            }}
                          >
                            <Text style={[
                              styles.datePickerOptionText,
                              selectedDate.getDate() === day && styles.datePickerOptionTextSelected
                            ]}>
                              {day}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.nativeDatePicker}>
                  <Text style={styles.datePickerNote}>
                    Native date picker would be implemented here for mobile platforms
                  </Text>
                  <Text style={styles.datePickerNote}>
                    Selected: {selectedDate.toDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  photoUploadSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  photoIcon: {
    opacity: 0.6,
  },
  uploadButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  uploadGuidelines: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputFieldsContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  placeholderText: {
    color: '#CCCCCC',
  },
  inputChevron: {
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  updateButton: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  // Date Picker Modal Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerCancelButton: {
    padding: 8,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerDoneButton: {
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerContent: {
    padding: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  webDatePicker: {
    width: '100%',
    height: 300,
  },
  datePickerRow: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'space-between',
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  yearScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  monthScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dayScrollView: {
    height: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  datePickerOptionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  datePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nativeDatePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  datePickerNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
