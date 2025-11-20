import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import { logOut } from '../../services/auth'; // Adjust path

// --- Our "Luxury House" Color Palette ---
const COLORS = {
  background: '#FFFFFF', // White Walls
  text: '#000000',       // Black Contrast
  textSecondary: '#555555',
  accent: '#9A6C42',      // Wood Detail (a warm, rich brown)
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    // After logging out, the user state will become null.
    // The "gatekeeper" in `app/index.tsx` will detect this
    // and show the login screen.
    // We just need to make sure we're at the root.
    router.replace('/'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, Agent</Text>
        <Text style={styles.email}>
          {user ? user.email : 'Loading...'}
        </Text>
        
        <Text style={styles.info}>
          This is your main dashboard. From here you can start a new client 
          budget or view your saved budgets.
        </Text>

        {/* We will add the "Start Workflow" button here later */}
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  info: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 40,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.accent, // Wood brown button
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: COLORS.background, // White text
    fontWeight: 'bold',
    fontSize: 16,
  },
});