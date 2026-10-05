import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Empty, FieldLabel, textStyles } from '../components/Rpv';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import {
  getHistory,
  getHighlights,
  getReadingProgress,
  changePassword,
  removeHighlightByVerse,
  HistoryEntry,
  VerseHighlight,
  ProgressEntry,
} from '../services/userData';

type AccountTab = 'bookmarks' | 'history' | 'highlights' | 'progress' | 'account';

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'bookmarks', label: 'Bookmarks' },
  { id: 'history', label: 'History' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'progress', label: 'Progress' },
  { id: 'account', label: 'Account' },
];

const HIGHLIGHT_BG: Record<string, string> = {
  yellow: '#fef3c7',
  green: '#d1fae5',
  blue: '#dbeafe',
  pink: '#fce7f3',
};

// Mirrors the web /account page: bookmarks, reading history, highlights,
// reading progress, and account settings in one tabbed view.
export default function AccountScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { bookmarks, loadBookmarks, removeBookmark } = useBookmarkStore();

  const [tab, setTab] = useState<AccountTab>('bookmarks');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const openVerse = useCallback(
    (book: string, chapter: number, verse?: number, translationId?: string) => {
      navigation.navigate('Read', { book, chapter, verse, translationId });
    },
    [navigation]
  );

  const load = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    setRefreshing(true);
    try {
      const [h, hl, p] = await Promise.allSettled([
        getHistory(),
        getHighlights(),
        getReadingProgress(),
      ]);
      if (h.status === 'fulfilled') setHistory(h.value);
      if (hl.status === 'fulfilled') setHighlights(hl.value);
      if (p.status === 'fulfilled') setProgress(p.value);
      await loadBookmarks(user.uid);
    } finally {
      setRefreshing(false);
    }
  }, [user, isAuthenticated, loadBookmarks]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Missing fields', 'Enter your current and new password.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Dashboard');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Empty icon="lock-outline" message="Sign in to view your account." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="account-circle-outline" size={30} color={colors.white} />
        <Text style={textStyles.heroTitle}>My Account</Text>
        <Text style={styles.heroSub}>{user?.email}</Text>
      </View>

      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabPill, tab === t.id && styles.tabPillActive]}
            >
              <Text style={[styles.tabPillText, tab === t.id && styles.tabPillTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.red600} />
        }
      >
        <View style={styles.tabBody}>
          {/* Bookmarks */}
          {tab === 'bookmarks' &&
            (bookmarks.length === 0 ? (
              <Empty icon="bookmark-outline" message="No bookmarks yet. Save verses while reading." />
            ) : (
              bookmarks.map((b: any) => (
                <TouchableOpacity
                  key={b.bookmarkId || b.id}
                  onPress={() => openVerse(b.book, b.chapter, b.verse, b.translation)}
                >
                  <RpvCard>
                    <View style={styles.row}>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>
                          {b.book} {b.chapter}:{b.verse}
                        </Text>
                        {!!b.text && (
                          <Text style={textStyles.body} numberOfLines={2}>
                            {b.text}
                          </Text>
                        )}
                        <Text style={styles.meta}>{b.translation}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeBookmark(user!.uid, b.bookmarkId || b.id)}
                        style={styles.iconBtn}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.red600} />
                      </TouchableOpacity>
                    </View>
                  </RpvCard>
                </TouchableOpacity>
              ))
            ))}

          {/* History */}
          {tab === 'history' &&
            (history.length === 0 ? (
              <Empty icon="history" message="No reading history yet." />
            ) : (
              history.map((h, i) => (
                <TouchableOpacity
                  key={`${h.translationId}-${h.book}-${h.chapter}-${i}`}
                  onPress={() => openVerse(h.book, h.chapter, h.verse, h.translationId)}
                >
                  <RpvCard>
                    <View style={styles.row}>
                      <MaterialCommunityIcons name="history" size={20} color={colors.navy800} />
                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>
                          {h.book} {h.chapter}
                          {h.verse ? `:${h.verse}` : ''}
                        </Text>
                        <Text style={styles.meta}>
                          {h.translationId}
                          {h.readAt ? ` · ${new Date(h.readAt).toLocaleDateString()}` : ''}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.inkFaint} />
                    </View>
                  </RpvCard>
                </TouchableOpacity>
              ))
            ))}

          {/* Highlights */}
          {tab === 'highlights' &&
            (highlights.length === 0 ? (
              <Empty icon="format-color-highlight" message="No highlights yet. Highlight verses while reading." />
            ) : (
              highlights.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => openVerse(h.book, h.chapter, h.verse, h.translationId)}
                >
                  <RpvCard style={{ borderLeftWidth: 4, borderLeftColor: HIGHLIGHT_BG[h.color] || colors.border }}>
                    <View style={styles.row}>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>
                          {h.book} {h.chapter}:{h.verse}
                        </Text>
                        <Text style={styles.meta}>{h.translationId}</Text>
                        {!!h.note && (
                          <Text style={textStyles.body} numberOfLines={2}>
                            {h.note}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          removeHighlightByVerse({
                            translationId: h.translationId,
                            book: h.book,
                            chapter: h.chapter,
                            verse: h.verse,
                          })
                            .then(() => setHighlights((x) => x.filter((y) => y.id !== h.id)))
                            .catch(() => {})
                        }
                        style={styles.iconBtn}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.red600} />
                      </TouchableOpacity>
                    </View>
                  </RpvCard>
                </TouchableOpacity>
              ))
            ))}

          {/* Reading progress */}
          {tab === 'progress' &&
            (progress.length === 0 ? (
              <Empty icon="book-check-outline" message="No reading progress yet. Progress is saved as you read." />
            ) : (
              progress.map((p) => (
                <TouchableOpacity
                  key={`${p.translationId}-${p.book}`}
                  onPress={() => openVerse(p.book, p.chapter, p.verse, p.translationId)}
                >
                  <RpvCard>
                    <View style={styles.row}>
                      <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.red600} />
                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>
                          {p.book} {p.chapter}
                        </Text>
                        <Text style={styles.meta}>
                          {p.translationId}
                          {p.lastReadAt
                            ? ` · Last read ${new Date(p.lastReadAt).toLocaleDateString()}`
                            : ''}
                        </Text>
                      </View>
                      <Text style={styles.continueText}>Continue</Text>
                    </View>
                  </RpvCard>
                </TouchableOpacity>
              ))
            ))}

          {/* Account */}
          {tab === 'account' && (
            <>
              <RpvCard>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <FieldLabel>Current password</FieldLabel>
                <TextInput
                  style={styles.input}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry
                />
                <FieldLabel>New password</FieldLabel>
                <TextInput
                  style={styles.input}
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry
                  placeholder="At least 6 characters"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, pwSaving && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={pwSaving}
                >
                  <Text style={styles.primaryBtnText}>
                    {pwSaving ? 'Saving…' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </RpvCard>

              <RpvCard>
                <View style={styles.row}>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>Sign out</Text>
                    <Text style={styles.meta}>{user?.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <MaterialCommunityIcons name="logout" size={18} color={colors.red600} />
                  </TouchableOpacity>
                </View>
              </RpvCard>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.navy900,
    padding: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroSub: { color: colors.lavSoft, fontSize: 13, marginTop: 4 },
  scroll: { flex: 1 },

  tabBarWrap: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: { paddingHorizontal: spacing.md, gap: 8, paddingVertical: 10 },
  tabPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  tabPillActive: { backgroundColor: colors.red600, borderColor: colors.red600 },
  tabPillText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  tabPillTextActive: { color: colors.white },

  tabBody: { padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  continueText: { fontSize: 13, fontWeight: '700', color: colors.red600 },
  iconBtn: { padding: 6 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  signOutBtn: {
    padding: 8,
    borderRadius: radius.input,
    backgroundColor: colors.red50,
  },
});
