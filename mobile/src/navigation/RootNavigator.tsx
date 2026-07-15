import React from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ReadScreen from '../screens/ReadScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TranslationScreen from '../screens/TranslationScreen';
import AuthScreen from '../screens/AuthScreen';
import AdminScreen from '../screens/AdminScreen';

// Navigation type definitions
export type RootStackParamList = {
  MainTabs: undefined;
  SearchDetail: { query: string };
  ReadDetail: { book: string; chapter: number };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Read: undefined;
  Bookmarks: undefined;
  Settings: undefined;
};

export type DrawerParamList = {
  MainTabs: undefined;
  Settings: undefined;
  Translations: undefined;
  Admin: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = NativeStackScreenProps<RootStackParamList>;
export type TabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackScreenProps<RootStackParamList>['navigation']
>;
export type DrawerNavigationProp_ = DrawerNavigationProp<DrawerParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const AuthStack = createNativeStackNavigator();

function TabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'magnify' : 'magnify';
              break;
            case 'Read':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Bookmarks':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#a9291c',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#a9291c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'RPV Bible',
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Read"
        component={ReadScreen}
        options={{
          title: 'Read',
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          title: 'Bookmarks',
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}

function StackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#a9291c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SearchDetail"
        component={ReadScreen}
        options={{
          title: 'Verse Details',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ReadDetail"
        component={ReadScreen}
        options={{
          title: 'Read Bible',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

function DrawerNavigator(): React.ReactElement {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#a9291c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#a9291c',
        drawerInactiveTintColor: '#999',
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={StackNavigator}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Translations"
        component={TranslationScreen}
        options={{
          title: 'Translations',
          drawerIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="translate" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          title: 'Admin',
          drawerIcon: ({ color, size }: any) => (
            <MaterialCommunityIcons name="shield-admin" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function RootNavigator(): React.ReactElement {
  const { user, loading } = useAuthStore();

  // Show auth screen if not authenticated and not loading
  if (!user && !loading) {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
      >
        <AuthStack.Screen name="Auth" component={AuthScreen} />
      </AuthStack.Navigator>
    );
  }

  // Show main app if authenticated
  return <DrawerNavigator />;
}
