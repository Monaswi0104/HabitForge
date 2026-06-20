import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Trash2, Book, Dumbbell, Droplets, Heart, BookOpen, Code, Wallet, Sparkles, GraduationCap, Activity } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
  interpolate,
  FadeInDown
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/colors';
import { useSettingsStore } from '../../store/settingsStore';
import { triggerHaptic } from '../../utils/haptics';

interface HabitCardProps {
  title: string;
  frequency: string;
  isCompleted: boolean;
  color?: string | null;
  iconName?: string | null;
  onToggle: () => void;
  onPress?: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
  targetCount?: number;
  targetUnit?: string | null;
  progressValue?: number;
  index?: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export default function HabitCard({ 
  title, 
  frequency,
  isCompleted, 
  color, 
  onToggle,
  onPress,
  onDelete,
  onLongPress,
  targetCount = 1,
  targetUnit,
  progressValue = 0,
  index = 0,
  iconName,
  isSelectionMode,
  isSelected
}: HabitCardProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const accentColor = color || theme.primary;

  const progress = useSharedValue(isCompleted ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(isCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 120
    });
  }, [isCompleted]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    if (onPress) {
      triggerHaptic('selection');
      onPress();
    }
  };

  const handleToggle = () => {
    triggerHaptic(isCompleted ? 'impactLight' : 'notificationSuccess');
    onToggle();
  };

  const animatedCheckboxStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', accentColor]
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, accentColor]
    );

    const scaleValue = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 1.3, 1]
    );

    return {
      backgroundColor,
      borderColor,
      transform: [
        { scale: scaleValue as any }
      ]
    };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getGradientColors = (hex: string): [string, string] => {
    if (isDarkMode) {
      return [hex + '12', hex + '04'];
    }
    return [hex + '0D', hex + '03'];
  };

  const renderIcon = (name: string | null | undefined, iconColor: string, size = 22) => {
    if (name && (name.match(/[\p{Emoji}]/u) || name.length <= 2) && name !== 'book' && name !== 'code') {
      return <Text style={{ fontSize: size - 2 }}>{name}</Text>;
    }
    switch (name) {
      case 'book': return <Book color={iconColor} size={size} />;
      case 'dumbbell': return <Dumbbell color={iconColor} size={size} />;
      case 'droplets': return <Droplets color={iconColor} size={size} />;
      case 'heart': return <Heart color={iconColor} size={size} />;
      case 'code': return <Code color={iconColor} size={size} />;
      case 'wallet': return <Wallet color={iconColor} size={size} />;
      case 'sparkles': return <Sparkles color={iconColor} size={size} />;
      case 'graduation-cap': return <GraduationCap color={iconColor} size={size} />;
      case 'activity': return <Activity color={iconColor} size={size} />;
      default: return <BookOpen color={iconColor} size={size} />;
    }
  };

  const progressFraction = targetCount > 1 ? Math.min(progressValue / targetCount, 1) : 0;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify().damping(20).stiffness(100)}
      style={[animatedCardStyle]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        style={[
          styles.card, 
          { backgroundColor: theme.surface },
          isCompleted && !isSelectionMode && { opacity: 0.8 },
          isSelected && { borderColor: theme.primary, borderWidth: 2 },
          isSelectionMode && !isSelected && { opacity: 0.4 }
        ]}
      >
        {/* Subtle gradient background tint */}
        <LinearGradient
          colors={getGradientColors(accentColor) as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Colored accent strip on the left */}
        <LinearGradient
          colors={[accentColor, accentColor + 'AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentStrip}
        />

        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + '1A' }]}>
            {renderIcon(iconName, accentColor, 22)}
          </View>
          <View style={styles.textContent}>
            <Text 
              style={[
                styles.title, 
                { color: theme.text },
                isCompleted && { textDecorationLine: 'line-through', color: theme.textSecondary }
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.frequency, { color: theme.textSecondary }]}>
                {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              </Text>
              {targetCount > 1 && (
                <>
                  <Text style={{ color: theme.textSecondary, marginHorizontal: 4, fontSize: 10 }}>•</Text>
                  <Text style={[styles.frequency, { color: accentColor, fontWeight: '700' }]}>
                    {progressValue}/{targetCount} {targetUnit || ''}
                  </Text>
                </>
              )}
            </View>
            {/* Progress bar for multi-step habits */}
            {targetCount > 1 && (
              <View style={[styles.progressBarBg, { backgroundColor: accentColor + '15' }]}>
                <View style={[styles.progressBarFill, { width: `${progressFraction * 100}%` as any, backgroundColor: accentColor }]} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          {isSelectionMode ? (
            <View style={[styles.selectionCircle, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              {isSelected && <Check color="#FFF" size={14} strokeWidth={3} />}
            </View>
          ) : (
            <>
              {onDelete && (
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={onDelete}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[styles.checkboxTouchArea, { marginRight: 8 }]}
                >
                  <Trash2 color={theme.textSecondary} size={20} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={handleToggle}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.checkboxTouchArea}
              >
                <Animated.View style={[styles.checkbox, animatedCheckboxStyle]}>
                  {isCompleted && <Check color="#FFF" size={16} strokeWidth={3} />}
                </Animated.View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 0,
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  accentStrip: {
    width: 5,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 18,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  frequency: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rightContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  checkboxTouchArea: {
    padding: 4,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  }
});
