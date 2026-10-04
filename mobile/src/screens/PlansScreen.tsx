import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import { RpvCard, Eyebrow, Loading, Empty, textStyles } from '../components/Rpv';
import { getReadingPlans, ReadingPlan } from '../services/bible';
import { useAuthStore } from '../store/authStore';

export default function PlansScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPlans(await getReadingPlans());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user) {
    return (
      <View style={styles.container}>
        <Empty icon="calendar-lock" message="Sign in to start a reading plan and track progress." />
      </View>
    );
  }
  if (loading) return <Loading label="Loading plans…" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={textStyles.heroTitle}>Reading Plans</Text>
        <Text style={styles.heroSub}>Structured journeys through Scripture.</Text>
      </View>
      <View style={styles.pad}>
        {error ? (
          <Empty icon="alert-circle-outline" message={error} />
        ) : plans.length === 0 ? (
          <Empty icon="calendar-blank-outline" message="No reading plans are published yet." />
        ) : (
          plans.map((p) => (
            <RpvCard key={p.id}>
              <Eyebrow>{p.durationDays ? `${p.durationDays} days` : 'Plan'}</Eyebrow>
              <Text style={styles.planTitle}>{p.name || p.title || 'Reading Plan'}</Text>
              {p.description ? <Text style={textStyles.body}>{p.description}</Text> : null}
            </RpvCard>
          ))
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
  planTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 6 },
});
