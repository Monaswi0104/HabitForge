import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { initDB } from './src/database/db';
import { notificationService } from './src/services/notificationService';
import { useSettingsStore } from './src/store/settingsStore';

function App() {
  const isDarkMode = useSettingsStore((state: any) => state.isDarkMode);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await notificationService.configure();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app', error);
      }
    };

    setup();
  }, []);

  if (!dbInitialized) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
