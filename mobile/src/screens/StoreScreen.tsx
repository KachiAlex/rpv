import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import { RpvCard, Loading, Empty, textStyles, OutlineButton } from '../components/Rpv';
import { getStoreBooks, StoreBook } from '../services/bible';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function StoreScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [books, setBooks] = useState<StoreBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setBooks(await getStoreBooks());
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
        <View style={styles.pad}>
          <RpvCard>
            <Text style={styles.title}>RPV Store</Text>
            <Text style={textStyles.body}>
              Digital books and study resources from the Redemption Project. Sign in to browse and
              purchase.
            </Text>
            <OutlineButton
              title="Sign In"
              icon="login"
              onPress={() => navigation.navigate('Settings')}
              style={styles.btn}
            />
          </RpvCard>
        </View>
      </View>
    );
  }

  if (loading) return <Loading label="Loading store…" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={textStyles.heroTitle}>Store</Text>
        <Text style={styles.heroSub}>Digital books and study resources.</Text>
      </View>
      <View style={styles.pad}>
        {error ? (
          <Empty icon="alert-circle-outline" message={error} />
        ) : books.length === 0 ? (
          <Empty icon="storefront-outline" message="No titles are available yet." />
        ) : (
          books.map((b) => (
            <RpvCard key={b.id}>
              <Text style={styles.title}>{b.title || 'Untitled'}</Text>
              {b.author ? <Text style={styles.author}>{b.author}</Text> : null}
              {b.description ? (
                <Text style={textStyles.body} numberOfLines={3}>
                  {b.description}
                </Text>
              ) : null}
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
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  author: { fontSize: 13, color: colors.inkFaint, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
