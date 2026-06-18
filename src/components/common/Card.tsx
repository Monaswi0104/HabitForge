import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export default function Card({ children, style, variant = 'elevated', padding = 16 }: CardProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.2 : 0.08,
          shadowRadius: 12,
          elevation: isDarkMode ? 2 : 4,
          borderWidth: isDarkMode ? 1 : 0,
          borderColor: theme.border,
        };
      case 'outlined':
        return {
          backgroundColor: theme.background,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'flat':
        return {
          backgroundColor: theme.surface,
        };
      default:
        return {};
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    width: '100%',
  },
});
