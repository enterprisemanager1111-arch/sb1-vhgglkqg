import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import FeaturesToCreateModal from '@/components/FeaturesToCreateModal';
import TaskCreationModal from '@/components/TaskCreationModal';
import EventCreationModal from '@/components/EventCreationModal';
import ShoppingItemCreationModal from '@/components/ShoppingItemCreationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

// Custom Tab Bar Component with Dented Design
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  const [showEventCreationModal, setShowEventCreationModal] = useState(false);
  const [showShoppingItemCreationModal, setShowShoppingItemCreationModal] = useState(false);
  const { currentFamily, isInFamily, loading: familyLoading, refreshFamily, familyMembers } = useFamily();
  
  // Removed unnecessary family refresh - FamilyContext already loads data on mount

  // Removed unnecessary navigation listener - FamilyContext handles data loading

  // Handle feature selection from the modal
  const handleFeatureSelect = (feature: string) => {
    console.log('🎯 Feature selected:', feature);
    console.log('🎯 Calendar feature selected, setting showEventCreationModal to true');
    
    switch (feature) {
      case 'tasks':
        // Show task creation modal instead of navigating
        setShowTaskCreationModal(true);
        break;
      case 'calendar':
        // Show event creation modal instead of navigating
        console.log('🎯 About to set showEventCreationModal to true');
        setShowEventCreationModal(true);
        console.log('🎯 showEventCreationModal set to true');
        break;
      case 'shopList':
        // Show shopping item creation modal instead of navigating
        setShowShoppingItemCreationModal(true);
        break;
      case 'coming-soon':
        // This feature is disabled, do nothing
        console.log('🚫 Coming soon feature is not yet available');
        break;
      default:
        console.log('❓ Unknown feature selected:', feature);
    }
  };
  
  // Filter to only show the 4 main tabs
  const visibleRoutes = state.routes.filter((route: any) => 
    ['index', 'family', 'flames', 'profile'].includes(route.name)
  );

  return (
    <>
    <View style={[
      styles.tabBarContainer, 
      { 
        paddingBottom: Math.max(insets.bottom, 0),
      }
    ]}>
      {/* Add Button positioned on top */}
      <View style={styles.addButtonContainer}>
        {/* Gray half circle background (page background color) */}
        <View style={styles.grayHalfCircleBackground} />
        <Pressable
          style={styles.addButton}
          onPress={() => setShowFeaturesModal(true)}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Navigation Bar - Flat White Design */}
      <View style={styles.navigationBar}>
        {/* Navigation Items */}
        <View style={styles.navigationItems}>
          {/* Left Group: Home and Family */}
          <View style={styles.leftGroup}>
            {visibleRoutes.slice(0, 2).map((route: any) => {
              const originalIndex = state.routes.findIndex((r: any) => r.key === route.key);
              // Make home icon active when on tasks page, calendar page, or shopList page
              const isFocused = state.index === originalIndex || 
                (route.name === 'index' && (state.routes[state.index]?.name === 'tasks' || state.routes[state.index]?.name === 'calendar' || state.routes[state.index]?.name === 'shopList'));

              const onPress = async () => {
                console.log('🔍 Button pressed for route:', route.name);
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                console.log('🔍 After emit - isFocused:', isFocused, 'event.defaultPrevented:', event.defaultPrevented);
                console.log('🔍 Navigation check - isFocused:', isFocused, 'event.defaultPrevented:', event.defaultPrevented);
                console.log('🔍 Should proceed with navigation?', !isFocused && !event.defaultPrevented);
                
                if (!isFocused && !event.defaultPrevented) {
                  // Special handling for family button
                  if (route.name === 'family') {
                    console.log('🔍 Family button clicked!');
                    console.log('🔍 isInFamily:', isInFamily);
                    console.log('🔍 currentFamily:', !!currentFamily);
                    console.log('🔍 currentFamily name:', currentFamily?.name);
                    console.log('🔍 currentFamily id:', currentFamily?.id);
                    console.log('🔍 familyLoading:', familyLoading);
                    console.log('🔍 familyMembers count:', familyMembers?.length || 0);
                    
                    // Family button clicked - proceeding with navigation
                    
                    // Test simple navigation first
                    console.log('🔄 Testing simple navigation first...');
                    try {
                      router.push('/(tabs)/family');
                      console.log('✅ Simple navigation successful');
                      return;
                    } catch (simpleNavError) {
                      console.error('❌ Simple navigation failed:', simpleNavError);
                    }
                    
                    // Always try to refresh family data first to ensure we have the latest state
                    console.log('🔄 Refreshing family data to ensure latest state...');
                    try {
                      await refreshFamily();
                      // Wait for the refresh to complete
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      console.log('🔄 After refresh - isInFamily:', isInFamily);
                      console.log('🔄 After refresh - currentFamily:', !!currentFamily);
                      console.log('🔄 After refresh - currentFamily name:', currentFamily?.name);
                      console.log('🔄 After refresh - currentFamily id:', currentFamily?.id);
                      
                      // Force navigation based on current state (don't wait for state update)
                      console.log('🔄 Current state shows user has family, navigating directly...');
                      console.log('🔍 About to call router.push("/(tabs)/family")');
                      console.log('🔍 Router object:', router);
                      console.log('🔍 Router.push method:', typeof router.push);
                      
                      // Try multiple navigation methods
                      console.log('🔄 Attempting navigation method 1: router.push...');
                      try {
                        router.push('/(tabs)/family');
                        console.log('✅ router.push("/(tabs)/family") called successfully');
                        return;
                      } catch (navError) {
                        console.error('❌ router.push failed:', navError);
                      }
                      
                      console.log('🔄 Attempting navigation method 2: router.replace...');
                      try {
                        router.replace('/(tabs)/family');
                        console.log('✅ router.replace("/(tabs)/family") called successfully');
                        return;
                      } catch (navError) {
                        console.error('❌ router.replace failed:', navError);
                      }
                      
                      console.log('🔄 Attempting navigation method 3: navigation.navigate...');
                      try {
                        navigation.navigate('family');
                        console.log('✅ navigation.navigate("family") called successfully');
                        return;
                      } catch (navError) {
                        console.error('❌ navigation.navigate failed:', navError);
                      }
                      
                      console.log('❌ All navigation methods failed');
                    } catch (error) {
                      console.error('❌ Error refreshing family data:', error);
                      // If refresh fails, use current state
                      if (isInFamily && currentFamily) {
                        console.log('✅ User has family (fallback), navigating to /(tabs)/family');
                        router.push('/(tabs)/family');
                      } else {
                        console.log('❌ User has no family (fallback), navigating to newFamily page');
                        router.push('/(onboarding)/newFamily');
                      }
                    }
                  } else {
                    navigation.navigate(route.name);
                  }
                } else if (route.name === 'index' && (state.routes[state.index]?.name === 'tasks' || state.routes[state.index]?.name === 'calendar' || state.routes[state.index]?.name === 'shopList')) {
                  // If on tasks page, calendar page, or shopList page and clicking home icon, navigate to home
                  navigation.navigate('index');
                }
              };

              // Get the appropriate icon and label
              const getIconAndLabel = () => {
                const iconSize = 24;
                
                switch (route.name) {
                   case 'index':
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/home_active.png') : 
                             require('@/assets/images/icon/home_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Home'
                     };
                   case 'family':
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/family_active.png') : 
                             require('@/assets/images/icon/family_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Family'
                     };
                   default:
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/home_active.png') : 
                             require('@/assets/images/icon/home_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Home'
                     };
                }
              };

              const { icon, label } = getIconAndLabel();

              return (
                <Pressable
                  key={route.key}
                  style={styles.tabItem}
                  onPress={onPress}
                >
                  <View style={styles.tabContent}>
                    <View style={styles.tabIconContainer}>
                      {icon}
                    </View>
                    <Text style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                    ]}>
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          
          {/* Right Group: Flames and Profile */}
          <View style={styles.rightGroup}>
            {visibleRoutes.slice(2, 4).map((route: any) => {
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
                const iconSize = 24;
                
                 switch (route.name) {
                   case 'flames':
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/flames_active.png') : 
                             require('@/assets/images/icon/flames_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Flames'
                     };
                   case 'profile':
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/person_active.png') : 
                             require('@/assets/images/icon/person_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Profile'
                     };
                   default:
                     return {
                       icon: (
                         <Image
                           source={isFocused ? 
                             require('@/assets/images/icon/home_active.png') : 
                             require('@/assets/images/icon/home_normal.png')
                           }
                           style={{
                             width: iconSize,
                             height: iconSize,
                             resizeMode: 'contain'
                           }}
                         />
                       ),
                       label: 'Home'
                     };
                 }
              };

              const { icon, label } = getIconAndLabel();

              return (
                <Pressable
                  key={route.key}
                  style={styles.tabItem}
                  onPress={onPress}
                >
                  <View style={styles.tabContent}>
                    <View style={styles.tabIconContainer}>
                      {icon}
                    </View>
                    <Text style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelActive : styles.tabLabelInactive
                    ]}>
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>

    {/* Features to Create Modal - Only render when visible */}
    {showFeaturesModal && (
      <FeaturesToCreateModal
        visible={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        onFeatureSelect={handleFeatureSelect}
      />
    )}

    {/* Task Creation Modal - Only render when visible */}
    {showTaskCreationModal && (
      <TaskCreationModal
        visible={showTaskCreationModal}
        onClose={() => setShowTaskCreationModal(false)}
      />
    )}

    {/* Event Creation Modal - Only render when visible */}
    {showEventCreationModal && (
      <>
        {console.log('🎭 Rendering EventCreationModal with visible:', showEventCreationModal)}
        <EventCreationModal
          visible={showEventCreationModal}
          onClose={() => setShowEventCreationModal(false)}
        />
      </>
    )}

    {/* Shopping Item Creation Modal - Only render when visible */}
    {showShoppingItemCreationModal && (
      <ShoppingItemCreationModal
        visible={showShoppingItemCreationModal}
        onClose={() => setShowShoppingItemCreationModal(false)}
      />
    )}
    </>
  );
}

export default function TabLayout() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and user is NOT authenticated
    if (!authLoading && (!session || !user)) {
      console.log('🚫 User is not authenticated, redirecting from tabs to onboarding...');
      router.replace('/(onboarding)');
    }
  }, [session, user, authLoading, router]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking authentication...</Text>
        <ActivityIndicator size="large" color="#17f196" />
      </View>
    );
  }

  // If user is not authenticated, don't render the tabs
  if (!session || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Redirecting to onboarding...</Text>
        <ActivityIndicator size="large" color="#17f196" />
      </View>
    );
  }

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
  // Container for the entire tab bar area
  tabBarContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    height: 110,
  },

  // Add Button Container - positioned higher
  addButtonContainer: {
    position: 'absolute',
    top: -20, // Positioned higher for half circle
    left: '50%',
    marginLeft: -24, // Adjusted for Add button size
    zIndex: 10,
  },

  // Gray half circle background (page background color) - pointing downward
  grayHalfCircleBackground: {
    position: 'absolute',
    width: 64,
    height: 64, // Half the height for half circle
    backgroundColor: '#F5F5F5', // Gray color matching page background
    borderRadius: 30,
    top: 24, // Center of bottom side aligns with center of Add button
    left: -8,
    boxShadow: '0 -2px 4px 0px rgba(0, 0, 0, 0.05) inset',
    zIndex: 0,
  },

  // Add Button - Green circular button (no white outline)
  addButton: {
    top: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#17f196', // Updated green color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00a146', // Green shadow
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },

  // Navigation Bar - Flat White Design
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF', // White background like the image
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    boxShadow: '0 -1px 4px 0px rgba(0, 0, 0, 0.05)',
    elevation: 4,
  },

  // Navigation items container
  navigationItems: {
    flexDirection: 'row',
    height: '100%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between', // Space between left and right groups
    alignItems: 'center',
  },

  // Left group (Home and Family)
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, // Space between Home and Family
  },

  // Right group (Flames and Profile)
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, // Space between Flames and Profile
  },

  // Individual tab item
  tabItem: {
    alignItems: 'center',
    minWidth: 60,
  },

  // Tab content wrapper
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  // Tab icon container
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab label text
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Active tab label
  tabLabelActive: {
    color: '#17f196', // Bright green color for active state
  },

  // Inactive tab label
  tabLabelInactive: {
    color: '#888888', // Gray color for inactive state
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
});
