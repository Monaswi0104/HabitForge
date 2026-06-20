import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Animated,
} from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingScreen from '../screens/SettingScreen';

import { MainTabParamList } from '../types/navigation.types';
import { Colors } from '../constants/colors';

import { useSettingsStore } from '../store/settingsStore';
import { useProfileStore } from '../store/profileStore';
import {
  Home,
  BarChart2,
  Plus,
  User,
  Settings,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const AddPlaceholder = () => null;

function CustomTabBarButton({ children, onPress }: any) {
  const isDark = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDark ? Colors.dark : Colors.light;
  const [isPressed, setIsPressed] = useState(false);

  const scale = React.useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.fabContainer}
      onPress={onPress}
      onPressIn={() => {
        setIsPressed(true);
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          friction: 5,
        }).start();
      }}
      onPressOut={() => {
        setIsPressed(false);
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
        }).start();
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.fab,
            { backgroundColor: theme.primary },
          ]}
        >
          <Plus
            color="#FFF"
            size={30}
            strokeWidth={2.8}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabNavigator({ navigation }: any) {
  const isDark = useSettingsStore((state: any) => state.isDarkMode);
  const theme = isDark ? Colors.dark : Colors.light;

  const insets = useSafeAreaInsets();

  const { selectProfile } = useProfileStore();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow navigation if it's not a back action
      if (e.data.action.type !== 'GO_BACK') {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      Alert.alert(
        'Logout',
        'Do you want to logout and switch profiles?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              selectProfile('');
              navigation.reset({
                index: 0,
                routes: [{ name: 'ProfileSelect' }],
              });
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },

        tabBarStyle: {
          backgroundColor: theme.surface,
          
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,

          height: 72 + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,

          borderTopWidth: 0,

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.06,
          shadowRadius: 16,

          elevation: 12,
          
          paddingHorizontal: 16,

          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },

        // Ensure content doesn't hide behind absolute tab bar
        tabBarBackground: () => (
          <View style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }} />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={24}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <BarChart2
              color={color}
              size={24}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AddHabitTabPlaceholder"
        component={AddPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateHabitModal');
          },
        })}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <CustomTabBarButton
              onPress={props.onPress}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={24}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              color={color}
              size={24}
              strokeWidth={focused ? 2.6 : 2}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fab: {
    width: 64,
    height: 64,

    borderRadius: 32,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,

    elevation: 12,
  },
});