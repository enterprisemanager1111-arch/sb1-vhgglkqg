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
import { ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
import { CurrentUserEvent } from '@/hooks/useCurrentUserEvents';
import { FadeInAnimation, SlideInAnimation, BounceInAnimation } from '@/components/CoolAnimations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import DateTimePickerModal and DurationPickerModal from EventCreationModal
// We'll need to copy these components or import them
// For now, let's include them inline (they're the same as EventCreationModal)

// DateTime Picker Modal Component
const DateTimePickerModal = ({ 
  visible, 
  onClose, 
  onDateTimeSelect, 
  selectedDateTime,
  t,
  theme,
  isDarkMode
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateTimeSelect: (dateTime: Date) => void;
  selectedDateTime: Date;
  t: any;
  theme: any;
  isDarkMode: boolean;
}) => {
  const [tempDateTime, setTempDateTime] = useState(selectedDateTime);
  
  const styles = createDateTimePickerStyles(theme, isDarkMode);

  useEffect(() => {
    if (visible) {
      setTempDateTime(selectedDateTime);
    }
  }, [visible, selectedDateTime]);

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
    t('eventCreationModal.months.january') || 'January',
    t('eventCreationModal.months.february') || 'February',
    t('eventCreationModal.months.march') || 'March',
    t('eventCreationModal.months.april') || 'April',
    t('eventCreationModal.months.may') || 'May',
    t('eventCreationModal.months.june') || 'June',
    t('eventCreationModal.months.july') || 'July',
    t('eventCreationModal.months.august') || 'August',
    t('eventCreationModal.months.september') || 'September',
    t('eventCreationModal.months.october') || 'October',
    t('eventCreationModal.months.november') || 'November',
    t('eventCreationModal.months.december') || 'December'
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
              <Text style={styles.dateTimePickerCancelText}>{t('common.cancel') || 'Cancel'}</Text>
            </Pressable>
            <Text style={styles.dateTimePickerTitle}>{t('eventCreationModal.dateTimePicker.selectDateTime') || 'Select Date & Time'}</Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.dateTimePickerDoneButton}
            >
              <Text style={styles.dateTimePickerDoneText}>{t('eventCreationModal.dateTimePicker.done') || 'Done'}</Text>
            </Pressable>
          </View>
          
          <View style={styles.dateTimePickerContent}>
            <View style={styles.dateTimePickerRow}>
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>{t('eventCreationModal.dateTimePicker.year') || 'Year'}</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getFullYear() === year && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => setTempDateTime(new Date(year, tempDateTime.getMonth(), tempDateTime.getDate(), tempDateTime.getHours(), tempDateTime.getMinutes()))}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getFullYear() === year && styles.dateTimePickerOptionTextSelected
                      ]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>{t('eventCreationModal.dateTimePicker.month') || 'Month'}</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <Pressable
                      key={month}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getMonth() === index && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => setTempDateTime(new Date(tempDateTime.getFullYear(), index, tempDateTime.getDate(), tempDateTime.getHours(), tempDateTime.getMinutes()))}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getMonth() === index && styles.dateTimePickerOptionTextSelected
                      ]}>
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>{t('eventCreationModal.dateTimePicker.day') || 'Day'}</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays(tempDateTime.getFullYear(), tempDateTime.getMonth()).map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getDate() === day && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), day, tempDateTime.getHours(), tempDateTime.getMinutes()))}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getDate() === day && styles.dateTimePickerOptionTextSelected
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>{t('eventCreationModal.dateTimePicker.hour') || 'Hour'}</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateHours().map((hour) => (
                    <Pressable
                      key={hour}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getHours() === hour && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), tempDateTime.getDate(), hour, tempDateTime.getMinutes()))}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getHours() === hour && styles.dateTimePickerOptionTextSelected
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.dateTimePickerColumn}>
                <Text style={styles.dateTimePickerLabel}>{t('eventCreationModal.dateTimePicker.minute') || 'Minute'}</Text>
                <ScrollView style={styles.dateTimePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateMinutes().map((minute) => (
                    <Pressable
                      key={minute}
                      style={[
                        styles.dateTimePickerOption,
                        tempDateTime.getMinutes() === minute && styles.dateTimePickerOptionSelected
                      ]}
                      onPress={() => setTempDateTime(new Date(tempDateTime.getFullYear(), tempDateTime.getMonth(), tempDateTime.getDate(), tempDateTime.getHours(), minute))}
                    >
                      <Text style={[
                        styles.dateTimePickerOptionText,
                        tempDateTime.getMinutes() === minute && styles.dateTimePickerOptionTextSelected
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

// Duration Picker Modal Component
const DurationPickerModal = ({ 
  visible, 
  onClose, 
  onDurationSelect, 
  selectedDuration,
  t,
  theme,
  isDarkMode
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDurationSelect: (duration: string) => void;
  selectedDuration: string;
  t: any;
  theme: any;
  isDarkMode: boolean;
}) => {
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(0);
  const [tempSeconds, setTempSeconds] = useState(0);
  
  const styles = createDurationPickerStyles(theme, isDarkMode);

  useEffect(() => {
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
              <Text style={styles.durationPickerCancelText}>{t('common.cancel') || 'Cancel'}</Text>
            </Pressable>
            <Text style={styles.durationPickerTitle}>{t('eventCreationModal.durationPicker.selectDuration') || 'Select Duration'}</Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.durationPickerDoneButton}
            >
              <Text style={styles.durationPickerDoneText}>{t('eventCreationModal.durationPicker.done') || 'Done'}</Text>
            </Pressable>
          </View>
          
          <View style={styles.durationPickerContent}>
            <View style={styles.durationPickerRow}>
              <View style={styles.durationPickerColumn}>
                <Text style={styles.durationPickerLabel}>{t('eventCreationModal.durationPicker.hours') || 'Hours'}</Text>
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
                <Text style={styles.durationPickerLabel}>{t('eventCreationModal.durationPicker.minutes') || 'Minutes'}</Text>
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
                <Text style={styles.durationPickerLabel}>{t('eventCreationModal.durationPicker.seconds') || 'Seconds'}</Text>
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

interface EventEditModalProps {
  visible: boolean;
  onClose: () => void;
  event: CurrentUserEvent | null;
  onEventUpdated?: () => void;
}

interface EventForm {
  title: string;
  description: string;
  assignee: string[];
  startTime: string;
  duration: string;
}

export default function EventEditModal({ visible, onClose, event, onEventUpdated }: EventEditModalProps) {
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
  const { familyMembers, currentFamily } = useFamily();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  const styles = createStyles(theme, isDarkMode);

  // Initialize form with event data when modal opens
  useEffect(() => {
    if (visible && event) {
      // Get assignees
      const assigneeIds = event.assignees ? event.assignees.map(a => a.user_id) : [];
      
      // Calculate duration from event_date and end_date
      let duration = '00:00:00hrs';
      if (event.event_date && event.end_date) {
        const start = new Date(event.event_date);
        const end = new Date(event.end_date);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}hrs`;
      }
      
      setForm({
        title: event.title || '',
        description: event.description || '',
        assignee: assigneeIds,
        startTime: event.event_date || '',
        duration: duration,
      });
      
      if (event.event_date) {
        setSelectedDateTime(new Date(event.event_date));
      }
      
      setShowStartTimePicker(false);
      setShowDurationPicker(false);
    }
  }, [visible, event]);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      hideLoading();
    }
  }, [visible, hideLoading]);

  const handleClose = () => {
    setLoading(false);
    hideLoading();
    onClose();
  };

  const updateForm = (field: keyof EventForm, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleAssignee = (memberId: string) => {
    setForm(prev => {
      const currentAssignees = prev.assignee;
      const isSelected = currentAssignees.includes(memberId);
      
      if (isSelected) {
        return {
          ...prev,
          assignee: currentAssignees.filter(id => id !== memberId)
        };
      } else {
        return {
          ...prev,
          assignee: [...currentAssignees, memberId]
        };
      }
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
    const isoString = dateTime.toISOString();
    setForm(prev => ({ ...prev, startTime: isoString }));
  };

  const handleDurationSelect = (duration: string) => {
    setForm(prev => ({ ...prev, duration }));
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };

  const handleUpdateEvent = async () => {
    if (!event || !currentFamily || !user) {
      Alert.alert(t('common.error') || 'Error', 'Missing required information');
      return;
    }

    if (!form.title.trim()) {
      Alert.alert(t('common.error') || 'Error', 'Event title is required');
      return;
    }

    setLoading(true);
    showLoading('Updating event...');

    try {
      // Calculate start and end times
      const startTime = form.startTime ? new Date(form.startTime) : new Date();
      const endTime = form.duration ? 
        new Date(startTime.getTime() + parseDuration(form.duration)) : 
        null;

      // Update the event
      const { data: updateData, error: updateError } = await supabase
        .from('calendar_events')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_date: startTime.toISOString(),
          end_date: endTime ? endTime.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .eq('family_id', currentFamily.id)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Event updated successfully:', updateData);

      // Update event assignments
      const { data: currentAssignments } = await supabase
        .from('event_assignment')
        .select('assignee_id')
        .eq('event_id', event.id);

      const currentAssigneeIds = currentAssignments?.map(a => a.assignee_id) || [];
      
      // Remove assignments that are no longer selected
      const toRemove = currentAssigneeIds.filter(id => !form.assignee.includes(id));
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('event_assignment')
          .delete()
          .in('assignee_id', toRemove)
          .eq('event_id', event.id);

        if (deleteError) {
          console.error('Error removing event assignments:', deleteError);
          throw deleteError;
        }
      }

      // Add new assignments
      const toAdd = form.assignee.filter(id => !currentAssigneeIds.includes(id));
      if (toAdd.length > 0) {
        const newAssignments = toAdd.map(assigneeId => ({
          event_id: event.id,
          assignee_id: assigneeId,
          assigned_by: user.id,
          status: 'assigned',
        }));

        const { error: insertError } = await supabase
          .from('event_assignment')
          .insert(newAssignments);
        
        if (insertError) {
          console.error('Error adding event assignments:', insertError);
          throw insertError;
        }
      }

      hideLoading();
      setLoading(false);
      
      if (onEventUpdated) {
        onEventUpdated();
      }
      
      handleClose();
      Alert.alert('Success', 'Event updated successfully');
    } catch (error: any) {
      console.error('Error updating event:', error);
      hideLoading();
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to update event');
    }
  };

  if (!event) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayPressable} onPress={handleClose} />
          
          <View style={{ width: '100%' }} pointerEvents="box-none">
            <SlideInAnimation direction="up" delay={100} duration={400} intensity={50}>
              <View style={styles.modalContainer}>
                {/* Main Icon */}
                <BounceInAnimation delay={200} duration={600}>
                  <View style={styles.iconContainer} pointerEvents="box-none">
                    <View style={styles.icon}>
                      <RNImage 
                        source={require('@/assets/images/icon/edit_task.png')}
                        style={styles.iconImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </BounceInAnimation>

                {/* Modal Header */}
                <FadeInAnimation delay={300} duration={400}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{event.title}</Text>
                    <Text style={styles.modalIntroText}>
                      {t('eventCreationModal.subtitle') || 'Fill in the details below to update your event'}
                    </Text>
                  </View>
                </FadeInAnimation>

                <View style={styles.formContainer}>
                  {/* Event Title */}
                  <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('eventCreationModal.form.eventTitle') || 'Event Title'}</Text>
                      <View style={styles.inputContainer}>
                        <RNImage 
                          source={require('@/assets/images/icon/task_title.png')}
                          style={styles.inputIcon}
                          resizeMode="contain"
                        />
                        <TextInput
                          style={[
                            styles.input,
                            Platform.OS === 'web' && ({
                              outline: 'none',
                              border: 'none',
                              boxShadow: 'none',
                            } as any)
                          ]}
                          placeholder={t('eventCreationModal.form.eventTitlePlaceholder') || 'Enter event title'}
                          placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                          value={form.title}
                          onChangeText={(value) => updateForm('title', value)}
                        />
                      </View>
                    </View>
                  </SlideInAnimation>

                  {/* Event Description */}
                  <SlideInAnimation direction="up" delay={500} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('eventCreationModal.form.eventDescription') || 'Event Description'}</Text>
                      <View style={styles.inputContainer}>
                        <RNImage 
                          source={require('@/assets/images/icon/note.png')}
                          style={styles.inputIcon}
                          resizeMode="contain"
                        />
                        <TextInput
                          style={[
                            styles.textArea,
                            Platform.OS === 'web' && ({
                              outline: 'none',
                              border: 'none',
                              boxShadow: 'none',
                            } as any)
                          ]}
                          placeholder={t('eventCreationModal.form.eventDescriptionPlaceholder') || 'Enter event description'}
                          placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                          value={form.description}
                          onChangeText={(value) => updateForm('description', value)}
                          multiline
                          numberOfLines={2}
                        />
                      </View>
                    </View>
                  </SlideInAnimation>

                  {/* Assign Event */}
                  <SlideInAnimation direction="up" delay={600} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('eventCreationModal.form.assignEvent') || 'Assign Event'}</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.assigneeScrollContainer}
                        contentContainerStyle={styles.assigneeContainer}
                      >
                        {familyMembers.length === 0 ? (
                          <Text style={styles.assigneeText}>No family members</Text>
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
                  </SlideInAnimation>

                  {/* Start Time and Duration */}
                  <SlideInAnimation direction="up" delay={650} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <View style={styles.timeContainer}>
                        <View style={styles.timeFieldContainer}>
                          <Text style={styles.timeFieldLabel}>{t('eventCreationModal.form.startTime') || 'Start Time'}</Text>
                          <Pressable
                            style={styles.timeInputContainer}
                            onPress={() => setShowStartTimePicker(true)}
                          >
                            <RNImage 
                              source={require('@/assets/images/icon/calendar2_dis.png')}
                              style={styles.inputIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.timeInputText}>
                              {form.startTime ? formatDateTime(new Date(form.startTime)) : t('eventCreationModal.form.selectStartTime') || 'Select start time'}
                            </Text>
                            <ChevronDown size={16} color={isDarkMode ? theme.placeholder : '#6B7280'} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </SlideInAnimation>

                  <SlideInAnimation direction="up" delay={700} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <View style={styles.timeContainer}>
                        <View style={styles.timeFieldContainer}>
                          <Text style={styles.timeFieldLabel}>{t('eventCreationModal.form.duration') || 'Duration'}</Text>
                          <Pressable
                            style={styles.timeInputContainer}
                            onPress={() => setShowDurationPicker(true)}
                          >
                            <RNImage 
                              source={require('@/assets/images/icon/soon_active.png')}
                              style={styles.inputIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.timeInputText}>
                              {form.duration || '00:00:00hrs'}
                            </Text>
                            <ChevronDown size={16} color={isDarkMode ? theme.placeholder : '#6B7280'} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </SlideInAnimation>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <Pressable
                    style={[styles.finishButton, loading && styles.disabledButton]}
                    onPress={handleUpdateEvent}
                    disabled={loading || !form.title.trim()}
                  >
                    <Text style={[styles.finishButtonText, loading && styles.disabledText]}>
                      {loading ? 'Updating...' : 'Update Event'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </SlideInAnimation>
          </View>
        </View>

        {/* DateTime Picker Modal */}
        <DateTimePickerModal
          visible={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
          onDateTimeSelect={handleDateTimeSelect}
          selectedDateTime={selectedDateTime}
          t={t}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Duration Picker Modal */}
        <DurationPickerModal
          visible={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onDurationSelect={handleDurationSelect}
          selectedDuration={form.duration}
          t={t}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      </Modal>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
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
    marginBottom: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalIntroText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: isDarkMode ? theme.textSecondary : '#475467',
    marginBottom: 6,
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? theme.input : '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? theme.inputBorder : '#98a2b3',
    shadowColor: isDarkMode ? theme.shadow : '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: isDarkMode ? theme.text : '#161618',
    fontFamily: 'Helvetica',
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: isDarkMode ? theme.text : '#161618',
    fontFamily: 'Helvetica',
    minHeight: 50,
    maxHeight: 60,
    textAlignVertical: 'top',
  },
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
    backgroundColor: theme.input,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedAssignee: {
    backgroundColor: isDarkMode ? '#2a4a3a' : '#F4F3FF',
    borderColor: '#17f196',
  },
  assigneeText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.text,
  },
  selectedAssigneeText: {
    // color: '#FFFFFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
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
    fontSize: 12,
    fontWeight: '500',
    color: isDarkMode ? theme.textSecondary : '#475467',
    marginBottom: 6,
    fontFamily: 'Helvetica',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? theme.input : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDarkMode ? theme.inputBorder : '#98a2b3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: isDarkMode ? theme.shadow : '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeInputText: {
    flex: 1,
    fontSize: 14,
    color: isDarkMode ? theme.text : '#161618',
    marginLeft: 12,
    fontFamily: 'Helvetica',
  },
  rewardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#17f196',
    padding: 16,
    marginTop: 8,
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
    color: theme.textSecondary,
  },
  rewardSubtext: {
    fontSize: 9,
    color: theme.textTertiary,
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardNumber: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.text,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.textSecondary,
  },
  modalReward: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  actionButtonsContainer: {
    gap: 8,
    marginTop: 12,
  },
  finishButton: {
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
  finishButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  cancelButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    shadowColor: '#E0E0E0',
    shadowOpacity: 0.2,
  },
  disabledText: {
    color: '#999999',
  },
});

const createDateTimePickerStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  dateTimePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateTimePickerContainer: {
    backgroundColor: theme.surface,
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
    borderBottomColor: theme.border,
  },
  dateTimePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateTimePickerCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  dateTimePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
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
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  dateTimePickerScroll: {
    flex: 1,
  },
  dateTimePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  dateTimePickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  dateTimePickerOptionText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  dateTimePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

const createDurationPickerStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  durationPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  durationPickerContainer: {
    backgroundColor: theme.surface,
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
    borderBottomColor: theme.border,
  },
  durationPickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  durationPickerCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  durationPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
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
    justifyContent: 'space-between',
    height: 200,
  },
  durationPickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  durationPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  durationPickerScroll: {
    flex: 1,
  },
  durationPickerOption: {
    paddingVertical: 12,
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
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  durationPickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

