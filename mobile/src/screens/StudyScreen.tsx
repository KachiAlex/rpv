import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Eyebrow, SectionHead, Empty, textStyles } from '../components/Rpv';
import {
  getTranslations,
  getCommentary,
  askStudyAssistant,
  CommentaryEntry,
  AssistantAnswer,
  RpvTranslation,
} from '../services/bible';

// Mirrors the web /study page: verse commentary panel + AI study assistant.
export default function StudyScreen(): React.ReactElement {
  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [translationId, setTranslationId] = useState('RPV');
  const [book, setBook] = useState('Romans');
  const [chapter, setChapter] = useState('8');
  const [verse, setVerse] = useState('28');

  const [commentary, setCommentary] = useState<CommentaryEntry[]>([]);
  const [commentaryLoading, setCommentaryLoading] = useState(false);
  const [commentaryError, setCommentaryError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    getTranslations().then(setTranslations).catch(() => {});
  }, []);

  const translation = translations.find((t) => t.id === translationId);
  const bookNames = translation?.books.map((b) => b.name) || [];

  const loadCommentary = useCallback(async () => {
    const ch = parseInt(chapter, 10);
    const vs = parseInt(verse, 10);
    if (!book.trim() || !ch || !vs) return;
    setCommentaryLoading(true);
    setCommentaryError(null);
    try {
      setCommentary(await getCommentary(translationId, book.trim(), ch, vs));
    } catch (e) {
      setCommentaryError(e instanceof Error ? e.message : 'Failed to load commentary');
      setCommentary([]);
    } finally {
      setCommentaryLoading(false);
    }
  }, [translationId, book, chapter, verse]);

  const ask = useCallback(
    async (q?: string) => {
      const query = (q ?? question).trim();
      if (!query) return;
      setAskLoading(true);
      setAskError(null);
      setAnswer(null);
      try {
        setAnswer(await askStudyAssistant(query));
      } catch (e) {
        setAskError(e instanceof Error ? e.message : 'Assistant request failed');
      } finally {
        setAskLoading(false);
      }
    },
    [question]
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Eyebrow>Study Tools</Eyebrow>
        <Text style={textStyles.heroTitle}>Deeper study, in context.</Text>
        <Text style={styles.heroSub}>
          Commentary and an AI study assistant for any passage.
        </Text>
      </View>

      <View style={styles.pad}>
        {/* Verse commentary — mirrors the web commentary panel */}
        <RpvCard>
          <SectionHead title="Verse Commentary" subtitle="Select a passage to read commentary." />

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
              style={[styles.input, styles.refInput]}
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
            <TouchableOpacity style={styles.primaryBtn} onPress={loadCommentary}>
              {commentaryLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Load</Text>
              )}
            </TouchableOpacity>
          </View>

          {commentaryError && <Text style={styles.errorText}>{commentaryError}</Text>}
          {!commentaryLoading && commentary.length === 0 && !commentaryError && (
            <Text style={styles.hintText}>
              Pick a book, chapter, and verse, then tap Load.
            </Text>
          )}
          {commentary.map((c, i) => (
            <View key={c.id || i} style={styles.commentaryItem}>
              {!!c.title && <Text style={styles.commentaryTitle}>{c.title}</Text>}
              <Text style={textStyles.body}>{c.body}</Text>
              {!!c.sources?.length && (
                <Text style={styles.commentaryMeta}>Sources: {c.sources.join(', ')}</Text>
              )}
              {!!c.tags?.length && (
                <View style={styles.tagRow}>
                  {c.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </RpvCard>

        {/* Study assistant — mirrors the web assistant panel */}
        <RpvCard>
          <SectionHead title="Study Assistant" subtitle="Ask a question about the passage or any topic." />
          <View style={styles.askRow}>
            <TextInput
              style={[styles.input, styles.askInput]}
              value={question}
              onChangeText={setQuestion}
              placeholder="e.g. What does justification by faith mean?"
              onSubmitEditing={() => ask()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => ask()}
              disabled={askLoading}
            >
              {askLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {askError && <Text style={styles.errorText}>{askError}</Text>}
          {answer && (
            <View style={styles.answerWrap}>
              <Text style={textStyles.body}>{answer.answer}</Text>
              {!!answer.verses?.length && (
                <View style={styles.verseRefs}>
                  {answer.verses.map((v, i) => (
                    <View key={i} style={styles.verseRef}>
                      <Text style={styles.verseRefTitle}>
                        {v.book} {v.chapter}:{v.verse}
                      </Text>
                      <Text style={styles.verseRefText}>{v.text}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!!answer.suggestions?.length && (
                <View style={styles.suggestRow}>
                  {answer.suggestions.map((s) => (
                    <TouchableOpacity key={s} style={styles.chip} onPress={() => { setQuestion(s); ask(s); }}>
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          {!answer && !askLoading && !askError && (
            <Empty icon="creation" message="Ask a question to get a study answer with verse references." />
          )}
        </RpvCard>
      </View>
    </ScrollView>
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
  heroSub: { color: colors.lavSoft, fontSize: 13, marginTop: 6 },
  pad: { padding: spacing.md, gap: spacing.sm },

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

  refRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  refInput: { flex: 1 },
  numInput: { width: 56, textAlign: 'center' },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  askInput: { flex: 1 },
  primaryBtn: {
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  primaryBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  hintText: { fontSize: 13, color: colors.inkFaint, marginTop: 8 },
  errorText: { fontSize: 13, color: colors.red600, marginTop: 8 },
  commentaryItem: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  commentaryTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  commentaryMeta: { fontSize: 11, color: colors.inkFaint, marginTop: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    backgroundColor: colors.red50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: colors.red600, fontWeight: '600' },

  answerWrap: { marginTop: 12 },
  verseRefs: { marginTop: 10, gap: 8 },
  verseRef: {
    backgroundColor: colors.cream,
    borderRadius: radius.input,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.red600,
  },
  verseRefTitle: { fontSize: 12, fontWeight: '700', color: colors.navy800 },
  verseRefText: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
});
