import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Eyebrow, Pill, Empty } from '../components/Rpv';
import {
  searchVerses,
  getSelectedTranslation,
  SearchHit,
} from '../services/bible';

const RECENT_KEY = 'rpv:recentSearches';

export default function SearchScreen(): React.ReactElement {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState(route.params?.query || '');
  const [translationId, setTranslationId] = useState(route.params?.translationId || 'RPV');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    (async () => {
      setTranslationId(await getSelectedTranslation());
      const raw = await AsyncStorage.getItem(RECENT_KEY).catch(() => null);
      setRecent(raw ? JSON.parse(raw) : []);
    })();
  }, []);

  useEffect(() => {
    if (route.params?.query) {
      runSearch(route.params.query);
    }
  }, [route.params?.query]);

  const saveRecent = useCallback(async (q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, 10);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      const needle = q.trim();
      if (!needle) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const hits = await searchVerses(needle, translationId);
        setResults(hits);
        saveRecent(needle);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [translationId, saveRecent]
  );

  const onChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounce.current) clearTimeout(debounce.current);
      if (text.trim().length >= 3) {
        debounce.current = setTimeout(() => runSearch(text), 400);
      } else {
        setResults([]);
      }
    },
    [runSearch]
  );

  const openVerse = useCallback(
    (hit: SearchHit) => {
      navigation.navigate('Read', { book: hit.book, chapter: hit.chapter });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.inkFaint} />
        <TextInput
          style={styles.input}
          placeholder="Search verses…"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={onChange}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
        />
        {loading ? (
          <MaterialCommunityIcons name="loading" size={20} color={colors.red600} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => onChange('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Pill variant="navy">{translationId}</Pill>
        <TouchableOpacity onPress={() => navigation.navigate('BibleSearch')}>
          <Text style={styles.aiLink}>Try AI Bible Search →</Text>
        </TouchableOpacity>
      </View>

      {results.length === 0 && !loading && query.trim().length === 0 ? (
        <RpvCard style={styles.recentCard}>
          <Eyebrow>Recent Searches</Eyebrow>
          <View style={styles.chips}>
            {recent.length ? (
              recent.map((r) => (
                <TouchableOpacity key={r} style={styles.chip} onPress={() => onChange(r)}>
                  <Text style={styles.chipText}>{r}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.hint}>No recent searches</Text>
            )}
          </View>
        </RpvCard>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(h) => `${h.book}-${h.chapter}-${h.verse}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openVerse(item)}>
            <RpvCard style={styles.resultCard}>
              <Text style={styles.ref}>
                {item.book} {item.chapter}:{item.verse}
              </Text>
              <Text style={styles.text} numberOfLines={3}>
                {item.text}
              </Text>
              <Text style={styles.trans}>{item.translation.toUpperCase()}</Text>
            </RpvCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.trim().length >= 3 && !loading ? (
            <Empty icon="text-search" message={`No verses found for "${query}"`} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  aiLink: {
    color: colors.red600,
    fontWeight: '700',
    fontSize: 13,
  },
  recentCard: {
    marginHorizontal: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.inkSoft,
    fontSize: 13,
  },
  hint: {
    color: colors.inkFaint,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  resultCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.red600,
  },
  ref: {
    fontWeight: '700',
    color: colors.navy800,
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  trans: {
    color: colors.inkFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
