import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { ChevronDown, Flame, Trophy, TrendingUp, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';
import { calculateStreak } from '../utils/streakCalculator';
import { subDays, format, isAfter, startOfDay } from 'date-fns';
import { useSettingsStore } from '../store/settingsStore';
import HeatmapCalendar from '../components/habit/HeatmapCalender';

export default function ProgressScreen() {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  
  const { habits, completions } = useHabitStore();

  const stats = useMemo(() => {
    if (habits.length === 0) {
      return { total: 0, currentStreak: 0, bestStreak: 0, monthlyRate: 0, weeklyChart: Array(7).fill(0) };
    }

    let maxCurrent = 0;
    let maxBest = 0;

    habits.forEach(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const { currentStreak, longestStreak } = calculateStreak(habitCompletions, habit.frequency);
      if (currentStreak > maxCurrent) maxCurrent = currentStreak;
      if (longestStreak > maxBest) maxBest = longestStreak;
    });

    // Monthly Completion Rate (Last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentCompletions = completions.filter(c => isAfter(new Date(c.date), thirtyDaysAgo));
    const possibleCompletions = habits.length * 30; // Rough estimate
    const monthlyRate = possibleCompletions > 0 ? Math.round((recentCompletions.length / possibleCompletions) * 100) : 0;

    // Weekly Chart (Mon - Sun)
    const today = new Date();
    const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0 for Mon, 6 for Sun
    
    // We want the last 7 days leading up to today, mapped to Mon-Sun
    // But standard chart usually shows the CURRENT week Mon-Sun
    const startOfCurrentWeek = subDays(today, currentDayOfWeek);
    
    const weeklyChart = Array.from({ length: 7 }).map((_, i) => {
      const date = startOfDay(subDays(startOfCurrentWeek, -i));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (isAfter(date, today)) return 0; // Future days
      
      const completionsOnDay = completions.filter(c => c.date === dateStr).length;
      return Math.round((completionsOnDay / habits.length) * 100);
    });

    return {
      total: habits.length,
      currentStreak: maxCurrent,
      bestStreak: Math.max(maxCurrent, maxBest),
      monthlyRate: Math.min(monthlyRate, 100),
      weeklyChart
    };
  }, [habits, completions]);

  // Overall Weekly Completion Rate
  const overallWeekly = useMemo(() => {
    const pastDays = stats.weeklyChart.filter((_, i) => i <= (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
    if (pastDays.length === 0) return 0;
    const sum = pastDays.reduce((a, b) => a + b, 0);
    return Math.round(sum / pastDays.length);
  }, [stats.weeklyChart]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
        <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
        <TouchableOpacity 
          style={[styles.weekDropdown, { backgroundColor: theme.surface }]}
          onPress={() => Alert.alert('Timeframe', 'Changing the timeframe will be supported soon.')}
        >
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>This Week</Text>
          <ChevronDown color={theme.textSecondary} size={16} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Completion Rate Chart Card */}
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Completion Rate</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Weekly overview</Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: theme.primary + '15' }]}>
              <TrendingUp color={theme.primary} size={14} />
              <Text style={[styles.chartPercent, { color: theme.primary }]}>{overallWeekly}%</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.barsContainer}>
              {stats.weeklyChart.map((h, i) => {
                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                const barColor = h === 100 ? '#10B981' : (isToday ? theme.primary : theme.secondary);
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.barBg, { backgroundColor: theme.border + '60' }]}>
                      <View style={[
                        styles.barFill, 
                        { 
                          height: `${h}%`, 
                          backgroundColor: barColor,
                          borderRadius: 6,
                        }
                      ]} />
                    </View>
                    <Text style={[
                      styles.xLabel, 
                      { color: isToday ? theme.text : theme.textSecondary },
                      isToday && { fontWeight: '700' }
                    ]}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#4F46E520' }]}>
              <Target color="#4F46E5" size={20} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Total Habits</Text>
            <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>Active habits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#10B98120' }]}>
              <TrendingUp color="#10B981" size={20} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.monthlyRate}%</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Monthly</Text>
            <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>Completion</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#F9731620' }]}>
              <Flame color="#F97316" size={20} />
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.currentStreak}</Text>
            </View>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Current Streak</Text>
            <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#F59E0B20' }]}>
              <Trophy color="#F59E0B" size={20} />
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.bestStreak}</Text>
            </View>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Best Streak</Text>
            <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>Days</Text>
          </View>
        </View>

        {/* Yearly Heatmap Card */}
        <View style={[styles.heatmapCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>Activity Heatmap</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: 16 }]}>Your consistency over the last 90 days</Text>
          <HeatmapCalendar completions={completions} days={90} color={theme.primary} />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  weekDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Chart Card
  chartCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chartPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartContainer: {
    height: 160,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBg: {
    width: 28,
    height: 120,
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 10,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  xLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Heatmap Card
  heatmapCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heatmapMonthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heatmapMonthLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  heatmapGrid: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
