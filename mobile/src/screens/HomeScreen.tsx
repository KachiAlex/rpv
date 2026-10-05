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
import {
  RpvCard,
  Eyebrow,
  Pill,
  RedButton,
  OutlineButton,
  SectionHead,
  textStyles,
} from '../components/Rpv';
import {
  getTranslations,
  getSelectedTranslation,
  setSelectedTranslation,
  getTodayDevotional,
  Devotional,
  RpvTranslation,
} from '../services/bible';
import { useAuthStore } from '../store/authStore';
import { getAuthToken } from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

const FEATURES = [
  {
    icon: 'calendar-check' as const,
    title: 'Daily Reading Hub',
    body: 'Choose your translation, set a plan, and follow curated passages that refresh every morning.',
  },
  {
    icon: 'tools' as const,
    title: 'Study Tools',
    body: 'Jump to commentaries, footnotes, and the AI assistant without leaving the passage you are reading.',
  },
  {
    icon: 'projector' as const,
    title: 'Projector Ready',
    body: 'Send verses and highlights straight to the projector screen in a single tap.',
  },
];

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [translations, setTranslations] = useState<RpvTranslation[]>([]);
  const [selectedTranslation, setSelected] = useState('RPV');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [devotional, setDevotional] = useState<Devotional | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      const list = await getTranslations(force);
      setTranslations(list);
      const saved = await getSelectedTranslation();
      setSelected(list.some((t) => t.id === saved) ? saved : list[0]?.id || 'RPV');
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
    setDevotional(await getTodayDevotional());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    navigation.navigate('Search', { query: q, translationId: selectedTranslation });
  }, [navigation, searchQuery, selectedTranslation]);

  const handleSelectTranslation = useCallback(async (id: string) => {
    setSelected(id);
    await setSelectedTranslation(id);
  }, []);

  const handleNotify = useCallback(async () => {
    const email = notifyEmail.trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Enter a valid email address');
      return;
    }
    setNotifyState('sending');
    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'newsletter',
          email,
          message: 'Launch notification signup (mobile)',
        }),
      });
      setNotifyState('done');
    } catch {
      setNotifyState('idle');
      Alert.alert('Could not subscribe right now. Please try again later.');
    }
  }, [notifyEmail]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red600} />}
    >
      {/* Hero — mirrors .rpv-hero */}
      <View style={styles.hero}>
        <View style={styles.pillRow}>
          <Pill variant="red">NEW</Pill>
          <Pill variant="navy">Redemption Project Version</Pill>
        </View>
        <Text style={textStyles.heroTitle}>A Bible built for today.</Text>
        <Text style={styles.heroBody}>
          Read, search, and study the Bible with a clean, distraction-free experience. Powered by AI
          for deeper understanding.
        </Text>

        <View style={styles.heroForm}>
          <TextInput
            style={styles.heroInput}
            placeholder="Enter your email to get notified"
            placeholderTextColor={colors.inkFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            value={notifyEmail}
            onChangeText={setNotifyEmail}
            editable={notifyState !== 'done'}
          />
          <RedButton
            title={notifyState === 'done' ? 'Subscribed' : 'Notify Me'}
            onPress={handleNotify}
            loading={notifyState === 'sending'}
            disabled={notifyState === 'done'}
            style={styles.heroButton}
          />
        </View>
      </View>

      {/* Red strip — mirrors .rpv-strip */}
      <View style={styles.strip}>
        <Text style={styles.stripText}>
          Take your Bible study anywhere — RPV keeps trusted tools and insights connected to the
          passage you are reading.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Smart Search card */}
        <RpvCard>
          <Eyebrow>Smart Search</Eyebrow>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter passage, keyword, or topic"
            placeholderTextColor={colors.inkFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.transRow}>
            {translations.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleSelectTranslation(t.id)}
                style={[
                  styles.transOption,
                  t.id === selectedTranslation && styles.transOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.transOptionText,
                    t.id === selectedTranslation && styles.transOptionTextActive,
                  ]}
                >
                  {t.id === selectedTranslation ? `✓ ${t.name}` : t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <RedButton title="Search" icon="magnify" onPress={handleSearch} />
          <Text style={styles.proTip}>
            <Text style={styles.proTipBold}>Pro tip:</Text> Bookmark a verse while reading to keep it
            synced across devices.
          </Text>
        </RpvCard>

        {/* Quick Actions card */}
        <RpvCard>
          <Eyebrow>Quick Actions</Eyebrow>
          <OutlineButton
            title="Browse Books"
            icon="book-open-variant"
            onPress={() => navigation.navigate('Read')}
          />
          <OutlineButton
            title="Daily Devotional"
            icon="calendar"
            onPress={() => navigation.navigate('Devotionals')}
          />
          <OutlineButton
            title="AI Bible Search"
            icon="creation"
            onPress={() => navigation.navigate('BibleSearch')}
          />
        </RpvCard>

        {/* Features — mirrors .rpv-feature-grid */}
        <SectionHead
          title="Discover Your Next Passage"
          subtitle="Built with a modern, warm aesthetic for today's study habits."
        />
        {FEATURES.map((f) => (
          <RpvCard key={f.title}>
            <View style={styles.featureRow}>
              <MaterialCommunityIcons name={f.icon} size={22} color={colors.red600} />
              <Text style={styles.featureTitle}>{f.title}</Text>
            </View>
            <Text style={textStyles.body}>{f.body}</Text>
          </RpvCard>
        ))}

        {/* Daily Devotional — replaces web's Featured Articles (Firestore-only) */}
        <RpvCard>
          <SectionHead
            title="Daily Devotional"
            subtitle="Today's reading from the RPV devotional feed."
          />
          {devotional ? (
            <View>
              <Text style={styles.devoTitle}>{devotional.title || 'Today'}</Text>
              <Text style={textStyles.body} numberOfLines={4}>
                {String(devotional.content || devotional.body || '')}
              </Text>
              <OutlineButton
                title="Open Devotionals"
                icon="calendar"
                onPress={() => navigation.navigate('Devotionals')}
                style={styles.devoButton}
              />
            </View>
          ) : (
            <OutlineButton
              title="Open Devotionals"
              icon="calendar"
              onPress={() => navigation.navigate('Devotionals')}
            />
          )}
        </RpvCard>

        {user ? (
          <Text style={styles.signedIn}>Signed in as {user.email}</Text>
        ) : (
          <OutlineButton
            title="Sign In to Sync"
            icon="login"
            onPress={() => navigation.navigate('Settings')}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  hero: {
    backgroundColor: colors.navy900,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  heroBody: {
    color: colors.lavSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  heroForm: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  heroInput: {
    backgroundColor: colors.white,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  heroButton: {
    alignSelf: 'stretch',
  },
  strip: {
    backgroundColor: colors.red700,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  stripText: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    padding: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  transRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  transOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  transOptionActive: {
    borderColor: colors.red600,
    backgroundColor: colors.red50,
  },
  transOptionText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  transOptionTextActive: {
    color: colors.red600,
    fontWeight: '700',
  },
  proTip: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.inkSoft,
  },
  proTipBold: {
    fontWeight: '700',
    color: colors.ink,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  devoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  devoButton: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  signedIn: {
    textAlign: 'center',
    color: colors.inkFaint,
    fontSize: 12,
    marginVertical: spacing.md,
  },
});
