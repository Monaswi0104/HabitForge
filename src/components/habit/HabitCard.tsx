import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Check, Trash2, Book, Dumbbell, Droplets, Brain, Pencil, Heart, BookOpen } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
  interpolate,
  FadeInDown
} from 'react-native-reanimated';
import { MotiView } from 'moti';
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

  const getLightBgColor = (hex: string) => {
    if (hex.length === 7) return hex + '18';
    return theme.border;
  };

  const renderIcon = (name: string | null | undefined, color: string, size = 22) => {
    switch (name) {
      case 'book': return <Book color={color} size={size} />;
      case 'dumbbell': return <Dumbbell color={color} size={size} />;
      case 'droplets': return <Droplets color={color} size={size} />;
      case 'brain': return <Brain color={color} size={size} />;
      case 'pencil': return <Pencil color={color} size={size} />;
      case 'heart': return <Heart color={color} size={size} />;
      default: return <BookOpen color={color} size={size} />;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 100, damping: 20, stiffness: 100 }}
    >
      <Animated.View style={[animatedCardStyle]}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={onLongPress}
          style={[
            styles.card, 
            { backgroundColor: theme.surface },
            isCompleted && !isSelectionMode && { opacity: 0.75 },
            isSelected && { borderColor: theme.primary, borderWidth: 2 },
          isSelectionMode && !isSelected && { opacity: 0.4 }
        ]}
      >
        {/* Colored accent strip on the left */}
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: getLightBgColor(accentColor) }]}>
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
            <Text style={[styles.frequency, { color: theme.textSecondary }]}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </Text>
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
    </MotiView>
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
