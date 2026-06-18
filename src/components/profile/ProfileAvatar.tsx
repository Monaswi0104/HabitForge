import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';
import { User } from 'lucide-react-native';

interface ProfileAvatarProps {
  name: string;
  avatarUrl?: string | null;
  color?: string | null;
  size?: number;
  showBorder?: boolean;
}

export default function ProfileAvatar({
  name,
  avatarUrl,
  color,
  size = 50,
  showBorder = false,
}: ProfileAvatarProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const backgroundColor = color || theme.primary;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarUrl ? theme.surface : backgroundColor,
          borderWidth: showBorder ? 2 : 0,
          borderColor: theme.background,
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : name ? (
        <Text
          style={[
            styles.initial,
            {
              fontSize: size * 0.45,
              color: '#FFFFFF',
            },
          ]}
        >
          {initial}
        </Text>
      ) : (
        <User color="#FFFFFF" size={size * 0.5} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: '700',
  },
});
