import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
import { FadeInAnimation, SlideInAnimation, BounceInAnimation } from '@/components/CoolAnimations';

interface RankSystemModalProps {
  visible: boolean;
  onClose: () => void;
  onStartGoal?: () => void | Promise<void>;
}

interface RankCard {
  id: string;
  title: string;
  icon: any;
  flames: number;
  totalFlames: number;
  description: string;
}

// Animated Rank Card Component
interface AnimatedRankCardProps {
  rank: RankCard;
  isMiddle: boolean;
  cardStyle: { width: number };
  styles: any;
  theme: ReturnType<typeof getTheme>;
}

const AnimatedRankCard: React.FC<AnimatedRankCardProps> = ({
  rank,
  isMiddle,
  cardStyle,
  styles,
  theme,
}) => {
  const scale = useSharedValue(isMiddle ? 1 : 0.85);
  
  useEffect(() => {
    scale.value = withSpring(isMiddle ? 1 : 0.85, {
      damping: 15,
      stiffness: 150,
    });
  }, [isMiddle]);
  
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  return (
    <Animated.View
      style={[
        styles.rankCard,
        cardStyle,
        isMiddle && styles.rankCardMiddle,
        animatedCardStyle,
      ]}
    >
      <Text style={[
        styles.rankTitle,
        isMiddle && styles.rankTitleMiddle
      ]}>
        {rank.title}
      </Text>
      <Text style={[
        styles.rankFlames,
        isMiddle && styles.rankFlamesMiddle
      ]}>
        {rank.flames} / {rank.totalFlames} Flames
      </Text>
      <View style={[
        styles.rankIcon,
        isMiddle ? styles.rankIconMiddle : styles.rankIconNormal
      ]}>
        <Image
          source={rank.icon}
          style={[
            styles.rankIconImage,
            isMiddle && styles.rankIconImageMiddle
          ]}
          resizeMode="contain"
        />
      </View>
      {isMiddle && (
        <Text style={styles.rankDescription}>
          {rank.description}
        </Text>
      )}
    </Animated.View>
  );
};

const RankSystemModal: React.FC<RankSystemModalProps> = ({
  visible,
  onClose,
  onStartGoal,
}) => {
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  const styles = createStyles(theme, isDarkMode);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const ranks: RankCard[] = [
    {
      id: 'contributor',
      title: 'The Contributor',
      icon: require('@/assets/images/icon/family_rank/contributor.png'),
      flames: 0,
      totalFlames: 1500,
      description: 'You\'re in the game! Keep mastering the basics and building your point total.',
    },
    {
      id: 'achiever',
      title: 'The Achiever',
      icon: require('@/assets/images/icon/family_rank/achiever.png'),
      flames: 1500,
      totalFlames: 5000,
      description: 'Solid effort! You consistently crush your goals and get things done.',
    },
    {
      id: 'coordinator',
      title: 'The Coordinator',
      icon: require('@/assets/images/icon/family_rank/coordinator.png'),
      flames: 5000,
      totalFlames: 10000,
      description: 'A true planner. Your smooth coordination keeps the family running efficiently.',
    },
    {
      id: 'keystone',
      title: 'The Keystone',
      icon: require('@/assets/images/icon/family_rank/anchor.png'), // Using anchor as placeholder
      flames: 10000,
      totalFlames: 17500,
      description: 'Foundational stability. You\'re the essential piece that holds the team together.',
    },
    {
      id: 'anchor',
      title: 'The Family Anchor',
      icon: require('@/assets/images/icon/family_rank/anchor.png'),
      flames: 17500,
      totalFlames: 30000,
      description: 'Unwavering reliability. The whole family depends on your dedication and focus.',
    },
    {
      id: 'captain',
      title: 'The Captain',
      icon: require('@/assets/images/icon/family_rank/captain.png'),
      flames: 25000,
      totalFlames: 40000,
      description: 'The undisputed leader. You inspire the team and set the standard for success.',
    },
  ];

  // Calculate card sizes to show exactly 3 items
  // Selected card is larger, unselected cards are smaller
  const cardWidth = screenWidth * 0.24; // Width for unselected cards (smaller)
  const cardWidthLarge = screenWidth * 0.32; // Width for selected card (larger)
  const cardSpacing = 12;
  const screenCenter = screenWidth / 2;
  
  // Calculate padding to allow first and last items to be centered
  // We need enough left padding so the first card can scroll to center
  const leftPadding = screenCenter - cardWidth / 2; // Enough to center first card
  const rightPadding = screenCenter - cardWidth / 2; // Enough to center last card
  // Use the larger of the two paddings to ensure both first and last can be centered
  const sidePadding = Math.max(leftPadding, (screenWidth - (cardWidth + cardSpacing + cardWidthLarge + cardSpacing + cardWidth)) / 2);

  // Calculate snap points for each card to center it
  const getSnapOffset = (index: number) => {
    // Use average width for consistent spacing calculation
    const avgCardWidth = (cardWidth + cardWidthLarge) / 2;
    let cardLeft = sidePadding;
    
    // Calculate position of each card
    for (let i = 0; i < index; i++) {
      cardLeft += avgCardWidth + cardSpacing;
    }
    
    const cardCenter = cardLeft + cardWidth / 2;
    const offset = cardCenter - screenCenter;
    
    // Don't allow negative scroll (can't scroll left past 0)
    return Math.max(0, offset);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollPosition(offsetX);
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Find which card's center is closest to the screen center
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < ranks.length; i++) {
      const { distanceFromCenter } = getCardPosition(i, offsetX);
      if (distanceFromCenter < minDistance) {
        minDistance = distanceFromCenter;
        closestIndex = i;
      }
    }
    
    // Snap to center the closest card
    if (scrollViewRef.current) {
      const snapOffset = getSnapOffset(closestIndex);
      scrollViewRef.current.scrollTo({
        x: snapOffset,
        animated: true,
      });
    }
  };

  // Helper to calculate card position with fixed spacing
  const getCardPosition = (index: number, scrollPos: number) => {
    const centeredIndex = getCenteredCardIndex(scrollPos);
    const isMiddle = index === centeredIndex;
    
    // Calculate position accounting for variable card widths
    const avgCardWidth = (cardWidth + cardWidthLarge) / 2;
    const cardLeft = sidePadding + (avgCardWidth + cardSpacing) * index;
    const currentCardWidth = isMiddle ? cardWidthLarge : cardWidth;
    const cardCenter = cardLeft + currentCardWidth / 2;
    const cardCenterInScreen = cardCenter - scrollPos;
    const distanceFromCenter = Math.abs(cardCenterInScreen - screenCenter);
    
    return { cardLeft, cardCenter, cardCenterInScreen, distanceFromCenter, isMiddle };
  };

  // Find which card is closest to center - always returns an index
  const getCenteredCardIndex = (scrollPos: number) => {
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < ranks.length; i++) {
      // Use average width for calculation
      const avgCardWidth = (cardWidth + cardWidthLarge) / 2;
      let cardLeft = sidePadding;
      
      // Calculate position of each card
      for (let j = 0; j < i; j++) {
        cardLeft += avgCardWidth + cardSpacing;
      }
      
      const cardCenter = cardLeft + cardWidth / 2;
      const cardCenterInScreen = cardCenter - scrollPos;
      const distance = Math.abs(cardCenterInScreen - screenCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    // Always return a valid index (guaranteed to have at least one card)
    return closestIndex;
  };

  const getCardStyle = (index: number) => {
    const centeredIndex = getCenteredCardIndex(scrollPosition);
    const isMiddle = index === centeredIndex;
    return {
      width: isMiddle ? cardWidthLarge : cardWidth,
    };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        
        <View style={{ width: '100%' }} pointerEvents="box-none">
          <SlideInAnimation direction="up" delay={100} duration={400} intensity={50}>
            <View style={styles.modalContainer}>
              {/* Icon */}
              <BounceInAnimation delay={200} duration={600}>
                <View style={styles.iconContainer} pointerEvents="box-none">
                  <View style={styles.icon}>
                    <View style={styles.barChartIcon}>
                      <View style={[styles.bar, styles.bar1]} />
                      <View style={[styles.bar, styles.bar2]} />
                      <View style={[styles.bar, styles.bar3]} />
                    </View>
                  </View>
                </View>
              </BounceInAnimation>

              {/* Modal Header */}
              <FadeInAnimation delay={300} duration={400}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Rank System</Text>
                  <Text style={styles.modalSubtitle}>
                    Here you can find everything you need to know about the ranks you can achieve. To advance, collect flames.
                  </Text>
                </View>
              </FadeInAnimation>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.formContainer}>
                  {/* Rank Cards - Horizontal Scrollable */}
                  <SlideInAnimation direction="up" delay={400} duration={400} intensity={30}>
                    <ScrollView
                      ref={scrollViewRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleScroll}
                      onScrollEndDrag={handleScrollEnd}
                      onMomentumScrollEnd={handleScrollEnd}
                      scrollEventThrottle={16}
                      decelerationRate="fast"
                      contentContainerStyle={[
                        styles.rankCardsScrollContainer,
                        { 
                          paddingLeft: sidePadding,
                          paddingRight: sidePadding,
                        }
                      ]}
                    >
                      {ranks.map((rank, index) => {
                        const cardStyle = getCardStyle(index);
                        const { isMiddle } = getCardPosition(index, scrollPosition);
                        
                        return (
                          <View 
                            key={rank.id} 
                            style={[
                              styles.rankCardWrapper,
                              { marginRight: index < ranks.length - 1 ? cardSpacing : 0 }
                            ]}
                          >
                            <BounceInAnimation delay={500 + (index * 50)} duration={600}>
                              <AnimatedRankCard
                                rank={rank}
                                isMiddle={isMiddle}
                                cardStyle={cardStyle}
                                styles={styles}
                                theme={theme}
                              />
                            </BounceInAnimation>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </SlideInAnimation>

                  {/* Start your goal button */}
                  <BounceInAnimation delay={800} duration={600}>
                    <Pressable
                      style={styles.startButton}
                      onPress={async () => {
                        if (onStartGoal) {
                          await onStartGoal();
                        }
                        onClose();
                      }}
                    >
                      <Text style={styles.startButtonText}>Start your goal</Text>
                    </Pressable>
                  </BounceInAnimation>
                </View>
              </View>
            </View>
          </SlideInAnimation>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
      width: '100%',
      maxHeight: screenHeight * 0.98,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 12,
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
      position: 'relative',
      shadowColor: '#17f196',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 9,
      elevation: 10,
    },
    barChartIcon: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 4,
      height: 35,
    },
    bar: {
      width: 6,
      backgroundColor: '#FFFFFF',
      borderRadius: 3,
    },
    bar1: {
      height: 12,
    },
    bar2: {
      height: 20,
    },
    bar3: {
      height: 28,
    },
    modalHeader: {
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Helvetica',
    },
    modalSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      textAlign: 'left',
      lineHeight: 18,
      marginBottom: 14,
      fontFamily: 'Helvetica',
    },
    content: {
      flex: 1,
    },
    formContainer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 16,
    },
    rankCardsScrollContainer: {
      paddingVertical: 8,
      marginBottom: 24,
    },
    rankCardWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankCard: {
      backgroundColor: theme.input,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      minHeight: 120,
      justifyContent: 'center',
    },
    rankCardMiddle: {
      borderColor: '#17F196',
      borderWidth: 2,
      backgroundColor: theme.input,
      height: 170,
      padding: 12,
    },
    rankIcon: {
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    rankIconNormal: {
      // backgroundColor: '#E8F8F0',
    },
    rankIconMiddle: {
      width: 80,
      height: 80,
      // backgroundColor: '#E8F8F0',
      marginBottom: 8,
    },
    rankIconImage: {
      width: 32,
      height: 32,
    },
    rankIconImageMiddle: {
      width: 56,
      height: 56,
    },
    rankTitle: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 3,
      textAlign: 'center',
      fontFamily: 'Helvetica',
    },
    rankFlames: {
      fontSize: 8,
      fontWeight: '400',
      color: theme.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
      fontFamily: 'Helvetica',
    },
    rankFlamesMiddle: {
      fontSize: 10,
      marginBottom: 8,
    },
    rankDescription: {
      fontSize: 6,
      fontWeight: '400',
      fontStyle: 'italic',
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 8,
      marginTop: 4,
      fontFamily: 'Helvetica',
      paddingHorizontal: 4,
    },
    rankDescriptionMiddle: {
      fontSize: 11,
      lineHeight: 16,
    },
    rankTitleMiddle: {
      fontSize: 12,
      fontWeight: '600',
    },
    startButton: {
      width: '100%',
      height: 50,
      backgroundColor: '#17f196',
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      shadowColor: '#17f196',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    startButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
      fontFamily: 'Helvetica',
    },
  });
};

export default RankSystemModal;

