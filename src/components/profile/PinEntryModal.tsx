import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { Colors } from '../../constants/colors';
import { X, Delete } from 'lucide-react-native';

interface PinEntryModalProps {
  visible: boolean;
  profileName: string;
  expectedPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export default function PinEntryModal({
  visible,
  profileName,
  expectedPin,
  onSuccess,
  onCancel,
}: PinEntryModalProps) {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shakeAnimation = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError(false);
    }
  }, [visible]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === expectedPin) {
        onSuccess();
      } else {
        triggerError();
      }
    }
  }, [pin]);

  const triggerError = () => {
    setError(true);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start(() => {
      setPin('');
      setError(false);
    });
  };

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      const isFilled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: isFilled ? theme.primary : theme.border,
              borderColor: isFilled ? theme.primary : theme.border,
            },
            error && { backgroundColor: theme.error, borderColor: theme.error }
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <X color={theme.text} size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Enter PIN</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock {profileName}'s profile
          </Text>

          <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
            {renderDots()}
          </Animated.View>

          {error && <Text style={[styles.errorText, { color: theme.error }]}>Incorrect PIN</Text>}

          <TouchableOpacity 
            style={{ marginTop: 24, padding: 8 }} 
            onPress={() => {
              import('react-native').then(({ Alert }) => {
                Alert.alert('Forgot PIN?', `Your PIN is: ${expectedPin}`, [{ text: 'OK' }]);
              });
            }}
          >
            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '500' }}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIndex) => (
            <View key={rIndex} style={styles.keypadRow}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={[styles.key, { backgroundColor: theme.surface }]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={styles.keypadRow}>
            <View style={styles.keyEmpty} />
            <TouchableOpacity
              style={[styles.key, { backgroundColor: theme.surface }]}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.key, { backgroundColor: theme.surface }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Delete color={theme.text} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    height: 40,
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  keypad: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  key: {
    width: (width - 80 - 32) / 3,
    aspectRatio: 1,
    borderRadius: (width - 80 - 32) / 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  keyEmpty: {
    width: (width - 80 - 32) / 3,
    aspectRatio: 1,
  },
  keyText: {
    fontSize: 32,
    fontWeight: '500',
  },
});
