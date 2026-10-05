import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Eyebrow, Loading, Empty, textStyles } from '../components/Rpv';
import {
  getTranslations,
  getBook,
  getSelectedTranslation,
  setSelectedTranslation,
  setLastRead,
  getLastRead,
  RpvTranslation,
  RpvBook,
} from '../services/bible';
import audioBible from '../services/audioBible';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';

type Mode = 'books' | 'chapters' | 'verses';

// Book names differ across translations ("1st Corinthians" vs
// "1 Corinthians", "James (Jacob)" vs "James"). Normalize so the same
// book can be matched when switching translations.
function normalizeBookName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ReadScreen(): React.ReactElement {
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { bookmarks, addBookmark, loadBookmarks } = useBookmarkStore();

  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [translationId, setTranslationId] = useState('RPV');
  const [book, setBook] = useState<RpvBook | null>(null);
  const [bookName, setBookName] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(17);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState<number | null>(null);
  const verseListRef = useRef<FlatList>(null);

  const mode: Mode = chapter !== null ? 'verses' : bookName ? 'chapters' : 'books';

  const translation = useMemo(
    () => translations.find((t) => t.id === translationId),
    [translations, translationId]
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await getTranslations();
        setTranslations(list);
        const saved = await getSelectedTranslation();
        const id = list.some((t) => t.id === saved) ? saved : list[0]?.id || 'RPV';
        setTranslationId(id);

        const params = route.params;
        const lastRead = await getLastRead();
        const initialBook = params?.book || lastRead?.book || list.find((t) => t.id === id)?.books[0]?.name;
        const initialChapter = params?.chapter ?? lastRead?.chapter ?? null;
        if (initialBook) {
          setBookName(initialBook);
          if (initialChapter) setChapter(initialChapter);
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) loadBookmarks(user.uid);
  }, [user]);

  // Load book content when book/translation changes
  useEffect(() => {
    if (!bookName) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const b = await getBook(translationId, bookName);
        if (!cancelled) setBook(b);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [translationId, bookName]);

  useEffect(() => {
    if (bookName && chapter) {
      setLastRead({ translationId, book: bookName, chapter });
    }
  }, [translationId, bookName, chapter]);

  const chapterData = useMemo(
    () => book?.chapters.find((c) => c.number === chapter) || null,
    [book, chapter]
  );

  const bookmarkedKeys = useMemo(
    () => new Set(bookmarks.map((b) => `${b.book}-${b.chapter}-${b.verse}`)),
    [bookmarks]
  );

  // Audio lifecycle
  useEffect(() => {
    audioBible.setCallbacks(
      (n) => {
        setSpeakingVerse(n);
        const idx = (chapterData?.verses || []).findIndex((v) => v.number === n);
        if (idx >= 0) {
          verseListRef.current?.scrollToIndex({ index: idx, viewPosition: 0.3, animated: true });
        }
      },
      (playing, paused) => {
        setAudioPlaying(playing);
        setAudioPaused(paused);
        if (!playing) setSpeakingVerse(null);
      }
    );
    return () => audioBible.stop();
  }, [chapterData]);

  useEffect(() => {
    // Stop playback when leaving verses mode or changing chapter
    return () => audioBible.stop();
  }, [translationId, bookName, chapter]);

  const changeTranslation = useCallback(
    async (id: string) => {
      setTranslationId(id);
      await setSelectedTranslation(id);
      audioBible.stop();

      const next = translations.find((t) => t.id === id);
      if (!bookName || !next) {
        setBook(null);
        setBookName(null);
        setChapter(null);
        return;
      }

      // Keep the same book/chapter in the new translation when possible
      const wanted = normalizeBookName(bookName);
      const match = next.books.find((b) => normalizeBookName(b.name) === wanted);
      if (match) {
        setBookName(match.name); // triggers book reload via effect
        if (chapter && chapter > match.chapterCount) setChapter(null);
      } else {
        setBook(null);
        setBookName(null);
        setChapter(null);
      }
    },
    [translations, bookName, chapter]
  );

  const selectBook = useCallback((name: string) => {
    setBookName(name);
    setChapter(null);
    setBook(null);
  }, []);

  const handleBookmark = useCallback(
    async (verse: { number: number; text: string }) => {
      if (!user) {
        Alert.alert('Sign in required', 'Sign in to save and sync bookmarks.');
        return;
      }
      if (!bookName || !chapter) return;
      try {
        await addBookmark(user.uid, {
          id: `${translationId}-${bookName}-${chapter}-${verse.number}`,
          book: bookName,
          chapter,
          verse: verse.number,
          text: verse.text,
          translation: translationId,
        } as any);
      } catch (e: any) {
        Alert.alert('Bookmark failed', e.message);
      }
    },
    [user, bookName, chapter, translationId, addBookmark]
  );

  const prevChapter = useCallback(() => {
    if (chapter && chapter > 1) setChapter(chapter - 1);
  }, [chapter]);

  const nextChapter = useCallback(() => {
    if (book && chapter && chapter < book.chapters.length) setChapter(chapter + 1);
  }, [book, chapter]);

  const handleCopyVerse = useCallback(
    async (verse: { number: number; text: string }) => {
      await Clipboard.setStringAsync(
        `${bookName} ${chapter}:${verse.number} (${translationId})\n\n${verse.text}`
      );
      Alert.alert('Copied', `${bookName} ${chapter}:${verse.number} copied to clipboard`);
    },
    [bookName, chapter, translationId]
  );

  const handleAudioToggle = useCallback(() => {
    const verses = chapterData?.verses || [];
    if (!verses.length) return;
    if (audioPlaying && audioPaused) {
      audioBible.resume();
    } else if (audioPlaying) {
      audioBible.pause();
    } else {
      audioBible.play(verses, 0);
    }
  }, [audioPlaying, audioPaused, chapterData]);

  const handleAudioStop = useCallback(() => {
    audioBible.stop();
  }, []);

  // ---------- Render ----------

  const renderTranslationRow = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.transRow}>
      {translations.map((t) => (
        <TouchableOpacity
          key={t.id}
          onPress={() => changeTranslation(t.id)}
          style={[styles.transChip, t.id === translationId && styles.transChipActive]}
        >
          <Text style={[styles.transChipText, t.id === translationId && styles.transChipTextActive]}>
            {t.id}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBooks = () => (
    <ScrollView style={styles.flex}>
      <View style={styles.pad}>
        <Eyebrow>Read the Bible</Eyebrow>
        <Text style={styles.pageTitle}>Choose a book</Text>
        <Text style={textStyles.body}>
          {translation ? `${translation.name} — ${translation.books.length} books` : ''}
        </Text>
        <View style={styles.bookGrid}>
          {translation?.books.map((b) => (
            <TouchableOpacity
              key={b.name}
              style={styles.bookTile}
              onPress={() => selectBook(b.name)}
            >
              <Text style={styles.bookTileText}>{b.name}</Text>
              <Text style={styles.bookTileMeta}>{b.chapterCount} ch.</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderChapters = () => (
    <ScrollView style={styles.flex}>
      <View style={styles.pad}>
        <TouchableOpacity onPress={() => { setBookName(null); setBook(null); }} style={styles.backRow}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.red600} />
          <Text style={styles.backText}>All books</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{bookName}</Text>
        {book?.introduction ? (
          <RpvCard>
            <Eyebrow>Introduction</Eyebrow>
            <Text style={textStyles.body}>{book.introduction}</Text>
          </RpvCard>
        ) : null}
        <View style={styles.chapterGrid}>
          {book?.chapters.map((c) => (
            <TouchableOpacity
              key={c.number}
              style={styles.chapterTile}
              onPress={() => setChapter(c.number)}
            >
              <Text style={styles.chapterTileText}>{c.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderVerses = () => (
    <View style={styles.flex}>
      {/* Sticky chapter bar */}
      <View style={styles.chapterBar}>
        <TouchableOpacity onPress={() => setChapter(null)} style={styles.backRow}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.red600} />
          <Text style={styles.backText}>{bookName}</Text>
        </TouchableOpacity>
        <View style={styles.chapterNav}>
          <TouchableOpacity
            onPress={prevChapter}
            disabled={!chapter || chapter <= 1}
            style={styles.navArrow}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={chapter && chapter > 1 ? colors.navy800 : colors.inkFaint}
            />
          </TouchableOpacity>
          <Text style={styles.chapterLabel}>
            {bookName} {chapter}
          </Text>
          <TouchableOpacity
            onPress={nextChapter}
            disabled={!book || !chapter || chapter >= book.chapters.length}
            style={styles.navArrow}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={
                book && chapter && chapter < book.chapters.length ? colors.navy800 : colors.inkFaint
              }
            />
          </TouchableOpacity>
        </View>
        <View style={styles.fontCtl}>
          <TouchableOpacity onPress={() => setFontSize(Math.max(13, fontSize - 1))}>
            <MaterialCommunityIcons name="format-font-size-decrease" size={18} color={colors.navy800} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize(Math.min(26, fontSize + 1))}>
            <MaterialCommunityIcons name="format-font-size-increase" size={18} color={colors.navy800} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio bible controls */}
      <View style={styles.audioBar}>
        <MaterialCommunityIcons name="volume-high" size={18} color={colors.red600} />
        <Text style={styles.audioLabel}>Audio Bible</Text>
        <View style={styles.audioBtns}>
          <TouchableOpacity onPress={handleAudioToggle} style={styles.audioBtn}>
            <MaterialCommunityIcons
              name={audioPlaying && !audioPaused ? 'pause' : 'play'}
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAudioStop} style={[styles.audioBtn, styles.audioBtnStop]}>
            <MaterialCommunityIcons name="stop" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={verseListRef}
        data={chapterData?.verses || []}
        keyExtractor={(v) => `${v.number}`}
        contentContainerStyle={styles.verseList}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const key = `${bookName}-${chapter}-${item.number}`;
          const saved = bookmarkedKeys.has(key);
          const speaking = speakingVerse === item.number;
          return (
            <View style={[styles.verseRow, speaking && styles.verseRowSpeaking]}>
              <Text style={styles.verseNum}>{item.number}</Text>
              <View style={styles.verseBody}>
                <Text
                  selectable
                  selectionColor={colors.lav}
                  style={[styles.verseText, { fontSize, lineHeight: fontSize * 1.55 }]}
                >
                  {item.text}
                </Text>
                <View style={styles.verseActions}>
                  <TouchableOpacity onPress={() => handleBookmark(item)} style={styles.verseAction}>
                    <MaterialCommunityIcons
                      name={saved ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={saved ? colors.red600 : colors.inkFaint}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCopyVerse(item)} style={styles.verseAction}>
                    <MaterialCommunityIcons name="content-copy" size={15} color={colors.inkFaint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      audioBible.play(chapterData?.verses || [], chapterData?.verses.findIndex((v) => v.number === item.number) || 0)
                    }
                    style={styles.verseAction}
                  >
                    <MaterialCommunityIcons
                      name={speaking ? 'volume-high' : 'play-circle-outline'}
                      size={17}
                      color={speaking ? colors.red600 : colors.inkFaint}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Empty icon="book-open-outline" message="No verses in this chapter yet." />
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTranslationRow()}
      {loading ? (
        <Loading label="Loading scripture…" />
      ) : error ? (
        <Empty icon="alert-circle-outline" message={error} />
      ) : mode === 'books' ? (
        renderBooks()
      ) : mode === 'chapters' ? (
        renderChapters()
      ) : (
        renderVerses()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
  },
  pad: {
    padding: spacing.md,
  },
  transRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.navy900,
    flexGrow: 0,
  },
  transChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.navy700,
    marginRight: 8,
  },
  transChipActive: {
    backgroundColor: colors.red600,
  },
  transChipText: {
    color: colors.lavSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transChipTextActive: {
    color: colors.white,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  bookTile: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    minWidth: '30%',
    flexGrow: 1,
    flexBasis: '30%',
  },
  bookTileText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy800,
  },
  bookTileMeta: {
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backText: {
    color: colors.red600,
    fontWeight: '700',
    fontSize: 14,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  chapterTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterTileText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  chapterBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chapterNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  navArrow: {
    padding: 6,
  },
  fontCtl: {
    position: 'absolute',
    right: spacing.md,
    top: 10,
    flexDirection: 'row',
    gap: 14,
  },
  verseList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 12,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.red600,
    marginTop: 3,
    minWidth: 22,
  },
  verseBody: {
    flex: 1,
  },
  verseText: {
    color: colors.ink,
  },
  verseRowSpeaking: {
    backgroundColor: colors.red50,
    borderRadius: radius.input,
    padding: 8,
    marginHorizontal: -8,
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },
  verseAction: {
    padding: 4,
  },
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  audioLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy800,
  },
  audioBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  audioBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.red600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnStop: {
    backgroundColor: colors.navy800,
  },
});
