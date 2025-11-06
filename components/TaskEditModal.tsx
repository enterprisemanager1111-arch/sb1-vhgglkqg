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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
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
      
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignee: assigneeIds,
        startDate: task.start_date ? task.start_date.split('T')[0] : '',
        endDate: task.end_date ? task.end_date.split('T')[0] : '',
        category: task.category || 'household',
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

  const handleDateSelect = (selectedDate: Date) => {
    setSelectedDate(selectedDate);
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    updateForm(datePickerType === 'start' ? 'startDate' : 'endDate', formattedDate);
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
      
      // Update the task
      const { error: updateError } = await supabase
        .from('family_tasks')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          points: form.points,
          start_date: form.startDate ? `${form.startDate}T00:00:00Z` : null,
          end_date: form.endDate ? `${form.endDate}T23:59:59Z` : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('family_id', currentFamily.id);

      if (updateError) {
        throw updateError;
      }

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
          
          <View style={{ width: '100%' }}>
            <SlideInAnimation direction="up" delay={100} duration={400} intensity={50}>
              <View style={styles.modalContainer}>
                {/* Header */}
                <FadeInAnimation delay={200} duration={400}>
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Edit Task</Text>
                    <Pressable style={styles.closeButton} onPress={handleClose}>
                      <X size={24} color="#161618" strokeWidth={2} />
                    </Pressable>
                  </View>
                </FadeInAnimation>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* Task Title */}
                <SlideInAnimation direction="up" delay={300} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Task Title *</Text>
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
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Task Description */}
                <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
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
                      placeholderTextColor="#888888"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Assign Task */}
                <SlideInAnimation direction="up" delay={500} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assign To</Text>
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

                {/* Start Date and End Date */}
                <SlideInAnimation direction="up" delay={600} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <View style={styles.dateRowContainer}>
                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.inputLabel}>Start Date</Text>
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
                          {form.startDate ? formatDisplayDate(form.startDate) : 'Select start date'}
                        </Text>
                        <ChevronDown size={16} color={theme.placeholder} strokeWidth={2} style={styles.chevronIcon} />
                      </Pressable>
                    </View>

                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.inputLabel}>End Date</Text>
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
                          {form.endDate ? formatDisplayDate(form.endDate) : 'Select end date'}
                        </Text>
                        <ChevronDown size={16} color={theme.placeholder} strokeWidth={2} style={styles.chevronIcon} />
                      </Pressable>
                    </View>
                  </View>
                </View>
                </SlideInAnimation>

                {/* Category */}
                <SlideInAnimation direction="up" delay={700} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        Platform.OS === 'web' && ({
                          outline: 'none',
                          border: 'none',
                          boxShadow: 'none',
                        } as any)
                      ]}
                      placeholder="Category"
                      value={form.category}
                      onChangeText={(value) => updateForm('category', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Points */}
                <SlideInAnimation direction="up" delay={750} duration={400} intensity={30}>
                  <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Points</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        Platform.OS === 'web' && ({
                          outline: 'none',
                          border: 'none',
                          boxShadow: 'none',
                        } as any)
                      ]}
                      placeholder="Points"
                      value={form.points.toString()}
                      onChangeText={(value) => {
                        const numValue = parseInt(value) || 0;
                        updateForm('points', numValue);
                      }}
                      keyboardType="numeric"
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>
                </SlideInAnimation>

                {/* Update Button */}
                <BounceInAnimation delay={800} duration={600}>
                  <Pressable
                    style={[styles.updateButton, (!form.title.trim() || loading) && styles.disabledButton]}
                    onPress={handleUpdateTask}
                    disabled={loading || !form.title.trim()}
                  >
                    <Text style={[styles.updateButtonText, (!form.title.trim() || loading) && styles.disabledText]}>
                      {loading ? 'Updating...' : 'Update Task'}
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

      {/* Simple Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerCancelButton}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>
                  Select {datePickerType === 'start' ? 'Start' : 'End'} Date
                </Text>
                <Pressable
                  onPress={() => {
                    handleDateSelect(selectedDate);
                    setShowDatePicker(false);
                  }}
                  style={styles.datePickerDoneButton}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              </View>
              {/* Simple date picker - you can enhance this later */}
              <View style={styles.datePickerContent}>
                <Text style={styles.datePickerInfo}>
                  Date picker implementation can be enhanced here
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    minHeight: 80,
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
    marginTop: 8,
  },
  assigneeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  assigneeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.input,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  selectedAssignee: {
    backgroundColor: '#17F196',
    borderColor: '#17F196',
  },
  assigneeText: {
    fontSize: 14,
    color: theme.text,
  },
  selectedAssigneeText: {
    color: '#FFFFFF',
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
    borderColor: '#FFFFFF',
  },
  finishedIcon: {
    width: 12,
    height: 12,
  },
  dateRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthContainer: {
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#17F196',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: theme.input,
    opacity: 0.5,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: theme.textSecondary,
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
});

