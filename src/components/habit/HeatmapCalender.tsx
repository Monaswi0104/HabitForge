import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';

interface HeatmapCalendarProps {
  completions: { date: string }[]; // array of 'yyyy-MM-dd' strings
  days?: number; // Number of days to look back
  color?: string; // Theme color for active cells
}

export default function HeatmapCalendar({ completions, days = 90, color }: HeatmapCalendarProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const primaryColor = color || theme.primary;

  // Generate the last X days
  const today = new Date();
  const startDate = subDays(today, days - 1);
  const dates = eachDayOfInterval({ start: startDate, end: today });

  // Create a set for O(1) lookups
  const completedSet = new Set(completions.map(c => c.date));

  // Organize by weeks (columns) and days of week (rows)
  const columns: Date[][] = [];
  let currentColumn: Date[] = [];

  dates.forEach((date) => {
    if (currentColumn.length === 7) {
      columns.push(currentColumn);
      currentColumn = [];
    }
    currentColumn.push(date);
  });
  if (currentColumn.length > 0) {
    columns.push(currentColumn);
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {columns.map((col, colIndex) => (
          <View key={`col-${colIndex}`} style={styles.column}>
            {col.map((date, rowIndex) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isCompleted = completedSet.has(dateStr);
              const index = colIndex * 7 + rowIndex;
              return (
                <Animated.View
                  key={`cell-${dateStr}`}
                  entering={FadeIn.delay(Math.min(index * 20, 1000))}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: isCompleted ? primaryColor : theme.textSecondary,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    gap: 4,
    paddingHorizontal: 4,
  },
  column: {
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});
