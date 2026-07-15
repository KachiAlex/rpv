import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { TextInput, Text, ActivityIndicator, Chip } from 'react-native-paper';
import searchService, { SearchResult } from '../services/searchService';

export default function SearchScreen(): React.ReactElement {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load recent searches on mount
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  const handleSearch = async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowRecent(true);
      return;
    }

    setLoading(true);
    setShowRecent(false);
    try {
      const searchResults = await searchService.search({
        query: searchQuery,
        limit: 50,
      });
      setResults(searchResults);
      setRecentSearches(searchService.getRecentSearches());
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string): void => {
    setQuery(text);

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim()) {
      debounceTimer.current = setTimeout(() => {
        handleSearch(text);
      }, 300);
    } else {
      setResults([]);
      setShowRecent(true);
    }
  };

  const handleRecentSearch = (recentQuery: string): void => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const renderResultItem = ({ item }: { item: SearchResult }): React.ReactElement => (
    <TouchableOpacity style={styles.resultItem}>
      <Text variant="titleSmall" style={styles.resultTitle}>
        {item.book} {item.chapter}:{item.verse}
      </Text>
      <Text variant="bodySmall" style={styles.resultText} numberOfLines={3}>
        {item.text}
      </Text>
      <Text variant="labelSmall" style={styles.resultTranslation}>
        {item.translation}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentSearches = (): React.ReactElement => (
    <View style={styles.recentContainer}>
      <Text variant="titleSmall" style={styles.recentTitle}>
        Recent Searches
      </Text>
      <View style={styles.chipsContainer}>
        {recentSearches.length > 0 ? (
          recentSearches.map((search, index) => (
            <Chip
              key={index}
              onPress={() => handleRecentSearch(search)}
              style={styles.chip}
            >
              {search}
            </Chip>
          ))
        ) : (
          <Text variant="bodySmall" style={styles.noRecentText}>
            No recent searches
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        label="Search verses..."
        value={query}
        onChangeText={handleQueryChange}
        style={styles.searchInput}
        mode="outlined"
        right={loading ? <TextInput.Icon icon="loading" /> : undefined}
      />

      {loading && <ActivityIndicator style={styles.loader} />}

      {showRecent && !loading ? (
        renderRecentSearches()
      ) : results.length === 0 && !loading && query.trim() ? (
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No verses found
          </Text>
        </View>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}`}
        renderItem={renderResultItem}
        scrollEnabled={results.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    marginBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
  },
  resultTitle: {
    fontWeight: '600',
    color: '#a9291c',
    marginBottom: 4,
  },
  resultText: {
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultTranslation: {
    color: '#999',
  },
  recentContainer: {
    padding: 16,
  },
  recentTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  noRecentText: {
    color: '#999',
  },
});
