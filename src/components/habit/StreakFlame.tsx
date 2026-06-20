import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  withTiming,
  FadeIn
} from 'react-native-reanimated';

interface StreakFlameProps {
  streakCount: number;
}

export default function StreakFlame({ streakCount }: StreakFlameProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (streakCount > 0) {
      // Base scale increases slightly with higher streaks (caps at 1.5)
      const targetScale = Math.min(1 + (streakCount * 0.05), 1.5);
      scale.value = withSpring(targetScale);
      
      if (streakCount >= 3) {
        // "On fire" pulsing animation for streak >= 3
        opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.6, { duration: 500 })
          ),
          -1, // infinite
          true // reverse
        );
      } else {
        opacity.value = withTiming(0.8);
      }
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(0.3);
    }
  }, [streakCount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Color changes based on streak intensity
  const getFlameColor = () => {
    if (streakCount >= 7) return '#3B82F6'; // Blue flame for high streak!
    if (streakCount >= 3) return '#EF4444'; // Red flame
    if (streakCount > 0) return '#F97316';  // Orange flame
    return '#9CA3AF'; // Gray flame for 0 streak
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <Animated.View style={animatedStyle}>
        <Flame color={getFlameColor()} size={20} fill={streakCount > 0 ? getFlameColor() : 'transparent'} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
});
