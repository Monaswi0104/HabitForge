import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue,
  SharedValue,
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { RootStackScreenProps } from '../../types/navigation.types';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Flame, Target, Trophy } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to HabitForge',
    description: 'Build lasting habits and track your progress with a clean, distraction-free interface.',
    icon: <Target size={80} color="#6366F1" />,
    color: '#E0E7FF'
  },
  {
    id: '2',
    title: 'Maintain Your Streak',
    description: 'Keep the fire alive! Complete your habits daily to earn XP and level up your profile.',
    icon: <Flame size={80} color="#F97316" />,
    color: '#FFF7ED'
  },
  {
    id: '3',
    title: 'Achieve Greatness',
    description: 'Focus mode, beautiful heatmaps, and detailed statistics will help you become your best self.',
    icon: <Trophy size={80} color="#10B981" />,
    color: '#D1FAE5'
  }
];

type Props = RootStackScreenProps<'Onboarding'>;

const PaginationDot = ({ index, scrollX, theme }: { index: number, scrollX: SharedValue<number>, theme: any }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );
    return { width: dotWidth, opacity };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: theme.primary },
        animatedDotStyle
      ]}
    />
  );
};

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    }
  });

  const handleScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    triggerHaptic('impactLight');
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      triggerHaptic('notificationSuccess');
      navigation.replace('CreateProfile');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((slide) => {
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
                {slide.icon}
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <PaginationDot key={index.toString()} index={index} scrollX={scrollX} theme={theme} />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRight color="#FFF" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  }
});
