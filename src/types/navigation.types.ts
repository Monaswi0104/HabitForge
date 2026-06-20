// src/types/navigation.types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  AddHabitTabPlaceholder: undefined; // Used just to show the + button
  Profile: undefined;
  Settings: undefined;
  CreateHabitModal: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  ProfileSelect: undefined;
  CreateProfile: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreateHabitModal: undefined; 
  HabitDetail: { habitId: string }; 
  FocusTimer: { habitId: string, durationMins: number };
  AllHabits: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
