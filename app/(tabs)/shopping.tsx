import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Plus, CircleCheck as CheckCircle, Circle, ShoppingCart, Trash2, User } from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem';
import EmptyState from '@/components/EmptyState';
import FamilyPrompt from '@/components/FamilyPrompt';
import AddItemModal from '@/components/AddItemModal';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Helper function to get category label
const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'all': return 'Alle';
    case 'dairy': return 'Milchprodukte';
    case 'produce': return 'Obst & Gemüse';
    case 'meat': return 'Fleisch';
    case 'bakery': return 'Bäckerei';
    case 'pantry': return 'Vorratsschrank';
    default: return category;
  }
};

export default function Shopping() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dairy' | 'produce' | 'meat' | 'bakery' | 'pantry'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { isInFamily, currentFamily, loading: familyLoading } = useFamily();
  const { 
    items, 
    loading: itemsLoading, 
    error: itemsError,
    createItem, 
    toggleItemCompletion, 
    deleteItem,
    refreshItems,
    getCompletedItems,
    getPendingItems 
  } = useFamilyShoppingItems();
  const { notifications, dismissNotification, showPointsEarned, showMemberActivity } = useNotifications();
  
  const headerOpacity = useSharedValue(0);
  const progressScale = useSharedValue(0.8);
  const addItemTranslateY = useSharedValue(20);
  const itemsListOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isLoaded) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      progressScale.value = withDelay(200, withSpring(1, { damping: 15 }));
      addItemTranslateY.value = withDelay(400, withSpring(0, { damping: 18 }));
      itemsListOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      setIsLoaded(true);
    }
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressScale.value }],
  }));

  const addItemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: addItemTranslateY.value }],
    opacity: addItemTranslateY.value === 0 ? 1 : 0.7,
  }));

  const itemsListAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemsListOpacity.value,
  }));

  // Show family prompt if user is not in a family
  if (!familyLoading && !isInFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <FamilyPrompt />
      </SafeAreaView>
    );
  }

  // Show loading while family data is being fetched
  if (familyLoading || itemsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Einkaufsliste...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (itemsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Fehler beim Laden der Einkaufsliste</Text>
          <Text style={styles.errorText}>{itemsError}</Text>
          <Pressable style={styles.retryButton} onPress={refreshItems}>
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshItems();
    } catch (error) {
      console.error('Error refreshing shopping items:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      const wasCompleted = item?.completed || false;
      
      await toggleItemCompletion(itemId);
      
      // Show notification when item is completed
      if (!wasCompleted && item) {
        showPointsEarned(5, `Gekauft: ${item.name}`);
        
        // Show member activity notification
        showMemberActivity(
          item.creator_profile?.name || 'Ein Familienmitglied',
          `hat "${item.name}" gekauft`
        );
      }
    } catch (error: any) {
      Alert.alert('Fehler', 'Artikel-Status konnte nicht geändert werden: ' + error.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Artikel löschen',
      'Möchten Sie diesen Artikel wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
            } catch (error: any) {
              Alert.alert('Fehler', 'Artikel konnte nicht gelöscht werden: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const completedItems = getCompletedItems();
  const pendingItems = getPendingItems();
  const totalItems = items.length;

  // Show empty state if no items
  if (isLoaded && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<ShoppingCart size={40} color="#54FE54" strokeWidth={1.5} />}
          title={t('tabs.shopping.emptyTitle')}
          description={t('tabs.shopping.emptyDescription')}
          buttonText={t('tabs.shopping.addItem')}
          onButtonPress={() => setShowAddModal(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#54FE54"
          />
        }
      >
        {/* Header */}
        <AnimatedView style={[styles.header, headerAnimatedStyle]}>
          <Text style={styles.title}>Einkaufsliste</Text>
          <Pressable 
            style={styles.addItemHeaderButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#161618" strokeWidth={2} />
          </Pressable>
        </AnimatedView>

        <AnimatedView style={[styles.headerStatsContainer, headerAnimatedStyle]}>
          <View style={styles.headerStats}>
            <Text style={styles.statText}>
              {completedItems.length} von {totalItems} erledigt
            </Text>
          </View>
        </AnimatedView>

        {/* Progress Summary */}
        <AnimatedView style={[styles.section, progressAnimatedStyle]}>
          <View style={styles.progressContainer}>
            <View style={styles.progressCard}>
              <ShoppingCart size={20} color="#54FE54" strokeWidth={1.5} />
              <Text style={styles.progressNumber}>{pendingItems.length}</Text>
              <Text style={styles.progressLabel}>Noch kaufen</Text>
            </View>
            <View style={styles.progressCard}>
              <CheckCircle size={20} color="#54FE54" strokeWidth={1.5} />
              <Text style={styles.progressNumber}>{completedItems.length}</Text>
              <Text style={styles.progressLabel}>Gekauft</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressPercentage}>
                {totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0}%
              </Text>
              <Text style={styles.progressLabel}>Fortschritt</Text>
            </View>
          </View>
        </AnimatedView>

        {/* Filter Buttons */}
        <AnimatedView style={[styles.section, addItemAnimatedStyle]}>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['all', 'dairy', 'produce', 'meat', 'bakery', 'pantry'].map((category) => (
                <AnimatedPressable
                  key={category}
                  style={[
                    styles.filterButton,
                    selectedCategory === category && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedCategory === category && styles.filterButtonTextActive
                  ]}>
                    {getCategoryLabel(category)}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </AnimatedView>

        {/* Shopping List */}
        <AnimatedView style={[styles.section, itemsListAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'Alle Artikel' : getCategoryLabel(selectedCategory)}
            </Text>
            <Text style={styles.itemCount}>
              {filteredItems.length} Artikel
            </Text>
          </View>
          
          {/* Pending Items */}
          <View style={styles.itemsContainer}>
            <Text style={styles.subsectionTitle}>Einkaufen ({pendingItems.filter(i => selectedCategory === 'all' || i.category === selectedCategory).length})</Text>
            <View style={styles.itemsList}>
              {filteredItems.filter(item => !item.completed).map((item) => (
                <AnimatedView key={item.id} style={styles.glassItemCard}>
                  <AnimatedPressable 
                    style={styles.itemCheckbox}
                    onPress={() => handleToggleItem(item.id)}
                  >
                    {item.completed ? (
                      <CheckCircle size={20} color="#54FE54" strokeWidth={1.5} />
                    ) : (
                      <Circle size={20} color="#161618" strokeWidth={1.5} />
                    )}
                  </AnimatedPressable>
                  
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                      {item.quantity && (
                        <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      )}
                      <View style={styles.itemCategory}>
                        <Text style={styles.categoryText}>
                          {getCategoryLabel(item.category)}
                        </Text>
                      </View>
                      <View style={styles.itemAddedBy}>
                        <User size={10} color="#161618" strokeWidth={1.5} />
                        <Text style={styles.addedByText}>
                          {item.creator_profile?.name || 'Unbekannt'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <AnimatedPressable 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 size={16} color="#666666" strokeWidth={1.5} />
                  </AnimatedPressable>
                </AnimatedView>
              ))}
            </View>

            {/* Completed Items */}
            {filteredItems.filter(item => item.completed).length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, styles.completedSubsection]}>
                  Kürzlich gekauft ({completedItems.filter(i => selectedCategory === 'all' || i.category === selectedCategory).length})
                </Text>
                <View style={styles.completedNotice}>
                  <Text style={styles.completedNoticeText}>
                    ✨ Gekaufte Artikel werden automatisch nach 24 Stunden gelöscht
                  </Text>
                </View>
                <View style={styles.itemsList}>
                  {filteredItems.filter(item => item.completed).map((item) => {
                    const completedTime = new Date(item.updated_at);
                    const timeRemaining = 24 - Math.floor((Date.now() - completedTime.getTime()) / (1000 * 60 * 60));
                    
                    return (
                      <AnimatedView key={item.id} style={[styles.glassItemCard, styles.completedItemCard]}>
                        <View style={styles.itemCheckbox}>
                          <CheckCircle size={20} color="#54FE54" strokeWidth={1.5} />
                        </View>
                        
                        <View style={styles.itemContent}>
                          <Text style={[styles.itemName, styles.completedItemName]}>
                            {item.name}
                          </Text>
                          <View style={styles.itemMeta}>
                            {item.quantity && (
                              <Text style={styles.itemQuantity}>{item.quantity}</Text>
                            )}
                            <View style={styles.itemCategory}>
                              <Text style={styles.categoryText}>
                                {getCategoryLabel(item.category)}
                              </Text>
                            </View>
                            <View style={styles.itemAddedBy}>
                              <User size={10} color="#666666" strokeWidth={1.5} />
                              <Text style={styles.addedByText}>
                                {item.creator_profile?.name || 'Unbekannt'}
                              </Text>
                            </View>
                            <View style={styles.timeRemaining}>
                              <Text style={styles.timeRemainingText}>
                                Noch {Math.max(0, timeRemaining)}h sichtbar
                              </Text>
                            </View>
                          </View>
                        </View>

                        <AnimatedPressable 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={16} color="#888888" strokeWidth={1.5} />
                        </AnimatedPressable>
                      </AnimatedView>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </AnimatedView>
      </ScrollView>

      {/* Add Shopping Item Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  addItemHeaderButton: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerStatsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerStats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#54FE54',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 16,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#161618',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addItemButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemButtonActive: {
    backgroundColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    marginTop: -16,
  },
  filterScroll: {
    paddingRight: 24,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#54FE54',
    borderColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  filterButtonTextActive: {
    color: '#161618',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCount: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  itemsContainer: {
    gap: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  completedSubsection: {
    marginTop: 20,
  },
  itemsList: {
    gap: 12,
  },
  glassItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedItemCard: {
    opacity: 0.7,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  itemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 6,
  },
  completedItemName: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  itemCategory: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  itemAddedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addedByText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  completedNotice: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  completedNoticeText: {
    fontSize: 12,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  timeRemaining: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeRemainingText: {
    fontSize: 9,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
});