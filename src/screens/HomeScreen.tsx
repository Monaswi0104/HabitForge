import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { Colors } from '../constants/colors';
import HabitCard from '../components/habit/HabitCard';
import { format } from 'date-fns';
import { calculateStreak } from '../utils/streakCalculator';
import { executeQuery } from '../database/db';
import { HabitDay } from '../types/habit.types';
import { Bell, Flame, TrendingUp, CheckCircle2, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSettingsStore } from '../store/settingsStore';

export default function HomeScreen({ navigation }: any) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { activeProfileId, profiles } = useProfileStore();
  const { habits, completions, loadHabits, toggleCompletion } = useHabitStore();

  const [habitDays, setHabitDays] = useState<HabitDay[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayName = format(new Date(), 'E'); 

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  useFocusEffect(
    useCallback(() => {
      if (activeProfileId) {
        loadHabits(activeProfileId);
        executeQuery<HabitDay>('SELECT * FROM habit_days').then(days => {
          setHabitDays(days);
        });
      }
    }, [activeProfileId])
  );

  const todaysHabits = habits.filter(habit => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') {
      const daysForHabit = habitDays.filter(hd => hd.habit_id === habit.id).map(hd => hd.day);
      return daysForHabit.includes(todayName as any);
    }
    return true; 
  });

  const completedCount = todaysHabits.filter(h => 
    completions.some(c => c.habit_id === h.id && c.date === todayStr)
  ).length;

  const totalCount = todaysHabits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  let maxGlobalStreak = 0;
  todaysHabits.forEach(habit => {
    const habitCompletions = completions.filter(c => c.habit_id === habit.id);
    const stats = calculateStreak(habitCompletions, habit.frequency, habitDays.filter(hd => hd.habit_id === habit.id));
    if (stats.currentStreak > maxGlobalStreak) {
      maxGlobalStreak = stats.currentStreak;
    }
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleToggle = (habitId: string, isCurrentlyCompleted: boolean) => {
    toggleCompletion(habitId, todayStr);
    
    // Trigger confetti if this marks all habits complete
    const willBeCompletedCount = isCurrentlyCompleted ? completedCount - 1 : completedCount + 1;
    if (willBeCompletedCount === totalCount && totalCount > 0 && !isCurrentlyCompleted) {
      setShowConfetti(true);
    }
  };

  const handleNotificationsPress = () => {
    const habitsWithReminders = todaysHabits.filter(h => h.reminder_time);
    
    if (habitsWithReminders.length === 0) {
      Alert.alert('Notifications', 'No habit reminders scheduled for today.');
      return;
    }

    const details = habitsWithReminders.map(h => {
      const time = new Date(h.reminder_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `• ${h.title} at ${time}`;
    }).join('\n');

    Alert.alert('Today\'s Reminders', details);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.nameTitle, { color: theme.text }]}>
            {activeProfile?.name || 'User'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.bellBtn, { backgroundColor: theme.surface }]}
          onPress={handleNotificationsPress}
        >
          <Bell color={theme.text} size={22} />
          {todaysHabits.some(h => h.reminder_time) && (
            <View style={[styles.bellDot, { borderColor: theme.surface }]} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={todaysHabits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* Summary Cards Row */}
            <View style={styles.summaryRow}>
              {/* Progress Card */}
              <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconCircle}>
                    <CheckCircle2 color="#FFF" size={18} />
                  </View>
                  <Text style={styles.summaryPercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.summaryBarBg}>
                  <View style={[styles.summaryBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.summaryLabel}>
                  {completedCount}/{totalCount} Done
                </Text>
              </View>

              {/* Streak Card */}
              <View style={[styles.summaryCard, { backgroundColor: '#F97316' }]}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconCircle}>
                    <Flame color="#FFF" size={18} fill="#FFF" />
                  </View>
                  <Text style={styles.summaryPercent}>{maxGlobalStreak}</Text>
                </View>
                <Text style={styles.summaryStreakUnit}>Day Streak</Text>
                <Text style={styles.summaryLabel}>
                  Keep it going!
                </Text>
              </View>
            </View>

            {/* Quick Stats Row */}
            <View style={[styles.quickStatsRow, { backgroundColor: theme.surface }]}>
              <View style={styles.quickStat}>
                <TrendingUp color={theme.primary} size={18} />
                <Text style={[styles.quickStatValue, { color: theme.text }]}>{habits.length}</Text>
                <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Active</Text>
              </View>
              <View style={[styles.quickStatDivider, { backgroundColor: theme.border }]} />
              <View style={styles.quickStat}>
                <CheckCircle2 color="#10B981" size={18} />
                <Text style={[styles.quickStatValue, { color: theme.text }]}>{completedCount}</Text>
                <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Today</Text>
              </View>
              <View style={[styles.quickStatDivider, { backgroundColor: theme.border }]} />
              <View style={styles.quickStat}>
                <Flame color="#F97316" size={18} />
                <Text style={[styles.quickStatValue, { color: theme.text }]}>{maxGlobalStreak}</Text>
                <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Streak</Text>
              </View>
            </View>

            {/* Habits List Header */}
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Habits</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('AllHabits')}
                style={[styles.viewAllBtn, { backgroundColor: theme.primary + '15' }]}
              >
                <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.primary + '15' }]}>
              <Plus color={theme.primary} size={32} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No habits for today
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tap the + button to create your first habit
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const isCompleted = completions.some(c => c.habit_id === item.id && c.date === todayStr);
          return (
            <HabitCard
              title={item.title}
              frequency={item.frequency}
              isCompleted={isCompleted}
              color={item.color}
              index={index}
              onToggle={() => handleToggle(item.id, isCompleted)}
              onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
            />
          );
        }}
      />

      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: '600',
  },
  nameTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bellDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  summaryBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  summaryStreakUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  // Quick stats
  quickStatsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickStatDivider: {
    width: 1,
    height: '100%',
  },
  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
