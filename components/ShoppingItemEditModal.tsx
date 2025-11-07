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
import { ShoppingItem } from '@/hooks/useFamilyShoppingItems';
import { FadeInAnimation, SlideInAnimation, BounceInAnimation } from '@/components/CoolAnimations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShoppingItemEditModalProps {
  visible: boolean;
  onClose: () => void;
  item: ShoppingItem | null;
  onItemUpdated?: () => void;
}

interface ShoppingForm {
  title: string;
  description: string;
  quantity: string;
  assignee: string;
  reward: number;
}

export default function ShoppingItemEditModal({ visible, onClose, item, onItemUpdated }: ShoppingItemEditModalProps) {
  const [form, setForm] = useState<ShoppingForm>({
    title: '',
    description: '',
    quantity: '',
    assignee: '',
    reward: 100,
  });
  const [loading, setLoading] = useState(false);
  
  const { showLoading, hideLoading } = useLoading();
  const { familyMembers, currentFamily } = useFamily();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  const styles = createStyles(theme, isDarkMode);

  // Initialize form with item data when modal opens
  useEffect(() => {
    if (visible && item) {
      setForm({
        title: item.name || '',
        description: '', // Shopping items don't have description in the current schema
        quantity: item.quantity || '',
        assignee: '', // Shopping items don't have assignee in the current schema, but we'll keep it for future use
        reward: 100, // Default reward
      });
      setLoading(false);
    }
  }, [visible, item]);

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

  const updateForm = (field: keyof ShoppingForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAssigneeSelect = (memberId: string) => {
    setForm(prev => ({ ...prev, assignee: memberId }));
  };

  const handleUpdateItem = async () => {
    if (!item || !currentFamily || !user) {
      Alert.alert(t('common.error') || 'Error', 'Missing required information');
      return;
    }

    if (!form.title.trim()) {
      Alert.alert(t('common.error') || 'Error', 'Item name is required');
      return;
    }

    setLoading(true);
    showLoading('Updating shopping item...');

    try {
      // Update the shopping item
      const { data: updateData, error: updateError } = await supabase
        .from('shopping_items')
        .update({
          name: form.title.trim(),
          quantity: form.quantity.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('family_id', currentFamily.id)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Shopping item updated successfully:', updateData);

      hideLoading();
      setLoading(false);
      
      if (onItemUpdated) {
        onItemUpdated();
      }
      
      handleClose();
      Alert.alert('Success', 'Shopping item updated successfully');
    } catch (error: any) {
      console.error('Error updating shopping item:', error);
      hideLoading();
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to update shopping item');
    }
  };

  if (!item) return null;

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
                    <Text style={styles.modalTitle}>{item.name}</Text>
                    <Text style={styles.modalIntroText}>
                      {t('shoppingItemCreationModal.subtitle') || 'Fill in the details below to update your shopping item'}
                    </Text>
                  </View>
                </FadeInAnimation>

                <View style={styles.formContainer}>
                  {/* Item Title and Quantity on same line */}
                  <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <View style={styles.rowContainer}>
                        {/* Item Title */}
                        <View style={styles.halfWidthContainer}>
                          <Text style={styles.inputLabel}>{t('shoppingItemCreationModal.form.itemTitle') || 'Item Title'}</Text>
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
                              placeholder={t('shoppingItemCreationModal.form.itemTitlePlaceholder') || 'Enter item title'}
                              placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                              value={form.title}
                              onChangeText={(value) => updateForm('title', value)}
                            />
                          </View>
                        </View>

                        {/* Quantity (optional) */}
                        <View style={styles.halfWidthContainer}>
                          <Text style={styles.inputLabel}>{t('shoppingItemCreationModal.form.quantity') || 'Quantity'}</Text>
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
                              placeholder={t('shoppingItemCreationModal.form.quantityPlaceholder') || 'Enter quantity'}
                              placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                              value={form.quantity}
                              onChangeText={(value) => updateForm('quantity', value)}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </SlideInAnimation>

                  {/* Item Description */}
                  <SlideInAnimation direction="up" delay={500} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('shoppingItemCreationModal.form.itemDescription') || 'Item Description'}</Text>
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
                          placeholder={t('shoppingItemCreationModal.form.itemDescriptionPlaceholder') || 'Enter item description'}
                          placeholderTextColor={isDarkMode ? theme.placeholder : '#888888'}
                          value={form.description}
                          onChangeText={(value) => updateForm('description', value)}
                          multiline
                          numberOfLines={2}
                        />
                      </View>
                    </View>
                  </SlideInAnimation>

                  {/* Assign Task (optional) */}
                  <SlideInAnimation direction="up" delay={600} duration={400} intensity={30}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('shoppingItemCreationModal.form.assignTask') || 'Assign Task'}</Text>
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
                            const isSelected = form.assignee === member.user_id;
                            const memberName = member.profiles?.name || `User ${member.user_id.slice(0, 8)}`;
                            
                            return (
                              <Pressable
                                key={member.user_id}
                                style={[
                                  styles.assigneeButton,
                                  isSelected && styles.assigneeButtonSelected
                                ]}
                                onPress={() => handleAssigneeSelect(member.user_id)}
                              >
                                <Text style={[
                                  styles.assigneeText,
                                  isSelected && styles.assigneeTextSelected
                                ]}>
                                  {memberName}
                                </Text>
                                <View style={[
                                  styles.checkIcon,
                                  isSelected && styles.checkIconSelected
                                ]}>
                                  {isSelected ? (
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
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  </SlideInAnimation>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <Pressable
                    style={[styles.finishButton, loading && styles.disabledButton]}
                    onPress={handleUpdateItem}
                    disabled={loading || !form.title.trim()}
                  >
                    <Text style={[styles.finishButtonText, loading && styles.disabledText]}>
                      {loading ? 'Updating...' : 'Update Item'}
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
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthContainer: {
    flex: 1,
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
  assigneeButtonSelected: {
    backgroundColor: isDarkMode ? '#2a4a3a' : '#F4F3FF',
    borderColor: '#17f196',
  },
  assigneeText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.text,
  },
  assigneeTextSelected: {
    // color: '#FFFFFF',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkIconSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#17f196',
    borderColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconImage: {
    width: 12,
    height: 12,
    tintColor: '#FFFFFF',
  },
  uncheckedIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
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

