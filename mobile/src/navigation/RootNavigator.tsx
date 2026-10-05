import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { colors, spacing } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import ReadScreen from '../screens/ReadScreen';
import SearchScreen from '../screens/SearchScreen';
import BibleSearchScreen from '../screens/BibleSearchScreen';
import DevotionalsScreen from '../screens/DevotionalsScreen';
import PlansScreen from '../screens/PlansScreen';
import StoreScreen from '../screens/StoreScreen';
import HubScreen from '../screens/HubScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import TranslationScreen from '../screens/TranslationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import AuthScreen from '../screens/AuthScreen';
import AccountScreen from '../screens/AccountScreen';
import StudyScreen from '../screens/StudyScreen';
import ProjectorScreen from '../screens/ProjectorScreen';

export type DrawerParamList = {
  Dashboard: undefined;
  Read:
    | { book?: string; chapter?: number; verse?: number; translationId?: string }
    | undefined;
  Search: { query?: string; translationId?: string } | undefined;
  BibleSearch: undefined;
  Study: undefined;
  News: { hub: string };
  Explore: { hub: string };
  Store: undefined;
  Devotionals: undefined;
  Plans: undefined;
  Projector: undefined;
  Account: undefined;
  Bookmarks: undefined;
  Translations: undefined;
  Settings: undefined;
  Admin: undefined;
  Auth: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface NavItem {
  label: string;
  icon: IconName;
  route: keyof DrawerParamList;
}

const MAIN_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'home-outline', route: 'Dashboard' },
  { label: 'Read the Bible', icon: 'book-open-variant', route: 'Read' },
  { label: 'AI Bible Search', icon: 'creation', route: 'BibleSearch' },
  { label: 'Search', icon: 'magnify', route: 'Search' },
];

const EXPLORE_ITEMS: NavItem[] = [
  { label: 'Study Tools', icon: 'school-outline', route: 'Study' },
  { label: 'Bible News', icon: 'newspaper-variant-outline', route: 'News' },
  { label: 'Explore More', icon: 'compass-outline', route: 'Explore' },
  { label: 'Daily Devotional', icon: 'calendar', route: 'Devotionals' },
  { label: 'Store', icon: 'storefront-outline', route: 'Store' },
  { label: 'Projector', icon: 'projector', route: 'Projector' },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'My Account', icon: 'account-outline', route: 'Account' },
  { label: 'Reading Plans', icon: 'calendar-check', route: 'Plans' },
  { label: 'Translations', icon: 'translate', route: 'Translations' },
  { label: 'Settings', icon: 'cog-outline', route: 'Settings' },
];

function DrawerItem({
  item,
  navigation,
  active,
}: {
  item: NavItem;
  navigation: any;
  active: boolean;
}): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={() => navigation.navigate(item.route)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={active ? colors.white : colors.lavSoft}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function RpvDrawerContent(props: DrawerContentComponentProps): React.ReactElement {
  const { navigation, state } = props;
  const { user, isAuthenticated } = useAuthStore();
  const { isAdmin, getAdminUser } = useAdminStore();

  useEffect(() => {
    if (user) getAdminUser(user.uid);
  }, [user]);

  const activeRoute = state.routeNames[state.index];

  const renderItem = (item: NavItem) => (
    <DrawerItem
      key={item.route}
      item={item}
      navigation={navigation}
      active={activeRoute === item.route}
    />
  );

  return (
    <View style={styles.drawer}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
        {/* Brand — mirrors .rpv-brand */}
        <View style={styles.brand}>
          <Image source={require('../../assets/icon.png')} style={styles.brandMark} />
          <Text style={styles.brandName}>
            RPV <Text style={styles.brandNameThin}>Bible</Text>
          </Text>
        </View>

        <View style={styles.navGroup}>{MAIN_ITEMS.map(renderItem)}</View>

        <View style={styles.navGroup}>
          <Text style={styles.navSection}>Explore</Text>
          {EXPLORE_ITEMS.map(renderItem)}
        </View>

        <View style={styles.navGroup}>
          <Text style={styles.navSection}>Account</Text>
          {isAuthenticated ? (
            <>
              {ACCOUNT_ITEMS.map(renderItem)}
              {isAdmin ? (
                <DrawerItem
                  item={{ label: 'Admin', icon: 'shield-crown', route: 'Admin' }}
                  navigation={navigation}
                  active={activeRoute === 'Admin'}
                />
              ) : null}
            </>
          ) : (
            <DrawerItem
              item={{ label: 'Sign In', icon: 'login', route: 'Auth' }}
              navigation={navigation}
              active={activeRoute === 'Auth'}
            />
          )}
        </View>
      </DrawerContentScrollView>

      {/* Footer — mirrors .rpv-sidebar-foot */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Redemption Project Version{'\n'}© {new Date().getFullYear()} The Redemption Project
        </Text>
      </View>
    </View>
  );
}

function MainDrawer(): React.ReactElement {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <RpvDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        drawerStyle: { backgroundColor: colors.navy900, width: 280 },
        sceneContainerStyle: { backgroundColor: colors.cream },
      }}
    >
      <Drawer.Screen name="Dashboard" component={HomeScreen} options={{ title: 'RPV Bible' }} />
      <Drawer.Screen name="Read" component={ReadScreen} options={{ title: 'Read the Bible' }} />
      <Drawer.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Drawer.Screen
        name="BibleSearch"
        component={BibleSearchScreen}
        options={{ title: 'AI Bible Search' }}
      />
      <Drawer.Screen
        name="Study"
        component={StudyScreen}
        options={{ title: 'Study Tools' }}
      />
      <Drawer.Screen
        name="News"
        component={HubScreen}
        initialParams={{ hub: 'News' }}
        options={{ title: 'Bible News' }}
      />
      <Drawer.Screen
        name="Explore"
        component={HubScreen}
        initialParams={{ hub: 'Explore' }}
        options={{ title: 'Explore More' }}
      />
      <Drawer.Screen name="Store" component={StoreScreen} options={{ title: 'Store' }} />
      <Drawer.Screen
        name="Devotionals"
        component={DevotionalsScreen}
        options={{ title: 'Devotionals' }}
      />
      <Drawer.Screen name="Plans" component={PlansScreen} options={{ title: 'Reading Plans' }} />
      <Drawer.Screen
        name="Projector"
        component={ProjectorScreen}
        options={{ title: 'Projector Remote' }}
      />
      <Drawer.Screen name="Account" component={AccountScreen} options={{ title: 'My Account' }} />
      <Drawer.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Bookmarks' }} />
      <Drawer.Screen
        name="Translations"
        component={TranslationScreen}
        options={{ title: 'Translations' }}
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Drawer.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
      <Drawer.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: 'Sign In', headerShown: false }}
      />
    </Drawer.Navigator>
  );
}

export default function RootNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="Main" component={MainDrawer} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: colors.navy900,
  },
  drawerScroll: {
    paddingTop: 0,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderNavy,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  brandName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  brandNameThin: {
    fontWeight: '400',
    color: colors.lavSoft,
  },
  navGroup: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  navSection: {
    color: colors.inkFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: colors.navy700,
    borderLeftWidth: 3,
    borderLeftColor: colors.red600,
  },
  navLabel: {
    color: colors.lavSoft,
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderNavy,
    padding: spacing.md,
  },
  footerText: {
    color: colors.inkFaint,
    fontSize: 11,
    lineHeight: 16,
  },
});
