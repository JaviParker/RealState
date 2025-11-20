import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "../contexts/AuthContext";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack> */}
        <Stack>
        {/* 1. The Login Screen (index.tsx) */}
        {/* It will now be part of the stack and show first */}
        <Stack.Screen
          name="index"
          options={{ headerShown: false }} // Hide header on login
        />
        
        {/* 2. The Main App (all files in the '(tabs)' folder) */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }} // We'll let the tab layout manage its own header
        />
        
        {/* 3. Any other screens (like a modal) */}
        {/* You probably have this already */}
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal' }}
        />
      </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
