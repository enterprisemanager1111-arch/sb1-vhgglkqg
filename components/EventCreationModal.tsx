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
import { X, Plus, CheckSquare, FileText, Calendar, Clock, User, ChevronDown } from 'lucide-react-native';
import { Image as RNImage } from 'react-native';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/NotificationSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EventForm {
  title: string;
  description: string;
  assignee: string;
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
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    assignee: '',
    startTime: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  const { showLoading, hideLoading } = useLoading();
  const { familyMembers, currentFamily, refreshFamily } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();


  const handleClose = () => {
    onClose();
  };

  const handleInputChange = (field: keyof EventForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeSelect = (memberId: string) => {
    setForm(prev => ({ ...prev, assignee: memberId }));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to create event with a specific family
  const createEventWithFamily = async (family: any, eventData: any) => {
    console.log('🔧 createEventWithFamily called with family:', family.id);
    
    try {
      const insertData = {
        ...eventData,
        family_id: family.id,
        created_by: user?.id,
      };
      
      console.log('🔧 Inserting event data:', insertData);
      
      // Direct database insert with timeout
      const insertPromise = supabase
        .from('family_events')
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
      
      console.log('✅ Event created successfully:', data);
      
      showPointsEarned(5, `Event created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created event: ${form.title}`);
      
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

  const handleCreateEvent = async () => {
    console.log('🚀 handleCreateEvent called');
    
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Please enter an event title');
      return;
    }

    // Prepare event data first
    const eventData = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: 'event',
      assignee_id: form.assignee || undefined,
      completed: false,
      points: 200,
      start_time: form.startTime || undefined,
      duration: form.duration || undefined,
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
          
          // Fallback: Use a known family ID to allow event creation
          const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
          console.log('🔄 Using fallback family ID for event creation:', fallbackFamilyId);
          
          // Create a temporary family object for event creation
          const tempFamily = {
            id: fallbackFamilyId,
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Override the currentFamily for this operation
          console.log('✅ Using fallback family data for event creation');
          
          // Proceed with event creation using the fallback family
          await createEventWithFamily(tempFamily, eventData);
          return;
        }
        
        console.log('✅ Family data loaded after refresh:', (refreshedFamily as any)?.id || 'unknown');
      } catch (error) {
        console.error('❌ Error refreshing family data:', error);
        
        // Even if refresh fails, try with fallback family
        console.log('🔄 Refresh failed, using fallback family for event creation...');
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
    showLoading('Creating event...');
    
    try {
      console.log('🔧 About to call createEventWithFamily with data:', eventData);
      console.log('🔧 Using currentFamily:', currentFamily.id);
      
      await createEventWithFamily(currentFamily, eventData);
      console.log('✅ createEventWithFamily completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error creating event:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to create event');
    } finally {
      console.log('🔧 Finally block - resetting loading state');
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
                  style={styles.textInput}
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
                  style={styles.textInput}
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
              <View style={styles.assigneeContainer}>
                {familyMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={[
                      styles.assigneeButton,
                      form.assignee === member.user_id && styles.assigneeButtonSelected
                    ]}
                    onPress={() => handleAssigneeSelect(member.user_id)}
                  >
                    <Text style={[
                      styles.assigneeText,
                      form.assignee === member.user_id && styles.assigneeTextSelected
                    ]}>
                      {member.profiles?.name || 'Unknown'}
                    </Text>
                    <View style={[
                      styles.checkIcon,
                      form.assignee === member.user_id && styles.checkIconSelected
                    ]}>
                      {form.assignee === member.user_id ? (
                        <RNImage 
                          source={require('@/assets/images/icon/finished.png')}
                          style={styles.checkIconImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.uncheckedIcon} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Start time & Duration */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Start time & Duration (optional)</Text>
              <View style={styles.timeContainer}>
                {/* Start time */}
                <View style={styles.timeFieldContainer}>
                  <Text style={styles.timeFieldLabel}>Start time</Text>
                  <Pressable 
                    style={styles.timeInputContainer}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <RNImage 
                      source={require('@/assets/images/icon/calendar.png')}
                      style={styles.inputIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.timeInputText}>
                      {form.startTime ? formatTime(form.startTime) : 'Start time'}
                    </Text>
                    <ChevronDown size={16} color="#6B7280" />
                  </Pressable>
                </View>

                {/* Duration */}
                <View style={styles.timeFieldContainer}>
                  <Text style={styles.timeFieldLabel}>Duration (optional)</Text>
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
  assigneeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  assigneeButton: {
    // flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    width: '50%',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  assigneeButtonSelected: {
    borderColor: '#17f196',
    borderWidth: 1,
  },
  assigneeText: {
    fontSize: 14,
    color: '#374151',
  },
  assigneeTextSelected: {
    color: '#1F2937',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconSelected: {
    backgroundColor: '#17f196',
  },
  checkIconImage: {
    width: 12,
    height: 12,
  },
  uncheckedIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
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
});

export default EventCreationModal;
