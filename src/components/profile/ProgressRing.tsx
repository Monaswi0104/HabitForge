import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  withSpring
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0 to 100
  radius?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  radius = 40,
  strokeWidth = 8,
  color = '#8B5CF6',
  backgroundColor = '#F3F4F6',
  textColor = '#1F2937'
}) => {
  const circumference = 2 * Math.PI * radius;
  const halfCircle = radius + strokeWidth;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    // Animate to the new progress percentage using a satisfying spring
    animatedProgress.value = withSpring(progress / 100, {
      damping: 15,
      stiffness: 90,
      mass: 1,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - circumference * animatedProgress.value;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={{ width: halfCircle * 2, height: halfCircle * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Svg
        width={halfCircle * 2}
        height={halfCircle * 2}
        viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}
      >
        <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
          <Circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.textContainer]}>
        <Text style={[styles.text, { color: textColor }]}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
