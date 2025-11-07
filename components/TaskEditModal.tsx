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
import { X, ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
import { TodayTask } from '@/hooks/useTodayTasks';
import { FamilyTask } from '@/hooks/useFamilyTasks';
import { FadeInAnimation, SlideInAnimation, BounceInAnimation } from '@/components/CoolAnimations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Date Range Picker Modal Component
const DateRangePickerModal = ({
  visible,
  onClose,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
  currentTab,
  onTabChange,
  theme,
  isDarkMode,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date, type: 'start' | 'end') => void;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  currentTab: 'start' | 'end';
  onTabChange: (tab: 'start' | 'end') => void;
  theme: any;
  isDarkMode: boolean;
  t: any;
}) => {
  const [tempDate, setTempDate] = useState(new Date());

  const styles = createDatePickerStyles(theme, isDarkMode);

  // Update tempDate when tab changes or modal opens
  useEffect(() => {
    if (visible) {
      if (currentTab === 'start' && selectedStartDate) {
        setTempDate(selectedStartDate);
      } else if (currentTab === 'end' && selectedEndDate) {
        setTempDate(selectedEndDate);
      } else {
        setTempDate(new Date());
      }
    }
  }, [visible, currentTab, selectedStartDate, selectedEndDate]);

  const handleConfirm = () => {
    // Validate end date is not before start date
    if (currentTab === 'end' && selectedStartDate && tempDate < selectedStartDate) {
      Alert.alert('Invalid Date', 'End date cannot be before start date');
      return;
    }
    
    onDateSelect(tempDate, currentTab);
    // Auto-switch to end date tab after selecting start date
    if (currentTab === 'start') {
      onTabChange('end');
    } else {
      onClose();
    }
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Check if a date is disabled (for end date picker)
  const isDateDisabled = (day: number) => {
    if (currentTab === 'end' && selectedStartDate) {
      const currentDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
      return currentDate < selectedStartDate;
    }
    return false;
  };

  // Check if year/month combination is valid for end date picker
  const isYearMonthValid = (year: number, month: number) => {
    if (currentTab === 'end' && selectedStartDate) {
      const startDateObj = selectedStartDate;
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const lastDateOfMonth = new Date(year, month, lastDayOfMonth);
      return lastDateOfMonth >= startDateObj;
    }
    return true;
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    t('taskCreationModal.months.january') || 'January',
    t('taskCreationModal.months.february') || 'February',
    t('taskCreationModal.months.march') || 'March',
    t('taskCreationModal.months.april') || 'April',
    t('taskCreationModal.months.may') || 'May',
    t('taskCreationModal.months.june') || 'June',
    t('taskCreationModal.months.july') || 'July',
    t('taskCreationModal.months.august') || 'August',
    t('taskCreationModal.months.september') || 'September',
    t('taskCreationModal.months.october') || 'October',
    t('taskCreationModal.months.november') || 'November',
    t('taskCreationModal.months.december') || 'December'
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Pressable
              onPress={onClose}
              style={styles.datePickerCancelButton}
            >
              <Text style={styles.datePickerCancelText}>{t('common.cancel') || 'Cancel'}</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>
              Select {currentTab === 'start' ? 'Start' : 'End'} Date
            </Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.datePickerDoneButton}
            >
              <Text style={styles.datePickerDoneText}>{t('taskCreationModal.datePicker.done') || 'Done'}</Text>
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, currentTab === 'start' && styles.tabActive]}
              onPress={() => onTabChange('start')}
            >
              <Text style={[styles.tabText, currentTab === 'start' && styles.tabTextActive]}>
                Start Date
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, currentTab === 'end' && styles.tabActive]}
              onPress={() => onTabChange('end')}
            >
              <Text style={[styles.tabText, currentTab === 'end' && styles.tabTextActive]}>
                End Date
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.year') || 'Year'}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => {
                    const yearDisabled = !isYearMonthValid(year, tempDate.getMonth());
                    return (
                      <Pressable
                        key={year}
                        style={[
                          styles.datePickerOption,
                          tempDate.getFullYear() === year && styles.datePickerOptionSelected,
                          yearDisabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!yearDisabled) {
                            setTempDate(new Date(year, tempDate.getMonth(), tempDate.getDate()));
                          }
                        }}
                        disabled={yearDisabled}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          tempDate.getFullYear() === year && styles.datePickerOptionTextSelected,
                          yearDisabled && styles.datePickerOptionTextDisabled
                        ]}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.month') || 'Month'}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => {
                    const monthDisabled = !isYearMonthValid(tempDate.getFullYear(), index);
                    return (
                      <Pressable
                        key={month}
                        style={[
                          styles.datePickerOption,
                          tempDate.getMonth() === index && styles.datePickerOptionSelected,
                          monthDisabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!monthDisabled) {
                            setTempDate(new Date(tempDate.getFullYear(), index, tempDate.getDate()));
                          }
                        }}
                        disabled={monthDisabled}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          tempDate.getMonth() === index && styles.datePickerOptionTextSelected,
                          monthDisabled && styles.datePickerOptionTextDisabled
                        ]}>
                          {month}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.day') || 'Day'}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays(tempDate.getFullYear(), tempDate.getMonth()).map((day) => {
                    const disabled = isDateDisabled(day);
                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.datePickerOption,
                          tempDate.getDate() === day && styles.datePickerOptionSelected,
                          disabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!disabled) {
                            setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day));
                          }
                        }}
                        disabled={disabled}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          tempDate.getDate() === day && styles.datePickerOptionTextSelected,
                          disabled && styles.datePickerOptionTextDisabled
                        ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Union type for task
type TaskData = TodayTask | FamilyTask;

interface TaskEditModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskData | null;
  onTaskUpdated?: () => void;
}

interface TaskForm {
  title: string;
  description: string;
  assignee: string[];
  startDate: string;
  endDate: string;
  category: string;
  points: number;
}

export default function TaskEditModal({ visible, onClose, task, onTaskUpdated }: TaskEditModalProps) {
  const [form, setForm] = useState<TaskForm>({
    title: '',
    description: '',
    assignee: [],
    startDate: '',
    endDate: '',
    category: 'household',
    points: 150,
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [currentPickerTab, setCurrentPickerTab] = useState<'start' | 'end'>('start');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  
  const { familyMembers, currentFamily } = useFamily();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  const styles = createStyles(theme, isDarkMode);

  // Initialize form with task data when modal opens
  useEffect(() => {
    if (visible && task) {
      // Get task ID (TodayTask uses task_id, FamilyTask uses id)
      const taskId = 'task_id' in task ? task.task_id : task.id;
      
      // Get assignees - TodayTask has assignees array, FamilyTask has task_assignments
      let assigneeIds: string[] = [];
      if ('assignees' in task && task.assignees) {
        assigneeIds = task.assignees.map(a => a.user_id);
      } else if ('task_assignments' in task && task.task_assignments) {
        assigneeIds = task.task_assignments.map(a => a.assignee_id);
      }
      
      // Map category/priority values to "Normal" or "High Level"
      let initialCategory = task.category || ('priority' in task ? (task as any).priority : null) || 'household';
      if (initialCategory === 'household' || initialCategory === 'high' || initialCategory === 'High Level') {
        initialCategory = 'High Level';
      } else if (initialCategory === 'Normal' || initialCategory === 'normal') {
        initialCategory = 'Normal';
      } else {
        initialCategory = 'Normal';
      }
      
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignee: assigneeIds,
        startDate: task.start_date ? task.start_date.split('T')[0] : '',
        endDate: task.end_date ? task.end_date.split('T')[0] : '',
        category: initialCategory,
        points: task.points || 150,
      });
      
      setShowDatePicker(false);
    }
  }, [visible, task]);

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

  const updateForm = (field: keyof TaskForm, value: string | string[] | number) => {
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

  const handleDateSelect = (date: Date, type: 'start' | 'end') => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    if (type === 'start') {
      setSelectedStartDate(date);
      updateForm('startDate', formattedDate);
      // If end date is before new start date, clear it
      if (form.endDate && new Date(form.endDate) < date) {
        updateForm('endDate', '');
        setSelectedEndDate(null);
      }
    } else {
      setSelectedEndDate(date);
      updateForm('endDate', formattedDate);
    }
  };

  const handleDueDatePress = () => {
    // Initialize dates if they exist in form
    if (form.startDate) {
      setSelectedStartDate(new Date(form.startDate));
    }
    if (form.endDate) {
      setSelectedEndDate(new Date(form.endDate));
    }
    setCurrentPickerTab('end'); // Start with end date (due date)
    setShowDatePicker(true);
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = () => {
    if (form.startDate && form.endDate) {
      return `${formatDisplayDate(form.startDate)} ~ ${formatDisplayDate(form.endDate)}`;
    } else if (form.endDate) {
      return formatDisplayDate(form.endDate);
    } else if (form.startDate) {
      return formatDisplayDate(form.startDate);
    }
    return 'Due date';
  };

  const handleUpdateTask = async () => {
    if (!task || !currentFamily || !user) {
      Alert.alert(t('common.error'), 'Missing required information');
      return;
    }

    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Task title is required');
      return;
    }

    setLoading(true);
    showLoading('Updating task...');

    try {
      // Get task ID (TodayTask uses task_id, FamilyTask uses id)
      const taskId = 'task_id' in task ? task.task_id : task.id;
      
      // Ensure priority has a value (default to 'Normal' if not set)
      const priorityValue = form.category || 'Normal';
      
      console.log('🔧 Updating task - Priority value:', priorityValue);
      console.log('🔧 Form category (priority):', form.category);
      console.log('🔧 Full form data:', JSON.stringify(form, null, 2));
      
      // Prepare update payload - MUST include priority field
      const updatePayload: {
        title: string;
        description: string | null;
        priority: string; // Priority field - always included
        points: number;
        start_date: string | null;
        end_date: string | null;
        updated_at: string;
      } = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: priorityValue, // Priority: 'Normal' or 'High Level'
        points: form.points,
        start_date: form.startDate ? `${form.startDate}T00:00:00Z` : null,
        end_date: form.endDate ? `${form.endDate}T23:59:59Z` : null,
        updated_at: new Date().toISOString(),
      };
      
      console.log('🔧 Update payload being sent (includes priority):', JSON.stringify(updatePayload, null, 2));
      console.log('🔧 Priority value in payload:', updatePayload.priority);
      
      // Update the task
      const { data: updateData, error: updateError } = await supabase
        .from('family_tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('family_id', currentFamily.id)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }
      
      console.log('✅ Task updated successfully!');
      console.log('✅ Updated task data:', updateData?.[0]);
      console.log('✅ Category in database after update:', updateData?.[0]?.category);

      // Update task assignments
      // Use task_assignment (singular) table which has: task_id, user_id, status
      const { data: currentAssignments } = await supabase
        .from('task_assignment')
        .select('user_id')
        .eq('task_id', taskId);

      const currentAssigneeIds = currentAssignments?.map(a => a.user_id) || [];
      
      // Remove assignments that are no longer selected
      const toRemove = currentAssigneeIds.filter(id => !form.assignee.includes(id));
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('task_assignment')
          .delete()
          .eq('task_id', taskId)
          .in('user_id', toRemove);
        
        if (deleteError) {
          console.error('Error removing task assignments:', deleteError);
        }
      }

      // Add new assignments
      const toAdd = form.assignee.filter(id => !currentAssigneeIds.includes(id));
      if (toAdd.length > 0) {
        const newAssignments = toAdd.map(userId => ({
          task_id: taskId,
          user_id: userId,
          status: 'assigned',
        }));

        const { error: insertError } = await supabase
          .from('task_assignment')
          .insert(newAssignments);
        
        if (insertError) {
          console.error('Error adding task assignments:', insertError);
          throw insertError;
        }
      }

      hideLoading();
      setLoading(false);
      
      // Refresh the task list to show updated priority
      if (onTaskUpdated) {
        onTaskUpdated();
      }
      
      handleClose();
      Alert.alert('Success', 'Task updated successfully');
    } catch (error: any) {
      console.error('Error updating task:', error);
      hideLoading();
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  if (!task) return null;

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
                {/* Header with Icon, Title, Reward, and Intro Text */}
                <FadeInAnimation delay={200} duration={400}>
                  <View style={styles.modalHeader}>
                    <BounceInAnimation delay={250} duration={600}>
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
                    <Text style={styles.modalTitle}>{task.title || 'Task'}</Text>
                    <Text style={styles.modalReward}>+ {form.points} Flames</Text>
                    <Text style={styles.modalIntroText}>
                      Here you can edit the task. Be sure about which setting you want to change
                    </Text>
                  </View>
                </FadeInAnimation>

                {/* Content */}
                <View style={styles.content}>
                  <View style={styles.formContainer}>
                    {/* Task Title */}
                    <SlideInAnimation direction="up" delay={300} duration={400} intensity={30}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Task Title</Text>
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
                            placeholder="Enter task title"
                            value={form.title}
                            onChangeText={(value) => updateForm('title', value)}
                            placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                          />
                        </View>
                      </View>
                    </SlideInAnimation>

                    {/* Task Description */}
                    <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Task Description</Text>
                        <View style={styles.inputContainer}>
                          <RNImage 
                            source={require('@/assets/images/icon/note.png')}
                            style={styles.inputIcon}
                            resizeMode="contain"
                          />
                          <TextInput
                            style={[
                              styles.input,
                              styles.textArea,
                              Platform.OS === 'web' && ({
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none',
                              } as any)
                            ]}
                            placeholder="Enter task description"
                            value={form.description}
                            onChangeText={(value) => updateForm('description', value)}
                            placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                            multiline
                            numberOfLines={2}
                          />
                        </View>
                      </View>
                    </SlideInAnimation>

                    {/* Assign Task */}
                    <SlideInAnimation direction="up" delay={500} duration={400} intensity={30}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Assign task</Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.assigneeScrollContainer}
                          contentContainerStyle={styles.assigneeContainer}
                        >
                          {familyMembers && familyMembers.length > 0 ? (
                            familyMembers.map((member) => {
                              const isSelected = form.assignee.includes(member.user_id);
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
                                    {member.profiles?.name || 'Unknown'}
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
                          ) : (
                            <Text style={styles.assigneeText}>No family members</Text>
                          )}
                        </ScrollView>
                      </View>
                    </SlideInAnimation>

                    {/* Due Date (optional) */}
                    <SlideInAnimation direction="up" delay={600} duration={400} intensity={30}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Due date (optional)</Text>
                        <Pressable 
                          style={styles.inputContainer}
                          onPress={handleDueDatePress}
                        >
                          <RNImage 
                            source={require('@/assets/images/icon/calendar.png')}
                            style={styles.inputIcon}
                            resizeMode="contain"
                          />
                          <Text style={[styles.input, (form.startDate || form.endDate) ? styles.inputText : styles.inputPlaceholder]}>
                            {formatDateRange()}
                          </Text>
                          <ChevronDown size={16} color={theme.placeholder} strokeWidth={2} style={styles.chevronIcon} />
                        </Pressable>
                      </View>
                    </SlideInAnimation>

                    {/* Priority */}
                    <SlideInAnimation direction="up" delay={700} duration={400} intensity={30}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Priority</Text>
                        <Pressable 
                          style={styles.inputContainer}
                          onPress={() => setShowPriorityPicker(true)}
                        >
                          <RNImage 
                            source={require('@/assets/images/icon/priority.png')}
                            style={styles.inputIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.input}>
                            {form.category === 'High Level' || form.category === 'high' || form.category === 'household' ? 'High Level' : 'Normal'}
                          </Text>
                          <ChevronDown size={16} color={theme.placeholder} strokeWidth={2} style={styles.chevronIcon} />
                        </Pressable>
                      </View>
                    </SlideInAnimation>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      <BounceInAnimation delay={800} duration={600}>
                        <Pressable
                          style={[styles.finishButton, (!form.title.trim() || loading) && styles.disabledButton]}
                          onPress={handleUpdateTask}
                          disabled={loading || !form.title.trim()}
                        >
                          <Text style={[styles.finishButtonText, (!form.title.trim() || loading) && styles.disabledText]}>
                            {loading ? 'Updating...' : 'Finish Task'}
                          </Text>
                        </Pressable>
                      </BounceInAnimation>
                      
                      <BounceInAnimation delay={850} duration={600}>
                        <Pressable
                          style={styles.cancelButton}
                          onPress={handleClose}
                        >
                          <Text style={styles.cancelButtonText}>Cancel Task</Text>
                        </Pressable>
                      </BounceInAnimation>
                    </View>
                  </View>
                </View>
              </View>
              </SlideInAnimation>
            </View>
          </View>
      </Modal>

      {/* Date Picker Modal with Start and End Date Selection */}
      {showDatePicker && (
        <DateRangePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={handleDateSelect}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          currentTab={currentPickerTab}
          onTabChange={setCurrentPickerTab}
          theme={theme}
          isDarkMode={isDarkMode}
          t={t}
        />
      )}

      {/* Priority Picker Modal */}
      {showPriorityPicker && (
        <Modal
          visible={showPriorityPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPriorityPicker(false)}
        >
          <View style={styles.priorityPickerOverlay}>
            <Pressable 
              style={styles.priorityPickerOverlayPressable}
              onPress={() => setShowPriorityPicker(false)}
            />
            <View style={styles.priorityPickerContainer} pointerEvents="box-none">
              <View style={styles.priorityPickerHeader}>
                <Pressable
                  onPress={() => setShowPriorityPicker(false)}
                  style={styles.priorityPickerCancelButton}
                >
                  <Text style={styles.priorityPickerCancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.priorityPickerTitle}>Select Priority</Text>
                <Pressable
                  onPress={() => setShowPriorityPicker(false)}
                  style={styles.priorityPickerDoneButton}
                >
                  <Text style={styles.priorityPickerDoneText}>Done</Text>
                </Pressable>
              </View>
              <View style={styles.priorityPickerContent}>
                <Pressable
                  style={[
                    styles.priorityOption,
                    (form.category === 'Normal' || (form.category !== 'High Level' && form.category !== 'high' && form.category !== 'household')) && styles.priorityOptionSelected
                  ]}
                  onPress={() => {
                    updateForm('category', 'Normal');
                    setShowPriorityPicker(false);
                  }}
                >
                  <Text style={styles.priorityOptionText}>Normal</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.priorityOption,
                    (form.category === 'High Level' || form.category === 'high' || form.category === 'household') && styles.priorityOptionSelected
                  ]}
                  onPress={() => {
                    updateForm('category', 'High Level');
                    setShowPriorityPicker(false);
                  }}
                >
                  <Text style={styles.priorityOptionText}>High Level</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const createDatePickerStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'Helvetica',
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.input,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#17f196',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  datePickerScroll: {
    flex: 1,
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: '#17f196',
  },
  datePickerOptionText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  datePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datePickerOptionDisabled: {
    backgroundColor: theme.input,
    opacity: 0.5,
  },
  datePickerOptionTextDisabled: {
    color: theme.textTertiary,
  },
});

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.95,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 30,
  },
  icon: {
    width: 100,
    height: 100,
    backgroundColor: '#17F196',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#17F196',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 10,
  },
  iconImage: {
    width: 35,
    height: 35,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalReward: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalIntroText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  content: {
    flexShrink: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
    color: isDarkMode ? theme.textSecondary : '#475467',
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
    minHeight: 50,
    maxHeight: 60,
    textAlignVertical: 'top',
  },
  inputText: {
    color: theme.text,
  },
  inputPlaceholder: {
    color: theme.placeholder,
  },
  chevronIcon: {
    marginLeft: 8,
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
    marginLeft: 10,
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
    borderWidth: 2,
    borderColor: '#17f196',
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },
  dateRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthContainer: {
    flex: 1,
  },
  actionButtonsContainer: {
    gap: 16,
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
    shadowColor: '#E0E0E0',
    shadowOpacity: 0.2,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  disabledText: {
    color: '#999999',
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerCancelButton: {
    padding: 8,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  datePickerDoneButton: {
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#17F196',
    fontWeight: '600',
  },
  datePickerContent: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  priorityPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  priorityPickerOverlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  priorityPickerContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '40%',
  },
  priorityPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  priorityPickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  priorityPickerCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  priorityPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'Helvetica',
  },
  priorityPickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  priorityPickerDoneText: {
    fontSize: 16,
    color: '#17f196',
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  priorityPickerContent: {
    gap: 12,
  },
  priorityOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.input,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    borderColor: '#17f196',
    backgroundColor: isDarkMode ? '#2a4a3a' : '#F4F3FF',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    fontFamily: 'Helvetica',
  },
});

