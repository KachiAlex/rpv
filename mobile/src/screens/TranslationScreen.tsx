import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Eyebrow, Loading, Empty, Pill } from '../components/Rpv';
import {
  getTranslations,
  getBook,
  getSelectedTranslation,
  setSelectedTranslation,
  RpvTranslation,
} from '../services/bible';

const BOOK_KEY_PREFIX = 'rpv:book:';

export default function TranslationScreen(): React.ReactElement {
  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [selected, setSelected] = useState('RPV');
  const [cached, setCached] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCached = useCallback(async () => {
    const keys = await AsyncStorage.getAllKeys().catch(() => [] as string[]);
    setCached(new Set(keys.filter((k) => k.startsWith(BOOK_KEY_PREFIX)).map((k) => k.split(':')[2])));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setTranslations(await getTranslations());
        setSelected(await getSelectedTranslation());
        await refreshCached();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshCached]);

  const handleSelect = useCallback(async (id: string) => {
    setSelected(id);
    await setSelectedTranslation(id);
  }, []);

  const handleDownload = useCallback(
    async (t: RpvTranslation) => {
      setDownloading(t.id);
      try {
        for (const book of t.books) {
          await getBook(t.id, book.name);
        }
        await refreshCached();
        Alert.alert('Downloaded', `${t.name} is now available offline.`);
      } catch (e: any) {
        Alert.alert('Download failed', e.message);
      } finally {
        setDownloading(null);
      }
    },
    [refreshCached]
  );

  const handleRemove = useCallback(
    (t: RpvTranslation) => {
      Alert.alert('Remove Offline Copy', `Remove downloaded books for ${t.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const keys = (await AsyncStorage.getAllKeys().catch(() => [] as string[])).filter(
              (k) => k.startsWith(`${BOOK_KEY_PREFIX}${t.id}:`)
            );
            await AsyncStorage.multiRemove(keys).catch(() => {});
            await refreshCached();
          },
        },
      ]);
    },
    [refreshCached]
  );

  if (loading) return <Loading label="Loading translations…" />;
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
      data={translations}
      keyExtractor={(t) => t.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Eyebrow>Bible Translations</Eyebrow>
          <Text style={styles.hint}>
            Select a default translation, or download one for offline reading.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isSelected = item.id === selected;
        const isCached = cached.has(item.id);
        const isDownloading = downloading === item.id;
        return (
          <RpvCard>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.id} • {item.books.length} books
                  {isCached ? ' • offline' : ''}
                </Text>
              </View>
              {isSelected ? <Pill variant="red">Default</Pill> : null}
            </View>
            <View style={styles.actions}>
              {!isSelected ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSelect(item.id)}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.navy800} />
                  <Text style={styles.actionText}>Set Default</Text>
                </TouchableOpacity>
              ) : null}
              {isCached ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemove(item)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color={colors.red600} />
                  <Text style={[styles.actionText, { color: colors.red600 }]}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDownload(item)}
                  disabled={isDownloading}
                >
                  <MaterialCommunityIcons
                    name={isDownloading ? 'loading' : 'download-outline'}
                    size={16}
                    color={colors.navy800}
                  />
                  <Text style={styles.actionText}>
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </RpvCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  hint: { fontSize: 13, color: colors.inkSoft, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.inkFaint, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.navy800 },
});
