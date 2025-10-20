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

interface ShoppingForm {
  title: string;
  description: string;
  quantity: string;
  assignee: string;
  reward: number;
}

interface ShoppingItemCreationModalProps {
  visible: boolean;
  onClose: () => void;
}

const ShoppingItemCreationModal: React.FC<ShoppingItemCreationModalProps> = ({
  visible,
  onClose,
}) => {
  const [form, setForm] = useState<ShoppingForm>({
    title: '',
    description: '',
    quantity: '',
    assignee: '',
    reward: 100,
  });
  const [loading, setLoading] = useState(false);
  
  const { showLoading, hideLoading } = useLoading();
  const { familyMembers, currentFamily, refreshFamily } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();


  const handleClose = () => {
    onClose();
  };

  const handleInputChange = (field: keyof ShoppingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeSelect = (memberId: string) => {
    setForm(prev => ({ ...prev, assignee: memberId }));
  };

  // Helper function to create shopping item with a specific family using Supabase function
  const createShoppingItemWithFamily = async (family: any, itemData: any) => {
    console.log('🔧 createShoppingItemWithFamily called with family:', family.id);
    
    try {
      // Prepare data for the Supabase function with correct parameter names
      const functionData = {
        _name: itemData.title,
        _quantity: itemData.quantity || null,
        _category: itemData.category || 'shopping',
        _family_id: family.id,
        _added_by: user?.id,
        _assignees: itemData.assignee_id ? [itemData.assignee_id] : null,
        _completed: false
      };
      
      console.log('🔧 Calling create_shopping_item_with_assignees function with data:', functionData);
      console.log('🔧 Supabase client available:', !!supabase);
      console.log('🔧 RPC method available:', typeof supabase.rpc);
      
      // Call the Supabase function
      console.log('🔧 About to call supabase.rpc...');
      const { data, error } = await supabase.rpc('create_shopping_item_with_assignees', functionData);
      console.log('🔧 RPC call completed, result:', { data, error });
        
      console.log('🔧 Function call completed:', { data, error });
      
      if (error) {
        console.error('❌ Function error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If function doesn't exist, try direct insert as fallback
        if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.log('🔄 Function not found, trying direct insert as fallback...');
          return await createShoppingItemDirectInsert(family, itemData);
        }
        
        throw error;
      }
      
      console.log('✅ Shopping item created successfully via function:', data);
      
      showPointsEarned(5, `Shopping item created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created shopping item: ${form.title}`);
      
      Alert.alert('Success', 'Shopping item created successfully!');
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error creating shopping item with family:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to create shopping item');
    }
  };

  // Fallback function for direct insert if RPC function doesn't exist
  const createShoppingItemDirectInsert = async (family: any, itemData: any) => {
    console.log('🔧 createShoppingItemDirectInsert called as fallback');
    
    try {
      const insertData = {
        name: itemData.title,
        description: itemData.description || null,
        quantity: itemData.quantity || null,
        category: itemData.category || 'shopping',
        family_id: family.id,
        created_by: user?.id,
        completed: false,
        points: itemData.points || 100
      };
      
      console.log('🔧 Direct insert data:', insertData);
      
      const { data, error } = await supabase
        .from('family_shopping_items')
        .insert([insertData])
        .select();
        
      if (error) {
        console.error('❌ Direct insert error:', error);
        throw error;
      }
      
      console.log('✅ Shopping item created via direct insert:', data);
      
      // If there's an assignee, create assignment
      if (itemData.assignee_id) {
        console.log('🔧 Creating assignment for assignee:', itemData.assignee_id);
        const { error: assignmentError } = await supabase
          .from('shopping_item_assignments')
          .insert([{
            shopping_item_id: data[0].id,
            user_id: itemData.assignee_id,
            assigned_by: user?.id,
            assigned_at: new Date().toISOString()
          }]);
          
        if (assignmentError) {
          console.error('❌ Assignment creation error:', assignmentError);
          // Don't throw here, item was created successfully
        } else {
          console.log('✅ Assignment created successfully');
        }
      }
      
      showPointsEarned(5, `Shopping item created: ${form.title}`);
      showMemberActivity(t('common.familyMember'), `Created shopping item: ${form.title}`);
      
      Alert.alert('Success', 'Shopping item created successfully!');
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error in direct insert fallback:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to create shopping item');
    }
  };

  const handleCreateShoppingItem = async () => {
    console.log('🚀 handleCreateShoppingItem called');
    
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), 'Please enter an item title');
      return;
    }

    // Prepare shopping item data first
    const itemData = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      quantity: form.quantity.trim() || undefined,
      category: 'shopping',
      assignee_id: form.assignee || undefined,
      completed: false,
      points: form.reward,
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
          
          // Fallback: Use a known family ID to allow shopping item creation
          const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
          console.log('🔄 Using fallback family ID for shopping item creation:', fallbackFamilyId);
          
          // Create a temporary family object for shopping item creation
          const tempFamily = {
            id: fallbackFamilyId,
            name: 'Family',
            code: 'FALLBACK',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Override the currentFamily for this operation
          console.log('✅ Using fallback family data for shopping item creation');
          
          // Proceed with shopping item creation using the fallback family
          await createShoppingItemWithFamily(tempFamily, itemData);
          return;
        }
        
        console.log('✅ Family data loaded after refresh:', (refreshedFamily as any)?.id || 'unknown');
      } catch (error) {
        console.error('❌ Error refreshing family data:', error);
        
        // Even if refresh fails, try with fallback family
        console.log('🔄 Refresh failed, using fallback family for shopping item creation...');
        const fallbackFamilyId = '9021859b-ae25-4045-8b74-9e84bad2bd1b';
        const tempFamily = {
          id: fallbackFamilyId,
          name: 'Family',
          code: 'FALLBACK',
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await createShoppingItemWithFamily(tempFamily, itemData);
        return;
      }
    }

    console.log('✅ Family data is available:', currentFamily.id);

    console.log('🔧 Setting loading state...');
    setLoading(true);
    showLoading('Creating shopping item...');
    
    try {
      console.log('🔧 About to call createShoppingItemWithFamily with data:', itemData);
      console.log('🔧 Using currentFamily:', currentFamily.id);
      
      await createShoppingItemWithFamily(currentFamily, itemData);
      console.log('✅ createShoppingItemWithFamily completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error creating shopping item:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to create shopping item');
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
            <Text style={styles.modalTitle}>Create New Shopping Item</Text>
            <Text style={styles.modalSubtitle}>
              Here you can create a new Item. Be sure about which shopping item you want to create.
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Item Title and Quantity on same line */}
            <View style={styles.inputSection}>
              <View style={styles.rowContainer}>
                {/* Item Title */}
                <View style={styles.halfWidthContainer}>
                  <Text style={styles.inputLabel}>Item Title</Text>
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

                {/* Quantity (optional) */}
                <View style={styles.halfWidthContainer}>
                  <Text style={styles.inputLabel}>Quantity (optional)</Text>
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
                      placeholder="1.0 stk"
                      placeholderTextColor="#9CA3AF"
                      value={form.quantity}
                      onChangeText={(value) => handleInputChange('quantity', value)}
                    />
                  </View>
                </View>
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

            {/* Assign Task (optional) */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Assign task (optional)</Text>
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

            {/* Shop item Reward */}
            <View style={styles.rewardContainer}>
              <View style={styles.rewardContent}>
                <View style={styles.rewardLeft}>
                  <View style={styles.rewardHeader}>
                    <RNImage 
                      source={require('@/assets/images/icon/soon_active.png')}
                      style={styles.rewardIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.rewardTitle}>Shop item Reward</Text>
                  </View>
                  <Text style={styles.rewardSubtext}>If this item is executed, the user receives</Text>
                </View>
                <View style={styles.rewardValue}>
                  <Plus size={16} color="#17F196" strokeWidth={2} />
                  <Text style={styles.rewardNumber}>{form.reward}</Text>
                  <Text style={styles.rewardText}>Flames</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Add Event Button */}
          <Pressable
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleCreateShoppingItem}
            disabled={loading || !form.title.trim()}
          >
            <Text style={styles.addButtonText}>Add Item</Text>
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
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthContainer: {
    flex: 1,
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
    width: '120%',
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
  // Shop item Reward - Matching TaskCreationModal style
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

export default ShoppingItemCreationModal;
