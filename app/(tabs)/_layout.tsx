import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons'; // For icons

// Our "Luxury House" Color Palette (from your login screen)
const COLORS = {
  primary: '#000000',    // Black
  accent: '#9A6C42',      // Wood Detail Brown
  secondary: '#888888',  // Grey for inactive
  background: '#FFFFFF', // White
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent, // Active icon color (wood brown)
        tabBarInactiveTintColor: COLORS.secondary, // Inactive icon color
        tabBarStyle: {
          backgroundColor: COLORS.background, // White tab bar
        },
        headerStyle: {
          backgroundColor: COLORS.background, // White header
        },
        headerTintColor: COLORS.primary, // Black header text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Tab 1: Home Screen */}
      <Tabs.Screen
        name="index" // This links to app/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Properties list*/}
      <Tabs.Screen
        name="properties" // Debe coincidir con el nombre del archivo properties.tsx
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            // Icono de edificio/propiedad
            <FontAwesome5 name="building" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Budgets Screen */}
      <Tabs.Screen
        name="budgets" // This will link to app/(tabs)/budgets.tsx
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="file-invoice-dollar" size={size} color={color} />
          ),
        }}
      />
      
      {/* Tab 3: Profile Screen */}
      <Tabs.Screen
        name="profile" // This will link to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}