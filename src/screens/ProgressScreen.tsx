import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import {
  Flame, Trophy, TrendingUp, Target, CheckCircle2,
  Clock, BarChart3, PieChart, Hash, Calendar,
  ChevronDown, Zap
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';
import { calculateStreak } from '../utils/streakCalculator';
import { subDays, format, isAfter, startOfDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useSettingsStore } from '../store/settingsStore';
import HeatmapCalendar from '../components/habit/HeatmapCalender';
import { executeQuery } from '../database/db';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryRow {
  id: string;
  name: string;
}

export default function ProgressScreen() {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { habits, completions } = useHabitStore();

  // Load category names from the database
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await executeQuery<{ id: string; name: string }>('SELECT id, name FROM categories');
        const map = new Map<string, string>();
        cats.forEach(c => map.set(c.id, c.name));
        setCategoryNames(map);
      } catch (e) {
        console.warn('Failed to load categories for stats:', e);
      }
    };
    loadCategories();
  }, []);

  // ────────────────────── DATA CRUNCHING ──────────────────────

  const stats = useMemo(() => {
    if (habits.length === 0) {
      return {
        totalHabits: 0,
        totalCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        weeklyChart: Array(7).fill(0),
        avgCompletionTime: null as string | null,
        categoryDistribution: [] as { name: string; count: number; color: string }[],
      };
    }

    // ── Streak Calculation ──
    let maxCurrent = 0;
    let maxLongest = 0;

    habits.forEach(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const { currentStreak, longestStreak } = calculateStreak(habitCompletions, habit.frequency);
      if (currentStreak > maxCurrent) maxCurrent = currentStreak;
      if (longestStreak > maxLongest) maxLongest = longestStreak;
    });

    // ── Monthly Completion Rate (Last 30 days) ──
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentCompletions30 = completions.filter(c => isAfter(new Date(c.date), thirtyDaysAgo));
    const possibleMonth = habits.length * 30;
    const monthlyRate = possibleMonth > 0 ? Math.round((recentCompletions30.length / possibleMonth) * 100) : 0;

    // ── Weekly Completion Rate (This Week Mon–Sun) ──
    const today = new Date();
    const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startOfCurrentWeek = subDays(today, currentDayOfWeek);

    const weeklyChart = Array.from({ length: 7 }).map((_, i) => {
      const date = startOfDay(subDays(startOfCurrentWeek, -i));
      const dateStr = format(date, 'yyyy-MM-dd');
      if (isAfter(date, today)) return 0;
      const completionsOnDay = completions.filter(c => c.date === dateStr).length;
      return habits.length > 0 ? Math.round((completionsOnDay / habits.length) * 100) : 0;
    });

    const pastWeekDays = weeklyChart.filter((_, i) => i <= currentDayOfWeek);
    const weeklyRate = pastWeekDays.length > 0 ? Math.round(pastWeekDays.reduce((a, b) => a + b, 0) / pastWeekDays.length) : 0;

    // ── All-time Completion Rate ──
    // (total completions) / (habits × days since first habit was created)
    const oldestHabit = habits.reduce((oldest, h) => {
      const created = new Date(h.created_at);
      return created < oldest ? created : oldest;
    }, new Date());
    const daysSinceStart = Math.max(1, Math.ceil((Date.now() - oldestHabit.getTime()) / (1000 * 60 * 60 * 24)));
    const possibleAll = habits.length * daysSinceStart;
    const completionRate = possibleAll > 0 ? Math.min(100, Math.round((completions.length / possibleAll) * 100)) : 0;

    // ── Average Completion Time ──
    let avgCompletionTime: string | null = null;
    const completionsWithTime = completions.filter(c => c.completed_at);
    if (completionsWithTime.length > 0) {
      let totalMinutes = 0;
      let validCount = 0;
      completionsWithTime.forEach(c => {
        try {
          const date = new Date(c.completed_at);
          if (!isNaN(date.getTime())) {
            totalMinutes += date.getHours() * 60 + date.getMinutes();
            validCount++;
          }
        } catch {}
      });
      if (validCount > 0) {
        const avgMin = Math.round(totalMinutes / validCount);
        const hours = Math.floor(avgMin / 60);
        const minutes = avgMin % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours % 12 === 0 ? 12 : hours % 12;
        avgCompletionTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    }

    // ── Category Distribution ──
    // Group habits by category_id and count them
    const categoryMap = new Map<string, { count: number }>();
    habits.forEach(h => {
      const catId = h.category_id || 'uncategorized';
      const existing = categoryMap.get(catId);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(catId, { count: 1 });
      }
    });

    const categoryColors = [
      '#4F46E5', '#10B981', '#F97316', '#EC4899', '#3B82F6',
      '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6', '#9CA3AF'
    ];

    // Build distribution array
    const categoryDistribution: { name: string; count: number; color: string }[] = [];
    let colorIdx = 0;
    categoryMap.forEach((val, key) => {
      const resolvedName = key === 'uncategorized' ? 'Other' : (categoryNames.get(key) || key);
      categoryDistribution.push({
        name: resolvedName,
        count: val.count,
        color: categoryColors[colorIdx % categoryColors.length],
      });
      colorIdx++;
    });

    // Sort by count descending
    categoryDistribution.sort((a, b) => b.count - a.count);

    return {
      totalHabits: habits.length,
      totalCompletions: completions.length,
      currentStreak: maxCurrent,
      longestStreak: Math.max(maxCurrent, maxLongest),
      completionRate,
      weeklyRate,
      monthlyRate: Math.min(monthlyRate, 100),
      weeklyChart,
      avgCompletionTime,
      categoryDistribution,
    };
  }, [habits, completions, categoryNames]);

  // ────────────────────── RENDER ──────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
        <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
        <View style={[styles.weekDropdown, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Dashboard</Text>
          <BarChart3 color={theme.textSecondary} size={16} style={{ marginLeft: 6 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ═══════ KEY METRICS GRID ═══════ */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.metricsSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>KEY METRICS</Text>

          {/* Row 1: Streak cards */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#F9731615' }]}>
                <Flame color="#F97316" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Current Streak</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>days</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#F59E0B15' }]}>
                <Trophy color="#F59E0B" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{stats.longestStreak}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Longest Streak</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>days</Text>
            </View>
          </View>

          {/* Row 2: Totals */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#4F46E515' }]}>
                <Target color="#4F46E5" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{stats.totalHabits}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Habits</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>active</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#10B98115' }]}>
                <CheckCircle2 color="#10B981" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{stats.totalCompletions}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Completions</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>all-time</Text>
            </View>
          </View>

          {/* Row 3: Rates + Avg Time */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#8B5CF615' }]}>
                <Zap color="#8B5CF6" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>{stats.completionRate}%</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Completion Rate</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>all-time</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.metricIconBg, { backgroundColor: '#EC489915' }]}>
                <Clock color="#EC4899" size={20} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text, fontSize: stats.avgCompletionTime ? 22 : 28 }]}>
                {stats.avgCompletionTime || '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Avg. Time</Text>
              <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>completion</Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══════ WEEKLY COMPLETION CHART ═══════ */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Weekly Completion</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>This week's overview</Text>
              </View>
              <View style={[styles.percentBadge, { backgroundColor: theme.primary + '15' }]}>
                <TrendingUp color={theme.primary} size={14} />
                <Text style={[styles.chartPercent, { color: theme.primary }]}>{stats.weeklyRate}%</Text>
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
                        <Animated.View
                          entering={FadeInDown.delay(300 + i * 80).springify()}
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(h, 2)}%`,
                              backgroundColor: barColor,
                              borderRadius: 6,
                            }
                          ]}
                        />
                      </View>
                      <Text style={[
                        styles.xLabel,
                        { color: isToday ? theme.text : theme.textSecondary },
                        isToday && { fontWeight: '700' }
                      ]}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </Text>
                      {isToday && <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ═══════ MONTHLY COMPLETION ═══════ */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={[styles.wideStatCard, { backgroundColor: theme.surface }]}>
            <View style={styles.wideStatLeft}>
              <View style={[styles.metricIconBg, { backgroundColor: '#3B82F615' }]}>
                <Calendar color="#3B82F6" size={20} />
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={[styles.wideStatLabel, { color: theme.textSecondary }]}>Monthly Completion</Text>
                <Text style={[styles.wideStatSubLabel, { color: theme.textSecondary }]}>Last 30 days</Text>
              </View>
            </View>
            <Text style={[styles.wideStatValue, { color: theme.text }]}>{stats.monthlyRate}%</Text>
          </View>
        </Animated.View>

        {/* ═══════ CATEGORY DISTRIBUTION ═══════ */}
        {stats.categoryDistribution.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Category Distribution</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Habits by category</Text>
                </View>
                <View style={[styles.percentBadge, { backgroundColor: '#8B5CF615' }]}>
                  <PieChart color="#8B5CF6" size={14} />
                  <Text style={[styles.chartPercent, { color: '#8B5CF6' }]}>{stats.categoryDistribution.length}</Text>
                </View>
              </View>

              {/* Horizontal Distribution Bar */}
              <View style={styles.distributionBarContainer}>
                <View style={styles.distributionBar}>
                  {stats.categoryDistribution.map((cat, idx) => {
                    const percent = (cat.count / stats.totalHabits) * 100;
                    return (
                      <Animated.View
                        key={cat.name}
                        entering={FadeInRight.delay(500 + idx * 100).springify()}
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: cat.color,
                          borderTopLeftRadius: idx === 0 ? 8 : 0,
                          borderBottomLeftRadius: idx === 0 ? 8 : 0,
                          borderTopRightRadius: idx === stats.categoryDistribution.length - 1 ? 8 : 0,
                          borderBottomRightRadius: idx === stats.categoryDistribution.length - 1 ? 8 : 0,
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legendContainer}>
                {stats.categoryDistribution.map((cat, idx) => {
                  const percent = Math.round((cat.count / stats.totalHabits) * 100);
                  return (
                    <View key={cat.name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.legendName, { color: theme.text }]}>
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                      </Text>
                      <Text style={[styles.legendPercent, { color: theme.textSecondary }]}>{percent}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ═══════ GITHUB ACTIVITY HEATMAP ═══════ */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 4 }]}>Activity Heatmap</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: 16 }]}>Your consistency over the last 90 days</Text>
            <HeatmapCalendar completions={completions} days={90} color={theme.primary} />
          </View>
        </Animated.View>

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

  // ── Section Labels ──
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
    marginLeft: 4,
  },

  // ── Metrics Grid ──
  metricsSection: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Chart Card ──
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
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
    fontWeight: '600',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },

  // ── Wide Stat Card ──
  wideStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  wideStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideStatLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  wideStatSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  wideStatValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // ── Category Distribution ──
  distributionBarContainer: {
    marginBottom: 18,
  },
  distributionBar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  legendContainer: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
});
