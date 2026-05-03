import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { CALCULATION_METHODS } from "@/data/prayers";

const MADHAB_OPTIONS = [
  { id: "Shafi", name: "Shafi / Maliki / Hanbali", desc: "Earlier Asr time" },
  { id: "Hanafi", name: "Hanafi", desc: "Later Asr time" },
];

const LANGUAGE_OPTIONS = [
  { id: "en" as const, name: "English", desc: "App displayed in English" },
  { id: "ar" as const, name: "العربية", desc: "التطبيق بالعربية" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;
  const s = styles(colors, bottomPad);

  function haptic() { try { Haptics.selectionAsync(); } catch {} }

  function toggle(key: keyof typeof settings) {
    haptic();
    updateSettings({ [key]: !settings[key as keyof typeof settings] });
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Language */}
      <Text style={s.sectionTitle}>Language / اللغة</Text>
      <View style={s.card}>
        {LANGUAGE_OPTIONS.map((lang, idx) => (
          <TouchableOpacity
            key={lang.id}
            style={[s.optionRow, idx < LANGUAGE_OPTIONS.length - 1 && s.optionDivider]}
            onPress={() => { haptic(); updateSettings({ language: lang.id }); }}
          >
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{lang.name}</Text>
              <Text style={s.optionSub}>{lang.desc}</Text>
            </View>
            <View style={[s.radioOuter, settings.language === lang.id && s.radioOuterActive]}>
              {settings.language === lang.id && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prayer Calculation */}
      <Text style={s.sectionTitle}>
        {settings.language === "ar" ? "حساب مواقيت الصلاة" : "Prayer Time Calculation"}
      </Text>
      <View style={s.card}>
        <Text style={s.cardSubtitle}>
          {settings.language === "ar" ? "طريقة الحساب" : "Calculation Method"}
        </Text>
        {CALCULATION_METHODS.map((method, idx) => (
          <TouchableOpacity
            key={method.id}
            style={[s.optionRow, idx < CALCULATION_METHODS.length - 1 && s.optionDivider]}
            onPress={() => { haptic(); updateSettings({ calculationMethod: method.id }); }}
          >
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{method.name}</Text>
              <Text style={s.optionSub}>{method.region}</Text>
            </View>
            <View style={[s.radioOuter, settings.calculationMethod === method.id && s.radioOuterActive]}>
              {settings.calculationMethod === method.id && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardSubtitle}>
          {settings.language === "ar" ? "مذهب وقت العصر" : "Asr Madhab"}
        </Text>
        {MADHAB_OPTIONS.map((m, idx) => (
          <TouchableOpacity
            key={m.id}
            style={[s.optionRow, idx < MADHAB_OPTIONS.length - 1 && s.optionDivider]}
            onPress={() => { haptic(); updateSettings({ madhab: m.id }); }}
          >
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{m.name}</Text>
              <Text style={s.optionSub}>{m.desc}</Text>
            </View>
            <View style={[s.radioOuter, settings.madhab === m.id && s.radioOuterActive]}>
              {settings.madhab === m.id && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <Text style={s.sectionTitle}>
        {settings.language === "ar" ? "الإشعارات" : "Notifications"}
      </Text>
      <View style={s.card}>
        {[
          {
            key: "notifications",
            label: settings.language === "ar" ? "إشعارات الصلاة" : "Prayer Notifications",
            sub: settings.language === "ar" ? "تنبيهات الأذان لكل صلاة" : "Adhan alerts for each prayer",
          },
          {
            key: "adhanEnabled",
            label: settings.language === "ar" ? "تشغيل الأذان" : "Play Adhan",
            sub: settings.language === "ar" ? "صوت الأذان مع الإشعار" : "Audio adhan on notification",
          },
        ].map((item, idx, arr) => (
          <View key={item.key} style={[s.switchRow, idx < arr.length - 1 && s.optionDivider]}>
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{item.label}</Text>
              <Text style={s.optionSub}>{item.sub}</Text>
            </View>
            <Switch
              value={settings[item.key as keyof typeof settings] as boolean}
              onValueChange={() => toggle(item.key as keyof typeof settings)}
              trackColor={{ false: colors.muted, true: colors.primary + "80" }}
              thumbColor={settings[item.key as keyof typeof settings] ? colors.primary : colors.mutedForeground}
            />
          </View>
        ))}
      </View>

      {/* Quran Display */}
      <Text style={s.sectionTitle}>
        {settings.language === "ar" ? "عرض القرآن" : "Quran Display"}
      </Text>
      <View style={s.card}>
        {[
          {
            key: "showTranslation",
            label: settings.language === "ar" ? "إظهار الترجمة" : "Show Translation",
            sub: settings.language === "ar" ? "عرض الترجمة الإنجليزية" : "Display English translation",
          },
          {
            key: "showTransliteration",
            label: settings.language === "ar" ? "إظهار النطق اللاتيني" : "Show Transliteration",
            sub: settings.language === "ar" ? "عرض الكتابة الصوتية" : "Display Latin script pronunciation",
          },
        ].map((item, idx, arr) => (
          <View key={item.key} style={[s.switchRow, idx < arr.length - 1 && s.optionDivider]}>
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{item.label}</Text>
              <Text style={s.optionSub}>{item.sub}</Text>
            </View>
            <Switch
              value={settings[item.key as keyof typeof settings] as boolean}
              onValueChange={() => toggle(item.key as keyof typeof settings)}
              trackColor={{ false: colors.muted, true: colors.primary + "80" }}
              thumbColor={settings[item.key as keyof typeof settings] ? colors.primary : colors.mutedForeground}
            />
          </View>
        ))}

        <View style={s.switchRow}>
          <View style={s.optionLeft}>
            <Text style={s.optionName}>
              {settings.language === "ar" ? "حجم الخط العربي" : "Arabic Font Size"}
            </Text>
            <Text style={s.optionSub}>
              {settings.language === "ar" ? `الحجم الحالي: ${settings.arabicFontSize}` : `Current: ${settings.arabicFontSize}px`}
            </Text>
          </View>
          <View style={s.fontSizeRow}>
            <TouchableOpacity
              style={s.fontSizeBtn}
              onPress={() => updateSettings({ arabicFontSize: Math.max(18, settings.arabicFontSize - 2) })}
            >
              <Feather name="minus" size={14} color={colors.primary} />
            </TouchableOpacity>
            <Text style={s.fontSizeVal}>{settings.arabicFontSize}</Text>
            <TouchableOpacity
              style={s.fontSizeBtn}
              onPress={() => updateSettings({ arabicFontSize: Math.min(38, settings.arabicFontSize + 2) })}
            >
              <Feather name="plus" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <Text style={s.sectionTitle}>
        {settings.language === "ar" ? "المظهر" : "Appearance"}
      </Text>
      <View style={s.card}>
        {([
          {
            id: "system" as const,
            name: settings.language === "ar" ? "وضع النظام" : "System Mode",
            desc: settings.language === "ar" ? "اتباع إعداد الجهاز" : "Follow device setting",
          },
          {
            id: "light" as const,
            name: settings.language === "ar" ? "الوضع الفاتح" : "Light Mode",
            desc: settings.language === "ar" ? "فاتح دائمًا" : "Always light",
          },
          {
            id: "dark" as const,
            name: settings.language === "ar" ? "الوضع الداكن" : "Dark Mode",
            desc: settings.language === "ar" ? "داكن دائمًا" : "Always dark",
          },
        ]).map((theme, idx, arr) => (
          <TouchableOpacity
            key={theme.id}
            style={[s.optionRow, idx < arr.length - 1 && s.optionDivider]}
            onPress={() => { haptic(); updateSettings({ theme: theme.id }); }}
          >
            <View style={s.optionLeft}>
              <Text style={s.optionName}>{theme.name}</Text>
              <Text style={s.optionSub}>{theme.desc}</Text>
            </View>
            <View style={[s.radioOuter, settings.theme === theme.id && s.radioOuterActive]}>
              {settings.theme === theme.id && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* About */}
      <View style={s.aboutCard}>
        <Text style={s.aboutTitle}>Deen Complete</Text>
        <Text style={s.aboutArabic}>دِيْن كَامِل</Text>
        <Text style={s.aboutVersion}>Version 1.0.0</Text>
        <Text style={s.aboutDesc}>
          {settings.language === "ar"
            ? "تطبيقك الإسلامي الشامل المصنوع بمحبة للأمة الإسلامية."
            : "Your comprehensive all-in-one Islamic companion app. Made with love for the Ummah."}
        </Text>
      </View>

      <View style={{ height: 40 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 8,
      paddingLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    cardSubtitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      color: colors.mutedForeground,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    optionDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    optionLeft: { flex: 1, marginRight: 10 },
    optionName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    optionSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    radioOuter: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: colors.border,
      justifyContent: "center", alignItems: "center",
    },
    radioOuterActive: { borderColor: colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    fontSizeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    fontSizeBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    fontSizeVal: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, width: 28, textAlign: "center" },
    aboutCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      gap: 4,
    },
    aboutTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
    aboutArabic: { fontFamily: "Amiri_400Regular", fontSize: 20, color: "rgba(255,255,255,0.8)" },
    aboutVersion: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    aboutDesc: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      textAlign: "center",
      lineHeight: 20,
      marginTop: 6,
    },
  });
