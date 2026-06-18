import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { Colors } from '../constants/colors';
import HabitCard from '../components/habit/HabitCard';
import { format } from 'date-fns';
import { RootStackScreenProps } from '../types/navigation.types';
import { ArrowLeft, Book, CheckSquare, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

type Props = RootStackScreenProps<'AllHabits'>;

export default function AllHabitsScreen({ navigation }: Props) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { habits, completions, toggleCompletion, completeAll, deleteHabit } = useHabitStore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleToggle = (habitId: string) => {
    toggleCompletion(habitId, todayStr);
  };

  const handleCompleteAll = () => {
    completeAll(todayStr);
  };

  const handleDelete = (habitId: string) => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Delete Habit',
        'Are you sure you want to delete this habit? All progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habitId) }
        ]
      );
    });
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Habits</Text>
        <TouchableOpacity 
          onPress={handleCompleteAll}
          style={[styles.headerBtn, { backgroundColor: theme.surface }]}
        >
          <CheckSquare color={theme.text} size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.primary + '15' }]}>
              <Book color={theme.primary} size={32} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No habits found
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Go back and tap the + button to create a habit
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
              onToggle={() => handleToggle(item.id)}
              onDelete={() => handleDelete(item.id)}
              onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
            />
          );
        }}
      />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
