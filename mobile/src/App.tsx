import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './navigation/RootNavigator';
import { initializeDatabase } from './services/database';
import { initializeApi } from './services/api';
import { useAuthStore } from './store/authStore';

export default function App(): React.ReactElement {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        // Initialize database
        await initializeDatabase();

        // Restore API session (token + user)
        await initializeApi();

        // Initialize auth state
        initializeAuth();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
