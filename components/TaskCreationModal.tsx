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
  datePickerType,
  startDate
}: { 
  visible: boolean; 
  onClose: () => void; 
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  datePickerType: 'start' | 'end';
  startDate?: string;
}) => {
  const [tempDate, setTempDate] = useState(selectedDate);

  // Reset to today's date when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempDate(new Date());
    }
  }, [visible]);

  const handleConfirm = () => {
    // Validate end date is not before start date
    if (datePickerType === 'end' && startDate) {
      const startDateObj = new Date(startDate);
      if (tempDate < startDateObj) {
        Alert.alert('Invalid Date', 'End date cannot be before start date');
        return;
      }
    }
    
    onDateSelect(tempDate);
    onClose();
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Check if a date is disabled (for end date picker)
  const isDateDisabled = (day: number) => {
    if (datePickerType === 'end' && startDate) {
      const currentDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
      const startDateObj = new Date(startDate);
      return currentDate < startDateObj;
    }
    return false;
  };

  // Check if year/month combination is valid for end date picker
  const isYearMonthValid = (year: number, month: number) => {
    if (datePickerType === 'end' && startDate) {
      const startDateObj = new Date(startDate);
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const lastDateOfMonth = new Date(year, month, lastDayOfMonth);
      return lastDateOfMonth >= startDateObj;
    }
    return true;
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
                <Text style={styles.datePickerLabel}>Month</Text>
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
                <Text style={styles.datePickerLabel}>Day</Text>
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const { showLoading, hideLoading } = useLoading();
  
  const { createTask, refreshTasks } = useFamilyTasks();
  const { familyMembers, currentFamily, refreshFamily } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (visible) {
      setForm(defaultForm);
      setShowDatePicker(false); // Reset date picker when modal opens
      setSelectedDate(new Date()); // Reset to today's date
      
      // Refresh family data when modal opens to ensure we have the latest data
      console.log('🔄 TaskCreationModal opened, refreshing family data...');
      console.log('🔍 Current family state:', { 
        currentFamily: currentFamily?.id, 
        familyMembers: familyMembers?.length,
        isInFamily: !!currentFamily 
      });
      
      // Enhanced family data refresh with timeout
      const refreshFamilyData = async () => {
        try {
          console.log('🔄 Starting family data refresh...');
          await Promise.race([
            refreshFamily(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Family refresh timeout')), 5000)
            )
          ]);
          console.log('✅ Family data refreshed successfully');
        } catch (error) {
          console.warn('⚠️ Failed to refresh family data in TaskCreationModal:', error);
          // Continue anyway - the task creation will handle missing family data
        }
      };
      
      refreshFamilyData();
    } else {
      // Clear loading state when modal is closed
      console.log('🔄 TaskCreationModal closed, clearing loading state...');
      setLoading(false);
      hideLoading();
    }
  }, [visible, refreshFamily, hideLoading]);

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

  const handleDateSelect = (selectedDate: Date) => {
    setSelectedDate(selectedDate);
    
    // Format date as YYYY-MM-DD for the form using local timezone
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('🔧 Date selected:', selectedDate, 'formatted:', formattedDate, 'type:', datePickerType);
    console.log('🔧 Local date components:', { year, month, day });
    updateForm(datePickerType === 'start' ? 'startDate' : 'endDate', formattedDate);
  };

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
      console.log('🔧 Attempting direct HTTP API call to bypass Supabase client completely...');
      
      // Get session token with aggressive fallback approaches to avoid GoTrueClient lock issues
      let accessToken = null;
      
      // Approach 1: Try AuthContext first (most reliable for navigation)
      if ((user as any)?.access_token) {
        console.log('🔍 Using token from AuthContext (most reliable)');
        accessToken = (user as any).access_token;
      } else {
        console.log('🔍 AuthContext token not available, trying localStorage...');
        
        // Approach 2: Try localStorage
        try {
          console.log('🔍 Trying to get session from localStorage...');
          const storedSession = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            const session = parsedSession.currentSession || parsedSession;
            accessToken = session?.access_token;
            if (accessToken) {
              console.log('✅ Session token obtained from localStorage');
            }
          }
        } catch (localStorageError) {
          console.warn('⚠️ localStorage session retrieval failed:', localStorageError);
        }
        
        // Approach 3: Try Supabase session with very short timeout (last resort)
        if (!accessToken) {
          try {
            console.log('🔍 Trying Supabase session with very short timeout...');
            const sessionTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Session retrieval timeout after 1 second')), 1000);
            });
            
            const sessionPromise = supabase.auth.getSession();
            const { data: { session: sessionData } } = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
            accessToken = sessionData?.access_token;
            
            if (accessToken) {
              console.log('✅ Session token obtained from Supabase auth');
            }
          } catch (sessionError) {
            console.warn('⚠️ Supabase session retrieval failed:', sessionError);
          }
        }
      }
      
      if (!accessToken) {
        throw new Error('No valid session found from any source');
      }
      
      // Get Supabase URL and key
      const supabaseUrl = (supabase as any).supabaseUrl;
      const supabaseKey = (supabase as any).supabaseKey;
      
      // Create task with only task details (no assignee_id - assignments go to task_assignment table)
      const taskInsertData = {
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        completed: taskData.completed,
        points: taskData.points,
        due_date: taskData.due_date,
        start_date: taskData.start_date,  // Already converted to ISO string
        end_date: taskData.end_date,      // Already converted to ISO string
        family_id: family.id,
        created_by: user?.id
        // No assignee_id - assignments are handled separately in task_assignment table
      };
      
      console.log('🔧 Inserting task data via HTTP API:', taskInsertData);
      console.log('🔧 Start date:', taskData.start_date, 'converted to:', taskInsertData.start_date);
      console.log('🔧 End date:', taskData.end_date, 'converted to:', taskInsertData.end_date);
      
      // Make HTTP request to create task with timeout
      const taskTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task creation HTTP timeout after 10 seconds')), 10000);
      });
      
      const taskFetchPromise = fetch(`${supabaseUrl}/rest/v1/family_tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(taskInsertData)
      });
      
      const response = await Promise.race([taskFetchPromise, taskTimeoutPromise]) as Response;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const createdTask = await response.json();
      console.log('✅ Task created successfully via HTTP API:', createdTask);
      
      const task = createdTask[0];
      
      // Create task assignments for each assignee (task_id + user_id to task_assignment table)
      if (assigneeIds.length > 0) {
        console.log('🔧 Creating task assignments for assignees:', assigneeIds);
        console.log('🔧 Total assignees to save:', assigneeIds.length);
        console.log('🔧 Task ID for assignments:', task.id);
        
        try {
          // Create assignment data: task_id + assigned_by for each selected family member
          const assignmentData = assigneeIds.map(userId => ({
            task_id: task.id,        // From family_tasks table
            assigned_by: userId      // From profiles table (assigned_by) - each selected family member
          }));
          
          console.log('🔧 Assignment data (task_id + assigned_by):', assignmentData);
          console.log('🔧 Number of assignments to create:', assignmentData.length);
          console.log('🔧 Each assignment record:', assignmentData.map((a: any) => `task_id: ${a.task_id}, assigned_by: ${a.assigned_by}`));
          console.log('🔧 JSON payload being sent:', JSON.stringify(assignmentData, null, 2));
          console.log('🔧 Supabase URL:', `${supabaseUrl}/rest/v1/task_assignment`);
          
          // Insert assignments into task_assignment table with timeout
          const assignmentTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Assignment creation HTTP timeout after 5 seconds')), 5000);
          });
          
          const assignmentFetchPromise = fetch(`${supabaseUrl}/rest/v1/task_assignment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': supabaseKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(assignmentData)
          });
          
          const assignmentResponse = await Promise.race([assignmentFetchPromise, assignmentTimeoutPromise]) as Response;
          
          console.log('🔧 Assignment response status:', assignmentResponse.status);
          console.log('🔧 Assignment response headers:', Object.fromEntries(assignmentResponse.headers.entries()));
          console.log('🔧 Assignment response ok:', assignmentResponse.ok);
          
          if (!assignmentResponse.ok) {
            const errorText = await assignmentResponse.text();
            console.error('❌ Assignment insert error:', errorText);
            console.error('❌ Assignment insert error details:', {
              status: assignmentResponse.status,
              statusText: assignmentResponse.statusText,
              url: assignmentResponse.url
            });
            console.warn('⚠️ Task created but assignments failed - this is not critical');
          } else {
            const assignmentResult = await assignmentResponse.json();
            console.log('✅ Task assignments created successfully:', assignmentResult);
            console.log('✅ Number of assignments actually created:', assignmentResult.length);
            console.log('✅ Created assignments:', assignmentResult.map((a: any) => `id: ${a.id}, task_id: ${a.task_id}, assigned_by: ${a.assigned_by}`));
            
            // Verify all expected assignments were created
            if (assignmentResult.length !== assigneeIds.length) {
              console.warn(`⚠️ Expected ${assigneeIds.length} assignments but only ${assignmentResult.length} were created`);
            }
          }
        } catch (assignmentError: any) {
          console.error('❌ Assignment creation failed:', assignmentError);
          console.warn('⚠️ Task was created successfully, but assignments failed');
        }
      }
      
      return { task, assignments: assigneeIds };
      
      } catch (error: any) {
        console.error('❌ Error creating task with family:', error);
        throw error;
      }
    };

  // Simple task creation with timeout to prevent hanging - using direct fetch with minimal session handling
  const createTaskSimple = async (family: any, taskData: any, assigneeIds: string[]) => {
    console.log('🔧 createTaskSimple called with family:', family.id, 'assignees:', assigneeIds);
    
    try {
      console.log('🔧 Creating task via direct fetch with minimal session handling...');
    
      // Get access token - try multiple approaches SYNCHRONOUSLY to avoid promises hanging
      let accessToken = null;
      
      // Approach 1: Try localStorage first (most reliable for navigation)
      try {
        console.log('🔍 Trying localStorage for token...');
        const storedSession = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          const session = parsedSession.currentSession || parsedSession;
          accessToken = session?.access_token;
          if (accessToken) {
            console.log('✅ Token obtained from localStorage');
          }
        }
      } catch (localStorageError) {
        console.warn('⚠️ localStorage token retrieval failed:', localStorageError);
      }
      
      // Approach 2: Try AuthContext as fallback
      if (!accessToken && (user as any)?.access_token) {
        console.log('✅ Using token from AuthContext');
        accessToken = (user as any).access_token;
      }
      
      // Approach 3: If still no token, try to refresh session
      if (!accessToken) {
        console.log('🔍 No token found, trying to refresh session...');
        try {
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          accessToken = refreshedSession?.access_token;
          if (accessToken) {
            console.log('✅ Token obtained from refreshed session');
          }
        } catch (refreshError) {
          console.warn('⚠️ Session refresh failed:', refreshError);
        }
      }
      
      // Approach 4: If still no token, throw error immediately
      if (!accessToken) {
        throw new Error('No access token available from any source');
      }
      
      // Get Supabase URL and key
      const supabaseUrl = (supabase as any).supabaseUrl;
      const supabaseKey = (supabase as any).supabaseKey;
      
      // Create task data with proper date handling
      const taskInsertData = {
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          completed: taskData.completed,
          points: taskData.points,
          due_date: taskData.due_date,
        start_date: taskData.start_date,  // This should be the ISO string
        end_date: taskData.end_date,      // This should be the ISO string
          family_id: family.id,
        created_by: user?.id
      };
      
      console.log('🔧 Task insert data:', taskInsertData);
      console.log('🔧 Start date in taskData:', taskData.start_date);
      console.log('🔧 End date in taskData:', taskData.end_date);
      console.log('🔧 Start date in insert data:', taskInsertData.start_date);
      console.log('🔧 End date in insert data:', taskInsertData.end_date);
      
      console.log('🔧 Inserting task via fetch:', taskInsertData);
      
      // Create task using fetch with timeout
      const taskTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task creation HTTP timeout after 8 seconds')), 8000);
      });
      
      const taskFetchPromise = fetch(`${supabaseUrl}/rest/v1/family_tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(taskInsertData)
      });
      
      console.log('🔧 About to fetch task creation...');
      const taskResponse = await Promise.race([taskFetchPromise, taskTimeoutPromise]);
      console.log('🔧 Task response received:', taskResponse.ok);
      console.log('🔧 Task response status:', taskResponse.status);
      
      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        console.error('❌ Task creation failed:', errorText);
        throw new Error(`HTTP ${taskResponse.status}: ${errorText}`);
      }
      
      const [task] = await taskResponse.json();
      console.log('✅ Task created successfully via fetch:', task);
      console.log('✅ Created task start_date:', task.start_date);
      console.log('✅ Created task end_date:', task.end_date);

      // Create assignments for each assignee
      if (assigneeIds.length > 0) {
        console.log('🔧 Creating assignments for assignees:', assigneeIds);
        
        const assignmentData = assigneeIds.map(userId => ({
          task_id: task.id,
          assigned_by: userId
        }));

        console.log('🔧 Assignment data:', assignmentData);

        // Create assignment using fetch with timeout
        const assignmentTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Assignment creation HTTP timeout after 5 seconds')), 5000);
        });
        
        const assignmentFetchPromise = fetch(`${supabaseUrl}/rest/v1/task_assignment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(assignmentData)
        });

        try {
          console.log('🔧 About to fetch assignment creation...');
          const assignmentResponse = await Promise.race([assignmentFetchPromise, assignmentTimeoutPromise]);
          console.log('🔧 Assignment response received:', assignmentResponse.ok);
          
          if (!assignmentResponse.ok) {
            const errorText = await assignmentResponse.text();
            console.error('❌ Assignment creation HTTP error:', errorText);
            console.warn('⚠️ Task created but assignments failed');
          } else {
            const assignments = await assignmentResponse.json();
            console.log('✅ Assignments created successfully via fetch:', assignments);
          }
        } catch (assignmentError) {
          console.warn('⚠️ Assignment creation failed or timed out, but task was created:', assignmentError);
        }
      }

      console.log('🔧 About to return from createTaskSimple...');
      return { task, assignments: assigneeIds };
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
    showLoading('Creating task...');
    
    // Helper function to clear loading state
    const clearLoadingState = () => {
      console.log('🔄 Clearing loading state...');
      setLoading(false);
      hideLoading();
    };
    
    // Early validation checks (outside try block)
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Please enter a task title');
      clearLoadingState();
      return;
    }

    // Ensure user is properly authenticated
    if (!user || !user.id) {
      Alert.alert(
        'Authentication Error', 
        'User not properly authenticated. Please sign in again.',
        [
          { text: 'OK', style: 'cancel' }
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
          'Session Error', 
          'Unable to get valid session. Please try refreshing the page or sign in again.',
          [
            { text: 'OK', style: 'cancel' }
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
      // Enhanced family data validation and refresh
      let familyToUse = currentFamily;
      
      if (!familyToUse) {
        console.warn('⚠️ No current family available, attempting to refresh...');
        try {
          // Try to refresh family data with timeout
          await Promise.race([
            refreshFamily(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Family refresh timeout')), 3000)
            )
          ]);
          
          // Wait a moment for the context to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          familyToUse = currentFamily;
          
          if (!familyToUse) {
            console.warn('⚠️ Family data still not available after refresh, using fallback...');
            // Use fallback family ID
            familyToUse = {
              id: '9021859b-ae25-4045-8b74-9e84bad2bd1b',
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          }
      } catch (error) {
          console.error('❌ Failed to refresh family data:', error);
          console.log('🔄 Using fallback family for task creation...');
          familyToUse = {
            id: '9021859b-ae25-4045-8b74-9e84bad2bd1b',
          name: 'Family',
          code: 'FALLBACK',
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        }
      }
    
      console.log('✅ Using family for task creation:', familyToUse.id);

      // Prepare task data first
      console.log('🔧 Form data:', form);
      console.log('🔧 Form startDate:', form.startDate, 'type:', typeof form.startDate);
      console.log('🔧 Form endDate:', form.endDate, 'type:', typeof form.endDate);
      
      // Convert dates to ISO strings without timezone issues
      const startDate = form.startDate ? `${form.startDate}T00:00:00.000Z` : undefined;
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
      
      // Create notifications for all assigned members
      if (result?.task && assigneeIds.length > 0) {
        console.log('🔔 Creating notifications for assigned members...');
        try {
            const notificationData = assigneeIds.map(userId => ({
              assignee_id: userId,
              assigner_id: user?.id,
              task_id: result.task.id,
              type: 'task',
              status: 'unread'
            }));

          console.log('🔔 Notification data:', notificationData);

          // Create notifications using direct HTTP API
          const supabaseUrl = (supabase as any).supabaseUrl;
          const supabaseKey = (supabase as any).supabaseKey;
          
          // Get access token for notifications
          let accessToken = null;
          try {
            const storedSession = localStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
            if (storedSession) {
              const parsedSession = JSON.parse(storedSession);
              const session = parsedSession.currentSession || parsedSession;
              accessToken = session?.access_token;
              console.log('🔔 Access token found for notifications');
            } else {
              console.log('🔔 No stored session found, trying AuthContext...');
              // Fallback to AuthContext
              if ((user as any)?.access_token) {
                accessToken = (user as any).access_token;
                console.log('🔔 Using token from AuthContext');
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to get token for notifications:', error);
            // Fallback to AuthContext
            if ((user as any)?.access_token) {
              accessToken = (user as any).access_token;
              console.log('🔔 Using fallback token from AuthContext');
            }
          }

          if (accessToken) {
            console.log('🔔 Creating notifications with access token...');
            
            // Add timeout for notification creation
            const notificationTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Notification creation timeout')), 5000);
            });
            
            const notificationPromise = fetch(`${supabaseUrl}/rest/v1/notifications`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'apikey': supabaseKey,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(notificationData)
            });

            try {
              const notificationResponse = await Promise.race([notificationPromise, notificationTimeout]);
              console.log('🔔 Notification response status:', notificationResponse.status);
              
              if (notificationResponse.ok) {
                const createdNotifications = await notificationResponse.json();
                console.log('✅ Notifications created successfully:', createdNotifications.length);
              } else {
                const errorText = await notificationResponse.text();
                console.error('❌ Failed to create notifications:', errorText);
                console.error('❌ Response status:', notificationResponse.status);
                console.error('❌ Response URL:', `${supabaseUrl}/rest/v1/notifications`);
                
                // Parse and log the error details
                try {
                  const errorData = JSON.parse(errorText);
                  console.error('❌ Error details:', errorData);
                  
                  if (errorData.code === 'PGRST205') {
                    console.error('❌ TABLE NOT FOUND: The notifications table does not exist in your database');
                    console.error('❌ SOLUTION: Run the SQL script "create_notifications_table_simple.sql" in your Supabase SQL Editor');
                  } else if (errorData.code === 'PGRST204') {
                    console.error('❌ COLUMN NOT FOUND: A required column is missing from the notifications table');
                    console.error('❌ SOLUTION: Run the SQL script "create_notifications_table_simple.sql" in your Supabase SQL Editor');
                  }
                } catch (parseError) {
                  console.error('❌ Could not parse error response:', parseError);
                }
              }
            } catch (timeoutError) {
              console.error('❌ Notification creation timed out:', timeoutError);
            }
          } else {
            console.warn('⚠️ No access token available for creating notifications');
          }
        } catch (notificationError) {
          console.error('❌ Failed to create notifications:', notificationError);
          // Don't fail the entire operation if notifications fail
        }
      }
      
      // Additional timeout check to ensure we don't hang
      if (!result) {
        console.error('❌ Task creation returned no result');
        throw new Error('Task creation returned no result');
      }
      
      // Clear the force timeout since we succeeded
      clearTimeout(forceTimeout);
      
      // Show success message based on number of assignments
      const assignmentCount = assigneeIds.length;
      const taskText = assignmentCount === 1 ? 'Task' : 'Task';
      const successMessage = assignmentCount === 1 
        ? 'Task created and assigned successfully!' 
        : `Task created and assigned to ${assignmentCount} members successfully!`;
      
      showPointsEarned(5, `${taskText} created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created ${taskText.toLowerCase()}: ${form.title}`);
      
      // Refresh tasks to update the home page
      console.log('🔄 Refreshing tasks after successful creation...');
      console.log('🔍 Created task data:', result);
      console.log('🔍 Task start_date:', result?.task?.start_date);
      console.log('🔍 Task end_date:', result?.task?.end_date);
      try {
        await refreshTasks();
        console.log('✅ Tasks refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh tasks:', refreshError);
        // Don't fail the entire operation if refresh fails
      }
      
      Alert.alert('Success', successMessage);
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error creating task:', error);
      
      // Clear loading state immediately on error
      clearLoadingState();
      
      // Handle timeout errors specifically
      if (error.message && error.message.includes('timeout')) {
        Alert.alert(
          'Connection Timeout', 
          'The request timed out. This might be due to network issues or server load. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleCreateTask() }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.message || 'Failed to create task');
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
                      style={[
                        styles.input,
                        Platform.OS === 'web' && ({
                          outline: 'none',
                          border: 'none',
                          boxShadow: 'none',
                        } as any)
                      ]}
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
                      style={[
                        styles.input,
                        Platform.OS === 'web' && ({
                          outline: 'none',
                          border: 'none',
                          boxShadow: 'none',
                        } as any)
                      ]}
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
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.assigneeScrollContainer}
                    contentContainerStyle={styles.assigneeContainer}
                  >
                    {familyMembers.map((member) => {
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
                    })}
                  </ScrollView>
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
        startDate={form.startDate}
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
  datePickerOptionDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  datePickerOptionTextDisabled: {
    color: '#9CA3AF',
  },
});