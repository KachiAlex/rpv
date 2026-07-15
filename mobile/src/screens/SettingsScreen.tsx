import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Switch, Divider, Button, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';

export default function SettingsScreen(): React.ReactElement {
  const { user, logout, loading: authLoading } = useAuthStore();
  const { preferences, loading: prefsLoading, updatePreference } = usePreferencesStore();

  useEffect(() => {
    if (user) {
      usePreferencesStore.getState().loadPreferences(user.uid);
    }
  }, [user]);

  const handleLogout = async (): Promise<void> => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            Alert.alert('Success', 'Logged out successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleToggleDarkMode = async (): Promise<void> => {
    if (user) {
      try {
        await updatePreference(user.uid, 'darkMode', !preferences.darkMode);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleToggleNotifications = async (): Promise<void> => {
    if (user) {
      try {
        await updatePreference(user.uid, 'notifications', !preferences.notifications);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  if (prefsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {user ? (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user.email}
            </Text>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={authLoading}
              disabled={authLoading}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </View>

          <Divider />
        </>
      ) : (
        <View style={styles.section}>
          <Text variant="bodySmall" style={styles.notSignedInText}>
            Sign in to sync your bookmarks and preferences across devices
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Display
        </Text>
        <View style={styles.settingItem}>
          <Text variant="bodyMedium">Dark Mode</Text>
          <Switch
            value={preferences.darkMode}
            onValueChange={handleToggleDarkMode}
            disabled={!user}
          />
        </View>
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notifications
        </Text>
        <View style={styles.settingItem}>
          <Text variant="bodyMedium">Enable Notifications</Text>
          <Switch
            value={preferences.notifications}
            onValueChange={handleToggleNotifications}
            disabled={!user}
          />
        </View>
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          About
        </Text>
        <Text variant="bodySmall" style={styles.aboutText}>
          RPV Bible v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userEmail: {
    color: '#666',
    marginBottom: 12,
  },
  notSignedInText: {
    color: '#999',
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#a9291c',
  },
  aboutText: {
    color: '#999',
  },
});
