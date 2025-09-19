import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Chrome as Home, Users, Flame, Settings, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import AddItemModal from '@/components/AddItemModal';
import { DesignTokens, Layout } from '@/components/design-system/DesignTokens';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useResponsiveContext } from '@/contexts/ResponsiveContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const { isMobile, isTablet, isDesktop, getResponsivePadding, scaleWidth, scaleHeight } = useResponsiveContext();
  
  
  // Filter to only show the 4 main tabs
  const visibleRoutes = state.routes.filter((route: any) => 
    ['index', 'family', 'flames', 'profile'].includes(route.name)
  );

  // Responsive values
  const responsivePadding = getResponsivePadding();
  const fabSize = isMobile ? 70 : isTablet ? 80 : 90;
  const fabIconSize = isMobile ? 28 : isTablet ? 32 : 36;
  const tabBarHeight = isMobile ? 80 : isTablet ? 90 : 100;

  return (
    <>
    <View style={[
      styles.tabBarContainer, 
      { 
        paddingBottom: Math.max(insets.bottom, 0),
        height: tabBarHeight + Math.max(insets.bottom, 0)
      }
    ]}>
      {/* Floating Action Button - Responsive */}
      <View style={[
        styles.fabContainer,
        {
          top: -fabSize / 2,
          marginLeft: -fabSize / 2,
        }
      ]}>
        {/* White background circle */}
        <View style={[
          styles.fabBackground,
          {
            width: fabSize + 20,
            height: fabSize + 20,
            borderRadius: (fabSize + 20) / 2,
            marginTop: -(fabSize + 20) / 2,
            marginLeft: -(fabSize + 20) / 2,
          }
        ]} />
        <View style={[
          styles.fab,
          {
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
          }
        ]}>
          <Pressable
            style={[
              styles.fabPressable,
              {
                borderRadius: fabSize / 2,
              }
            ]}
            onPress={() => {
              setShowAddItemModal(true);
            }}
          >
            <Plus size={fabIconSize} color={DesignTokens.colors.backgrounds.primary} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Tab Bar - Responsive */}
      <View style={[
        styles.tabBar,
        {
          height: tabBarHeight,
          paddingHorizontal: responsivePadding.horizontal,
        }
      ]}>
        {visibleRoutes.map((route: any, adjustedIndex: any) => {
            const { options } = descriptors[route.key];
            const originalIndex = state.routes.findIndex((r: any) => r.key === route.key);
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
              const iconSize = isMobile ? 24 : isTablet ? 28 : 32;
              
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
                style={[
                  styles.tabItem,
                  {
                    paddingHorizontal: isMobile ? 8 : isTablet ? 12 : 16,
                  }
                ]}
                onPress={onPress}
              >
                <View style={[
                  styles.tabContent,
                  isFocused && styles.tabContentActive,
                  {
                    paddingVertical: isMobile ? 8 : isTablet ? 10 : 12,
                  }
                ]}>
                  <View style={[
                    styles.tabIconContainer,
                    {
                      width: isMobile ? 40 : isTablet ? 44 : 48,
                      height: isMobile ? 40 : isTablet ? 44 : 48,
                      borderRadius: isMobile ? 20 : isTablet ? 22 : 24,
                    }
                  ]}>
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