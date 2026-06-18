import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { RootStackScreenProps } from '../types/navigation.types';
import { Colors } from '../constants/colors';
import { ArrowLeft, MoreHorizontal, Book, Dumbbell, Droplets, Brain, Pencil, Heart, Flame, CheckCircle, Calendar, Clock, Target, TrendingUp, Share2 } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { useHabitStore } from '../store/habitStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { calculateStreak } from '../utils/streakCalculator';
import HeatmapCalendar from '../components/habit/HeatmapCalender';
import { format } from 'date-fns';

type Props = RootStackScreenProps<'HabitDetail'>;

const renderIcon = (name: string, color: string, size = 24) => {
  switch (name) {
    case 'book': return <Book color={color} size={size} />;
    case 'dumbbell': return <Dumbbell color={color} size={size} />;
    case 'droplets': return <Droplets color={color} size={size} />;
    case 'brain': return <Brain color={color} size={size} />;
    case 'pencil': return <Pencil color={color} size={size} />;
    case 'heart': return <Heart color={color} size={size} />;
    default: return <Book color={color} size={size} />;
  }
};

export default function HabitDetailScreen({ route, navigation }: Props) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  
  const { habitId } = route.params;
  const { habits, completions, deleteHabit } = useHabitStore();
  const habit = habits.find(h => h.id === habitId);
  const primaryColor = habit?.color || theme.primary;

  const habitCompletions = completions.filter(c => c.habit_id === habitId);
  const streakStats = habit ? calculateStreak(habitCompletions, habit.frequency) : { currentStreak: 0, longestStreak: 0, missedDays: 0 };
  
  const daysSinceCreation = Math.max(1, Math.round((new Date().getTime() - new Date(habit?.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24)));
  const completionPercent = habit?.frequency === 'daily' 
    ? Math.round((habitCompletions.length / daysSinceCreation) * 100) 
    : Math.round((habitCompletions.length > 0 ? 100 : 0));

  const handleMenuPress = () => {
    Alert.alert(
      'Habit Actions',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Habit',
              'Are you sure you want to delete this habit? All progress will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteHabit(habitId);
                    navigation.goBack();
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const viewShotRef = useRef<any>(null);

  if (!habit) return null;

  const handleShare = async () => {
    if (viewShotRef.current && viewShotRef.current.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: 'My Habit Streak',
          message: `Check out my progress on ${habit.title}!`,
        });
      } catch (e: any) {
        if (e.message !== 'User did not share') {
          console.log(e);
        }
      }
    }
  };

  const getLightBg = (hex: string) => {
    if (hex.length === 7) return hex + '18';
    return theme.border;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: theme.surface }]}
        >
          <ArrowLeft color={theme.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Habit Details</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={handleShare}
            style={[styles.headerBtn, { backgroundColor: theme.surface }]}
          >
            <Share2 color={theme.text} size={22} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleMenuPress}
            style={[styles.headerBtn, { backgroundColor: theme.surface }]}
          >
            <MoreHorizontal color={theme.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <View style={{ backgroundColor: theme.background, paddingBottom: 16 }}>
            {/* Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
          <View style={styles.heroIconCircle}>
            {renderIcon(habit.icon || 'book', primaryColor, 32)}
          </View>
          <Text style={styles.heroTitle}>{habit.title}</Text>
          <Text style={styles.heroSubtitle}>
            {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)} Habit
          </Text>
          
          {/* Streak Badge */}
          <View style={styles.heroStreakRow}>
            <View style={styles.heroStreakBadge}>
              <Flame color="#F97316" size={16} fill="#F97316" />
              <Text style={styles.heroStreakText}>{streakStats.currentStreak} Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statMiniCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statMiniIcon, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle color="#10B981" size={18} />
            </View>
            <Text style={[styles.statMiniValue, { color: theme.text }]}>{Math.min(100, completionPercent)}%</Text>
            <Text style={[styles.statMiniLabel, { color: theme.textSecondary }]}>Completion</Text>
          </View>
          <View style={[styles.statMiniCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statMiniIcon, { backgroundColor: '#FFF7ED' }]}>
              <Flame color="#F97316" size={18} />
            </View>
            <Text style={[styles.statMiniValue, { color: theme.text }]}>{streakStats.longestStreak}</Text>
            <Text style={[styles.statMiniLabel, { color: theme.textSecondary }]}>Best Streak</Text>
          </View>
          <View style={[styles.statMiniCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statMiniIcon, { backgroundColor: '#E0E7FF' }]}>
              <Calendar color="#4F46E5" size={18} />
            </View>
            <Text style={[styles.statMiniValue, { color: theme.text }]}>{habitCompletions.length}</Text>
            <Text style={[styles.statMiniLabel, { color: theme.textSecondary }]}>Completed</Text>
          </View>
          </View>
          </View>
        </ViewShot>

        {/* Heatmap Card */}
        <View style={[styles.heatmapCard, { backgroundColor: theme.surface }]}>
          <View style={styles.heatmapHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Activity</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{format(new Date(), 'MMMM yyyy')}</Text>
          </View>
          <HeatmapCalendar completions={habitCompletions} color={primaryColor} days={90} />
        </View>

        {/* Detailed Stats Card */}
        <View style={[styles.detailedStatsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 16 }]}>Statistics</Text>
          {[
            { label: 'Completed', value: `${habitCompletions.length}`, icon: <CheckCircle size={18} color="#10B981" />, iconBg: '#D1FAE5' },
            { label: 'Missed', value: `${Math.max(0, daysSinceCreation - habitCompletions.length)}`, icon: <Target size={18} color="#EF4444" />, iconBg: '#FEE2E2' },
            { label: 'Best Streak', value: `${streakStats.longestStreak} days`, icon: <TrendingUp size={18} color="#F97316" />, iconBg: '#FFF7ED' },
            { label: 'Avg. Completion', value: `${Math.min(100, completionPercent)}%`, icon: <Clock size={18} color="#4F46E5" />, iconBg: '#E0E7FF' },
          ].map((stat, i, arr) => (
            <View 
              key={i} 
              style={[
                styles.detailedStatRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
            >
              <View style={styles.detailedStatLeft}>
                <View style={[styles.detailedStatIcon, { backgroundColor: stat.iconBg }]}>
                  {stat.icon}
                </View>
                <Text style={[styles.detailedStatLabel, { color: theme.text }]}>{stat.label}</Text>
              </View>
              <Text style={[styles.detailedStatValue, { color: theme.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity Card */}
        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 16 }]}>Recent Activity</Text>
          {[...habitCompletions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map((activity, i, arr) => (
            <View 
              key={i} 
              style={[
                styles.activityRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
            >
              <View style={styles.activityLeft}>
                <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.activityDate, { color: theme.text }]}>{format(new Date(activity.date), 'MMM d, yyyy')}</Text>
              </View>
              <View style={styles.activityStatus}>
                <Text style={[styles.activityStatusText, { color: '#10B981' }]}>Completed</Text>
                <CheckCircle color="#10B981" size={16} />
              </View>
            </View>
          ))}
          {habitCompletions.length === 0 && (
            <Text style={{color: theme.textSecondary, textAlign: 'center', marginVertical: 16}}>No recent activity</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  heroStreakRow: {
    flexDirection: 'row',
  },
  heroStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroStreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statMiniCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statMiniValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statMiniLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Heatmap
  heatmapCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  heatmapDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  heatmapDayText: {
    fontSize: 12,
    fontWeight: '600',
    width: 28,
    textAlign: 'center',
  },
  heatmapGrid: {
    gap: 6,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  heatmapCell: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  // Detailed Stats
  detailedStatsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailedStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailedStatLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Activity
  activityCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityDate: {
    fontSize: 15,
    fontWeight: '500',
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
