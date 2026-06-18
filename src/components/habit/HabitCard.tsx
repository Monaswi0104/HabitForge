import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Check, BookOpen, Trash2 } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
  FadeInDown
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { useSettingsStore } from '../../store/settingsStore';

interface HabitCardProps {
  title: string;
  frequency: string;
  isCompleted: boolean;
  color?: string | null;
  iconName?: string | null;
  onToggle: () => void;
  onPress?: () => void;
  onDelete?: () => void;
  index?: number;
}

export default function HabitCard({ 
  title, 
  frequency,
  isCompleted, 
  color, 
  onToggle,
  onPress,
  onDelete,
  index = 0
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
    if (onPress) onPress();
  };

  const handleToggle = () => {
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

    return {
      backgroundColor,
      borderColor,
      transform: [
        { scale: isCompleted ? withSpring(1.1) : withSpring(1) }
      ]
    };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getLightBgColor = (hex: string) => {
    if (hex.length === 7) return hex + '18';
    return theme.border;
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify().damping(14)}
      style={[animatedCardStyle]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card, 
          { backgroundColor: theme.surface },
          isCompleted && { opacity: 0.75 }
        ]}
      >
        {/* Colored accent strip on the left */}
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: getLightBgColor(accentColor) }]}>
            <BookOpen color={accentColor} size={22} />
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
            <Text style={[styles.frequency, { color: theme.textSecondary }]}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.rightContent}>
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  accentStrip: {
    width: 5,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  frequency: {
    fontSize: 13,
    fontWeight: '500',
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
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
