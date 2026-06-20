import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import ProfileSelectScreen from '../screens/auth/ProfileSelectScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';
import TabNavigator from './TabNavigator';
import CreateHabitModal from '../screens/CreateHabitModal';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import AllHabitsScreen from '../screens/AllHabitsScreen';
import SettingScreen from '../screens/SettingScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';

import { useSettingsStore } from '../store/settingsStore';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.background }
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        options={{ animation: 'fade' }} 
      />
      <Stack.Screen 
        name="ProfileSelect" 
        component={ProfileSelectScreen} 
        options={{ animation: 'fade' }} 
      />
      <Stack.Screen 
        name="CreateProfile" 
        component={CreateProfileScreen} 
        options={{ animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ animation: 'fade' }} 
      />
      <Stack.Screen 
        name="CreateHabitModal" 
        component={CreateHabitModal} 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="HabitDetail" 
        component={HabitDetailScreen} 
        options={{ presentation: 'card' }} 
      />
      <Stack.Screen 
        name="AllHabits" 
        component={AllHabitsScreen} 
        options={{ animation: 'slide_from_right' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingScreen} 
        options={{ animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="FocusTimer" 
        component={FocusTimerScreen} 
        options={{ presentation: 'fullScreenModal' }} 
      />
    </Stack.Navigator>
  );
}
