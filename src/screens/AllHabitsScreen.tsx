import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { Colors } from '../constants/colors';
import HabitCard from '../components/habit/HabitCard';
import { format } from 'date-fns';
import { RootStackScreenProps } from '../types/navigation.types';
import { ArrowLeft, Book, CheckSquare, Trash2, ListChecks, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';

type Props = RootStackScreenProps<'AllHabits'>;

export default function AllHabitsScreen({ navigation }: Props) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { activeProfileId } = useProfileStore();
  const { habits, completions, toggleCompletion, completeAll, deleteHabit, deleteAllHabits, deleteHabits, completeHabits } = useHabitStore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === habits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(habits.map(h => h.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Selected',
      `Are you sure you want to delete ${selectedIds.size} habit(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteHabits(Array.from(selectedIds));
            toggleSelectionMode();
          } 
        }
      ]
    );
  };

  const handleBulkComplete = () => {
    if (selectedIds.size === 0) return;
    completeHabits(Array.from(selectedIds), todayStr);
    toggleSelectionMode();
  };

  const handleToggle = (habitId: string) => {
    toggleCompletion(habitId, todayStr);
  };

  const handleDelete = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habitId) }
      ]
    );
  };

  const handleDeleteAll = () => {
    if (habits.length === 0) return;
    Alert.alert(
      'Delete ALL Habits',
      'Are you sure you want to delete ALL habits for this profile? This completely wipes your progress and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive', 
          onPress: () => {
            if (activeProfileId) deleteAllHabits(activeProfileId);
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        {!isSelectionMode ? (
          <>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={[styles.headerBtn, { backgroundColor: theme.surface }]}
            >
              <ArrowLeft color={theme.text} size={22} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>All Habits</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                onPress={handleDeleteAll}
                style={[styles.headerBtn, { backgroundColor: theme.surface }]}
              >
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => completeAll(todayStr)}
                style={[styles.headerBtn, { backgroundColor: theme.surface }]}
              >
                <CheckSquare color={theme.text} size={22} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleSelectionMode}
                style={[styles.headerBtn, { backgroundColor: theme.surface }]}
              >
                <ListChecks color={theme.text} size={22} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity 
              onPress={toggleSelectionMode}
              style={[styles.headerBtn, { backgroundColor: theme.surface }]}
            >
              <X color={theme.text} size={22} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{selectedIds.size} Selected</Text>
            <TouchableOpacity 
              onPress={handleSelectAll}
              style={[styles.headerBtn, { backgroundColor: theme.surface, paddingHorizontal: 12, width: 'auto' }]}
            >
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Select All</Text>
            </TouchableOpacity>
          </>
        )}
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
          const isSelected = selectedIds.has(item.id);
          return (
            <HabitCard
              title={item.title}
              frequency={item.frequency}
              isCompleted={isCompleted}
              color={item.color}
              iconName={item.icon}
              index={index}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected}
              onToggle={() => isSelectionMode ? handleToggleSelection(item.id) : handleToggle(item.id)}
              onDelete={() => handleDelete(item.id)}
              onPress={() => isSelectionMode ? handleToggleSelection(item.id) : navigation.navigate('HabitDetail', { habitId: item.id })}
              onLongPress={() => {
                if (!isSelectionMode) {
                  toggleSelectionMode();
                  handleToggleSelection(item.id);
                }
              }}
            />
          );
        }}
      />

      {/* Floating Bottom Bar for Selection Mode */}
      {isSelectionMode && (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity 
            style={[styles.bottomBtn, { opacity: selectedIds.size > 0 ? 1 : 0.5 }]}
            disabled={selectedIds.size === 0}
            onPress={handleBulkDelete}
          >
            <Trash2 color="#EF4444" size={24} />
            <Text style={[styles.bottomBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomBtn, { opacity: selectedIds.size > 0 ? 1 : 0.5 }]}
            disabled={selectedIds.size === 0}
            onPress={handleBulkComplete}
          >
            <CheckSquare color={theme.primary} size={24} />
            <Text style={[styles.bottomBtnText, { color: theme.primary }]}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBtn: {
    height: 40,
    minWidth: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  emptyContainer: { padding: 32, borderRadius: 24, alignItems: 'center', marginTop: 40 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBtn: { alignItems: 'center', justifyContent: 'center' },
  bottomBtnText: { fontSize: 12, fontWeight: '600', marginTop: 4 }
});
