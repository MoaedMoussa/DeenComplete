import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View, Text, TouchableOpacity, useColorScheme, Modal } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import * as Updates from "expo-updates";
import { I18nManager } from "react-native";

function LanguageSelectionModal() {
  const { settings, updateSettings } = useApp();
  const colors = useColors();

  if (settings.hasChosenLanguage) return null;

  const selectLang = async (lang: "en" | "ar") => {
    updateSettings({ language: lang, hasChosenLanguage: true });
    
    if (Platform.OS === "web") {
      document.dir = lang === "ar" ? "rtl" : "ltr";
    } else {
      if (lang === "ar" && !I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        try {
          await Updates.reloadAsync();
        } catch (e) {}
      } else if (lang === "en" && I18nManager.isRTL) {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        try {
          await Updates.reloadAsync();
        } catch (e) {}
      }
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ backgroundColor: colors.card, width: "100%", borderRadius: 20, padding: 24, alignItems: "center" }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground, marginBottom: 8 }}>
            Welcome / أهلاً بك
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center", marginBottom: 24 }}>
            Please select your preferred language.
            {"\n"}يرجى اختيار لغتك المفضلة.
          </Text>

          <TouchableOpacity
            style={{ width: "100%", backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 }}
            onPress={() => selectLang("ar")}
          >
            <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 20, color: "#fff" }}>العربية</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: "100%", backgroundColor: colors.muted, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            onPress={() => selectLang("en")}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 18, color: colors.foreground }}>English</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function NativeTabLayout() {
  const { settings } = useApp();
  const ar = settings.language === "ar";

  useEffect(() => {
    if (Platform.OS === "web") {
      document.dir = settings.language === "ar" ? "rtl" : "ltr";
    }
  }, [settings.language]);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{ar ? "الرئيسية" : "Home"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="quran">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>{ar ? "القرآن" : "Quran"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} />
        <Label>{ar ? "الصلاة" : "Prayer"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dhikr">
        <Icon sf={{ default: "circle.grid.3x3", selected: "circle.grid.3x3.fill" }} />
        <Label>{ar ? "الذكر" : "Dhikr"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>{ar ? "المزيد" : "More"}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { settings } = useApp();
  const ar = settings.language === "ar";

  useEffect(() => {
    if (Platform.OS === "web") {
      document.dir = settings.language === "ar" ? "rtl" : "ltr";
    }
  }, [settings.language]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ar ? "الرئيسية" : "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: ar ? "القرآن" : "Quran",
          tabBarIcon: ({ color }) => <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: ar ? "الصلاة" : "Prayer",
          tabBarIcon: ({ color }) => <Feather name="sun" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dhikr"
        options={{
          title: ar ? "الذكر" : "Dhikr",
          tabBarIcon: ({ color }) => <Feather name="refresh-cw" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: ar ? "المزيد" : "More",
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return (
      <>
        <LanguageSelectionModal />
        <NativeTabLayout />
      </>
    );
  }
  return (
    <>
      <LanguageSelectionModal />
      <ClassicTabLayout />
    </>
  );
}
