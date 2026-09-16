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
import { AppProvider, useApp } from "@/contexts/AppContext";
import { useT } from "@/constants/i18n";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { settings } = useApp();
  const t = useT(settings.language);
  const ar = settings.language === "ar";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="quran/[surahId]" options={{ headerShown: true, title: ar ? "سورة" : "Surah", headerBackTitle: t("quran") }} />
      <Stack.Screen name="qibla" options={{ headerShown: true, title: t("qiblaCompass"), headerBackTitle: t("prayer") }} />
      <Stack.Screen name="prayer-tracker" options={{ headerShown: true, title: t("prayerTracker"), headerBackTitle: t("prayer") }} />
      <Stack.Screen name="duas" options={{ headerShown: true, title: t("duaLibrary"), headerBackTitle: t("more") }} />
      <Stack.Screen name="hadith" options={{ headerShown: true, title: t("hadithLibrary"), headerBackTitle: t("more") }} />
      <Stack.Screen name="zakat" options={{ headerShown: true, title: t("zakatCalc"), headerBackTitle: t("more") }} />
      <Stack.Screen name="hajj" options={{ headerShown: true, title: t("hajjGuide"), headerBackTitle: t("more") }} />
      <Stack.Screen name="calendar" options={{ headerShown: true, title: t("islamicCalendar"), headerBackTitle: t("more") }} />
      <Stack.Screen name="names" options={{ headerShown: true, title: t("names99"), headerBackTitle: t("more") }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: t("settings"), headerBackTitle: t("more") }} />
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
