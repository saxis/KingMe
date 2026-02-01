// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f4c430',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopWidth: 1,
          borderTopColor: '#1a1f2e',
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#0a0e1a',
          borderBottomWidth: 1,
          borderBottomColor: '#1a1f2e',
        },
        headerTintColor: '#f4c430',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="obligations"
        options={{
          title: 'Obligations',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Debts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💳</Text>,
        }}
      />
      <Tabs.Screen
        name="desires"
        options={{
          title: 'Desires',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
