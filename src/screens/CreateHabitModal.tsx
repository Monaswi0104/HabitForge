import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { RootStackScreenProps } from '../types/navigation.types';
import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { Colors } from '../constants/colors';
import { Frequency, DayOfWeek } from '../types/habit.types';
import { executeQuery } from '../database/db';
import { ArrowLeft, ChevronRight, Book, Dumbbell, Droplets, Brain, Pencil, Heart, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useSettingsStore } from '../store/settingsStore';
import { triggerHaptic } from '../utils/haptics';

import { HABIT_ICONS, HABIT_COLORS } from '../constants/habitCategories';

type Props = RootStackScreenProps<'CreateHabitModal'>;

interface Category {
  id: string;
  name: string;
  color: string;
}

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

export default function CreateHabitModal({ route, navigation }: Props) {
  const { addHabit } = useHabitStore();
  const { activeProfileId } = useProfileStore();
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [selectedIcon, setSelectedIcon] = useState('book');
  const [selectedColor, setSelectedColor] = useState(theme.avatarColors[0]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await executeQuery<Category>('SELECT * FROM categories');
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    };
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !activeProfileId) return;

    triggerHaptic('notificationSuccess');

    await addHabit({
      profile_id: activeProfileId,
      category_id: selectedCategoryId,
      title: title.trim(),
      description: goal.trim(),
      frequency,
      color: selectedColor,
      icon: selectedIcon,
      reminder_time: reminderTime ? reminderTime.toISOString() : undefined,
    }, selectedDays);

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: theme.surface
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create New Habit</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!title.trim()} style={styles.headerBtn}>
          <Text style={[styles.saveText, { color: title.trim() ? theme.primary : theme.textSecondary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 0 }]}>Habit Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          placeholder="e.g. Read Books"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
        <View style={styles.wrapContainer}>
          {categories.map(cat => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.pill,
                  { backgroundColor: isSelected ? theme.primary : theme.surface },
                  isSelected && { shadowColor: theme.primary, shadowOpacity: 0.3 }
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedCategoryId(cat.id);
                }}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFF' : theme.textSecondary }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Icon</Text>
        <View style={styles.wrapContainer}>
          {HABIT_ICONS.map(icon => {
            const isSelected = selectedIcon === icon.icon;
            return (
              <TouchableOpacity
                key={icon.id}
                style={[
                  styles.iconBox,
                  { backgroundColor: isSelected ? theme.primary : theme.surface },
                  isSelected && { shadowColor: theme.primary, shadowOpacity: 0.3 }
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedIcon(icon.icon);
                }}
              >
                {renderIcon(icon.icon, isSelected ? '#FFF' : theme.textSecondary, 20)}
                <Text style={[
                  styles.iconBoxText,
                  { color: isSelected ? '#FFF' : theme.textSecondary }
                ]}>
                  {icon.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
        <View style={styles.wrapContainer}>
          {theme.avatarColors.map(color => {
            const isSelected = selectedColor === color;
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color }
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedColor(color);
                }}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <Check color="#FFF" size={24} strokeWidth={3} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
        <View style={[styles.segmentedControl, { backgroundColor: isDarkMode ? theme.surface : '#F1F5F9' }]}>
          {(['daily', 'weekly', 'custom'] as Frequency[]).map((freq) => {
            const isSelected = frequency === freq;
            return (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.segmentBtn,
                  isSelected && [styles.segmentBtnSelected, { backgroundColor: theme.surface }]
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text style={[
                  styles.segmentText,
                  { color: isSelected ? theme.text : theme.textSecondary, fontWeight: isSelected ? '600' : '500' }
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {frequency === 'weekly' && (
          <View style={styles.daysRow}>
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[]).map(day => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCircle,
                    { backgroundColor: isSelected ? theme.primary : theme.surface }
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[
                    styles.dayText,
                    { color: isSelected ? '#FFF' : theme.textSecondary }
                  ]}>
                    {day.charAt(0)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Reminder</Text>
        <TouchableOpacity
          style={[styles.inputField, { backgroundColor: theme.surface }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={[styles.inputText, { color: reminderTime ? theme.text : theme.textSecondary }]}>
            {reminderTime ? format(reminderTime, 'h:mm a') : 'No reminder set'}
          </Text>
          <ChevronRight color={theme.textSecondary} size={20} />
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime || new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedDate) setReminderTime(selectedDate);
            }}
          />
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Goal (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          placeholder="e.g. 30 minutes"
          placeholderTextColor={theme.textSecondary}
          value={goal}
          onChangeText={setGoal}
        />
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  headerBtn: {
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputField: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputText: {
    fontSize: 16,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  iconBox: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBoxText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    height: 52,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
