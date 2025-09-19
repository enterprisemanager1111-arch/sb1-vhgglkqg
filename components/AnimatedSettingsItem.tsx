import React from 'react';
import { Pressable, View, Text, StyleSheet, Switch } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withSequence,
  withDelay,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedSettingsItemProps {
  item: {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    type?: 'navigation' | 'toggle' | 'action';
    value?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
    destructive?: boolean;
    badge?: string;
  };
  index: number;
  isLast: boolean;
}

export default function AnimatedSettingsItem({ item, index, isLast }: AnimatedSettingsItemProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value }
    ],
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, 0.3]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [4, 12]),
  }));
  
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.96, { 
      damping: 12, 
      stiffness: 300 
    });
    translateX.value = withSpring(4, { 
      damping: 15, 
      stiffness: 200 
    });
    iconScale.value = withSpring(1.1, { 
      damping: 10, 
      stiffness: 400 
    });
    glowIntensity.value = withTiming(1, { duration: 200 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { 
      damping: 20, 
      stiffness: 150 
    });
    translateX.value = withSpring(0, { 
      damping: 15, 
      stiffness: 200 
    });
    iconScale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 200 
    });
    glowIntensity.value = withTiming(0, { duration: 300 });
  };

  return (
    <View>
      <AnimatedPressable
        style={[
          styles.settingsItem,
          item.destructive && styles.destructiveItem,
          animatedStyle
        ]}
        onPress={item.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.settingsItemLeft}>
          <Animated.View style={[
            styles.settingsIcon,
            item.destructive && styles.destructiveIcon,
            iconAnimatedStyle
          ]}>
            {item.icon}
          </Animated.View>
          <View style={styles.settingsContent}>
            <Text style={[
              styles.settingsTitle,
              item.destructive && styles.destructiveText
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.settingsDescription}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.settingsItemRight}>
          {item.badge && (
            <View style={styles.settingsBadge}>
              <Text style={styles.settingsBadgeText}>{item.badge}</Text>
            </View>
          )}
          
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ 
                false: '#E0E0E0', 
                true: 'rgba(84, 254, 84, 0.3)' 
              }}
              thumbColor={item.value ? '#54FE54' : '#FFFFFF'}
            />
          )}
          
          {item.type === 'navigation' && (
            <ChevronRight size={16} color="#666666" strokeWidth={2} />
          )}
          
          {item.type === 'action' && (
            <ChevronRight size={16} color={item.destructive ? "#FF0000" : "#666666"} strokeWidth={2} />
          )}
        </View>
      </AnimatedPressable>
      
      {/* Divider between items (except last) */}
      {!isLast && (
        <View style={styles.itemDivider} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  destructiveItem: {
    backgroundColor: '#FFF5F5',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  destructiveIcon: {
    backgroundColor: '#FFE5E5',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#FF0000',
  },
  settingsDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBadge: {
    backgroundColor: '#54FE54',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settingsBadgeText: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 76, // Align with text content
  },
});
