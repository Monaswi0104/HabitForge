import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, useColorScheme, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackScreenProps } from '../../types/navigation.types';
import { useProfileStore } from '../../store/profileStore';
import { Colors } from '../../constants/colors';
import { ArrowLeft, Camera, Check, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/settingsStore';

type Props = RootStackScreenProps<'CreateProfile'>;

export default function CreateProfileScreen({ navigation }: Props) {
  const { createProfile } = useProfileStore();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  
  const [selectedColor, setSelectedColor] = useState(theme.avatarColors[0]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('ProfileSelect');
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    try {
      await createProfile(
        name.trim(), 
        null, 
        selectedColor,
        pin.trim() ? pin.trim() : undefined
      );
      navigation.reset({
        index: 1,
        routes: [
          { name: 'ProfileSelect' },
          { name: 'MainTabs', params: { screen: 'Home' } }
        ],
      });
    } catch (e) {
      console.error('Failed to create profile:', e);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 48) }]}>
          <TouchableOpacity 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace('ProfileSelect');
              }
            }} 
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <ArrowLeft color={theme.text} size={22} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Create Your Profile</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Let's get started.</Text>

        <View style={styles.avatarPreviewContainer}>
          <View style={[styles.avatarPreview, { backgroundColor: selectedColor }]}>
            <Text style={styles.avatarPreviewText}>
              {name.trim() ? name.charAt(0).toUpperCase() : 'M'}
            </Text>
            <View style={[styles.cameraBadge, { backgroundColor: theme.surface }]}>
              <Camera color={theme.text} size={16} />
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="e.g. John"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 24 }]}>Passcode (Optional)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: 'transparent', color: theme.text }]}
              placeholder="Enter a 4-digit PIN"
              placeholderTextColor={theme.textSecondary}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={!showPin}
            />
            {pin.length > 0 && (
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPin(!showPin)}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeOff color={theme.textSecondary} size={20} />
                ) : (
                  <Eye color={theme.textSecondary} size={20} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 24 }]}>Choose a Theme Color</Text>
          <View style={styles.colorPickerContainer}>
            {theme.avatarColors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && { shadowColor: color, shadowOpacity: 0.6 }
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <View style={styles.colorCheckMark}>
                    <Check color="#FFF" size={16} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            { backgroundColor: name.trim() ? theme.primary : theme.border }
          ]} 
          onPress={handleCreate}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            { color: name.trim() ? '#FFF' : theme.textSecondary }
          ]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPreview: {
    width: 104,
    height: 104,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarPreviewText: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
  },
  eyeIcon: {
    padding: 14,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  colorCheckMark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
  continueButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
