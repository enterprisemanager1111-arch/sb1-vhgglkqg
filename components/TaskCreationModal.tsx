import React, { useState } from 'react';
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
// Custom Date Picker Modal Component (End Date Only)
const DatePickerModal = ({ 
  visible, 
  onClose, 
  onDateSelect, 
  selectedEndDate,
  t,
  theme,
  isDarkMode
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateSelect: (endDate: Date | null) => void;
  selectedEndDate: Date | null;
  t: any;
  theme: any;
  isDarkMode: boolean;
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  
  const styles = createStyles(theme, isDarkMode);

  // Initialize with selectedEndDate or today
  const [tempEndDate, setTempEndDate] = useState(() => {
    if (selectedEndDate) {
      const date = new Date(selectedEndDate);
      date.setHours(0, 0, 0, 0);
      // Ensure date is not before today
      return date < today ? new Date() : date;
    }
    return new Date();
  });

  // Reset date when modal opens
  React.useEffect(() => {
    if (visible) {
      if (selectedEndDate) {
        const date = new Date(selectedEndDate);
        date.setHours(0, 0, 0, 0);
        // Ensure date is not before today
        setTempEndDate(date < today ? new Date() : date);
      } else {
        // Default to today if no date is selected
        setTempEndDate(new Date());
      }
    }
  }, [visible, selectedEndDate]);

  const handleConfirm = () => {
    console.log('📅 Date picker confirm button clicked');
    console.log('📅 Selected date:', tempEndDate);
    
    // Validate end date is not before today
    const endDate = new Date(tempEndDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      console.log('⚠️ Selected date is before today, showing error');
      Alert.alert(t('taskCreationModal.datePicker.invalidDate'), t('taskCreationModal.datePicker.endDateError'));
      return;
    }
    
    console.log('✅ Date validated, calling onDateSelect');
    onDateSelect(tempEndDate);
    onClose();
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Check if a date is disabled (must be >= today)
  const isDateDisabled = (day: number) => {
    const currentDate = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), day);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate < today;
  };

  // Check if year/month combination is valid (must have at least one day >= today)
  const isYearMonthValid = (year: number, month: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDateOfMonth = new Date(year, month, lastDayOfMonth);
    lastDateOfMonth.setHours(0, 0, 0, 0);
    return lastDateOfMonth >= today;
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    t('taskCreationModal.months.january'),
    t('taskCreationModal.months.february'),
    t('taskCreationModal.months.march'),
    t('taskCreationModal.months.april'),
    t('taskCreationModal.months.may'),
    t('taskCreationModal.months.june'),
    t('taskCreationModal.months.july'),
    t('taskCreationModal.months.august'),
    t('taskCreationModal.months.september'),
    t('taskCreationModal.months.october'),
    t('taskCreationModal.months.november'),
    t('taskCreationModal.months.december')
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
              <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>
              {t('taskCreationModal.datePicker.selectDueDate')}
            </Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.datePickerDoneButton}
            >
              <Text style={styles.datePickerDoneText}>{t('taskCreationModal.datePicker.done')}</Text>
            </Pressable>
          </View>

          <View style={styles.datePickerContent}>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.year')}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => {
                    const yearDisabled = !isYearMonthValid(year, tempEndDate.getMonth());
                    return (
                    <Pressable
                      key={year}
                      style={[
                        styles.datePickerOption,
                          tempEndDate.getFullYear() === year && styles.datePickerOptionSelected,
                          yearDisabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!yearDisabled) {
                            setTempEndDate(new Date(year, tempEndDate.getMonth(), tempEndDate.getDate()));
                          }
                        }}
                        disabled={yearDisabled}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                          tempEndDate.getFullYear() === year && styles.datePickerOptionTextSelected,
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
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.month')}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => {
                    const monthDisabled = !isYearMonthValid(tempEndDate.getFullYear(), index);
                    return (
                    <Pressable
                      key={month}
                      style={[
                        styles.datePickerOption,
                          tempEndDate.getMonth() === index && styles.datePickerOptionSelected,
                          monthDisabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!monthDisabled) {
                            setTempEndDate(new Date(tempEndDate.getFullYear(), index, tempEndDate.getDate()));
                          }
                        }}
                        disabled={monthDisabled}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                          tempEndDate.getMonth() === index && styles.datePickerOptionTextSelected,
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
                <Text style={styles.datePickerLabel}>{t('taskCreationModal.datePicker.day')}</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays(tempEndDate.getFullYear(), tempEndDate.getMonth()).map((day) => {
                    const disabled = isDateDisabled(day);
                    return (
                    <Pressable
                      key={day}
                      style={[
                        styles.datePickerOption,
                          tempEndDate.getDate() === day && styles.datePickerOptionSelected,
                          disabled && styles.datePickerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!disabled) {
                            setTempEndDate(new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), day));
                          }
                        }}
                        disabled={disabled}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                          tempEndDate.getDate() === day && styles.datePickerOptionTextSelected,
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
import { X, Plus, CheckSquare, FileText, Calendar, Clock, User, ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/NotificationSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
import { FadeInAnimation, SlideInAnimation, BounceInAnimation } from '@/components/CoolAnimations';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TaskCreationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TaskForm {
  title: string;
  description: string;
  assignee: string[];
  startDate: string;
  endDate: string;
}

const defaultForm: TaskForm = {
  title: '',
  description: '',
  assignee: [],
  startDate: '',
  endDate: '',
};

export default function TaskCreationModal({ visible, onClose }: TaskCreationModalProps) {
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const { showLoading, hideLoading } = useLoading();
  
  // Use family context but only when modal is opened (lazy loading)
  const { familyMembers, currentFamily } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  const styles = createStyles(theme, isDarkMode);
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  React.useEffect(() => {
    if (visible) {
      // Set start date to today automatically
      const todayString = getTodayDateString();
      setForm({
        ...defaultForm,
        startDate: todayString, // Always set start date to today
      });
      setShowDatePicker(false); // Reset date picker when modal opens
      setSelectedEndDate(null); // Reset end date
      
      console.log('🔄 TaskCreationModal opened - start date set to today:', todayString);
    } else {
      // Clear loading state when modal is closed
      console.log('🔄 TaskCreationModal closed, clearing loading state...');
      setLoading(false);
      hideLoading();
    }
  }, [visible, hideLoading]);

  // Cleanup effect to ensure loading state is cleared on unmount
  React.useEffect(() => {
    return () => {
      console.log('🧹 TaskCreationModal cleanup - clearing loading state');
      setLoading(false);
      hideLoading();
    };
  }, [hideLoading]);

  // Additional cleanup for loading state
  React.useEffect(() => {
    if (!visible && loading) {
      console.log('🔄 Modal closed while loading - clearing loading state');
      setLoading(false);
      hideLoading();
    }
  }, [visible, loading, hideLoading]);


  const handleClose = () => {
    console.log('🔄 TaskCreationModal handleClose called - clearing loading state');
    setLoading(false);
    hideLoading();
    onClose();
  };

  const updateForm = (field: keyof TaskForm, value: string | string[]) => {
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

  const handleDateSelect = (endDate: Date | null) => {
    console.log('📅 handleDateSelect called with:', endDate);
    
    if (!endDate) {
      console.log('⚠️ No date selected, clearing end date');
      updateForm('endDate', '');
      setSelectedEndDate(null);
      return;
    }
    
    setSelectedEndDate(endDate);
    
    // Format date as YYYY-MM-DD for the form using local timezone
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formattedEndDate = formatDate(endDate);
    
    // Start date is always today
    const todayString = getTodayDateString();
    
    console.log('✅ Due date selected and saved:', { 
      endDate: endDate.toISOString(), 
      formattedEndDate, 
      startDate: todayString 
    });
    
    updateForm('startDate', todayString); // Always set to today
    updateForm('endDate', formattedEndDate);
    
    console.log('✅ Form updated - endDate:', formattedEndDate);
  };

  // Initialize end date from form when opening date picker
  React.useEffect(() => {
    if (showDatePicker) {
      if (form.endDate) {
        // Parse YYYY-MM-DD format correctly
        const [year, month, day] = form.endDate.split('-').map(Number);
        const end = new Date(year, month - 1, day);
        setSelectedEndDate(end);
      } else {
        // If no end date is set, default to today
        setSelectedEndDate(new Date());
      }
    }
  }, [showDatePicker, form.endDate]);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, parse it directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Fallback for other formats
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to create task with a specific family using direct HTTP API
  const createTaskWithFamily = async (family: any, taskData: any, assigneeIds: string[]) => {
    console.log('🔧 createTaskWithFamily called with family:', family.id, 'assignees:', assigneeIds);
    
    try {
      console.log('🔧 Using create_task_with_details RPC function...');
      
      // Call the create_task_with_details RPC function with your exact requirements
      const { data, error } = await supabase.rpc('create_task_with_details', {
        _title: taskData.title,
        _description: taskData.description,
        _points: 150, // Fixed points as requested
        _category: 'household', // Fixed category as requested
        _due_date: null, // Always null as requested
        _start_date: taskData.start_date,
        _end_date: taskData.end_date,
        _family_id: family.id,
        _created_by: user?.id,
        _assignees: assigneeIds
      });

      if (error) {
        console.error('❌ Error creating task with details:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      console.log('✅ Task created successfully with details:', data);
      
      // Return the created task info
      return { 
        task: { id: data[0]?.task_id }, 
        assignments: assigneeIds,
        success: data[0]?.success,
        message: data[0]?.message
      };
      
      } catch (error: any) {
        console.error('❌ Error creating task with family:', error);
        throw error;
      }
    };

  // Simple task creation using RPC function
  const createTaskSimple = async (family: any, taskData: any, assigneeIds: string[]) => {
    console.log('🔧 createTaskSimple called with family:', family.id, 'assignees:', assigneeIds);
    
    try {
      console.log('🔧 Using create_task_with_details RPC function...');
      
      // Call the create_task_with_details RPC function with your exact requirements
      const { data, error } = await supabase.rpc('create_task_with_details', {
        _title: taskData.title,
        _description: taskData.description,
        _points: 150, // Fixed points as requested
        _category: 'household', // Fixed category as requested
        _due_date: null, // Always null as requested
        _start_date: taskData.start_date,
        _end_date: taskData.end_date,
        _family_id: family.id,
        _created_by: user?.id,
        _assignees: assigneeIds
      });

      if (error) {
        console.error('❌ Error creating task with details:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      console.log('✅ Task created successfully with details:', data);
      
      // Return the created task info
      return { 
        task: { id: data[0]?.task_id }, 
        assignments: assigneeIds,
        success: data[0]?.success,
        message: data[0]?.message
      };
      
    } catch (error: any) {
      console.error('❌ Error in createTaskSimple:', error);
      throw error;
    }
  };

  const handleCreateTask = async () => {
    console.log('🚀 handleCreateTask called');
    console.log('🔍 Current family state:', { 
      currentFamily: currentFamily?.id, 
      familyMembers: familyMembers?.length,
      isInFamily: !!currentFamily 
    });
    console.log('🔍 User state:', { 
      user: user?.id, 
      hasAccessToken: !!(user as any)?.access_token 
    });
    
    // Set loading state immediately
    setLoading(true);
    showLoading(t('taskCreationModal.loading'));
    
    // Helper function to clear loading state
    const clearLoadingState = () => {
      console.log('🔄 Clearing loading state...');
      setLoading(false);
      hideLoading();
    };
    
    // Early validation checks (outside try block)
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), t('taskCreationModal.validation.titleRequired'));
      clearLoadingState();
      return;
    }

    // Ensure user is properly authenticated
    if (!user || !user.id) {
      Alert.alert(
        t('taskCreationModal.validation.authError'), 
        t('taskCreationModal.validation.authErrorMessage'),
        [
          { text: t('common.ok'), style: 'cancel' }
        ]
      );
      clearLoadingState();
      return;
    }
    
    // Check if user has access token (critical for API calls)
    if (!(user as any).access_token) {
      console.warn('⚠️ User has no access token, trying localStorage fallback...');
      
      // Try localStorage first (most reliable for navigation)
      try {
        console.log('🔍 Trying localStorage for token...');
        const storedSession = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          const session = parsedSession.currentSession || parsedSession;
          if (session?.access_token) {
            console.log('✅ Token found in localStorage, continuing with task creation...');
            // Continue with task creation - the createTaskSimple function will handle the token
          } else {
            throw new Error('No valid token in localStorage');
          }
        } else {
          throw new Error('No session found in localStorage');
        }
      } catch (localStorageError) {
        console.error('❌ localStorage token retrieval failed:', localStorageError);
        Alert.alert(
          t('taskCreationModal.validation.sessionError'), 
          t('taskCreationModal.validation.sessionErrorMessage'),
          [
            { text: t('common.ok'), style: 'cancel' }
          ]
        );
        clearLoadingState();
        return;
      }
    }
    
    // Set up a manual timeout to force clear loading state if something goes wrong
    const forceTimeout = setTimeout(() => {
      console.error('🚨 Force timeout reached - clearing loading state');
      clearLoadingState();
    }, 15000); // 15 seconds force timeout
    
    try {
      // Use current family or fallback
      const familyToUse = currentFamily || {
              id: '9021859b-ae25-4045-8b74-9e84bad2bd1b',
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
      console.log('🔧 Using family for task creation:', familyToUse.id);
    
      console.log('✅ Using family for task creation:', familyToUse.id);

      // Prepare task data first
      console.log('🔧 Form data:', form);
      console.log('🔧 Form startDate:', form.startDate, 'type:', typeof form.startDate);
      console.log('🔧 Form endDate:', form.endDate, 'type:', typeof form.endDate);
      
      // Convert dates to ISO strings without timezone issues
      // Start date is always today
      const todayString = getTodayDateString();
      const startDate = `${todayString}T00:00:00.000Z`;
      const endDate = form.endDate ? `${form.endDate}T23:59:59.999Z` : undefined;
      
      console.log('🔧 Converted startDate:', startDate);
      console.log('🔧 Converted endDate:', endDate);
      console.log('🔧 Form startDate raw:', form.startDate);
      console.log('🔧 Form endDate raw:', form.endDate);
      
      // Get assignee IDs - if none selected, default to current user
      const assigneeIds = form.assignee.length > 0 ? form.assignee : [user?.id || ''];
      console.log('🔧 Form assignees:', form.assignee);
      console.log('🔧 Form assignees type:', typeof form.assignee);
      console.log('🔧 Form assignees length:', form.assignee.length);
      console.log('🔧 Final assigneeIds:', assigneeIds);
      console.log('🔧 Final assigneeIds length:', assigneeIds.length);
      
      const taskData = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: 'household',
        completed: false,
        points: 150,
        due_date: endDate,
        start_date: startDate,  // Add start_date to taskData
        end_date: endDate,      // Add end_date to taskData
      };

      // Family data is now validated and ready to use
      console.log('🔧 About to create task with data:', taskData);
      console.log('🔧 Using family:', familyToUse.id);
      
      // Simplified task creation with single timeout
      console.log('🔧 Starting task creation process...');
      
      // Create a single timeout for the entire operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('⏰ Task creation timeout after 15 seconds');
          reject(new Error('Task creation timeout after 15 seconds'));
        }, 15000);
      });
      
      // Try createTaskSimple first (most reliable)
      const taskCreationPromise = createTaskSimple(familyToUse, taskData, assigneeIds);
      
      // Race between task creation and timeout
      console.log('🏁 Starting race between task creation and timeout...');
      const result = await Promise.race([taskCreationPromise, timeoutPromise]) as any;
      console.log('✅ Task created successfully:', result);
      
      // Notifications are now handled automatically by the create_task_with_details RPC function
      console.log('✅ Task, assignments, and notifications created via RPC function');
      
      // Additional timeout check to ensure we don't hang
      if (!result) {
        console.error('❌ Task creation returned no result');
        throw new Error('Task creation returned no result');
      }
      
      // Clear the force timeout since we succeeded
      clearTimeout(forceTimeout);
      
      // Show success message based on number of assignments
      const assignmentCount = assigneeIds.length;
      const taskText = t('taskCreationModal.success.task');
      const successMessage = assignmentCount === 1 
        ? t('taskCreationModal.success.createdSingle') 
        : t('taskCreationModal.success.createdMultiple', { count: String(assignmentCount) });
      
      showPointsEarned(5, `${taskText} created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created ${taskText.toLowerCase()}: ${form.title}`);
      
      // Task creation completed (no refresh needed - handled by RPC function)
      console.log('✅ Task created successfully:', result);
      console.log('🔍 Created task data:', result);
      console.log('🔍 Task start_date:', result?.task?.start_date);
      console.log('🔍 Task end_date:', result?.task?.end_date);
      
      Alert.alert(t('common.success'), successMessage);
      handleClose();
      
      // Navigate to tasks page after successful task creation
      router.push('/(tabs)/tasks');
      
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      
      // Clear loading state immediately on error
      clearLoadingState();
      
      // Handle timeout errors specifically
      if (error.message && error.message.includes('timeout')) {
        Alert.alert(
          t('taskCreationModal.validation.timeout'), 
          t('taskCreationModal.validation.timeoutMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('taskCreationModal.validation.retry'), onPress: () => handleCreateTask() }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.message || t('taskCreationModal.validation.createFailed'));
      }
    } finally {
      console.log('🔧 Finally block - resetting loading state');
      clearTimeout(forceTimeout); // Clear the force timeout
      clearLoadingState();
    }
  };


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
                {/* Icon */}
                <BounceInAnimation delay={200} duration={600}>
                  <View style={styles.iconContainer} pointerEvents="box-none">
                    <View style={styles.icon}>
                      <RNImage 
                        source={require('@/assets/images/icon/add_task.png')}
                        style={styles.iconImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </BounceInAnimation>

                {/* Modal Header */}
                <FadeInAnimation delay={300} duration={400}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('taskCreationModal.title')}</Text>
                    <Text style={styles.modalSubtitle}>
                      {t('taskCreationModal.subtitle')}
                    </Text>
                  </View>
                </FadeInAnimation>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* Task Title */}
                <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('taskCreationModal.form.taskTitle')}</Text>
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
                      placeholder={t('taskCreationModal.form.taskTitlePlaceholder')}
                      value={form.title}
                      onChangeText={(value) => updateForm('title', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Task Description */}
                <SlideInAnimation direction="up" delay={500} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('taskCreationModal.form.taskDescription')}</Text>
                  <View style={styles.inputContainer}>
                    <RNImage 
                      source={require('@/assets/images/icon/note.png')}
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
                      placeholder={t('taskCreationModal.form.taskDescriptionPlaceholder')}
                      value={form.description}
                      onChangeText={(value) => updateForm('description', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Assign Task */}
                <SlideInAnimation direction="up" delay={600} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('taskCreationModal.form.assignTask')}</Text>
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
                      <View style={styles.assigneeContainer}>
                        <Text style={styles.assigneeText}>
                          {t('taskCreationModal.form.noMembers')}
                        </Text>
                        <Text style={styles.assigneeSubtext}>
                          {t('taskCreationModal.form.joinFamily')}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
                </SlideInAnimation>

                {/* Due Date (optional) */}
                <SlideInAnimation direction="up" delay={700} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('taskCreationModal.form.dueDate')}</Text>
                    <Pressable 
                      style={styles.inputContainer}
                      onPress={() => {
                        console.log('📅 Due date field clicked - opening date picker');
                        console.log('📅 Current form.endDate:', form.endDate);
                        setShowDatePicker(true);
                      }}
                    >
                      <RNImage 
                        source={require('@/assets/images/icon/calendar.png')}
                        style={styles.inputIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.input, form.endDate ? styles.inputText : styles.inputPlaceholder]}>
                        {form.endDate
                          ? formatDisplayDate(form.endDate)
                          : t('taskCreationModal.form.dueDatePlaceholder')}
                      </Text>
                      <ChevronDown size={16} color={theme.placeholder} strokeWidth={2} style={styles.chevronIcon} />
                    </Pressable>
                  </View>
                </SlideInAnimation>

                {/* Task Reward */}
                <SlideInAnimation direction="up" delay={750} duration={400} intensity={30}>
                  <View style={styles.rewardContainer}>
                  <View style={styles.rewardContent}>
                    <View style={styles.rewardLeft}>
                      <View style={styles.rewardHeader}>
                        <RNImage 
                          source={require('@/assets/images/icon/soon_active.png')}
                          style={styles.rewardIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.rewardTitle}>{t('taskCreationModal.reward.title')}</Text>
                      </View>
                      <Text style={styles.rewardSubtext}>{t('taskCreationModal.reward.subtitle')}</Text>
                    </View>
                    <View style={styles.rewardValue}>
                      <Plus size={16} color="#17F196" strokeWidth={2} />
                      <Text style={styles.rewardNumber}>150</Text>
                      <Text style={styles.rewardText}>{t('taskCreationModal.reward.flames')}</Text>
                    </View>
                  </View>
                </View>
                </SlideInAnimation>

                {/* Add Task Button */}
                <BounceInAnimation delay={800} duration={600}>
                  <Pressable
                    style={[styles.addTaskButton, !form.title.trim() && styles.disabledButton]}
                    onPress={() => {
                      console.log('🔥 Add Task button pressed!');
                      console.log('🔥 Button disabled?', loading || !form.title.trim());
                      console.log('🔥 Form title:', form.title);
                      handleCreateTask();
                    }}
                    disabled={loading || !form.title.trim()}
                  >
                    <Text style={[styles.addTaskButtonText, !form.title.trim() && styles.disabledText]}>
                      {loading ? t('taskCreationModal.button.creating') : t('taskCreationModal.button.addTask')}
                    </Text>
                  </Pressable>
                </BounceInAnimation>
              </View>
            </ScrollView>
            </View>
              </SlideInAnimation>
            </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal (End Date Only) */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        selectedEndDate={selectedEndDate}
        t={t}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: screenHeight * 0.9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  
  // Icon - Matching FeaturesToCreateModal styling
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
    position: 'relative',
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

  // Modal Header - Matching resetPwd styling
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: 'Helvetica',
  },

  // Content
  content: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },

  // Form - Matching resetPwd styling
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontFamily: 'Helvetica',
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

  // Date Row Layout
  dateRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthContainer: {
    flex: 1,
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
  assigneeSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    marginTop: 4,
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
    backgroundColor: '#17f196',
    borderColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  finishedIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },

  // Task Reward
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

  // Add Task Button - Matching resetPwd button styling
  addTaskButton: {
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  disabledText: {
    color: '#999999',
  },

  // Date Picker Modal Styles
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
  dateRangeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.input,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  dateRangeButtonActive: {
    backgroundColor: '#17f196',
    borderColor: '#17f196',
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    fontFamily: 'Helvetica',
  },
  dateRangeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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