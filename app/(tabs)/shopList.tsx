import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { router } from 'expo-router';

export default function ShopListScreen() {
  const [activeFilter, setActiveFilter] = useState('Buy Items');

  // Mock data for the design
  const mockData = {
    summary: {
      itemsToBuy: 20,
      purchasedItems: 2,
    },
    filters: [
      { id: 'all', label: 'All Items', count: 3, active: activeFilter === 'All Items' },
      { id: 'buy', label: 'Buy Items', count: 2, active: activeFilter === 'Buy Items' },
      { id: 'finished', label: 'Finished', count: 2, active: activeFilter === 'Finished' },
    ],
    items: [
      {
        id: 1,
        date: '18 September 2024',
        items: [
          {
            id: 1,
            name: 'Pizza Tonno',
            quantity: '2 stk.',
            status: 'purchased',
            statusText: 'Purchased at 19 Sept 2024',
            purchaser: 'Elaine',
            purchaserAvatar: 'E',
          },
        ],
      },
      {
        id: 2,
        date: '21 September 2024',
        items: [
          {
            id: 2,
            name: 'Coca Cola Lite',
            quantity: '10 stk.',
            status: 'deleted',
            statusText: 'Deleted at 22 Sept 2024',
            purchaser: 'Elaine',
            purchaserAvatar: 'E',
          },
        ],
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Shopping List</Text>
            <Text style={styles.subtitle}>Don't forget your shopping list</Text>
          </View>
          <View style={styles.headerIllustration}>
            <Image
              source={require('@/assets/images/icon/shopList_header.png')}
              style={styles.headerImage}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Perfekt Shopping List</Text>
          <Text style={styles.summarySubtitle}>Your current shopping list</Text>
          
          <View style={styles.progressCards}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View style={styles.progressDotGreen} />
                <Text style={styles.progressCardTitle}>Items to Buy</Text>
              </View>
              <Text style={styles.progressCardValue}>{mockData.summary.itemsToBuy}</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressCardHeader}>
                <View style={styles.progressDotBlue} />
                <Text style={styles.progressCardTitle}>Purchased Items</Text>
              </View>
              <Text style={styles.progressCardValue}>{mockData.summary.purchasedItems}</Text>
            </View>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBarContainer}>
          <View style={styles.filterBar}>
            {mockData.filters.map((filter) => (
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
          {mockData.items.map((dateGroup) => (
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
                        <Text style={styles.itemLabel}>Item</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <View style={styles.quantityInfo}>
                        <Text style={styles.quantityLabel}>Quantity</Text>
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
                      <Text style={styles.byText}>By</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f8',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    lineHeight: 19.6,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475467',
    lineHeight: 16.8,
    marginBottom: 16,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 16,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBECEE',
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
    color: '#475467',
  },
  progressCardValue: {
    fontSize: 22,
    fontWeight: '400',
    color: '#101828',
  },
  filterBarContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
    color: '#475467',
    numberOfLines: 1,
  },
  filterTextActive: {
    color: '#fefefe',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475467',
  },
  filterBadgeTextActive: {
    color: '#475467',
  },
  contentContainer: {
    paddingHorizontal: 10,
  },
  dateGroupPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
    color: '#2D2D2D',
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
    color: '#475467',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  quantityInfo: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
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
    color: '#475467',
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
    color: '#2D2D2D',
  },
  bottomSpacing: {
    height: 100,
  },
});
