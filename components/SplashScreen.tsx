import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolate,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import Svg, { Path as SvgPath, Defs, Mask, Circle, Rect, Image as SvgImage } from 'react-native-svg';




const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  onFinish?: () => void;
}


export default function SplashScreen({ onAnimationComplete, onFinish }: SplashScreenProps) {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const pathProgress = useSharedValue(0);
  
  
  // Removed all logo animation variables
  
  // New Mask Effects
  const glowRingScale = useSharedValue(0);
  const shimmerOverlayX = useSharedValue(-120);
  
  // Welcome Text Effects
  const welcomeTextOpacity = useSharedValue(0);
  const welcomeTextScale = useSharedValue(0);
  const welcomeTextGlow = useSharedValue(0);
  const textShimmerX = useSharedValue(-200);
  
  // Sparkling Orbit Animation around Logo
  const orbitRotation = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const sparkle4Opacity = useSharedValue(0);
  const sparkle5Opacity = useSharedValue(0);
  const sparkle6Opacity = useSharedValue(0);
  const sparkle7Opacity = useSharedValue(0);
  const sparkle8Opacity = useSharedValue(0);
  const sparkleOrbitRotation = useSharedValue(0);
  
  // Rotating Animator around Logo
  const animatorRotation = useSharedValue(0);
  const animatorScale = useSharedValue(1);
  const animatorOpacity = useSharedValue(0);
  
  // Enhanced Cool Animations
  const logoGlow = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const logoShimmer = useSharedValue(0);
  const energyRings = useSharedValue(0);
  const particleBurst = useSharedValue(0);
  const energyRingsRotation = useSharedValue(0);
  const particleBurstRotation = useSharedValue(0);
  
  // Curved Path Animation
  const curvedPathProgress = useSharedValue(0);
  const curvedPathOpacity = useSharedValue(0);


  // Start animations
  useEffect(() => {
    // Background fade in
    backgroundOpacity.value = withTiming(1, { duration: 200 });
    
    // Logo appears immediately - no delays
    logoOpacity.value = 1; // Logo is visible from start
    logoScale.value = 1; // Logo is full size from start
    
    // 4. Removed all logo animations

    // 6. Removed scale animation

    // 7. Removed Mask Effect

    // 8. Removed Glow Ring Effect


    // 10. Removed Welcome Text Effects
    
    // 11. Sparkling Orbit Animation around Logo
    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 6000 }),
      -1,
      false
    );
    
    // Sparkle orbit rotation around center
    sparkleOrbitRotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
    
    // Staggered sparkle animations - All start immediately around logo
    sparkle1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle2Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle3Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle4Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle5Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle6Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle7Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    sparkle8Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
    
    // Rotating Animator around Logo
    animatorRotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
    
    animatorScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
    
    animatorOpacity.value = withTiming(1, { duration: 800 }); // Animator appears immediately
    
    // Enhanced Cool Animations - All start immediately around logo
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
    
    logoShimmer.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
    
    energyRings.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
    
    // Energy rings rotation around center
    energyRingsRotation.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false
    );
    
    particleBurst.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 1600 })
      ),
      -1,
      false
    );
    
    // Particle burst rotation around center
    particleBurstRotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );
    
    // Curved path animation - sweeps around the infinity symbol
    curvedPathOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
    
    curvedPathProgress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
    
    // Particle animation
    particleOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    
    // Complete animation and navigate
    setTimeout(() => {
      if (onFinish) {
          runOnJS(onFinish)();
      } else if (onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
    }, 1500);
  }, []);

  // Animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Removed all logo animation styles

  const particleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));


  const glowRingStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: glowRingScale.value },
    ],
    opacity: interpolate(glowRingScale.value, [1, 1.5], [0.3, 0.8], Extrapolate.CLAMP),
  }));

  const shimmerOverlayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerOverlayX.value },
    ],
  }));

  // Welcome Text Animated Styles
  const welcomeTextStyle = useAnimatedStyle(() => ({
    opacity: welcomeTextOpacity.value,
    transform: [
      { scale: welcomeTextScale.value },
    ],
  }));

  const welcomeTextGlowStyle = useAnimatedStyle(() => ({
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: interpolate(welcomeTextGlow.value, [0, 1], [5, 20], Extrapolate.CLAMP),
  }));

  const textShimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: textShimmerX.value },
    ],
  }));

  // Sparkling Orbit Animated Styles
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sparkleOrbitRotation.value}deg` }
    ],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3Opacity.value,
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4Opacity.value,
  }));

  const sparkle5Style = useAnimatedStyle(() => ({
    opacity: sparkle5Opacity.value,
  }));

  const sparkle6Style = useAnimatedStyle(() => ({
    opacity: sparkle6Opacity.value,
  }));

  const sparkle7Style = useAnimatedStyle(() => ({
    opacity: sparkle7Opacity.value,
  }));

  const sparkle8Style = useAnimatedStyle(() => ({
    opacity: sparkle8Opacity.value,
  }));

  // Rotating Animator Animated Styles
  const animatorStyle = useAnimatedStyle(() => ({
    opacity: animatorOpacity.value,
    transform: [
      { rotate: `${animatorRotation.value}deg` },
      { scale: animatorScale.value }
    ],
  }));

  // Enhanced Cool Animation Styles
  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const logoPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoPulse.value }],
  }));

  const logoShimmerStyle = useAnimatedStyle(() => ({
    opacity: logoShimmer.value,
  }));

  const energyRingsStyle = useAnimatedStyle(() => ({
    opacity: energyRings.value,
    transform: [{ rotate: `${energyRingsRotation.value}deg` }],
  }));

  const particleBurstStyle = useAnimatedStyle(() => ({
    opacity: particleBurst.value,
    transform: [{ rotate: `${particleBurstRotation.value}deg` }],
  }));
  
  const curvedPathStyle = useAnimatedStyle(() => ({
    opacity: curvedPathOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />
      
      {/* Background Gradient */}
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        <RNLinearGradient
          colors={['#17f196', '#00ff88', '#33ff99', '#17f196']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Floating Particles */}
        <Animated.View style={[styles.particles, particleAnimatedStyle]}>
          {[...Array(15)].map((_, index) => (
            <FloatingParticle key={index} index={index} />
          ))}
        </Animated.View>
      </Animated.View>

        {/* Background Effects */}
        <Animated.View style={[styles.logoContainer]}>
        
         {/* Logo SVG with Enhanced Cool Animations */}
         <View style={styles.logoImageContainer}>
           {/* Energy Rings Effect */}
           <Animated.View style={[styles.energyRings, energyRingsStyle]}>
             <View style={styles.energyRing1} />
             <View style={styles.energyRing2} />
             <View style={styles.energyRing3} />
           </Animated.View>
           
           {/* Logo Glow Effect */}
           <Animated.View style={[styles.logoGlow, logoGlowStyle]} />
           
           {/* Main Logo with Pulse */}
           <Animated.View style={[styles.logoWrapper, logoPulseStyle]}>
             <Image
               source={require('../assets/images/newImg/logo.svg')}
               style={styles.logoSvg}
               resizeMode="contain"
               onLoad={() => console.log('✅ Logo SVG loaded successfully!')}
               onError={(error) => console.log('❌ Logo SVG error:', error)}
             />
           </Animated.View>
           
           {/* Shimmer Effect */}
           <Animated.View style={[styles.logoShimmer, logoShimmerStyle]} />
           
           {/* Sparkling Orbit around Logo */}
           {/* <Animated.View style={[styles.sparklingOrbit, orbitStyle]}>
             <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]} />
             <Animated.View  style={[styles.sparkle, styles.sparkle2, sparkle2Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle4, sparkle4Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle5, sparkle5Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle6, sparkle6Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle7, sparkle7Style]} />
             <Animated.View style={[styles.sparkle, styles.sparkle8, sparkle8Style]} />
           </Animated.View> */}
           
           {/* Rotating Animator around Logo */}
           <Animated.View style={[styles.rotatingAnimator, animatorStyle]}>
             <View style={styles.animatorRing} />
             <View style={styles.animatorRing2} />
             <View style={styles.animatorRing3} />
           </Animated.View>
           
           {/* Particle Burst Effect */}
           {/* <Animated.View style={[styles.particleBurst, particleBurstStyle]}>
             <View style={styles.burstParticle1} />
             <View style={styles.burstParticle2} />
             <View style={styles.burstParticle3} />
             <View style={styles.burstParticle4} />
             <View style={styles.burstParticle5} />
             <View style={styles.burstParticle6} />
           </Animated.View> */}
           
           {/* Curved Path Animation */}
           <Animated.View style={[styles.curvedPathContainer, curvedPathStyle]}>
             <Svg width="300" height="300" viewBox="0 0 300 300">
               <SvgPath
                 d="M 250 250 Q 200 200 150 150 Q 100 100 50 150 Q 100 200 150 150 Q 200 100 250 50"
                 stroke="white"
                 strokeWidth="3"
                 fill="none"
                 strokeDasharray="10 5"
                 strokeDashoffset={interpolate(
                   curvedPathProgress.value,
                   [0, 1],
                   [50, -50],
                   Extrapolate.CLAMP
                 )}
                 opacity={curvedPathOpacity.value}
               />
             </Svg>
           </Animated.View>
            </View>



    </Animated.View>
    </View>
  );
}

// Floating Particle Component
function FloatingParticle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 50;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1,
        true
      )
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const randomX = Math.random() * (width - 20) + 10; // Keep 10px margin from edges
  const randomY = Math.random() * (height - 20) + 10; // Keep 10px margin from edges
  const randomSize = Math.random() * 4 + 2;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: randomX,
          top: randomY,
          width: randomSize,
          height: randomSize,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17f196',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
        logoImageContainer: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -50 }, { translateY: -50 }],
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        },
        logoSvg: {
          width: 100,
          height: 100,
          alignSelf: 'center',
        },
        logoWrapper: {
          position: 'relative',
          zIndex: 1003,
        },
        logoGlow: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '50%',
          left: '50%',
          transform: [{ translateX: -100 }, { translateY: -100 }],
          borderRadius: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 30,
          elevation: 20,
        },
        logoShimmer: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '-50%',
          left: '-50%',
          transform: [{ translateX: -100 }, { translateY: -100 }],
          borderRadius: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },  
        sparklingOrbit: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '-50%',
          left: '-50%',
          transform: [{ translateX: -100 }, { translateY: -100 }],
          borderRadius: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }, 
        rotatingAnimator: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '-50%',
          left: '-50%',
          transform: [{ translateX: -200 }, { translateY: -200 }],
          zIndex: 1001,
        },
        particleBurst: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '-50%',
          left: '-50%',
          transform: [{ translateX: -100 }, { translateY: -100 }],
          borderRadius: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
        curvedPathContainer: {
          position: 'absolute',
          width: 300,
          height: 300,
          top: '50%',
          left: '50%',
          transform: [{ translateX: -150 }, { translateY: -150 }],
          zIndex: 1006,
        },
        particles: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        energyRings: {
          position: 'absolute',
          width: 200,
          height: 200,
          top: '50%',
          left: '50%',
          transform: [{ translateX: -100 }, { translateY: -100 }],
          zIndex: 1000,
        },
        energyRing1: {
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        },
        energyRing2: {
          position: 'absolute',
          width: 160,
          height: 160,
          top: 20,
          left: 20,
          borderRadius: 80,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
        },
        energyRing3: {
          position: 'absolute',
    width: 120,
    height: 120,
          top: 40,
          left: 40,
    borderRadius: 60,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderRightColor: 'transparent',
          borderTopColor: 'transparent',
        },
        sparkle: {
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: 'white',
          borderRadius: 4,
          shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
    elevation: 10,
  },
        sparkle1: {
          top: 0,
          left: '50%',
          transform: [{ translateX: -4 }],
        },
        sparkle2: {
          top: '50%',
          right: 0,
          transform: [{ translateY: -4 }],
        },
        sparkle3: {
          bottom: 0,
          left: '50%',
          transform: [{ translateX: -4 }],
        },
        sparkle4: {
          top: '50%',
          left: 0,
          transform: [{ translateY: -4 }],
        },
        sparkle5: {
          top: '25%',
          right: '25%',
        },
        sparkle6: {
          bottom: '25%',
          right: '25%',
        },
        sparkle7: {
          bottom: '25%',
          left: '25%',
        },
        sparkle8: {
          top: '25%',
          left: '25%',
        },
        animatorRing: {
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          borderWidth: 2,
          borderColor: 'white',
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
        },
        animatorRing2: {
          position: 'absolute',
          width: 160,
          height: 160,
          top: 20,
          left: 20,
          borderRadius: 80,
          borderWidth: 2,
          borderColor: 'white',
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          borderTopColor: 'transparent',
        },
        animatorRing3: {
          position: 'absolute',
          width: 120,
          height: 120,
          top: 40,
          left: 40,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: 'white',
          borderRightColor: 'transparent',
          borderTopColor: 'transparent',
          borderLeftColor: 'transparent',
        },
        burstParticle1: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          top: 0,
          left: '50%',
          transform: [{ translateX: -3 }],
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        burstParticle2: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          top: '50%',
          right: 0,
          transform: [{ translateY: -3 }],
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        burstParticle3: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          bottom: 0,
          left: '50%',
          transform: [{ translateX: -3 }],
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        burstParticle4: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          top: '50%',
          left: 0,
          transform: [{ translateY: -3 }],
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        burstParticle5: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          top: '25%',
          right: '25%',
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        burstParticle6: {
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: 'white',
          borderRadius: 3,
          bottom: '25%',
          left: '25%',
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
        },
        particle: {
    position: 'absolute',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 50,
          shadowColor: 'white',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 8,
  },
});
