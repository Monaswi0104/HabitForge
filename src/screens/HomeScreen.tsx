import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { Colors } from '../constants/colors';
import HabitCard from '../components/habit/HabitCard';
import { ProgressRing } from '../components/profile/ProgressRing';
import { format } from 'date-fns';
import { calculateStreak } from '../utils/streakCalculator';
import { HabitDay } from '../types/habit.types';
import { Bell, Flame, TrendingUp, CheckCircle2, Plus, CheckSquare, X, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSettingsStore } from '../store/settingsStore';
import notifee, { AndroidImportance } from '@notifee/react-native';
import LinearGradient from 'react-native-linear-gradient';
export default function HomeScreen({ navigation }: any) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { activeProfileId, profiles } = useProfileStore();
  const { toggleCompletion, incrementProgress, habits, completions, habitDays, loadHabits } = useHabitStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [activeReminderHabit, setActiveReminderHabit] = useState<any>(null);
  const lastAlertTimeRef = useRef<Map<string, number>>(new Map());
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayName = format(new Date(), 'E'); 

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  useFocusEffect(
    useCallback(() => {
      if (activeProfileId) {
        loadHabits(activeProfileId);
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

  const completedCount = todaysHabits.filter(h => {
    const c = completions.find(comp => comp.habit_id === h.id && comp.date === todayStr);
    return c && c.progress_value >= h.target_count;
  }).length;

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

  const QUOTES = [
    "Small steps every day.",
    "Consistency beats intensity.",
    "You've got this."
  ];

  const randomQuote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, [todayStr]);

  const handleToggle = (habitId: string, isCurrentlyCompleted: boolean, targetCount: number) => {
    incrementProgress(habitId, todayStr, targetCount);
    
    const existing = completions.find(c => c.habit_id === habitId && c.date === todayStr);
    const currentProgress = existing ? existing.progress_value : 0;
    
    // Trigger confetti if this marks all habits complete
    if (currentProgress + 1 === targetCount && completedCount + 1 === totalCount && totalCount > 0) {
      setShowConfetti(true);
    }
  };

  const handleNotificationsPress = () => {
    setShowNotificationsModal(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      todaysHabits.forEach(habit => {
        if (!habit.reminder_time) return;
        
        // Skip if already completed today
        const isCompleted = completions.some(c => c.habit_id === habit.id && c.date === todayStr);
        if (isCompleted) return;

        const reminderDate = new Date(habit.reminder_time);
        const todaysReminderTime = new Date();
        todaysReminderTime.setHours(reminderDate.getHours(), reminderDate.getMinutes(), 0, 0);

        // If the current time is past the reminder time, we start the 30-second nagging
        if (now.getTime() >= todaysReminderTime.getTime()) {
          const lastAlert = lastAlertTimeRef.current.get(habit.id) || 0;
          
          // Alert if it's the very first time, or if 30 seconds have passed since the last alert
          if (now.getTime() - lastAlert >= 30000) {
            lastAlertTimeRef.current.set(habit.id, now.getTime());
            
            // Trigger the native OS notification for the chime sound and heads-up banner
            notifee.displayNotification({
              title: '⏰ Habit Reminder',
              body: `It's time to do: ${habit.title}`,
              android: {
                channelId: 'habit-reminders',
                importance: AndroidImportance.HIGH,
                pressAction: {
                  id: 'default',
                },
              },
              ios: {
                sound: 'default',
              }
            });
            setActiveReminderHabit(habit);
          }
        }
      });
    }, 1000); // Check every second for exact precision

    return () => clearInterval(interval);
  }, [todaysHabits, completions, todayStr]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Image 
              source={require('../assets/images/app_icon.png')} 
              style={{ width: 34, height: 34, borderRadius: 8, marginRight: 10 }} 
            />
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>HabitForge</Text>
          </View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.nameTitle, { color: theme.text }]}>
            {activeProfile?.name || 'User'}
          </Text>
          <Text style={[styles.quoteText, { color: theme.textSecondary, marginTop: 4, fontSize: 14, opacity: 0.8 }]}>
            {randomQuote}
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
              <LinearGradient
                colors={['#7C3AED', '#A78BFA', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.summaryCard, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}
              >
                {/* Decorative circles */}
                <View style={[styles.decorCircle, { top: -20, right: -20, width: 70, height: 70 }]} />
                <View style={[styles.decorCircle, { bottom: -15, left: -15, width: 50, height: 50 }]} />
                <ProgressRing 
                  progress={progressPercent} 
                  radius={32} 
                  strokeWidth={6} 
                  color="#FFF" 
                  backgroundColor="rgba(255,255,255,0.2)" 
                  textColor="#FFF" 
                />
                <Text style={[styles.summaryLabel, { marginTop: 12, textAlign: 'center' }]}>
                  {completedCount}/{totalCount} Done
                </Text>
              </LinearGradient>

              {/* Streak Card */}
              <LinearGradient
                colors={['#F97316', '#FB923C', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.summaryCard, { overflow: 'hidden' }]}
              >
                {/* Decorative circles */}
                <View style={[styles.decorCircle, { top: -10, right: -10, width: 60, height: 60 }]} />
                <View style={[styles.decorCircle, { bottom: -25, left: 20, width: 55, height: 55 }]} />
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconCircle}>
                    <Flame color="#FFF" size={18} fill="#FFF" />
                  </View>
                  <Text style={styles.summaryPercent}>{maxGlobalStreak}</Text>
                </View>
                <Text style={styles.summaryStreakUnit}>Day Streak</Text>
                <Text style={styles.summaryLabel}>
                  {maxGlobalStreak > 0 ? 'Keep it going!' : 'Start today!'}
                </Text>
              </LinearGradient>
            </View>

            {/* Quick Stats Row */}
            <View style={styles.quickStatsRow}>
              <View style={[styles.quickStatCard, { backgroundColor: theme.surface }]}>
                <LinearGradient
                  colors={['#7C3AED', '#A78BFA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.quickStatAccent}
                />
                <View style={[styles.quickStatIconBg, { backgroundColor: '#7C3AED18' }]}>
                  <TrendingUp color="#7C3AED" size={20} />
                </View>
                <Text style={[styles.quickStatValue, { color: theme.text }]}>{habits.length}</Text>
                <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Active</Text>
              </View>
              <View style={[styles.quickStatCard, { backgroundColor: theme.surface }]}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.quickStatAccent}
                />
                <View style={[styles.quickStatIconBg, { backgroundColor: '#10B98118' }]}>
                  <CheckCircle2 color="#10B981" size={20} />
                </View>
                <Text style={[styles.quickStatValue, { color: theme.text }]}>{completedCount}</Text>
                <Text style={[styles.quickStatLabel, { color: theme.textSecondary }]}>Today</Text>
              </View>
              <View style={[styles.quickStatCard, { backgroundColor: theme.surface }]}>
                <LinearGradient
                  colors={['#F97316', '#FB923C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.quickStatAccent}
                />
                <View style={[styles.quickStatIconBg, { backgroundColor: '#F9731618' }]}>
                  <Flame color="#F97316" size={20} />
                </View>
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
          const comp = completions.find(c => c.habit_id === item.id && c.date === todayStr);
          const progressValue = comp ? comp.progress_value : 0;
          const isCompleted = progressValue >= item.target_count;
          
          return (
            <HabitCard
              title={item.title}
              frequency={item.frequency}
              isCompleted={isCompleted}
              color={item.color}
              iconName={item.icon}
              index={index}
              targetCount={item.target_count}
              targetUnit={item.target_unit}
              progressValue={progressValue}
              onToggle={() => handleToggle(item.id, isCompleted, item.target_count)}
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

      {showNotificationsModal && (
        <Modal visible={showNotificationsModal} transparent animationType="fade" onRequestClose={() => setShowNotificationsModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotificationsModal(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Today's Reminders</Text>
                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                  <X color={theme.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {todaysHabits.filter(h => h.reminder_time).length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <Bell color={theme.textSecondary} size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '500' }}>No reminders scheduled.</Text>
                  </View>
                ) : (
                  todaysHabits.filter(h => h.reminder_time).map((h, i) => {
                    const time = new Date(h.reminder_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <View key={h.id} style={[styles.reminderRow, i !== 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                        <View style={[styles.reminderIconBg, { backgroundColor: (h.color || theme.primary) + '20' }]}>
                          <Clock color={h.color || theme.primary} size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reminderTitle, { color: theme.text }]}>{h.title}</Text>
                          <Text style={[styles.reminderTime, { color: theme.textSecondary }]}>{time}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {activeReminderHabit && (
        <Modal visible={!!activeReminderHabit} transparent animationType="slide" onRequestClose={() => setActiveReminderHabit(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.reminderAlertContent, { backgroundColor: theme.surface }]}>
              <View style={[styles.reminderAlertIconWrapper, { backgroundColor: (activeReminderHabit.color || theme.primary) + '20' }]}>
                <Bell color={activeReminderHabit.color || theme.primary} size={36} />
              </View>
              <Text style={[styles.reminderAlertTitle, { color: theme.text }]}>Time for your habit!</Text>
              <Text style={[styles.reminderAlertBody, { color: theme.textSecondary }]}>
                It's time to do:{'\n'}
                <Text style={{ fontWeight: '800', color: theme.text, fontSize: 18 }}>{activeReminderHabit.title}</Text>
              </Text>
              <Text style={[styles.reminderAlertSubtext, { color: theme.textSecondary }]}>
                (I will remind you every 30 seconds until it's done!)
              </Text>

              <View style={styles.reminderAlertActions}>
                <TouchableOpacity 
                  style={[styles.reminderAlertBtn, styles.reminderAlertBtnLater, { borderColor: theme.border }]} 
                  onPress={() => setActiveReminderHabit(null)}
                >
                  <Text style={[styles.reminderAlertBtnText, { color: theme.textSecondary }]}>Later</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.reminderAlertBtn, styles.reminderAlertBtnDone, { backgroundColor: theme.primary }]} 
                  onPress={() => {
                    handleToggle(activeReminderHabit.id, false, activeReminderHabit.target_count);
                    setActiveReminderHabit(null);
                  }}
                >
                  <CheckCircle2 color="#FFF" size={18} style={{ marginRight: 6 }} />
                  <Text style={[styles.reminderAlertBtnText, { color: '#FFF' }]}>Mark Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  quoteText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
    borderRadius: 24,
    padding: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryPercent: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  summaryStreakUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  // Quick stats
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 18,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  quickStatAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  quickStatIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  reminderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderAlertContent: {
    width: '90%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  reminderAlertIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  reminderAlertTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  reminderAlertBody: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  reminderAlertSubtext: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 28,
  },
  reminderAlertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  reminderAlertBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  reminderAlertBtnLater: {
    borderWidth: 1,
  },
  reminderAlertBtnDone: {},
  reminderAlertBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
