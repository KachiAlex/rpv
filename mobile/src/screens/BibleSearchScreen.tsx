import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Pill, textStyles } from '../components/Rpv';
import { askBible, BibleVerseResult } from '../services/bible';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  verses?: BibleVerseResult[];
  followUps?: string[];
}

const SUGGESTIONS = [
  'How to find peace in difficult times?',
  'What does the Bible say about forgiveness?',
  'Verses about hope and strength',
];

export default function BibleSearchScreen(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || loading) return;
      setInput('');
      setLoading(true);
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: q },
      ]);
      try {
        const res = await askBible(q, sessionId.current, messages.length > 0);
        if (res.conversationState?.sessionId) {
          sessionId.current = res.conversationState.sessionId;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: res.text,
            verses: res.verses,
            followUps: res.followUpQuestions,
          },
        ]);
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: `I'm having trouble reaching the assistant right now. (${e.message})`,
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [loading, messages.length]
  );

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === 'user') {
      return (
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      );
    }
    return (
      <View style={styles.aiBlock}>
        <View style={[styles.bubble, styles.aiBubble]}>
          <View style={styles.aiHeader}>
            <MaterialCommunityIcons name="creation" size={14} color={colors.red600} />
            <Text style={styles.aiLabel}>RPV Assistant</Text>
          </View>
          <Text style={styles.aiText}>{item.text}</Text>
        </View>
        {item.verses?.map((v) => (
          <View key={`${v.book}-${v.chapter}-${v.verse}`} style={styles.verseCard}>
            <Text style={styles.verseRef}>
              {v.book} {v.chapter}:{v.verse}
            </Text>
            <Text style={styles.verseText}>{v.text}</Text>
            {v.applicationSuggestion ? (
              <Text style={styles.verseApp}>{v.applicationSuggestion}</Text>
            ) : null}
          </View>
        ))}
        {item.followUps?.map((q) => (
          <TouchableOpacity key={q} style={styles.followUp} onPress={() => send(q)}>
            <Text style={styles.followUpText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.hero}>
        <View style={styles.pillRow}>
          <Pill variant="navy">AI-Powered</Pill>
        </View>
        <Text style={textStyles.heroTitle}>Ask the Bible Anything</Text>
        <Text style={styles.heroSub}>
          Conversational search — ask natural questions and get relevant verses with context.
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chat}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={[styles.bubble, styles.aiBubble, styles.thinking]}>
              <Text style={styles.aiText}>Thinking…</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Ask about any topic…"
          placeholderTextColor={colors.inkFaint}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <MaterialCommunityIcons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  hero: {
    backgroundColor: colors.navy900,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  heroSub: {
    color: colors.lavSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  chat: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  suggestions: {
    gap: 8,
    marginTop: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: 14,
  },
  suggestionText: {
    color: colors.navy800,
    fontSize: 14,
    fontWeight: '600',
  },
  aiBlock: {
    marginBottom: spacing.sm,
  },
  bubble: {
    borderRadius: radius.card,
    padding: 14,
    marginBottom: spacing.sm,
    maxWidth: '88%',
  },
  userBubble: {
    backgroundColor: colors.navy800,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
    minWidth: '70%',
  },
  thinking: {
    opacity: 0.6,
  },
  userText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.red600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  aiText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  verseCard: {
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderLeftColor: colors.red600,
    borderRadius: radius.input,
    padding: 12,
    marginBottom: spacing.sm,
  },
  verseRef: {
    fontWeight: '700',
    color: colors.navy800,
    fontSize: 13,
    marginBottom: 4,
  },
  verseText: {
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  verseApp: {
    color: colors.inkFaint,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  followUp: {
    borderWidth: 1,
    borderColor: colors.lav,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
    backgroundColor: colors.white,
  },
  followUpText: {
    color: colors.navy800,
    fontSize: 13,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.red600,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
