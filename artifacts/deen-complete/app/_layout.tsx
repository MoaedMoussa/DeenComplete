import {
  Amiri_400Regular,
  Amiri_700Bold,
  useFonts as useAmiriFonts,
} from "@expo-google-fonts/amiri";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="quran/[surahId]" options={{ headerShown: true, title: "Surah", headerBackTitle: "Quran" }} />
      <Stack.Screen name="qibla" options={{ headerShown: true, title: "Qibla", headerBackTitle: "Prayer" }} />
      <Stack.Screen name="prayer-tracker" options={{ headerShown: true, title: "Prayer Tracker", headerBackTitle: "Prayer" }} />
      <Stack.Screen name="duas" options={{ headerShown: true, title: "Duas", headerBackTitle: "More" }} />
      <Stack.Screen name="hadith" options={{ headerShown: true, title: "Hadith", headerBackTitle: "More" }} />
      <Stack.Screen name="zakat" options={{ headerShown: true, title: "Zakat Calculator", headerBackTitle: "More" }} />
      <Stack.Screen name="hajj" options={{ headerShown: true, title: "Hajj & Umrah", headerBackTitle: "More" }} />
      <Stack.Screen name="calendar" options={{ headerShown: true, title: "Islamic Calendar", headerBackTitle: "More" }} />
      <Stack.Screen name="names" options={{ headerShown: true, title: "99 Names of Allah", headerBackTitle: "More" }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings", headerBackTitle: "More" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [arabicFontsLoaded] = useAmiriFonts({
    Amiri_400Regular,
    Amiri_700Bold,
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && arabicFontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, arabicFontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
