import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Pill, Loading, Empty, textStyles } from '../components/Rpv';
import { BlogPost, getPublishedPosts, htmlToText } from '../services/blog';

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function NewsScreen(): React.ReactElement {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BlogPost | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { posts: list } = await getPublishedPosts(30);
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Article detail ----------
  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.detailPad}>
        <TouchableOpacity style={styles.backRow} onPress={() => setSelected(null)}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.red600} />
          <Text style={styles.backText}>All articles</Text>
        </TouchableOpacity>

        {selected.tags.length > 0 && (
          <View style={styles.tagRow}>
            {selected.tags.map((t) => (
              <Pill key={t} variant="red">
                {t}
              </Pill>
            ))}
          </View>
        )}

        <Text style={styles.detailTitle}>{selected.title}</Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-outline" size={15} color={colors.inkFaint} />
          <Text style={styles.metaText}>{selected.authorName}</Text>
          <Text style={styles.metaDot}>•</Text>
          <MaterialCommunityIcons name="clock-outline" size={15} color={colors.inkFaint} />
          <Text style={styles.metaText}>{formatDate(selected.publishedAt || selected.createdAt)}</Text>
        </View>

        {selected.excerpt ? <Text style={styles.detailExcerpt}>{selected.excerpt}</Text> : null}

        <View style={styles.divider} />
        <Text style={styles.detailBody}>{htmlToText(selected.content)}</Text>

        {selected.videoEmbeds.length > 0 && (
          <View style={styles.videos}>
            <Text style={styles.videosTitle}>Videos</Text>
            {selected.videoEmbeds.map((v, i) => (
              <TouchableOpacity
                key={`${v.videoId}-${i}`}
                style={styles.videoRow}
                onPress={() =>
                  Linking.openURL(
                    v.platform === 'vimeo'
                      ? `https://vimeo.com/${v.videoId}`
                      : `https://www.youtube.com/watch?v=${v.videoId}`
                  )
                }
              >
                <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.red600} />
                <Text style={styles.videoText}>{v.title || `Watch video ${i + 1}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // ---------- List ----------
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={textStyles.heroTitle}>Bible News</Text>
        <Text style={styles.heroSub}>Latest articles and updates from the Redemption Project.</Text>
      </View>

      {loading ? (
        <Loading label="Loading articles..." />
      ) : error ? (
        <View style={styles.pad}>
          <Empty icon="alert-circle-outline" message={error} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.red600} />
          }
        >
          {posts.length === 0 ? (
            <Empty icon="newspaper-variant-outline" message="No articles yet. Check back soon for updates." />
          ) : (
            posts.map((post) => (
              <TouchableOpacity key={post.id} activeOpacity={0.85} onPress={() => setSelected(post)}>
                <RpvCard>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>
                      {post.authorName} • {formatDate(post.publishedAt || post.createdAt)}
                    </Text>
                    {post.tags.slice(0, 2).map((t) => (
                      <View key={t} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.cardTitle}>{post.title}</Text>
                  <Text style={styles.cardExcerpt} numberOfLines={3}>
                    {post.excerpt || htmlToText(post.content).slice(0, 200)}
                  </Text>
                  <View style={styles.readMore}>
                    <Text style={styles.readMoreText}>Read more</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.red600} />
                  </View>
                </RpvCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
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
  heroSub: { color: colors.lavSoft, fontSize: 13, marginTop: 6 },
  scroll: { flex: 1 },
  pad: { padding: spacing.md, gap: 12 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  cardMetaText: { fontSize: 12, color: colors.inkFaint, marginRight: 'auto' },
  tagChip: {
    backgroundColor: colors.red50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipText: { fontSize: 11, fontWeight: '600', color: colors.red700 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 6, lineHeight: 24 },
  cardExcerpt: { fontSize: 14, color: colors.inkSoft, lineHeight: 21 },
  readMore: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  readMoreText: { fontSize: 14, fontWeight: '600', color: colors.red600 },
  detailPad: { padding: spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: colors.red600 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  detailTitle: { fontSize: 26, fontWeight: '800', color: colors.ink, lineHeight: 33, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  metaText: { fontSize: 13, color: colors.inkFaint },
  metaDot: { color: colors.inkFaint },
  detailExcerpt: { fontSize: 16, color: colors.inkSoft, lineHeight: 24, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  detailBody: { fontSize: 16, color: colors.ink, lineHeight: 26 },
  videos: { marginTop: 20 },
  videosTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  videoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  videoText: { fontSize: 14, color: colors.red600, fontWeight: '600' },
});
