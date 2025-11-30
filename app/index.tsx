import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext'; // Check your path
import { emailSignIn, googleSignIn } from '../services/auth'; // Check your path
import { FontAwesome5, AntDesign } from '@expo/vector-icons'; // For icons

// --- Our "Luxury House" Color Palette ---
const COLORS = {
  background: '#FFFFFF', // White Walls
  text: '#000000',       // Black Contrast
  textSecondary: '#555555',
  primary: '#000000',    // Black Button
  accent: '#9A6C42',      // Wood Detail (a warm, rich brown)
  border: '#E0E0E0',
  lightBackground: '#F7F7F7',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  // This is the "Gatekeeper" logic.
  // It runs when 'user' or 'loading' state changes.
  useEffect(() => {
    if (loading) {
      // Still checking auth, wait...
      return;
    }
    
    if (user) {
      // User is logged in, send them to the main app
      router.replace('/(tabs)/home'); // Assumes your main app is in a (tabs) group
    }
    // If no user, this screen will just render the Login UI
  }, [user, loading, router]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setIsLoggingIn(true);
    try {
      await emailSignIn(email, password);
      // On success, the 'useEffect' above will catch the 'user' change and redirect.
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await googleSignIn();
      // On success, the 'useEffect' will redirect.
    } catch (error) {
      Alert.alert('Google Sign-In Failed', 'An error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show a loading screen while auth state is being checked
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- This is the Login UI ---
  // It will only be visible if 'user' is null and 'loading' is false.
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentView}
      >
        {/* 1. Logo / Title */}
        <FontAwesome5 name="building" size={48} color={COLORS.accent} />
        <Text style={styles.title}>Eta Carinae</Text>
        <Text style={styles.subtitle}>Welcome, Agent. Sign in to continue.</Text>

        {/* 2. Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Agent Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* 3. Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleEmailLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* 4. Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 5. Google Button */}
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={isLoggingIn}
        >
          <AntDesign name="google" size={20} color={COLORS.text} />
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            Sign In with Google
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- All the Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 55,
    backgroundColor: COLORS.lightBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 15,
  },
  forgotPassword: {
    textAlign: 'right',
    color: COLORS.accent, // Wood detail color
    marginBottom: 20,
    fontWeight: '500',
  },
  button: {
    height: 55,
    backgroundColor: COLORS.primary, // Black button
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: COLORS.background, // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    color: COLORS.text, // Black text
  },
});