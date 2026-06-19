import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { RootStackScreenProps } from '../../types/navigation.types';
import { useProfileStore } from '../../store/profileStore';
import { Colors } from '../../constants/colors';
import { loadMockData } from '../../database/db';

type Props = RootStackScreenProps<'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { loadProfiles } = useProfileStore();
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    const initApp = async () => {
      const start = Date.now();
      
      try {
        await loadProfiles();
      } catch (e) {
        console.error('Failed to load profiles:', e);
      }

      const end = Date.now();
      const elapsed = end - start;
      if (elapsed < 1500) {
        await new Promise<void>(resolve => setTimeout(resolve, 1500 - elapsed));
      }

      const currentStore = useProfileStore.getState();
      
      if (currentStore.profiles.length === 0) {
        // Automatically seed fake data from mockData.json in development
        if (__DEV__) {
          const loaded = await loadMockData();
          if (loaded) {
            await loadProfiles();
            navigation.replace('ProfileSelect');
            return;
          }
        }
        navigation.replace('CreateProfile');
      } else if (!currentStore.activeProfileId) {
        navigation.replace('ProfileSelect');
      } else {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'ProfileSelect' },
            { name: 'MainTabs', params: { screen: 'Home' } }
          ],
        });
      }
    };

    initApp();
  }, [navigation, loadProfiles, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Mockup Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={{ width: 120, height: 120, resizeMode: 'contain' }} 
          />
        </View>
        <Text style={styles.logoText}>HabitForge</Text>
        <Text style={styles.tagline}>Build discipline.</Text>
        <Text style={styles.tagline}>Forge your best self.</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  logoMarkH: {
    fontSize: 80,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.light.primary,
    marginRight: -20,
  },
  logoMarkF: {
    fontSize: 80,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.light.text,
    marginTop: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
