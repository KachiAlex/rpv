import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { RpvCard, textStyles } from '../components/Rpv';

interface HubItem {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body: string;
  route?: string;
}

// Mirrors the web hub pages at /study, /news, /explore.
const HUBS: Record<string, { title: string; subtitle: string; items: HubItem[]; note?: string }> = {
  Study: {
    title: 'Study Tools',
    subtitle: 'Deeper study without leaving the passage.',
    items: [
      {
        icon: 'text-search',
        title: 'AI Bible Search',
        body: 'Ask natural questions and get verses with context.',
        route: 'BibleSearch',
      },
      {
        icon: 'book-open-variant',
        title: 'Read the Bible',
        body: 'Browse every book, chapter, and verse.',
        route: 'Read',
      },
      {
        icon: 'bookmark-multiple',
        title: 'Bookmarks',
        body: 'Revisit verses you saved while reading.',
        route: 'Bookmarks',
      },
      {
        icon: 'calendar-check',
        title: 'Reading Plans',
        body: 'Structured journeys through Scripture.',
        route: 'Plans',
      },
    ],
  },
  News: {
    title: 'Bible News',
    subtitle: 'Updates from the Redemption Project.',
    note: 'News articles are coming soon.',
    items: [
      {
        icon: 'newspaper-variant-outline',
        title: 'Publication Updates',
        body: 'Announcements on new translations and releases.',
      },
      {
        icon: 'calendar-star',
        title: 'Daily Devotionals',
        body: 'Short reflections refreshed every morning.',
        route: 'Devotionals',
      },
    ],
  },
  Explore: {
    title: 'Explore More',
    subtitle: 'More ways to engage with Scripture.',
    items: [
      {
        icon: 'storefront-outline',
        title: 'Store',
        body: 'Digital books and study resources.',
        route: 'Store',
      },
      {
        icon: 'translate',
        title: 'Translations',
        body: 'Manage available Bible translations.',
        route: 'Translations',
      },
      {
        icon: 'cog-outline',
        title: 'Settings',
        body: 'Account, display, and notification preferences.',
        route: 'Settings',
      },
    ],
  },
};

export default function HubScreen(): React.ReactElement {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const hub = HUBS[route.params?.hub as string] || HUBS.Explore;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={textStyles.heroTitle}>{hub.title}</Text>
        <Text style={styles.heroSub}>{hub.subtitle}</Text>
      </View>
      <View style={styles.pad}>
        {hub.note ? (
          <RpvCard>
            <Text style={[textStyles.body, styles.note]}>{hub.note}</Text>
          </RpvCard>
        ) : null}
        {hub.items.map((item) => (
          <RpvCard key={item.title}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.red600} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={textStyles.body}>{item.body}</Text>
              </View>
              {item.route ? (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.inkFaint}
                  onPress={() => navigation.navigate(item.route as never)}
                />
              ) : null}
            </View>
          </RpvCard>
        ))}
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
  note: { fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    backgroundColor: colors.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 },
});
