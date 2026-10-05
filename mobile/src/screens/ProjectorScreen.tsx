import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RpvCard, SectionHead, textStyles } from '../components/Rpv';
import {
  getTranslations,
  getChapter,
  RpvTranslation,
  RpvVerse,
} from '../services/bible';
import { getChannel, sendToChannel, ProjectorRef } from '../services/projector';

// Mirrors the web /remote and /projector pages in one screen:
// the Remote tab sends verses to a channel (cross-device via /api/projector),
// the Display tab shows the currently projected verse in projector styling.
export default function ProjectorScreen(): React.ReactElement {
  const [mode, setMode] = useState<'remote' | 'display'>('remote');
  const [channel, setChannel] = useState('default');

  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [translationId, setTranslationId] = useState('RPV');
  const [book, setBook] = useState('Romans');
  const [chapter, setChapter] = useState('8');
  const [verse, setVerse] = useState('28');
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<ProjectorRef[]>([]);

  const [current, setCurrent] = useState<ProjectorRef | null>(null);
  const [fontSize, setFontSize] = useState(44);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStamp = useRef<string>('');

  useEffect(() => {
    getTranslations().then(setTranslations).catch(() => {});
  }, []);

  const translation = translations.find((t) => t.id === translationId);
  const bookNames = translation?.books.map((b) => b.name) || [];

  // Poll the channel while on display mode (or to show "on air" in remote)
  useEffect(() => {
    const poll = async () => {
      try {
        const ref = await getChannel(channel.trim() || 'default');
        const stamp = String(ref?.timestamp ?? '');
        if (ref && stamp !== lastStamp.current) {
          lastStamp.current = stamp;
          setCurrent(ref);
        }
      } catch {
        /* offline — keep polling */
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [channel]);

  const send = useCallback(async () => {
    const ch = parseInt(chapter, 10);
    const vs = parseInt(verse, 10);
    if (!book.trim() || !ch || !vs) {
      Alert.alert('Missing fields', 'Enter a book, chapter, and verse.');
      return;
    }
    setSending(true);
    try {
      const chapterData = await getChapter(translationId, book.trim(), ch);
      const verseData = chapterData?.verses.find((v: RpvVerse) => v.number === vs);
      const ref: ProjectorRef = {
        translation: translation?.name || translationId,
        book: book.trim(),
        chapter: ch,
        verse: vs,
        text: verseData?.text || '',
        timestamp: new Date().toISOString(),
      };
      await sendToChannel(channel.trim() || 'default', ref);
      setCurrent(ref);
      lastStamp.current = String(ref.timestamp);
      setRecent((r) => [ref, ...r].slice(0, 8));
    } catch (e) {
      Alert.alert('Send failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  }, [translationId, translation, book, chapter, verse, channel]);

  const nextVerse = useCallback(
    (delta: number) => {
      const v = Math.max(1, (parseInt(verse, 10) || 1) + delta);
      setVerse(String(v));
    },
    [verse]
  );

  return (
    <View style={styles.container}>
      {/* Mode switch */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'remote' && styles.modeBtnActive]}
          onPress={() => setMode('remote')}
        >
          <MaterialCommunityIcons
            name="remote"
            size={16}
            color={mode === 'remote' ? colors.white : colors.inkSoft}
          />
          <Text style={[styles.modeText, mode === 'remote' && styles.modeTextActive]}>Remote</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'display' && styles.modeBtnActive]}
          onPress={() => setMode('display')}
        >
          <MaterialCommunityIcons
            name="projector"
            size={16}
            color={mode === 'display' ? colors.white : colors.inkSoft}
          />
          <Text style={[styles.modeText, mode === 'display' && styles.modeTextActive]}>Projector</Text>
        </TouchableOpacity>
      </View>

      {mode === 'remote' ? (
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.pad}>
            <RpvCard>
              <SectionHead title="Channel" subtitle="Both devices must use the same channel name." />
              <TextInput
                style={styles.input}
                value={channel}
                onChangeText={setChannel}
                placeholder="default"
                autoCapitalize="none"
              />
            </RpvCard>

            <RpvCard>
              <SectionHead title="Verse" subtitle="Pick the verse to project." />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {translations.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setTranslationId(t.id)}
                    style={[styles.chip, t.id === translationId && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, t.id === translationId && styles.chipTextActive]}>
                      {t.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {bookNames.map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setBook(b)}
                    style={[styles.chip, b === book && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, b === book && styles.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.refRow}>
                <TextInput
                  style={[styles.input, styles.bookInput]}
                  value={book}
                  onChangeText={setBook}
                  placeholder="Book"
                />
                <TextInput
                  style={[styles.input, styles.numInput]}
                  value={chapter}
                  onChangeText={setChapter}
                  keyboardType="number-pad"
                  placeholder="Ch"
                />
                <TextInput
                  style={[styles.input, styles.numInput]}
                  value={verse}
                  onChangeText={setVerse}
                  keyboardType="number-pad"
                  placeholder="Vs"
                />
              </View>
              <View style={styles.stepRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nextVerse(-1)}>
                  <MaterialCommunityIcons name="chevron-left" size={22} color={colors.navy800} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, sending && { opacity: 0.6 }]}
                  onPress={send}
                  disabled={sending}
                >
                  <Text style={styles.primaryBtnText}>
                    {sending ? 'Sending…' : 'Send to Projector'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nextVerse(1)}>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.navy800} />
                </TouchableOpacity>
              </View>
            </RpvCard>

            {current && (
              <RpvCard>
                <Text style={styles.onAir}>ON AIR — {channel || 'default'}</Text>
                <Text style={styles.onAirRef}>
                  {current.book} {current.chapter}:{current.verse}
                </Text>
                <Text style={textStyles.body} numberOfLines={3}>
                  {current.text}
                </Text>
              </RpvCard>
            )}

            {recent.length > 0 && (
              <RpvCard>
                <SectionHead title="Recent" />
                {recent.map((r, i) => (
                  <View key={i} style={styles.recentRow}>
                    <Text style={styles.recentRef}>
                      {r.book} {r.chapter}:{r.verse}
                    </Text>
                    <Text style={styles.recentText} numberOfLines={1}>
                      {r.text}
                    </Text>
                  </View>
                ))}
              </RpvCard>
            )}
          </View>
        </ScrollView>
      ) : (
        // Display mode — mirrors the web projector page styling
        <View style={styles.projector}>
          <View style={styles.projControls}>
            <TextInput
              style={styles.projChannel}
              value={channel}
              onChangeText={setChannel}
              placeholder="channel"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setFontSize(Math.max(24, fontSize - 4))}>
              <MaterialCommunityIcons name="format-font-size-decrease" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFontSize(Math.min(96, fontSize + 4))}>
              <MaterialCommunityIcons name="format-font-size-increase" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
          {current ? (
            <View style={styles.projContent}>
              <Text style={styles.projRef}>
                {current.book} {current.chapter}:{current.verse} · {current.translation}
              </Text>
              <Text style={[styles.projVerse, { fontSize, lineHeight: fontSize * 1.35 }]}>
                {current.text}
              </Text>
            </View>
          ) : (
            <View style={styles.projContent}>
              <MaterialCommunityIcons name="projector" size={48} color={colors.navy600} />
              <Text style={styles.projIdle}>
                Waiting for verses on channel "{channel || 'default'}"
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  pad: { padding: spacing.md, gap: spacing.sm },

  modeBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { backgroundColor: colors.red600, borderColor: colors.red600 },
  modeText: { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  modeTextActive: { color: colors.white },

  chipRow: { flexDirection: 'row', marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.red600, backgroundColor: colors.red50 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: colors.red600 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  refRow: { flexDirection: 'row', gap: 8 },
  bookInput: { flex: 1 },
  numInput: { width: 56, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  onAir: { fontSize: 11, fontWeight: '800', color: colors.red600, letterSpacing: 1 },
  onAirRef: { fontSize: 15, fontWeight: '700', color: colors.ink, marginVertical: 4 },
  recentRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  recentRef: { fontSize: 13, fontWeight: '700', color: colors.ink },
  recentText: { fontSize: 12, color: colors.inkFaint },

  projector: { flex: 1, backgroundColor: colors.navy900 },
  projControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  projChannel: {
    color: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy600,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 100,
    fontSize: 14,
  },
  projContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  projRef: {
    color: colors.lav,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  projVerse: { color: colors.white, fontWeight: '600', textAlign: 'center' },
  projIdle: { color: colors.lavSoft, fontSize: 15, marginTop: 16, textAlign: 'center' },
});
