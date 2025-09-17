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
} from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { X, ChevronLeft, Calendar, SquareCheck as CheckSquare, ShoppingCart, Plus, Clock, ChevronDown, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import { useFamilyCalendarEvents } from '@/hooks/useFamilyCalendarEvents';
import { useFamily } from '@/contexts/FamilyContext';
import { useNotifications } from '@/components/NotificationSystem';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
}

interface QuickCreateForm {
  // Task fields
  taskTitle: string;
  taskDescription: string;
  taskCategory: 'household' | 'personal' | 'work' | 'family';
  taskAssignee: string;
  taskDueDate: string;
  
  // Shopping fields
  itemName: string;
  itemCategory: 'dairy' | 'produce' | 'meat' | 'bakery' | 'pantry' | 'general';
  itemQuantity: string;
  
  // Event fields
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
}

const defaultForm: QuickCreateForm = {
  taskTitle: '',
  taskDescription: '',
  taskCategory: 'household',
  taskAssignee: '',
  taskDueDate: '',
  
  itemName: '',
  itemCategory: 'general',
  itemQuantity: '',
  
  eventTitle: '',
  eventDescription: '',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
};

export default function AddItemModal({ visible, onClose }: AddItemModalProps) {
  const [currentView, setCurrentView] = useState<'menu' | 'task' | 'shopping' | 'calendar'>('menu');
  const [form, setForm] = useState<QuickCreateForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  
  const { createTask } = useFamilyTasks();
  const { createItem } = useFamilyShoppingItems();
  const { createEvent } = useFamilyCalendarEvents();
  const { familyMembers } = useFamily();
  const { showPointsEarned, showMemberActivity } = useNotifications();
  
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Reset to menu when opening
      setCurrentView('menu');
      setForm(defaultForm);
      
      // Animate in
      overlayOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Animate out
      overlayOpacity.value = withTiming(0, { duration: 250 });
      modalScale.value = withSpring(0.9, { damping: 20, stiffness: 200 });
      modalOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const handleClose = () => {
    runOnJS(onClose)();
  };

  const handleBack = () => {
    if (currentView === 'menu') {
      handleClose();
    } else {
      setCurrentView('menu');
      setForm(defaultForm);
    }
  };

  const updateForm = (field: keyof QuickCreateForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Create Task
  const handleCreateTask = async () => {
    if (!form.taskTitle.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel ein');
      return;
    }

    setLoading(true);
    try {
      const dueDate = form.taskDueDate ? new Date(form.taskDueDate).toISOString() : undefined;
      
      await createTask({
        title: form.taskTitle.trim(),
        description: form.taskDescription.trim() || undefined,
        category: form.taskCategory,
        assignee_id: form.taskAssignee || undefined,
        completed: false,
        points: 15, // Fixed points for tasks
        due_date: dueDate,
      });

      showPointsEarned(5, `Neue Aufgabe erstellt: ${form.taskTitle}`);
      showMemberActivity('Ein Familienmitglied', `hat eine neue Aufgabe erstellt: ${form.taskTitle}`);
      
      Alert.alert('Erfolg', 'Aufgabe wurde erstellt!');
      handleClose();
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Aufgabe konnte nicht erstellt werden');
    } finally {
      setLoading(false);
    }
  };

  // Create Shopping Item
  const handleCreateShoppingItem = async () => {
    if (!form.itemName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Artikelnamen ein');
      return;
    }

    setLoading(true);
    try {
      await createItem({
        name: form.itemName.trim(),
        category: form.itemCategory,
        quantity: form.itemQuantity.trim() || undefined,
        completed: false,
      });

      showMemberActivity('Ein Familienmitglied', `hat "${form.itemName}" zur Einkaufsliste hinzugefügt`);
      
      Alert.alert('Erfolg', 'Artikel wurde zur Einkaufsliste hinzugefügt!');
      handleClose();
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Artikel konnte nicht hinzugefügt werden');
    } finally {
      setLoading(false);
    }
  };

  // Create Calendar Event
  const handleCreateEvent = async () => {
    if (!form.eventTitle.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel ein');
      return;
    }

    if (!form.eventDate) {
      Alert.alert('Fehler', 'Bitte geben Sie mindestens Titel und Datum ein');
      return;
    }

    // Validate date format DD.MM.YYYY
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(form.eventDate)) {
      Alert.alert('Fehler', 'Bitte geben Sie das Datum im Format DD.MM.YYYY ein (z.B. 19.09.2025)');
      return;
    }

    // Validate time format if provided
    if (form.eventTime && !/^\d{2}:\d{2}$/.test(form.eventTime)) {
      Alert.alert('Fehler', 'Bitte geben Sie die Uhrzeit im Format HH:MM ein (z.B. 15:30)');
      return;
    }

    setLoading(true);
    try {
      // Parse DD.MM.YYYY format
      const [day, month, year] = form.eventDate.split('.').map(Number);
      const eventDateTime = new Date(year, month - 1, day); // month is 0-indexed
      
      // Validate that date is valid
      if (isNaN(eventDateTime.getTime()) || 
          eventDateTime.getDate() !== day || 
          eventDateTime.getMonth() !== month - 1 || 
          eventDateTime.getFullYear() !== year) {
        Alert.alert('Fehler', 'Ungültiges Datum. Bitte überprüfen Sie Ihre Eingabe.');
        setLoading(false);
        return;
      }
      
      if (form.eventTime) {
        const [hours, minutes] = form.eventTime.split(':');
        eventDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
      } else {
        // Set default time to 12:00 if no time provided
        eventDateTime.setHours(12, 0);
      }

      // Validate that the date is not in the past
      const now = new Date();
      if (eventDateTime < now) {
        Alert.alert('Fehler', 'Das Datum darf nicht in der Vergangenheit liegen');
        setLoading(false);
        return;
      }

      await createEvent({
        title: form.eventTitle.trim(),
        description: form.eventDescription.trim() || undefined,
        event_date: eventDateTime.toISOString(),
        end_date: undefined,
        location: form.eventLocation.trim() || undefined,
        attendees: [],
      });

      showPointsEarned(10, `Termin erstellt: ${form.eventTitle}`);
      showMemberActivity('Ein Familienmitglied', `hat einen neuen Termin erstellt: ${form.eventTitle}`);
      
      Alert.alert('Erfolg', 'Termin wurde erstellt!');
      handleClose();
      setForm(defaultForm);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Fehler', error.message || 'Termin konnte nicht erstellt werden');
    } finally {
      setLoading(false);
    }
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  // Get current date in YYYY-MM-DD format for date input
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const taskCategories = [
    { value: 'household', label: 'Haushalt' },
    { value: 'personal', label: 'Persönlich' },
    { value: 'work', label: 'Arbeit' },
    { value: 'family', label: 'Familie' },
  ];

  const shoppingCategories = [
    { value: 'general', label: 'Allgemein' },
    { value: 'dairy', label: 'Milchprodukte' },
    { value: 'produce', label: 'Obst & Gemüse' },
    { value: 'meat', label: 'Fleisch' },
    { value: 'bakery', label: 'Bäckerei' },
    { value: 'pantry', label: 'Vorratsschrank' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <AnimatedView style={[styles.overlay, overlayAnimatedStyle]}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        
        <AnimatedView style={[styles.modalContainer, modalAnimatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            {currentView !== 'menu' && (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={24} color="#161618" strokeWidth={2} />
              </Pressable>
            )}
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {currentView === 'menu' ? 'Neues hinzufügen' :
                 currentView === 'task' ? 'Neue Aufgabe' :
                 currentView === 'shopping' ? 'Einkaufsartikel' :
                 'Neuer Termin'}
              </Text>
            </View>
            
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#161618" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {currentView === 'menu' && (
              <View style={styles.menuContainer}>
                <Pressable
                  style={styles.menuCard}
                  onPress={() => setCurrentView('task')}
                >
                  <View style={styles.menuIcon}>
                    <CheckSquare size={28} color="#54FE54" strokeWidth={2} />
                  </View>
                  <Text style={styles.menuTitle}>Neue Aufgabe</Text>
                  <Text style={styles.menuDescription}>
                    Familienaufgabe erstellen und Punkte sammeln
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.menuCard}
                  onPress={() => setCurrentView('shopping')}
                >
                  <View style={styles.menuIcon}>
                    <ShoppingCart size={28} color="#54FE54" strokeWidth={2} />
                  </View>
                  <Text style={styles.menuTitle}>Einkaufsartikel</Text>
                  <Text style={styles.menuDescription}>
                    Artikel zur gemeinsamen Einkaufsliste hinzufügen
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.menuCard}
                  onPress={() => setCurrentView('calendar')}
                >
                  <View style={styles.menuIcon}>
                    <Calendar size={28} color="#54FE54" strokeWidth={2} />
                  </View>
                  <Text style={styles.menuTitle}>Neuer Termin</Text>
                  <Text style={styles.menuDescription}>
                    Familientermin planen und alle benachrichtigen
                  </Text>
                </Pressable>
              </View>
            )}

            {currentView === 'task' && (
              <View style={styles.formContainer}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Aufgaben-Titel *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="z.B. Küche putzen"
                    value={form.taskTitle}
                    onChangeText={(value) => updateForm('taskTitle', value)}
                    placeholderTextColor="#888888"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Beschreibung (optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Details zur Aufgabe..."
                    value={form.taskDescription}
                    onChangeText={(value) => updateForm('taskDescription', value)}
                    placeholderTextColor="#888888"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Kategorie</Text>
                  <View style={styles.categoryGrid}>
                    {taskCategories.map((category) => (
                      <Pressable
                        key={category.value}
                        style={[
                          styles.categoryButton,
                          form.taskCategory === category.value && styles.selectedCategory
                        ]}
                        onPress={() => updateForm('taskCategory', category.value)}
                      >
                        <Text style={[
                          styles.categoryText,
                          form.taskCategory === category.value && styles.selectedCategoryText
                        ]}>
                          {category.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Zuweisen an (optional)</Text>
                  <View style={styles.assigneeContainer}>
                    <Pressable
                      style={[
                        styles.assigneeButton,
                        !form.taskAssignee && styles.selectedAssignee
                      ]}
                      onPress={() => updateForm('taskAssignee', '')}
                    >
                      <Text style={[
                        styles.assigneeText,
                        !form.taskAssignee && styles.selectedAssigneeText
                      ]}>
                        Niemand
                      </Text>
                    </Pressable>
                    {familyMembers.map((member) => (
                      <Pressable
                        key={member.user_id}
                        style={[
                          styles.assigneeButton,
                          form.taskAssignee === member.user_id && styles.selectedAssignee
                        ]}
                        onPress={() => updateForm('taskAssignee', member.user_id)}
                      >
                        <Text style={[
                          styles.assigneeText,
                          form.taskAssignee === member.user_id && styles.selectedAssigneeText
                        ]}>
                          {member.profiles?.name || 'Unbekannt'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Fälligkeitsdatum (optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder={getCurrentDate()}
                      value={form.taskDueDate}
                      onChangeText={(value) => updateForm('taskDueDate', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>

                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoText}>🔥 Diese Aufgabe bringt 15 Punkte</Text>
                </View>

                <Pressable
                  style={[styles.createButton, !form.taskTitle.trim() && styles.disabledButton]}
                  onPress={handleCreateTask}
                  disabled={loading || !form.taskTitle.trim()}
                >
                  <CheckSquare size={20} color={form.taskTitle.trim() ? "#161618" : "#999999"} strokeWidth={2} />
                  <Text style={[styles.createButtonText, !form.taskTitle.trim() && styles.disabledText]}>
                    {loading ? 'Erstelle Aufgabe...' : 'Aufgabe erstellen'}
                  </Text>
                </Pressable>
              </View>
            )}

            {currentView === 'shopping' && (
              <View style={styles.formContainer}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Artikel-Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="z.B. Milch, Brot, Bananen"
                    value={form.itemName}
                    onChangeText={(value) => updateForm('itemName', value)}
                    placeholderTextColor="#888888"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Kategorie</Text>
                  <View style={styles.categoryGrid}>
                    {shoppingCategories.map((category) => (
                      <Pressable
                        key={category.value}
                        style={[
                          styles.categoryButton,
                          form.itemCategory === category.value && styles.selectedCategory
                        ]}
                        onPress={() => updateForm('itemCategory', category.value)}
                      >
                        <Text style={[
                          styles.categoryText,
                          form.itemCategory === category.value && styles.selectedCategoryText
                        ]}>
                          {category.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Menge/Details (optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="z.B. 2 Liter, 500g, 1 Packung"
                    value={form.itemQuantity}
                    onChangeText={(value) => updateForm('itemQuantity', value)}
                    placeholderTextColor="#888888"
                  />
                </View>

                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoText}>🛒 Dieser Artikel bringt 20 Punkte</Text>
                </View>

                <Pressable
                  style={[styles.createButton, !form.itemName.trim() && styles.disabledButton]}
                  onPress={handleCreateShoppingItem}
                  disabled={loading || !form.itemName.trim()}
                >
                  <ShoppingCart size={20} color={form.itemName.trim() ? "#161618" : "#999999"} strokeWidth={2} />
                  <Text style={[styles.createButtonText, !form.itemName.trim() && styles.disabledText]}>
                    {loading ? 'Füge hinzu...' : 'Zur Liste hinzufügen'}
                  </Text>
                </Pressable>
              </View>
            )}

            {currentView === 'calendar' && (
              <View style={styles.formContainer}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Termin-Titel *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="z.B. Familienabend, Geburtstag"
                    value={form.eventTitle}
                    onChangeText={(value) => updateForm('eventTitle', value)}
                    placeholderTextColor="#888888"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Beschreibung (optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Was ist geplant..."
                    value={form.eventDescription}
                    onChangeText={(value) => updateForm('eventDescription', value)}
                    placeholderTextColor="#888888"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formSection, { flex: 2 }]}>
                    <Text style={styles.formLabel}>Datum *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="DD.MM.YYYY (z.B. 19.09.2025)"
                      value={form.eventDate}
                      onChangeText={(value) => updateForm('eventDate', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                  
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Uhrzeit</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="HH:MM"
                      value={form.eventTime}
                      onChangeText={(value) => updateForm('eventTime', value)}
                      placeholderTextColor="#888888"
                    />
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Ort (optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="z.B. Zuhause, Restaurant, Park"
                    value={form.eventLocation}
                    onChangeText={(value) => updateForm('eventLocation', value)}
                    placeholderTextColor="#888888"
                  />
                </View>

                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoText}>📅 Feste Punkte: 10 Punkte</Text>
                </View>

                <Pressable
                  style={[styles.createButton, (!form.eventTitle.trim() || !form.eventDate) && styles.disabledButton]}
                  onPress={handleCreateEvent}
                  disabled={loading || !form.eventTitle.trim() || !form.eventDate}
                >
                  <Calendar size={20} color={(form.eventTitle.trim() && form.eventDate) ? "#161618" : "#999999"} strokeWidth={2} />
                  <Text style={[styles.createButtonText, (!form.eventTitle.trim() || !form.eventDate) && styles.disabledText]}>
                    {loading ? 'Erstelle Termin...' : 'Termin erstellen'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </AnimatedView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#F3F3F5',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Menu
  menuContainer: {
    padding: 20,
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form
  formContainer: {
    padding: 20,
    gap: 24,
  },
  formSection: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategory: {
    backgroundColor: '#54FE54',
    borderColor: '#54FE54',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  selectedCategoryText: {
    color: '#161618',
  },

  // Assignee
  assigneeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assigneeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedAssignee: {
    backgroundColor: '#54FE54',
    borderColor: '#54FE54',
  },
  assigneeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  selectedAssigneeText: {
    color: '#161618',
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#54FE54',
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
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  disabledText: {
    color: '#999999',
  },

  // Points Info
  pointsInfo: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    alignItems: 'center',
  },
  pointsInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
});