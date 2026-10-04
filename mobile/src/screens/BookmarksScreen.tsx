import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { RpvCard, Loading, Empty } from '../components/Rpv';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';

export default function BookmarksScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { bookmarks, loading, error, loadBookmarks, removeBookmark } = useBookmarkStore();

  useEffect(() => {
    if (user) loadBookmarks(user.uid);
  }, [user]);

  const handleRemove = (bookmarkId: string): void => {
    if (!user) return;
    Alert.alert('Remove Bookmark', 'Remove this bookmark?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeBookmark(user.uid, bookmarkId).catch((e: any) => Alert.alert('Error', e.message)),
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Empty icon="bookmark-outline" message="Sign in to save and sync bookmarks." />
      </View>
    );
  }
  if (loading) return <Loading label="Loading bookmarks…" />;
  if (error) {
    return (
      <View style={styles.container}>
        <Empty icon="alert-circle-outline" message={error} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={bookmarks}
      keyExtractor={(item) => item.bookmarkId || item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Read', { book: item.book, chapter: item.chapter })
          }
        >
          <RpvCard style={styles.item}>
            <View style={styles.itemRow}>
              <View style={styles.itemBody}>
                <Text style={styles.ref}>
                  {item.book} {item.chapter}:{item.verse}
                </Text>
                {item.text ? (
                  <Text style={styles.text} numberOfLines={3}>
                    {item.text}
                  </Text>
                ) : null}
                <Text style={styles.trans}>{item.translation}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item.bookmarkId || item.id)}
                style={styles.delete}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color={colors.red600} />
              </TouchableOpacity>
            </View>
          </RpvCard>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Empty icon="bookmark-outline" message="No bookmarks yet. Bookmark a verse while reading." />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  item: { borderLeftWidth: 4, borderLeftColor: colors.red600 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemBody: { flex: 1, marginRight: 8 },
  ref: { fontWeight: '700', color: colors.navy800, fontSize: 14, marginBottom: 4 },
  text: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  trans: { color: colors.inkFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  delete: { padding: 4 },
});
