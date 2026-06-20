import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, FadeInDown } from 'react-native-reanimated';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';

interface ProfileCardProps {
  name: string;
  color: string;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpProgress: number;
  xpPerLevel: number;
  streak?: number;
  completion?: number;
  activeHabits?: number;
}

export default function ProfileCard({
  name,
  color,
  currentLevel,
  xpInCurrentLevel,
  xpProgress,
  xpPerLevel,
  streak = 0,
  completion = 0,
  activeHabits = 0
}: ProfileCardProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(Math.max(xpProgress * 100, 0), 100), {
      duration: 1000,
      easing: Easing.out(Easing.cubic)
    });
  }, [xpProgress]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`
    };
  });

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={[styles.profileCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <Text style={[styles.name, { color: theme.text }]}>{name || 'User'}</Text>
      <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
        <Award color="#FFF" size={14} />
        <Text style={styles.levelText}>Level {currentLevel}</Text>
      </View>
      
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>Experience</Text>
          <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>{Math.round(xpInCurrentLevel)} / {xpPerLevel} XP</Text>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}>
          <Animated.View style={[styles.xpBarFill, { backgroundColor: theme.primary }, progressStyle]} />
        </View>
      </View>

      <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{streak} Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{activeHabits} Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>✨</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(completion)}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  levelText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  xpSection: {
    width: '100%',
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  xpBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
});
