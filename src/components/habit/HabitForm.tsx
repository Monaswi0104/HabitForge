import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';
import Button from '../common/Button';

interface HabitFormProps {
  initialValues?: {
    title: string;
    description: string;
    color: string;
    icon: string;
    frequency: string;
  };
  onSubmit: (values: any) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function HabitForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save Habit',
  isLoading = false,
}: HabitFormProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  // For simplicity, other fields omitted from this basic implementation.
  // We can expand this component as needed later!

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      color: initialValues?.color || theme.primary,
      icon: initialValues?.icon || 'book',
      frequency: initialValues?.frequency || 'daily',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.inputGroup, { backgroundColor: theme.surface }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Habit Name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="e.g. Read for 20 mins"
          placeholderTextColor={theme.border}
          value={title}
          onChangeText={setTitle}
        />
        
        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Why do you want to build this habit?"
          placeholderTextColor={theme.border}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          disabled={!title.trim() || isLoading}
          isLoading={isLoading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputGroup: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  footer: {
    marginBottom: 40,
  },
});
