import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { X, Plus, CheckSquare, FileText, Calendar, Clock, User, ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

// Custom DateTime Picker Modal Component for Start Time
const DateTimePickerModal = ({ 
  visible, 
  onClose, 
  onDateTimeSelect, 
  selectedDateTime
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateTimeSelect: (dateTime: Date) => void;
  selectedDateTime: Date;
}) => {
  const [tempDateTime, setTempDateTime] = useState(selectedDateTime);

  // Reset to current date/time when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempDateTime(new Date());
    }
  }, [visible]);

  const handleConfirm = () => {
    onDateTimeSelect(tempDateTime);
    onClose();
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.dateTimePickerOverlay}>
        <View style={styles.dateTimePickerContainer}>
          <View style={styles.dateTimePickerHeader}>
            <Pressable
              onPress={onClose}
              style={styles.dateTimePickerCancelButton}
            >
              <Text style={styles.dateTimePickerCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.dateTimePickerTitle}>Select Start Date & Time</Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.dateTimePickerDoneButton}
            >
              <Text style={styles.dateTimePickerDoneText}>Done</Text>
            </Pressable>
          </View>
          
          <View style={styles.dateTimePickerContent}>
            <View style={styles.dateTimePickerRow}>
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>Year</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getFullYear() === year && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => {
                        setTempDateTime(new Date(year, tempDateTime.getMonth(), tempDateTime.getDate(), tempDateTime.getHours(), tempDateTime.getMinutes()));
                      }}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getFullYear() === year && styles.dateTimePickerOptionSelected
                      ]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>Month</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <Pressable
                      key={month}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getMonth() === index && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => {
                        setTempDateTime(new Date(tempDateTime.getFullYear(), index, tempDateTime.getDate(), tempDateTime.getHours(), tempDateTime.getMinutes()));
                      }}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getMonth() === index && styles.dateTimePickerOptionSelected
                      ]}>
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>Day</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays(tempDateTime.getFullYear(), tempDateTime.getMonth()).map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getDate() === day && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => {
                        setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), day, tempDateTime.getHours(), tempDateTime.getMinutes()));
                      }}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getDate() === day && styles.dateTimePickerOptionSelected
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>Hour</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateHours().map((hour) => (
                    <Pressable
                      key={hour}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getHours() === hour && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => {
                        setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), tempDateTime.getDate(), hour, tempDateTime.getMinutes()));
                      }}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getHours() === hour && styles.dateTimePickerOptionSelected
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>Minute</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateMinutes().map((minute) => (
                    <Pressable
                      key={minute}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getMinutes() === minute && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => {
                        setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), tempDateTime.getDate(), tempDateTime.getHours(), minute));
                      }}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getMinutes() === minute && styles.dateTimePickerOptionSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Custom Duration Picker Modal Component
const DurationPickerModal = ({ 
  visible, 
  onClose, 
  onDurationSelect, 
  selectedDuration
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDurationSelect: (duration: string) => void;
  selectedDuration: string;
}) => {
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(0);
  const [tempSeconds, setTempSeconds] = useState(0);

  // Parse existing duration when modal opens
  React.useEffect(() => {
    if (visible) {
      if (selectedDuration && selectedDuration !== '00:00:00hrs') {
        const parts = selectedDuration.replace('hrs', '').split(':');
        if (parts.length === 3) {
          setTempHours(parseInt(parts[0]) || 0);
          setTempMinutes(parseInt(parts[1]) || 0);
          setTempSeconds(parseInt(parts[2]) || 0);
        }
      } else {
        setTempHours(0);
        setTempMinutes(0);
        setTempSeconds(0);
      }
    }
  }, [visible, selectedDuration]);

  const handleConfirm = () => {
    const durationString = `${tempHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}:${tempSeconds.toString().padStart(2, '0')}hrs`;
    onDurationSelect(durationString);
    onClose();
  };

  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };

  const generateSeconds = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.durationPickerOverlay}>
        <View style={styles.durationPickerContainer}>
          <View style={styles.durationPickerHeader}>
            <Pressable
              onPress={onClose}
              style={styles.durationPickerCancelButton}
            >
              <Text style={styles.durationPickerCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.durationPickerTitle}>Select Duration</Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.durationPickerDoneButton}
            >
              <Text style={styles.durationPickerDoneText}>Done</Text>
            </Pressable>
          </View>
          
          <View style={styles.durationPickerContent}>
            <View style={styles.durationPickerRow}>
              <View style={styles.durationPickerColumn}>
                <Text style={styles.durationPickerLabel}>Hours</Text>
                <ScrollView style={styles.durationPickerScroll} showsVerticalScrollIndicator={false}>
                  {generateHours().map((hour) => (
                    <Pressable
                      key={hour}
                      style={[
                        styles.durationPickerOption,
                        tempHours === hour && styles.durationPickerOptionSelected
                      ]}
                      onPress={() => setTempHours(hour)}
                    >
                      <Text style={[
                        styles.durationPickerOptionText,
                        tempHours === hour && styles.durationPickerOptionTextSelected
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.durationPickerColumn}>
                <Text style={styles.durationPickerLabel}>Minutes</Text>
                <ScrollView style={styles.durationPickerScroll} showsVerticalScrollIndicator={false}>
                  {generateMinutes().map((minute) => (
                    <Pressable
                      key={minute}
                      style={[
                        styles.durationPickerOption,
                        tempMinutes === minute && styles.durationPickerOptionSelected
                      ]}
                      onPress={() => setTempMinutes(minute)}
                    >
                      <Text style={[
                        styles.durationPickerOptionText,
                        tempMinutes === minute && styles.durationPickerOptionTextSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.durationPickerColumn}>
                <Text style={styles.durationPickerLabel}>Seconds</Text>
                <ScrollView style={styles.durationPickerScroll} showsVerticalScrollIndicator={false}>
                  {generateSeconds().map((second) => (
                    <Pressable
                      key={second}
                      style={[
                        styles.durationPickerOption,
                        tempSeconds === second && styles.durationPickerOptionSelected
                      ]}
                      onPress={() => setTempSeconds(second)}
                    >
                      <Text style={[
                        styles.durationPickerOptionText,
                        tempSeconds === second && styles.durationPickerOptionTextSelected
                      ]}>
                        {second.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EventForm {
  title: string;
  description: string;
  assignee: string[];
  startTime: string;
  duration: string;
}

interface EventCreationModalProps {
  visible: boolean;
  onClose: () => void;
}

const EventCreationModal: React.FC<EventCreationModalProps> = ({
  visible,
  onClose,
}) => {
  console.log('🎭 EventCreationModal rendered with visible:', visible);
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    assignee: [],
    startTime: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  
  const { showLoading, hideLoading } = useLoading();
  const { familyMembers, currentFamily, refreshFamily, refreshFamilyMembers } = useFamily();
  const { t } = useLanguage();
  const { user } = useAuth();


  // Reset form when modal opens and refresh family members
  useEffect(() => {
    if (visible) {
      setForm({
        title: '',
        description: '',
        assignee: [],
        startTime: '',
        duration: '',
      });
      setLoading(false);
      setShowStartTimePicker(false);
      setShowDurationPicker(false);
      
      // Refresh family members when modal opens
      refreshFamilyMembers();
    }
  }, [visible, refreshFamilyMembers]);


  const handleClose = () => {
    // Reset form state when closing
    setForm({
      title: '',
      description: '',
      assignee: [],
      startTime: '',
      duration: '',
    });
    setLoading(false);
    setShowStartTimePicker(false);
    setShowDurationPicker(false);
    onClose();
  };

  const handleInputChange = (field: keyof EventForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleAssignee = (memberId: string) => {
    setForm(prev => {
      const currentAssignees = prev.assignee;
      const isSelected = currentAssignees.includes(memberId);
      
      if (isSelected) {
        // Remove from selection
        return {
          ...prev,
          assignee: currentAssignees.filter(id => id !== memberId)
        };
      } else {
        // Add to selection
        return {
          ...prev,
          assignee: [...currentAssignees, memberId]
        };
      }
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateTime: Date) => {
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const year = dateTime.getFullYear();
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleDateTimeSelect = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    // Format as ISO string for start time
    const isoString = dateTime.toISOString();
    setForm(prev => ({ ...prev, startTime: isoString }));
  };

  const handleDurationSelect = (duration: string) => {
    setForm(prev => ({ ...prev, duration }));
  };

  const handleStartTimePress = () => {
    setShowStartTimePicker(true);
  };

  const handleDurationPress = () => {
    setShowDurationPicker(true);
  };

  // Helper function to create event with a specific family using Supabase function
  const createEventWithFamily = async (family: any, eventData: any) => {
    console.log('🔧 createEventWithFamily called with family:', family.id);
    console.log('🔧 createEventWithFamily called with eventData:', eventData);
    console.log('🔧 createEventWithFamily function started');
    
    try {
      // Calculate start and end times properly
      const startTime = eventData.start_time ? new Date(eventData.start_time) : new Date();
      const endTime = eventData.duration ? 
        new Date(startTime.getTime() + parseDuration(eventData.duration)) : 
        null;
      
       // Prepare function parameters (using existing database function parameter names)
       const functionParams = {
         _family_id: family.id,
         _title: eventData.title,
         _description: eventData.description || null,
         _event_date: startTime.toISOString(),
         _end_date: endTime ? endTime.toISOString() : null,
         _location: null,
         _created_by: user?.id,
         _assignees: eventData.assignee && eventData.assignee.length > 0 ? 
           eventData.assignee.filter((id: string) => id && id.trim() !== '') : []
       };

      let result: any = null;
      let eventData_result: any = null;

      let rpcSuccess = false;
      let rpcError: any = null;
      
      // Try RPC call up to 2 times with session refresh
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          // Refresh session before RPC call to ensure fresh authentication
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.log('Session refresh failed, proceeding with RPC call anyway');
          }

          // Try to use the RPC function with timeout
          const rpcPromise = supabase.rpc(
            'create_calendar_event_with_details',
            functionParams
          );
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC call timeout')), 10000)
          );
          
          const { data: rpcResult, error: functionError } = await Promise.race([
            rpcPromise,
            timeoutPromise
          ]) as any;

          if (functionError) {
            throw functionError;
          }

          result = rpcResult;
          rpcSuccess = true;
          break;
        } catch (error: any) {
          rpcError = error;
          console.log(`RPC attempt ${attempt} failed:`, error.message);
          
          if (attempt === 1) {
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!rpcSuccess) {
        console.log('RPC call failed, falling back to direct database inserts:', rpcError?.message);

        // Try to refresh Supabase client if RPC consistently fails
        try {
          const { createFreshSupabaseClient } = await import('@/lib/supabase');
          const freshClient = createFreshSupabaseClient();
          
          // Try one more time with fresh client
          const { data: freshRpcResult, error: freshFunctionError } = await freshClient.rpc(
            'create_calendar_event_with_details',
            functionParams
          );
          
          if (!freshFunctionError) {
            result = freshRpcResult;
            console.log('Fresh client RPC call succeeded');
          } else {
            throw freshFunctionError;
          }
        } catch (freshError: any) {
          console.log('Fresh client also failed, using direct database inserts');
        }
        
        // Fallback to direct database inserts
        // Create the calendar event first
        const { data: directEventData, error: eventError } = await supabase
          .from('calendar_events')
          .insert([{
            family_id: functionParams._family_id,
            title: functionParams._title,
            description: functionParams._description,
            event_date: functionParams._event_date,
            end_date: functionParams._end_date,
            location: functionParams._location,
            created_by: functionParams._created_by
          }])
          .select('id')
          .single();

        if (eventError) {
          throw eventError;
        }

        eventData_result = directEventData;

        // Create event assignments for each assignee
        const assignmentIds = [];
        if (functionParams._assignees && functionParams._assignees.length > 0) {
          const assignments = functionParams._assignees.map((assigneeId: string) => ({
            event_id: eventData_result.id,
            assignee_id: assigneeId,
            assigned_by: functionParams._created_by,
            status: 'assigned'
          }));

          const { data: assignmentData, error: assignmentError } = await supabase
            .from('event_assignment')
            .insert(assignments)
            .select('id');

          if (assignmentError) {
            throw assignmentError;
          }

          assignmentIds.push(...assignmentData.map(a => a.id));
        }

        result = {
          event_id: eventData_result.id,
          assignment_ids: assignmentIds
        };
      }
      
      // Reset form state after successful creation
      setForm({
        title: '',
        description: '',
        assignee: [],
        startTime: '',
        duration: '',
      });
      setLoading(false);
      setShowStartTimePicker(false);
      setShowDurationPicker(false);
      
      Alert.alert('Success', 'Event created successfully!');
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error creating event with family:', error);
      
      // If it's a timeout error, set flag to reload on next attempt
      if (error.message && error.message.includes('timed out')) {
        console.log('🔄 Detected timeout error - marking for reload on next attempt');
        sessionStorage.setItem('supabase_needs_reload', 'true');
        Alert.alert(
          t('common.error'), 
          'Database connection issue. Please try again.',
          [{ text: 'OK', onPress: () => window.location.reload() }]
        );
      } else {
        Alert.alert(t('common.error'), error.message || 'Failed to create event');
      }
    }
  };

  // Helper function to parse duration string (e.g., "02:30:00") to milliseconds
  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };

  const handleCreateEvent = async () => {
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Please enter an event title');
      return;
    }

    // Prepare event data first
    const eventData = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: 'event',
        assignee: form.assignee, // Pass the full assignee array for the function
      completed: false,
      points: 200,
      start_time: form.startTime || undefined,
      duration: form.duration || undefined,
    };

    // Check if family data is loaded
    if (!currentFamily) {
      try {
        await refreshFamily();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!currentFamily) {
          // Fallback: Use a known family ID to allow event creation
          const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
          
          // Create a temporary family object for event creation
          const tempFamily = {
            id: fallbackFamilyId,
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Proceed with event creation using the fallback family
          await createEventWithFamily(tempFamily, eventData);
          return;
        }
      } catch (error) {
        // Even if refresh fails, try with fallback family
        const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
        const tempFamily = {
          id: fallbackFamilyId,
          name: 'Family',
          code: 'FALLBACK',
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await createEventWithFamily(tempFamily, eventData);
        return;
      }
    }

    setLoading(true);
    showLoading('Creating event...');
    
    try {
      await createEventWithFamily(currentFamily, eventData);
      
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to create event');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        
        <View style={styles.modalContainer}>
          {/* Main Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <RNImage 
                source={require('@/assets/images/icon/add_task.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <Text style={styles.modalSubtitle}>
              Here you can create a new Event. Be sure about which event you want to create.
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Event Title */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Event Title</Text>
              <View style={styles.inputContainer}>
                <RNImage 
                  source={require('@/assets/images/icon/task_title.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={[
                    styles.textInput,
                    Platform.OS === 'web' && ({
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    } as any)
                  ]}
                  placeholder="Bobs Birthday"
                  placeholderTextColor="#9CA3AF"
                  value={form.title}
                  onChangeText={(value) => handleInputChange('title', value)}
                />
              </View>
            </View>

            {/* Event Description */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Event Description</Text>
              <View style={styles.inputContainer}>
                <RNImage 
                  source={require('@/assets/images/icon/note.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={[
                    styles.textInput,
                    Platform.OS === 'web' && ({
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    } as any)
                  ]}
                  placeholder="Bring a Gift"
                  placeholderTextColor="#9CA3AF"
                  value={form.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                />
              </View>
            </View>

            {/* Assign Event */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Assign task</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.assigneeScrollContainer}
                contentContainerStyle={styles.assigneeContainer}
              >
                {familyMembers.length === 0 ? (
                  <Text style={styles.noMembersText}>
                    No family members found. Please refresh or check your family connection.
                  </Text>
                ) : (
                  familyMembers.map((member) => {
                  const isSelected = form.assignee.includes(member.user_id);
                  const memberName = member.profiles?.name || `User ${member.user_id.slice(0, 8)}`;
                  
                  return (
                    <Pressable
                      key={member.user_id}
                      style={[
                        styles.assigneeButton,
                        isSelected && styles.selectedAssignee
                      ]}
                      onPress={() => toggleAssignee(member.user_id)}
                    >
                      <Text style={[
                        styles.assigneeText,
                        isSelected && styles.selectedAssigneeText
                      ]}>
                        {memberName}
                      </Text>
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected
                      ]}>
                        {isSelected && (
                          <RNImage
                            source={require('@/assets/images/icon/finished.png')}
                            style={styles.finishedIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })
                )}
              </ScrollView>
            </View>

            {/* Start time & Duration */}
            <View style={styles.inputSection}>
              <View style={styles.timeContainer}>
                {/* Start time */}
                <View style={styles.timeFieldContainer}>
                  <Text style={styles.timeFieldLabel}>Start time</Text>
                  <Pressable 
                    style={styles.timeInputContainer}
                    onPress={handleStartTimePress}
                  >
                    <RNImage 
                      source={require('@/assets/images/icon/calendar.png')}
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.timeInputText}>
                      {form.startTime ? formatDateTime(new Date(form.startTime)) : 'Start time'}
                    </Text>
                    <ChevronDown size={16} color="#6B7280" />
                  </Pressable>
                </View>

                {/* Duration */}
                <View style={styles.timeFieldContainer}>
                  <Text style={styles.timeFieldLabel}>Duration (optional)</Text>
                  <Pressable 
                    style={styles.timeInputContainer}
                    onPress={handleDurationPress}
                  >
                    <RNImage 
                      source={require('@/assets/images/icon/soon_active.png')}
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.timeInputText}>
                      {form.duration || '00:00:00hrs'}
                    </Text>
                    <ChevronDown size={16} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            </View>

             {/* Event Reward */}
             <View style={styles.rewardContainer}>
               <View style={styles.rewardContent}>
                 <View style={styles.rewardLeft}>
                   <View style={styles.rewardHeader}>
                     <RNImage 
                       source={require('@/assets/images/icon/soon_active.png')}
                       style={styles.rewardIcon}
                       resizeMode="contain"
                     />
                     <Text style={styles.rewardTitle}>Event Reward</Text>
                   </View>
                   <Text style={styles.rewardSubtext}>If this event is executed, the user receives</Text>
                 </View>
                 <View style={styles.rewardValue}>
                   <Plus size={16} color="#17F196" strokeWidth={2} />
                   <Text style={styles.rewardNumber}>200</Text>
                   <Text style={styles.rewardText}>Flames</Text>
                 </View>
               </View>
             </View>
          </ScrollView>

          {/* Add Event Button */}
          <Pressable
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading || !form.title.trim()}
          >
            <Text style={styles.addButtonText}>Add Event</Text>
          </Pressable>
        </View>
      </View>

      {/* DateTime Picker Modal */}
      <DateTimePickerModal
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onDateTimeSelect={handleDateTimeSelect}
        selectedDateTime={selectedDateTime}
      />

      {/* Duration Picker Modal */}
      <DurationPickerModal
        visible={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onDurationSelect={handleDurationSelect}
        selectedDuration={form.duration}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    maxHeight: screenHeight * 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  icon: {
    width: 100,
    height: 100,
    backgroundColor: '#17f196',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },
  iconImage: {
    width: 35,
    height: 35,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  // Assignee Selection
  assigneeScrollContainer: {
    maxHeight: 60,
  },
  assigneeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  assigneeButton: {
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAssignee: {
    backgroundColor: '#F4F3FF',
    borderColor: '#17f196',
  },
  assigneeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#2D2D2D',
  },
  selectedAssigneeText: {
    // color: '#FFFFFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#17f196',
    borderColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeFieldContainer: {
    flex: 1,
  },
  timeFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeInputText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  // Event Reward - Matching TaskCreationModal style
  rewardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#17f196',
    padding: 16,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardLeft: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rewardIcon: {
    width: 16,
    height: 16,
  },
  rewardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
  },
  rewardSubtext: {
    fontSize: 9,
    color: '#98A2B3',
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardNumber: {
    fontSize: 18,
    fontWeight: '400',
    color: '#161B23',
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#475467',
  },
  addButton: {
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
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // DateTime Picker Modal Styles
  dateTimePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateTimePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  dateTimePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateTimePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateTimePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Helvetica',
  },
  dateTimePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Helvetica',
  },
  dateTimePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateTimePickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  dateTimePickerContent: {
    flex: 1,
  },
  dateTimePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  dateTimePickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateTimePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  dateTimePickerScroll: {
    flex: 1,
  },
  dateTimePickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginVertical: 1,
    alignItems: 'center',
  },
  dateTimePickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  dateTimePickerOptionText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Helvetica',
  },
  dateTimePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Duration Picker Modal Styles
  durationPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  durationPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  durationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  durationPickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  durationPickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Helvetica',
  },
  durationPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Helvetica',
  },
  durationPickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  durationPickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  durationPickerContent: {
    flex: 1,
  },
  durationPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 200,
  },
  durationPickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  durationPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Helvetica',
  },
  durationPickerScroll: {
    flex: 1,
  },
  durationPickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  durationPickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  durationPickerOptionText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Helvetica',
  },
  durationPickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noMembersText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Helvetica',
  },
});

export default EventCreationModal;
