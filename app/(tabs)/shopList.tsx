import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import { useFamily } from '@/contexts/FamilyContext';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';

export default function ShopListScreen() {
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  const styles = createStyles(theme, isDarkMode);
  const [activeFilter, setActiveFilter] = useState('Buy Items');
  const [familyTimeout, setFamilyTimeout] = useState(false);
  
  // Get shopping items data
  const { 
    items, 
    loading: itemsLoading, 
    error: itemsError,
    getCompletedItems,
    getPendingItems,
    refreshItems
  } = useFamilyShoppingItems();
  
  const { isInFamily, currentFamily, loading: familyLoading, refreshFamily, error, familyMembers, userRole } = useFamily();
  const [refreshing, setRefreshing] = useState(false);
  
  // Debug family data
  console.log('🏪 ShopList - Family loading:', familyLoading);
  console.log('🏪 ShopList - Current family:', currentFamily);
  console.log('🏪 ShopList - Is in family:', isInFamily);
  console.log('🏪 ShopList - Family ID:', currentFamily?.id);
  console.log('🏪 ShopList - Items loading:', itemsLoading);
  console.log('🏪 ShopList - Items count:', items.length);
  console.log('🏪 ShopList - Items error:', itemsError);
  
  // Additional debugging for family context
  console.log('🏪 ShopList - Family context debug:');
  console.log('🏪 ShopList - Family loading state:', familyLoading);
  console.log('🏪 ShopList - Family error state:', error);
  console.log('🏪 ShopList - Family members count:', familyMembers?.length || 0);
  console.log('🏪 ShopList - User role:', userRole);
  
  // Test family context directly
  React.useEffect(() => {
    const testFamilyContext = async () => {
      console.log('🧪 Testing family context directly...');
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('🧪 Auth user:', authUser?.id);
        
        if (authUser) {
          const { data: memberships, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', authUser.id);
          
          console.log('🧪 Direct family memberships query:', { memberships, error });
        }
      } catch (testError) {
        console.error('🧪 Direct test error:', testError);
      }
    };
    
    testFamilyContext();
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setFamilyTimeout(false);
    try {
      await Promise.all([
        refreshFamily(),
        refreshItems(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Timeout mechanism for family loading
  React.useEffect(() => {
    if (familyLoading) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Family loading timeout reached');
        setFamilyTimeout(true);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    } else {
      setFamilyTimeout(false);
    }
  }, [familyLoading]);

  // Calculate summary data
  const summaryData = useMemo(() => {
    const pendingItems = getPendingItems();
    const completedItems = getCompletedItems();
    
    return {
      itemsToBuy: pendingItems.length,
      purchasedItems: completedItems.length,
    };
  }, [items, getPendingItems, getCompletedItems]);

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    if (activeFilter === 'All Items') {
      return items;
    } else if (activeFilter === 'Buy Items') {
      return getPendingItems();
    } else if (activeFilter === 'Finished') {
      return getCompletedItems();
    }
    return items;
  }, [items, activeFilter, getPendingItems, getCompletedItems]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredItems.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      const purchasedDate = new Date(item.updated_at).toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
      groups[date].push({
        id: item.id,
        name: item.name,
        quantity: item.quantity || '1 stk.',
        status: item.completed ? 'purchased' : 'pending',
        statusText: item.completed 
          ? `${t('shopListPage.item.purchasedAt')} ${purchasedDate}`
          : t('shopListPage.item.pendingPurchase'),
        purchaser: item.creator_profile?.name || t('shopListPage.item.unknown'),
        purchaserAvatar: item.creator_profile?.name ? item.creator_profile.name.charAt(0).toUpperCase() : '?',
      });
    });
    
    return Object.entries(groups).map(([date, items], index) => ({
      id: index + 1,
      date,
      items,
    }));
  }, [filteredItems]);

  // Filter data for tabs
  const filterData = useMemo(() => {
    const allItems = items.length;
    const buyItems = getPendingItems().length;
    const finishedItems = getCompletedItems().length;
    
    return [
      { id: 'all', label: t('shopListPage.filters.allItems'), count: allItems, active: activeFilter === 'All Items' },
      { id: 'buy', label: t('shopListPage.filters.buyItems'), count: buyItems, active: activeFilter === 'Buy Items' },
      { id: 'finished', label: t('shopListPage.filters.finished'), count: finishedItems, active: activeFilter === 'Finished' },
    ];
  }, [items, activeFilter, getPendingItems, getCompletedItems, t]);

  // Show loading state for family or items
  if (familyLoading || itemsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17f196" />
          <Text style={styles.loadingText}>
            {familyLoading ? t('shopListPage.loading.family') : t('shopListPage.loading.items')}
          </Text>
          {familyTimeout && (
            <Text style={styles.timeoutText}>
              {t('shopListPage.loading.timeout')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state if family data is not available yet
  if (!currentFamily && !familyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17f196" />
          <Text style={styles.loadingText}>{t('shopListPage.loading.initializing')}</Text>
          <Text style={styles.timeoutText}>
            {t('shopListPage.loading.timeoutRefresh')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (itemsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('shopListPage.error.loadFailed')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if user is not in a family
  if (!isInFamily || !currentFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('shopListPage.empty.noFamily')}</Text>
          <Text style={styles.emptySubtext}>{t('shopListPage.empty.needFamily')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no items
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('shopListPage.empty.noItems')}</Text>
          <Text style={styles.emptySubtext}>{t('shopListPage.empty.addItems')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface}
      />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('shopListPage.header.title')}</Text>
            <Text style={styles.subtitle}>{t('shopListPage.header.subtitle')}</Text>
          </View>
          <View style={styles.headerIllustration}>
            <Image
              source={require('@/assets/images/icon/shopList_header.png')}
              style={styles.headerImage}
            />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#17f196"
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('shopListPage.summary.title')}</Text>
          <Text style={styles.summarySubtitle}>{t('shopListPage.summary.subtitle')}</Text>
          
          <View style={styles.progressCards}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View style={styles.progressDotGreen} />
                <Text style={styles.progressCardTitle}>{t('shopListPage.summary.itemsToBuy')}</Text>
              </View>
              <Text style={styles.progressCardValue}>{summaryData.itemsToBuy}</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View style={styles.progressDotBlue} />
                <Text style={styles.progressCardTitle}>{t('shopListPage.summary.purchasedItems')}</Text>
              </View>
              <Text style={styles.progressCardValue}>{summaryData.purchasedItems}</Text>
            </View>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBarContainer}>
          <View style={styles.filterBar}>
            {filterData.map((filter) => (
              <Pressable
                key={filter.id}
                style={[
                  styles.filterButton,
                  filter.active && styles.filterButtonActive
                ]}
                onPress={() => setActiveFilter(filter.label)}
              >
                <Text style={[
                  styles.filterText,
                  filter.active && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterBadge,
                  filter.active && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    filter.active && styles.filterBadgeTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Shopping Items List */}
        <View style={styles.contentContainer}>
          {groupedItems.map((dateGroup) => (
            <View key={dateGroup.id} style={styles.dateGroupPanel}>
              <View style={styles.dateHeader}>
                <Image
                  source={require('@/assets/images/icon/shop_date.png')}
                  style={styles.dateIcon}
                />
                <Text style={styles.dateText}>{dateGroup.date}</Text>
              </View>
              
              {dateGroup.items.map((item) => (
                <View key={item.id} style={styles.itemContainer}>
                  <View style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemLabel}>{t('shopListPage.item.item')}</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <View style={styles.quantityInfo}>
                        <Text style={styles.quantityLabel}>{t('shopListPage.item.quantity')}</Text>
                        <Text style={styles.quantityValue}>{item.quantity}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.itemFooter}>
                    <View style={styles.statusContainer}>
                      <Image
                        source={require('@/assets/images/icon/check.png')}
                        style={[
                          styles.statusIcon,
                          item.status === 'deleted' && styles.statusIconRed
                        ]}
                      />
                      <Text style={[
                        styles.statusText,
                        item.status === 'deleted' && styles.statusTextRed
                      ]}>
                        {item.statusText}
                      </Text>
                    </View>
                    <View style={styles.purchaserContainer}>
                      <Text style={styles.byText}>{t('shopListPage.item.by')}</Text>
                      <View style={styles.purchaserAvatar}>
                        <Text style={styles.purchaserAvatarText}>{item.purchaserAvatar}</Text>
                      </View>
                      <Text style={styles.purchaserName}>{item.purchaser}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: '#17f196',
    paddingTop: 40,
    minHeight: 230,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -90,
    paddingHorizontal: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FEFEFE',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D9D6FE',
  },
  headerIllustration: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    width: 176,
    height: 86,
    resizeMode: 'contain',
    position: 'absolute',
  },
  bagImage: {
    width: 80,
    height: 160,
    resizeMode: 'contain',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  summaryCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    lineHeight: 19.6,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    lineHeight: 16.8,
    marginBottom: 16,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 16,
  },
  progressCard: {
    flex: 1,
    backgroundColor: theme.input,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#19B36E',
  },
  progressDotBlue: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  progressCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  progressCardValue: {
    fontSize: 22,
    fontWeight: '400',
    color: theme.text,
  },
  filterBarContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 0,
    padding: 4,
    alignItems: 'center',
    elevation: 2,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#17f196',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    numberOfLines: 1,
  },
  filterTextActive: {
    color: '#fefefe',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterBadgeTextActive: {
    color: theme.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: 10,
  },
  dateGroupPanel: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: theme.input,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  quantityInfo: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  statusIconRed: {
    tintColor: '#F95555',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#19B36E',
  },
  statusTextRed: {
    color: '#F95555',
  },
  purchaserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  byText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  purchaserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaserAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  purchaserName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  timeoutText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
