import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '../types/navigation.types';
import { useHabitStore } from '../store/habitStore';
import { useSettingsStore } from '../store/settingsStore';
import { Colors } from '../constants/colors';
import { ArrowLeft, Play, Pause, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps,
  useAnimatedStyle,
  withTiming, 
  Easing,
  withRepeat,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import { triggerHaptic } from '../utils/haptics';
import { format } from 'date-fns';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCLE_RADIUS = 120;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

type Props = RootStackScreenProps<'FocusTimer'>;

export default function FocusTimerScreen({ route, navigation }: Props) {
  const { habitId, durationMins } = route.params;
  const insets = useSafeAreaInsets();
  
  const { habits, incrementProgress } = useHabitStore();
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  
  const habit = habits.find(h => h.id === habitId);
  const color = habit?.color || theme.primary;

  const totalSeconds = durationMins * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const progress = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(sec => sec - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Sync animation with state
  useEffect(() => {
    progress.value = withTiming(secondsLeft / totalSeconds, { duration: 1000, easing: Easing.linear });
  }, [secondsLeft, totalSeconds]);

  // Glow pulse when active
  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      );
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0.5);
    }
  }, [isActive]);

  const handleComplete = useCallback(async () => {
    triggerHaptic('notificationSuccess');
    setIsCompleted(true);
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (habit) {
      await incrementProgress(habit.id, todayStr, habit.target_count);
    }
  }, [habit, incrementProgress]);

  const toggleTimer = () => {
    triggerHaptic('impactLight');
    setIsActive(!isActive);
  };

  const cancelTimer = () => {
    triggerHaptic('impactLight');
    navigation.goBack();
  };

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_CIRCUMFERENCE * (1 - progress.value)
  }));

  const animatedGlowProps = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.05 }]
  }));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!habit) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={cancelTimer} style={styles.headerBtn}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Focus Mode</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.habitTitle, { color: theme.text }]}>{habit.title}</Text>
        
        <View style={styles.timerContainer}>
          {/* Glowing background circle */}
          <Animated.View style={[styles.glowContainer, animatedGlowProps]}>
            <Svg width={300} height={300}>
              <Circle
                cx={150}
                cy={150}
                r={CIRCLE_RADIUS}
                stroke={color}
                strokeWidth={20}
                fill="none"
                opacity={0.15}
              />
            </Svg>
          </Animated.View>

          {/* Main SVG circles */}
          <Svg width={300} height={300} style={styles.svg}>
            {/* Track */}
            <Circle
              cx={150}
              cy={150}
              r={CIRCLE_RADIUS}
              stroke={theme.border}
              strokeWidth={12}
              fill="none"
            />
            {/* Progress */}
            <AnimatedCircle
              cx={150}
              cy={150}
              r={CIRCLE_RADIUS}
              stroke={color}
              strokeWidth={12}
              fill="none"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform="rotate(-90 150 150)"
            />
          </Svg>

          <View style={styles.timeTextContainer}>
            <Text style={[styles.timeText, { color: theme.text }]}>
              {formatTime(secondsLeft)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          {isCompleted ? (
            <TouchableOpacity 
              style={[styles.playBtn, { backgroundColor: color }]} 
              onPress={() => navigation.goBack()}
            >
              <Check color="#FFF" size={32} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: theme.surface }]} 
                onPress={cancelTimer}
              >
                <X color={theme.text} size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.playBtn, { backgroundColor: color }]} 
                onPress={toggleTimer}
              >
                {isActive ? <Pause color="#FFF" size={32} /> : <Play color="#FFF" size={32} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  habitTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 60,
    letterSpacing: -0.5,
  },
  timerContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center'
  },
  svg: { position: 'absolute' },
  timeTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 80,
    gap: 30,
  },
  playBtn: {
    width: 88, height: 88,
    borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  cancelBtn: {
    width: 56, height: 56,
    borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  }
});
