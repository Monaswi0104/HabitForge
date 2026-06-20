import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, Alert } from 'react-native';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { Colors } from '../constants/colors';
import { Settings, Shield, Clock, BookOpen, Target, ChevronRight, Flame, CheckCircle, Star, Award } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { useOverallStreak } from '../hooks/useStreak';
import ProfileCard from '../components/profile/ProfileCard';

export default function ProfileScreen({ navigation }: any) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { activeProfileId, profiles } = useProfileStore();
  const { habits, completions } = useHabitStore();

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Calculate Real Stats
  const totalHabits = habits.length;
  const totalCompletions = completions.length;
  
  const { currentStreak: overallCurrentStreak, longestStreak: overallLongestStreak } = useOverallStreak(activeProfileId);

  const habitsWithAtLeastOneCompletion = habits.filter(h => 
    completions.some(c => c.habit_id === h.id)
  ).length;

  // Calculate XP and Level
  const XP_PER_COMPLETION = 50;
  const XP_PER_LEVEL = 500;
  
  const totalXP = totalCompletions * XP_PER_COMPLETION;
  const currentLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
  const xpProgress = xpInCurrentLevel / XP_PER_LEVEL;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity 
          style={[styles.settingsBtn, { backgroundColor: theme.surface }]} 
          onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}
        >
          <Settings color={theme.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Card */}
        <ProfileCard
          name={activeProfile?.name || 'User'}
          color={activeProfile?.color || theme.primary}
          currentLevel={currentLevel}
          xpInCurrentLevel={xpInCurrentLevel}
          xpProgress={xpProgress}
          xpPerLevel={XP_PER_LEVEL}
          streak={overallLongestStreak}
          completion={totalHabits > 0 ? (totalCompletions / (totalHabits * 30)) * 100 : 0}
          activeHabits={habitsWithAtLeastOneCompletion}
        />

        {/* Badges Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Badges Earned</Text>
          <TouchableOpacity 
            onPress={() => Alert.alert('Badges', 'More badges coming soon!')}
            style={[styles.viewAllBtn, { backgroundColor: theme.primary + '15' }]}
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.badgesContainer}>
          {[
            { icon: <Clock color="#D97706" size={24} />, bg: '#D9770625', label: 'Early Bird', earned: false },
            { icon: <Shield color="#DC2626" size={24} />, bg: '#DC262625', label: 'Consistent', earned: overallLongestStreak >= 7 },
            { icon: <BookOpen color="#4F46E5" size={24} />, bg: '#4F46E525', label: 'Bookworm', earned: totalHabits >= 5 },
            { icon: <Target color="#9333EA" size={24} />, bg: '#9333EA25', label: 'Achiever', earned: totalCompletions >= 10 },
          ].map((badge, i) => (
            <View key={i} style={[styles.badgeCard, { backgroundColor: theme.surface, opacity: badge.earned ? 1 : 0.3 }]}>
              <View style={[styles.badgeIconBg, { backgroundColor: badge.bg }]}>
                {badge.icon}
              </View>
              <Text style={[styles.badgeLabel, { color: theme.text }]}>{badge.label}</Text>
            </View>
          ))}
        </View>

        {/* Stats Section */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16, marginLeft: 4 }]}>
          Your Statistics
        </Text>
        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
          {[
            { label: 'Current Streak', value: `${overallCurrentStreak} Days`, icon: <Flame size={20} color="#F97316" />, iconBg: '#F9731625' },
            { label: 'Longest Streak', value: `${overallLongestStreak} Days`, icon: <Clock size={20} color="#4F46E5" />, iconBg: '#4F46E525' },
            { label: 'Habits Created', value: totalHabits.toString(), icon: <BookOpen size={20} color="#10B981" />, iconBg: '#10B98125' },
            { label: 'Active Habits', value: habitsWithAtLeastOneCompletion.toString(), icon: <CheckCircle size={20} color="#8B5CF6" />, iconBg: '#8B5CF625' },
            { label: 'Total Completions', value: totalCompletions.toString(), icon: <Star size={20} color="#F59E0B" />, iconBg: '#F59E0B25' },
          ].map((stat, i, arr) => (
            <View 
              key={i} 
              style={[
                styles.statListItem, 
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
              ]}
            >
              <View style={styles.statListLeft}>
                <View style={[styles.statIconBg, { backgroundColor: stat.iconBg }]}>
                  {stat.icon}
                </View>
                <Text style={[styles.statListLabel, { color: theme.text }]}>{stat.label}</Text>
              </View>
              <View style={styles.statListRight}>
                <Text style={[styles.statListValue, { color: theme.text }]}>{stat.value}</Text>
              </View>
            </View>
          ))}
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Profile Card
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
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 20,
  },
  levelText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '500',
  },
  xpBarBg: {
    height: 10,
    borderRadius: 5,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  // Badges
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
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
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Stats
  statsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  statListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statListLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statListValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
