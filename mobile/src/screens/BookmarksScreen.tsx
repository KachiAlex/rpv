import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';

export default function BookmarksScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { bookmarks, loading, error, loadBookmarks, removeBookmark } = useBookmarkStore();

  useEffect(() => {
    if (user) {
      loadBookmarks(user.uid);
    }
  }, [user]);

  const handleRemoveBookmark = (bookmarkId: string): void => {
    if (!user) return;

    Alert.alert('Remove Bookmark', 'Are you sure you want to remove this bookmark?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Remove',
        onPress: async () => {
          try {
            await removeBookmark(user.uid, bookmarkId);
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bookmark-outline" size={48} color="#ccc" />
          <Text variant="bodyMedium" style={styles.emptyText}>
            Sign in to save and sync bookmarks
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

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={styles.errorText}>
            Error: {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bookmark-outline" size={48} color="#ccc" />
          <Text variant="bodyMedium" style={styles.emptyText}>
            No bookmarks yet. Start bookmarking verses!
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.bookmarkId || item.id}
          renderItem={({ item }) => (
            <View style={styles.bookmarkItem}>
              <View style={styles.bookmarkContent}>
                <Text variant="titleSmall" style={styles.bookmarkTitle}>
                  {item.book} {item.chapter}:{item.verse}
                </Text>
                <Text variant="bodySmall" style={styles.bookmarkText} numberOfLines={3}>
                  {item.text}
                </Text>
                <Text variant="labelSmall" style={styles.bookmarkTranslation}>
                  {item.translation}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveBookmark(item.bookmarkId || item.id)}
                style={styles.deleteButton}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#a9291c" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  bookmarkItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookmarkContent: {
    flex: 1,
    marginRight: 12,
  },
  bookmarkTitle: {
    fontWeight: '600',
    color: '#a9291c',
    marginBottom: 4,
  },
  bookmarkText: {
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  bookmarkTranslation: {
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
