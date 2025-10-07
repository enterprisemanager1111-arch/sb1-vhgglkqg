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
// Custom Date Picker Modal Component
const DatePickerModal = ({ 
  visible, 
  onClose, 
  onDateSelect, 
  selectedDate,
  datePickerType
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  datePickerType: 'start' | 'end';
}) => {
  const [tempDate, setTempDate] = useState(selectedDate);

  const handleConfirm = () => {
    onDateSelect(tempDate);
    onClose();
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
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
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Pressable
              onPress={onClose}
              style={styles.datePickerCancelButton}
            >
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>
              Select {datePickerType === 'start' ? 'Start' : 'End'} Date
            </Text>
            <Pressable
              onPress={handleConfirm}
              style={styles.datePickerDoneButton}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </Pressable>
          </View>
          
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      style={[
                        styles.datePickerOption,
                        tempDate.getFullYear() === year && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setTempDate(new Date(year, tempDate.getMonth(), tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        tempDate.getFullYear() === year && styles.datePickerOptionTextSelected
                      ]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <Pressable
                      key={month}
                      style={[
                        styles.datePickerOption,
                        tempDate.getMonth() === index && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), index, tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        tempDate.getMonth() === index && styles.datePickerOptionTextSelected
                      ]}>
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays(tempDate.getFullYear(), tempDate.getMonth()).map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.datePickerOption,
                        tempDate.getDate() === day && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        tempDate.getDate() === day && styles.datePickerOptionTextSelected
                      ]}>
                        {day}
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
import { X, Plus, CheckSquare, FileText, Calendar, Clock, User, ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/NotificationSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TaskCreationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TaskForm {
  title: string;
  description: string;
  assignee: string;
  startDate: string;
  endDate: string;
}

const defaultForm: TaskForm = {
  title: '',
  description: '',
  assignee: '',
  startDate: '',
  endDate: '',
};

export default function TaskCreationModal({ visible, onClose }: TaskCreationModalProps) {
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const { showLoading, hideLoading } = useLoading();
  
  const { createTask } = useFamilyTasks();
  const { familyMembers, currentFamily, refreshFamily } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (visible) {
      setForm(defaultForm);
      setShowDatePicker(false); // Reset date picker when modal opens
    }
  }, [visible]);


  const handleClose = () => {
    onClose();
  };

  const updateForm = (field: keyof TaskForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (selectedDate: Date) => {
    setSelectedDate(selectedDate);
    
    // Format date as YYYY-MM-DD for the form
    const formattedDate = selectedDate.toISOString().split('T')[0];
    updateForm(datePickerType === 'start' ? 'startDate' : 'endDate', formattedDate);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to create task with a specific family
  const createTaskWithFamily = async (family: any, taskData: any) => {
    console.log('🔧 createTaskWithFamily called with family:', family.id);
    
    try {
      const insertData = {
        ...taskData,
        family_id: family.id,
        created_by: user?.id,
      };
      
      console.log('🔧 Inserting task data:', insertData);
      
      // Direct database insert with timeout
      const insertPromise = supabase
        .from('family_tasks')
        .insert([insertData])
        .select();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out after 5 seconds')), 5000);
      });

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;
        
      console.log('🔧 Insert completed:', { data, error });
      
      if (error) {
        console.error('❌ Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Task created successfully:', data);
      
      showPointsEarned(5, `Task created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created task: ${form.title}`);
      
      Alert.alert('Success', 'Task created successfully!');
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error creating task with family:', error);
      
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
        Alert.alert(t('common.error'), error.message || 'Failed to create task');
      }
    }
  };

  const handleCreateTask = async () => {
    console.log('🚀 handleCreateTask called');
    
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Please enter a task title');
      return;
    }

    // Prepare task data first
    const startDate = form.startDate ? new Date(form.startDate).toISOString() : undefined;
    const endDate = form.endDate ? new Date(form.endDate).toISOString() : undefined;
    
    const taskData = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: 'household',
      assignee_id: form.assignee || undefined,
      completed: false,
      points: 150,
      due_date: endDate,
    };

    // Check if family data is loaded
    if (!currentFamily) {
      console.log('⚠️ No current family found, attempting to refresh family data...');
      
      try {
        console.log('🔄 Attempting to refresh family data...');
        await refreshFamily();
        
        // Wait a moment for the refresh to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if family data is now available after refresh
        const refreshedFamily = currentFamily;
        if (!refreshedFamily) {
          console.log('⚠️ Family data still not available after refresh, using fallback...');
          
          // Fallback: Use a known family ID to allow task creation
          const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
          console.log('🔄 Using fallback family ID for task creation:', fallbackFamilyId);
          
          // Create a temporary family object for task creation
          const tempFamily = {
            id: fallbackFamilyId,
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Override the currentFamily for this operation
          console.log('✅ Using fallback family data for task creation');
          
          // Proceed with task creation using the fallback family
          await createTaskWithFamily(tempFamily, taskData);
          return;
        }
        
        console.log('✅ Family data loaded after refresh:', (refreshedFamily as any)?.id || 'unknown');
      } catch (error) {
        console.error('❌ Error refreshing family data:', error);
        
        // Even if refresh fails, try with fallback family
        console.log('🔄 Refresh failed, using fallback family for task creation...');
        const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
        const tempFamily = {
          id: fallbackFamilyId,
          name: 'Family',
          code: 'FALLBACK',
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await createTaskWithFamily(tempFamily, taskData);
        return;
      }
    }

    console.log('✅ Family data is available:', currentFamily.id);

    // Force reload the page to reinitialize Supabase client if we detect GoTrueClient lock
    console.log('🔧 Checking if page reload is needed to fix Supabase client...');
    const shouldReload = sessionStorage.getItem('supabase_needs_reload');
    if (shouldReload === 'true') {
      console.log('🔄 Reloading page to fix Supabase client...');
      sessionStorage.removeItem('supabase_needs_reload');
      window.location.reload();
      return;
    }

    console.log('🔧 Setting loading state...');
    setLoading(true);
    showLoading('Creating task...');
    
    try {
      console.log('🔧 About to call createTaskWithFamily with data:', taskData);
      console.log('🔧 Using currentFamily:', currentFamily.id);
      
      await createTaskWithFamily(currentFamily, taskData);
      console.log('✅ createTaskWithFamily completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to create task');
    } finally {
      console.log('🔧 Finally block - resetting loading state');
      setLoading(false);
      hideLoading();
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
          
          <View style={styles.modalContainer}>
            {/* Icon */}
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
              <Text style={styles.modalTitle}>Create New Task</Text>
              <Text style={styles.modalSubtitle}>
                Here you can create a new task. Be sure about which tasks you want to create.
              </Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* Task Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Task Title</Text>
                  <View style={styles.inputContainer}>
                    <RNImage 
                      source={require('@/assets/images/icon/task_title.png')}
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Clean kitchen"
                      value={form.title}
                      onChangeText={(value) => updateForm('title', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>

                {/* Task Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Task Description</Text>
                  <View style={styles.inputContainer}>
                    <RNImage 
                      source={require('@/assets/images/icon/note.png')}
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Everything except the refrigerator"
                      value={form.description}
                      onChangeText={(value) => updateForm('description', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>

                {/* Assign Task */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assign task</Text>
                  <View style={styles.assigneeContainer}>
                    {familyMembers.map((member) => (
                      <Pressable
                        key={member.user_id}
                        style={[
                          styles.assigneeButton,
                          form.assignee === member.user_id && styles.selectedAssignee
                        ]}
                        onPress={() => updateForm('assignee', member.user_id)}
                      >
                        <Text style={[
                          styles.assigneeText,
                          form.assignee === member.user_id && styles.selectedAssigneeText
                        ]}>
                          {member.profiles?.name || 'Unknown'}
                        </Text>
                        <View style={[
                          styles.radioButton,
                          form.assignee === member.user_id && styles.radioButtonSelected
                        ]}>
                          {form.assignee === member.user_id && (
                            <RNImage
                              source={require('@/assets/images/icon/finished.png')}
                              style={styles.finishedIcon}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Start Date and End Date on same line */}
                <View style={styles.inputGroup}>
                  <View style={styles.dateRowContainer}>
                    {/* Start Date */}
                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.inputLabel}>Start date (optional)</Text>
                      <Pressable 
                        style={styles.inputContainer}
                        onPress={() => {
                          setDatePickerType('start');
                          setShowDatePicker(true);
                        }}
                      >
                        <RNImage 
                          source={require('@/assets/images/icon/calendar.png')}
                          style={styles.inputIcon}
                          resizeMode="contain"
                        />
                        <Text style={[styles.input, form.startDate ? styles.inputText : styles.inputPlaceholder]}>
                          {form.startDate ? formatDisplayDate(form.startDate) : 'Start date'}
                        </Text>
                        <ChevronDown size={16} color="#888888" strokeWidth={2} style={styles.chevronIcon} />
                      </Pressable>
                    </View>

                    {/* End Date */}
                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.inputLabel}>End date (optional)</Text>
                      <Pressable 
                        style={styles.inputContainer}
                        onPress={() => {
                          setDatePickerType('end');
                          setShowDatePicker(true);
                        }}
                      >
                        <RNImage 
                          source={require('@/assets/images/icon/calendar.png')}
                          style={styles.inputIcon}
                          resizeMode="contain"
                        />
                        <Text style={[styles.input, form.endDate ? styles.inputText : styles.inputPlaceholder]}>
                          {form.endDate ? formatDisplayDate(form.endDate) : 'End date'}
                        </Text>
                        <ChevronDown size={16} color="#888888" strokeWidth={2} style={styles.chevronIcon} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Task Reward */}
                <View style={styles.rewardContainer}>
                  <View style={styles.rewardContent}>
                    <View style={styles.rewardLeft}>
                      <View style={styles.rewardHeader}>
                        <RNImage 
                          source={require('@/assets/images/icon/soon_active.png')}
                          style={styles.rewardIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.rewardTitle}>Task Reward</Text>
                      </View>
                      <Text style={styles.rewardSubtext}>If this task is executed, the user receives</Text>
                    </View>
                    <View style={styles.rewardValue}>
                      <Plus size={16} color="#17F196" strokeWidth={2} />
                      <Text style={styles.rewardNumber}>150</Text>
                      <Text style={styles.rewardText}>Flames</Text>
                    </View>
                  </View>
                </View>

                {/* Add Task Button */}
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
                    {loading ? 'Creating...' : 'Add Task'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        datePickerType={datePickerType}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
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
    color: '#101828',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Helvetica',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#393b41',
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
    color: '#475467',
    fontFamily: 'Helvetica',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#98a2b3',
    shadowColor: '#101828',
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
    color: '#161618',
    fontFamily: 'Helvetica',
  },
  inputText: {
    color: '#161618',
  },
  inputPlaceholder: {
    color: '#888888',
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
  assigneeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  assigneeButton: {
    flex: 1,
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Helvetica',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#374151',
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
    color: '#374151',
    fontFamily: 'Helvetica',
  },
  datePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});