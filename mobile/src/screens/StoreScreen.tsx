import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Loading, Empty, textStyles, OutlineButton } from '../components/Rpv';
import { getStoreBooks, StoreBook } from '../services/bible';
import { getPurchases, purchaseBook, getBookSignedUrl } from '../services/userData';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export default function StoreScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [books, setBooks] = useState<StoreBook[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([getStoreBooks(), getPurchases()]);
      setBooks(b);
      setPurchased(new Set(p));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuy = useCallback(
    async (book: StoreBook) => {
      setBusy(String(book.id));
      try {
        await purchaseBook(String(book.id));
        setPurchased((p) => new Set([...p, String(book.id)]));
        Alert.alert('Purchase complete', `"${book.title}" has been added to your library.`);
      } catch (e) {
        Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setBusy(null);
      }
    },
    []
  );

  const handleOpen = useCallback(async (book: StoreBook) => {
    setBusy(String(book.id));
    try {
      const url = await getBookSignedUrl(String(book.id));
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Open failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
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
          books.map((b) => {
            const id = String(b.id);
            const owned = purchased.has(id);
            const price = typeof b.price === 'number' ? b.price : parseFloat(String(b.price || 0)) || 0;
            return (
              <RpvCard key={id}>
                <Text style={styles.title}>{b.title || 'Untitled'}</Text>
                {b.author ? <Text style={styles.author}>{b.author}</Text> : null}
                {b.description ? (
                  <Text style={textStyles.body} numberOfLines={3}>
                    {b.description}
                  </Text>
                ) : null}
                <View style={styles.buyRow}>
                  <Text style={styles.price}>{price === 0 ? 'Free' : `$${price.toFixed(2)}`}</Text>
                  <TouchableOpacity
                    style={[styles.buyBtn, owned && styles.buyBtnOwned, busy === id && { opacity: 0.6 }]}
                    onPress={() => (owned ? handleOpen(b) : handleBuy(b))}
                    disabled={busy === id}
                  >
                    {busy === id ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.buyBtnText}>
                        {owned ? 'Open / Download' : price === 0 ? 'Get Free' : 'Buy Now'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </RpvCard>
            );
          })
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
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: { fontSize: 16, fontWeight: '800', color: colors.navy800 },
  buyBtn: {
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  buyBtnOwned: { backgroundColor: colors.navy800 },
  buyBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
