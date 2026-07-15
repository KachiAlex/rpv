import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';

export default function AdminScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { isAdmin, adminUser, loading, getAdminUser } = useAdminStore();

  useEffect(() => {
    if (user) {
      getAdminUser(user.uid);
    }
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="lock-outline" size={48} color="#ccc" />
          <Text variant="bodyMedium" style={styles.emptyText}>
            Sign in to access admin features
          </Text>
        </View>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="shield-alert-outline" size={48} color="#ccc" />
          <Text variant="bodyMedium" style={styles.emptyText}>
            You don't have admin access
          </Text>
        </View>
      </View>
    );
  }

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
        <MaterialCommunityIcons name="shield-admin" size={32} color="#a9291c" />
        <Text variant="headlineSmall" style={styles.title}>
          Admin Dashboard
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {adminUser?.email}
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="file-document" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Blog Management
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Create, edit, and publish blog posts
            </Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Blog Management', 'Blog management feature coming soon')}
              style={styles.cardButton}
            >
              Manage Blogs
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Publication Management
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Manage Bible translations and publications
            </Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Publications', 'Publication management feature coming soon')}
              style={styles.cardButton}
            >
              Manage Publications
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Analytics
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              View app usage and user statistics
            </Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Analytics', 'Analytics feature coming soon')}
              style={styles.cardButton}
            >
              View Analytics
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-multiple" size={24} color="#a9291c" />
              <Text variant="titleMedium" style={styles.cardTitle}>
                User Management
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.cardText}>
              Manage users and permissions
            </Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Users', 'User management feature coming soon')}
              style={styles.cardButton}
            >
              Manage Users
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Admin Info
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Role: {adminUser?.role}
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Email: {adminUser?.email}
          </Text>
        </View>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    color: '#a9291c',
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
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
    color: '#666',
    marginBottom: 12,
  },
  cardButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#666',
    marginBottom: 4,
  },
});
