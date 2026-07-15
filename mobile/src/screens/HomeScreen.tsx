import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen(): React.ReactElement {
  const { user, initializeAuth, loading } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          RPV Bible
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Study Scripture with confidence
        </Text>
        {user && (
          <Text variant="labelSmall" style={styles.userInfo}>
            Signed in as {user.email}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {!user && (
          <Card style={[styles.card, styles.authCard]}>
            <Card.Content>
              <View style={styles.authCardContent}>
                <MaterialCommunityIcons name="lock-outline" size={32} color="#a9291c" />
                <Text variant="titleMedium" style={styles.authCardTitle}>
                  Sign In to Sync
                </Text>
                <Text variant="bodySmall" style={styles.authCardText}>
                  Sign in to save bookmarks and sync across devices
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="magnify" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Quick Search
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Find verses instantly across all translations
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Read Bible
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Read Scripture in multiple translations with offline support
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="bookmark" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Bookmarks
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Save your favorite verses {user ? 'and sync them' : 'locally'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="wifi-off" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Offline Support
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Read and search verses even without internet connection
            </Text>
          </Card.Content>
        </Card>
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
  header: {
    padding: 20,
    backgroundColor: '#a9291c',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    marginTop: 8,
  },
  userInfo: {
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  authCard: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
    marginBottom: 16,
  },
  authCardContent: {
    alignItems: 'center',
  },
  authCardTitle: {
    marginTop: 12,
    color: '#a9291c',
    fontWeight: '600',
  },
  authCardText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    marginLeft: 12,
    color: '#a9291c',
  },
  cardText: {
    marginTop: 8,
    color: '#666',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#a9291c',
  },
});
