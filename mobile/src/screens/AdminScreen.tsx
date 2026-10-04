import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Loading, Empty, textStyles } from '../components/Rpv';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';

const ADMIN_TOOLS = [
  {
    icon: 'file-document-outline' as const,
    title: 'Blog Management',
    body: 'Create, edit, and publish blog posts — manage via the web admin.',
  },
  {
    icon: 'book-open-page-variant' as const,
    title: 'Publication Management',
    body: 'Manage Bible translations and publications at rpvbible.com/admin.',
  },
  {
    icon: 'chart-line' as const,
    title: 'Analytics',
    body: 'View app usage and user statistics on the web dashboard.',
  },
  {
    icon: 'account-multiple-outline' as const,
    title: 'User Management',
    body: 'Manage users and permissions on the web dashboard.',
  },
];

export default function AdminScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { isAdmin, adminUser, loading, getAdminUser } = useAdminStore();

  useEffect(() => {
    if (user) getAdminUser(user.uid);
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Empty icon="lock-outline" message="Sign in to access admin features." />
      </View>
    );
  }
  if (loading) return <Loading label="Checking access…" />;
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Empty icon="shield-alert-outline" message="You don't have admin access." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.shieldRow}>
          <MaterialCommunityIcons name="shield-crown" size={26} color={colors.red600} />
          <Text style={textStyles.heroTitle}>Admin Dashboard</Text>
        </View>
        <Text style={styles.heroSub}>{adminUser?.email || user.email}</Text>
      </View>

      <View style={styles.pad}>
        {ADMIN_TOOLS.map((tool) => (
          <RpvCard key={tool.title}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={tool.icon} size={22} color={colors.red600} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{tool.title}</Text>
                <Text style={textStyles.body}>{tool.body}</Text>
              </View>
            </View>
          </RpvCard>
        ))}

        <RpvCard>
          <Text style={styles.infoTitle}>Admin Info</Text>
          <Text style={textStyles.body}>Role: {adminUser?.role || 'admin'}</Text>
          <Text style={textStyles.body}>Email: {adminUser?.email || user.email}</Text>
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
  shieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroSub: { color: colors.lavSoft, fontSize: 13, marginTop: 6 },
  pad: { padding: spacing.md },
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
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 6 },
});
