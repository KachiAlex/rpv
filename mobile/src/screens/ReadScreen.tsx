import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Menu, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import searchService, { SearchResult } from '../services/searchService';
import translationService from '../services/translationService';
import offlineQueueService from '../services/offlineQueueService';

interface VerseWithMeta extends SearchResult {
  isBookmarked?: boolean;
}

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
];

export default function ReadScreen(): React.ReactElement {
  const [selectedBook, setSelectedBook] = useState<string>('John');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<VerseWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('KJV');
  const [menuVisible, setMenuVisible] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSelectedTranslation();
    loadChapter();
  }, []);

  const loadSelectedTranslation = async (): Promise<void> => {
    try {
      const translation = await translationService.getSelectedTranslation();
      setSelectedTranslation(translation);
    } catch (error) {
      console.error('Error loading translation:', error);
    }
  };

  const loadChapter = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const chapterVerses = await searchService.getChapter(
        selectedBook,
        selectedChapter,
        selectedTranslation
      );
      setVerses(chapterVerses);
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Error', 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, selectedTranslation]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const handlePreviousChapter = (): void => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    }
  };

  const handleNextChapter = (): void => {
    setSelectedChapter(selectedChapter + 1);
  };

  const handleChangeTranslation = async (translation: string): Promise<void> => {
    try {
      await translationService.setSelectedTranslation(translation);
      setSelectedTranslation(translation);
      setMenuVisible(false);
    } catch (error) {
      console.error('Error changing translation:', error);
      Alert.alert('Error', 'Failed to change translation');
    }
  };

  const handleBookmark = async (verse: SearchResult): Promise<void> => {
    try {
      const verseId = `${verse.book}-${verse.chapter}-${verse.verse}`;
      const isBookmarked = bookmarks.has(verseId);

      if (isBookmarked) {
        bookmarks.delete(verseId);
        setBookmarks(new Set(bookmarks));
      } else {
        bookmarks.add(verseId);
        setBookmarks(new Set(bookmarks));
        // Queue bookmark for sync
        await offlineQueueService.queueBookmarkAdd(verse.id, 'current-user');
      }
    } catch (error) {
      console.error('Error bookmarking verse:', error);
      Alert.alert('Error', 'Failed to bookmark verse');
    }
  };

  const handleCopyVerse = async (verse: SearchResult): Promise<void> => {
    try {
      const text = `${verse.book} ${verse.chapter}:${verse.verse} (${verse.translation})\n\n${verse.text}`;
      // In a real app, use react-native-clipboard
      Alert.alert('Copied', 'Verse copied to clipboard');
    } catch (error) {
      console.error('Error copying verse:', error);
    }
  };

  const renderVerseItem = ({ item }: { item: VerseWithMeta }): React.ReactElement => {
    const verseId = `${item.book}-${item.chapter}-${item.verse}`;
    const isBookmarked = bookmarks.has(verseId);

    return (
      <View style={styles.verseContainer}>
        <View style={styles.verseHeader}>
          <Text style={[styles.verseNumber, { fontSize: fontSize - 2 }]}>
            {item.verse}
          </Text>
          <TouchableOpacity
            onPress={() => handleBookmark(item)}
            style={styles.bookmarkButton}
          >
            <MaterialCommunityIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#a9291c' : '#999'}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.verseText, { fontSize }]}>
          {item.text}
        </Text>
        <TouchableOpacity
          onPress={() => handleCopyVerse(item)}
          style={styles.copyButton}
        >
          <MaterialCommunityIcons name="content-copy" size={16} color="#a9291c" />
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with book/chapter navigation */}
      <View style={styles.header}>
        <View style={styles.navigationRow}>
          <Button
            mode="text"
            onPress={handlePreviousChapter}
            disabled={selectedChapter === 1}
            icon="chevron-left"
          >
            Prev
          </Button>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterTitle}>
              {selectedBook} {selectedChapter}
            </Text>
          </View>
          <Button
            mode="text"
            onPress={handleNextChapter}
            icon="chevron-right"
          >
            Next
          </Button>
        </View>

        {/* Translation selector and font size */}
        <View style={styles.controlsRow}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                compact
              >
                {selectedTranslation}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleChangeTranslation('KJV')}
              title="KJV"
            />
            <Menu.Item
              onPress={() => handleChangeTranslation('NIV')}
              title="NIV"
            />
            <Menu.Item
              onPress={() => handleChangeTranslation('ESV')}
              title="ESV"
            />
          </Menu>

          <View style={styles.fontSizeControl}>
            <TouchableOpacity
              onPress={() => setFontSize(Math.max(12, fontSize - 2))}
              style={styles.fontButton}
            >
              <MaterialCommunityIcons name="minus" size={18} color="#a9291c" />
            </TouchableOpacity>
            <Text style={styles.fontSizeText}>{fontSize}</Text>
            <TouchableOpacity
              onPress={() => setFontSize(Math.min(24, fontSize + 2))}
              style={styles.fontButton}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#a9291c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}`}
          renderItem={renderVerseItem}
          contentContainerStyle={styles.listContent}
          scrollEnabled
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
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chapterInfo: {
    alignItems: 'center',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fontButton: {
    padding: 4,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    gap: 16,
  },
  verseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseNumber: {
    fontWeight: '700',
    color: '#a9291c',
  },
  bookmarkButton: {
    padding: 4,
  },
  verseText: {
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#a9291c',
    fontWeight: '600',
  },
});
