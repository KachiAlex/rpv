import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { initializeDatabase } from './services/database';
import { initializeApi } from './services/api';
import { useAuthStore } from './store/authStore';
import { colors } from './theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.navy900,
    text: colors.ink,
    primary: colors.red600,
    border: colors.border,
  },
};

export default function App(): React.ReactElement {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        await initializeDatabase();
        await initializeApi();
        initializeAuth();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initialize();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
