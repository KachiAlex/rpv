import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import { RpvCard, Eyebrow, Loading, Empty, Pill, textStyles } from '../components/Rpv';
import { getTodayDevotional, Devotional } from '../services/bible';

export default function DevotionalsScreen(): React.ReactElement {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setDevotional(await getTodayDevotional());
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading label="Loading devotional…" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Pill variant="navy">Daily</Pill>
        <Text style={[textStyles.heroTitle, { marginTop: spacing.sm }]}>Devotional</Text>
        <Text style={styles.heroSub}>A short reflection for today.</Text>
      </View>
      <View style={styles.pad}>
        {devotional ? (
          <RpvCard>
            <Eyebrow>{devotional.date || 'Today'}</Eyebrow>
            <Text style={styles.title}>{devotional.title || 'Daily Devotional'}</Text>
            {devotional.passage ? (
              <Text style={styles.passage}>{devotional.passage}</Text>
            ) : null}
            <Text style={textStyles.body}>
              {String(devotional.content || devotional.body || '')}
            </Text>
          </RpvCard>
        ) : (
          <RpvCard>
            <Empty
              icon="calendar-blank-outline"
              message="No devotional published for today yet. Check back tomorrow."
            />
          </RpvCard>
        )}
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
  pad: { padding: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  passage: { fontSize: 13, color: colors.red600, fontWeight: '600', marginBottom: 8 },
});
