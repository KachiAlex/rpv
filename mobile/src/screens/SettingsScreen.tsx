import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { RpvCard, Eyebrow, RedButton, Loading, textStyles } from '../components/Rpv';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';

export default function SettingsScreen(): React.ReactElement {
  const { user, logout, loading: authLoading } = useAuthStore();
  const { preferences, loading: prefsLoading, updatePreference } = usePreferencesStore();

  useEffect(() => {
    if (user) usePreferencesStore.getState().loadPreferences(user.uid);
  }, [user]);

  const handleLogout = (): void => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout().catch(() => {}) },
    ]);
  };

  const toggle = async (key: 'darkMode' | 'notifications'): Promise<void> => {
    if (!user) return;
    try {
      await updatePreference(user.uid, key, !preferences[key]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (prefsLoading) return <Loading label="Loading settings…" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={textStyles.heroTitle}>Settings</Text>
        <Text style={styles.heroSub}>Account, display, and app preferences.</Text>
      </View>

      <View style={styles.pad}>
        {user ? (
          <RpvCard>
            <Eyebrow>Account</Eyebrow>
            <View style={styles.accountRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.displayName || user.email || '?').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                {user.displayName ? (
                  <Text style={styles.accountName}>{user.displayName}</Text>
                ) : null}
                <Text style={styles.accountEmail}>{user.email}</Text>
              </View>
            </View>
            <RedButton
              title="Sign Out"
              icon="logout"
              onPress={handleLogout}
              loading={authLoading}
              style={styles.logout}
            />
          </RpvCard>
        ) : (
          <RpvCard>
            <Eyebrow>Account</Eyebrow>
            <Text style={textStyles.body}>
              Sign in to sync your bookmarks and preferences across devices.
            </Text>
          </RpvCard>
        )}

        <RpvCard>
          <Eyebrow>Display</Eyebrow>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSub}>Easier reading at night</Text>
            </View>
            <Switch
              value={preferences.darkMode}
              onValueChange={() => toggle('darkMode')}
              disabled={!user}
              trackColor={{ false: colors.border, true: colors.navy600 }}
              thumbColor={preferences.darkMode ? colors.red600 : colors.white}
            />
          </View>
        </RpvCard>

        <RpvCard>
          <Eyebrow>Notifications</Eyebrow>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Enable Notifications</Text>
              <Text style={styles.rowSub}>Devotional reminders and updates</Text>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={() => toggle('notifications')}
              disabled={!user}
              trackColor={{ false: colors.border, true: colors.navy600 }}
              thumbColor={preferences.notifications ? colors.red600 : colors.white}
            />
          </View>
        </RpvCard>

        <RpvCard>
          <Eyebrow>About</Eyebrow>
          <View style={styles.aboutRow}>
            <MaterialCommunityIcons name="book-cross" size={20} color={colors.red600} />
            <Text style={styles.aboutText}>RPV Bible v1.0.0</Text>
          </View>
          <Text style={[textStyles.body, { marginTop: 6 }]}>
            Redemption Project Version — a Bible built for today.
          </Text>
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
  pad: { padding: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  accountEmail: { fontSize: 13, color: colors.inkSoft },
  logout: { marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  cardRadius: { borderRadius: radius.card },
});
