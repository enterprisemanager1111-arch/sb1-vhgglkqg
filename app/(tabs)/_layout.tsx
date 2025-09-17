import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Chrome as Home, Users, Flame, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import AddItemModal from '@/components/AddItemModal';
import { DesignTokens, Layout } from '@/components/design-system/DesignTokens';
import { router } from 'expo-router';

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  
  // Filter to only show the 4 main tabs
  const visibleRoutes = state.routes.filter(route => 
    ['index', 'family', 'flames', 'profile'].includes(route.name)
  );

  return (
    <>
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      {/* Floating Action Button - Smaller and More Proportionate */}
      <View style={styles.fabContainer}>
        {/* White background circle */}
        <View style={styles.fabBackground} />
        <View style={styles.fab}>
          <Pressable
            style={styles.fabPressable}
            onPress={() => {
              setShowAddItemModal(true);
            }}
          >
            <Plus size={28} color={DesignTokens.colors.backgrounds.primary} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Tab Bar - Redesigned with Onboarding Aesthetics */}
      <View style={styles.tabBar}>
        {visibleRoutes.map((route, adjustedIndex) => {
            const { options } = descriptors[route.key];
            const originalIndex = state.routes.findIndex(r => r.key === route.key);
            const isFocused = state.index === originalIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Get the appropriate icon and label
            const getIconAndLabel = () => {
              const iconColor = isFocused ? DesignTokens.colors.primary[400] : DesignTokens.colors.neutral[400];
              const iconSize = 28;
              
              switch (route.name) {
                case 'index':
                  return {
                    icon: <Home size={iconSize} color={iconColor} strokeWidth={2} />
                  };
                case 'family':
                  return {
                    icon: <Users size={iconSize} color={iconColor} strokeWidth={2} />
                  };
                case 'flames':
                  return {
                    icon: <Flame size={iconSize} color={iconColor} strokeWidth={2} />
                  };
                case 'profile':
                  return {
                    icon: <Settings size={iconSize} color={iconColor} strokeWidth={2} />
                  };
                default:
                  return {
                    icon: <Home size={iconSize} color={iconColor} strokeWidth={2.5} />
                  };
              }
            };

            const { icon } = getIconAndLabel();

            return (
              <Pressable
                key={route.key}
                style={styles.tabItem}
                onPress={onPress}
              >
                <View style={[
                  styles.tabContent,
                  isFocused && styles.tabContentActive
                ]}>
                  <View style={styles.tabIconContainer}>
                    {icon}
                  </View>
                </View>
              </Pressable>
            );
          })}
      </View>
    </View>

    {/* Add Item Modal */}
    <AddItemModal
      visible={showAddItemModal}
      onClose={() => setShowAddItemModal(false)}
    />
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar completely
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="flames"
        options={{
          title: 'Flames',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: '/tasks', // Make accessible
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          href: '/shopping', // Make accessible
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: '/calendar', // Make accessible
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Container for the entire tab bar area - Onboarding Style
  tabBarContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    paddingBottom: DesignTokens.spacing.sm,
  },

  // Floating Action Button - Enhanced with Onboarding Aesthetics
  fabContainer: {
    position: 'absolute',
    top: -45,
    left: '50%',
    marginLeft: -45,
    zIndex: 10,
  },

  // White background circle behind FAB
  fabBackground: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    top: '50%',
    left: '50%',
    marginTop: -45,
    marginLeft: -45,
    zIndex: -1,
  },

  // FAB main circle - Larger and more prominent
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: DesignTokens.colors.primary[400],
    position: 'relative',
    zIndex: 2,
  },

  // FAB pressable area - Larger touch target
  fabPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Main tab bar container - Onboarding Background Color
  tabBar: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    borderTopLeftRadius: DesignTokens.radius.xl + DesignTokens.spacing.md,
    borderTopRightRadius: DesignTokens.radius.xl + DesignTokens.spacing.md,
    height: Layout.tabBarHeight,
    paddingTop: DesignTokens.spacing['2xl'] + DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing['2xl'],
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.neutral[200],
  },

  // Individual tab item
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    minWidth: 60,
  },

  // Tab content wrapper - Enhanced styling
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.md,
  },

  // Active tab content - Subtle highlight
  tabContentActive: {
    backgroundColor: DesignTokens.colors.primary[50],
  },

  // Tab icon container
  tabIconContainer: {
    // Icon now stands alone without text below
  },

  // Tab label text - Onboarding Typography
  tabLabel: {
    fontFamily: DesignTokens.typography.fonts.caption,
    fontSize: DesignTokens.typography.sizes.ui.small,
    textAlign: 'center',
    letterSpacing: 0.2,
    fontWeight: '600',
    marginTop: DesignTokens.spacing.xs,
  },
});