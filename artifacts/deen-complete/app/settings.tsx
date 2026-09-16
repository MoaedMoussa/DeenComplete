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
import { useT } from "@/constants/i18n";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import Slider from "@react-native-community/slider";

const MADHAB_OPTIONS = [
  { id: "Shafi", name: "Shafi / Maliki / Hanbali", desc: "Earlier Asr time" },
  { id: "Hanafi", name: "Hanafi", desc: "Later Asr time" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  const t = useT(settings.language);

  const LANGUAGE_OPTIONS = [
    { id: "en" as const, name: t("english"), desc: t("englishDesc") },
    { id: "ar" as const, name: t("arabic"), desc: t("arabicDesc") },
  ];

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;
  const s = styles(colors, bottomPad);

  function haptic() { try { Haptics.selectionAsync(); } catch {} }

  function toggle(key: keyof typeof settings) {
    haptic();
    updateSettings({ [key]: !settings[key as keyof typeof settings] });
  }

  const handleLanguageChange = async (lang: "en" | "ar") => {
    haptic();
    updateSettings({ language: lang });
    
    if (Platform.OS === "web") {
      document.dir = lang === "ar" ? "rtl" : "ltr";
    } else {
      if (lang === "ar" && !I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        try { await Updates.reloadAsync(); } catch (e) {}
      } else if (lang === "en" && I18nManager.isRTL) {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        try { await Updates.reloadAsync(); } catch (e) {}
      }
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Language */}
      <Text style={s.sectionTitle}>{t("language")}</Text>
      <View style={s.card}>
        {LANGUAGE_OPTIONS.map((lang, idx) => (
          <TouchableOpacity
            key={lang.id}
            style={[s.optionRow, idx < LANGUAGE_OPTIONS.length - 1 && s.optionDivider]}
            onPress={() => handleLanguageChange(lang.id)}
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
        {t("prayerCalculation")}
      </Text>
      <View style={s.card}>
        <Text style={s.cardSubtitle}>
          {t("calculationMethod")}
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
          {t("asrMadhab")}
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
        {t("notifications")}
      </Text>
      <View style={s.card}>
        {[
          {
            key: "notifications",
            label: t("prayerNotifications"),
            sub: t("adhanAlertsDesc"),
          },
          {
            key: "adhanEnabled",
            label: t("playAdhan"),
            sub: t("audioAdhanDesc"),
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
        {t("quranDisplay")}
      </Text>
      <View style={s.card}>
        {[
          {
            key: "showTranslation",
            label: t("showTranslation"),
            sub: t("showTranslationDesc"),
          },
          {
            key: "showTransliteration",
            label: t("showTransliteration"),
            sub: t("showTransliterationDesc"),
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

        <View style={[s.optionRow, s.optionDivider, { flexDirection: "column", alignItems: "stretch", gap: 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={s.optionName}>{t("arabicFontSize")}</Text>
              <Text style={s.optionSub}>
                {settings.language === "ar" ? `الحجم الحالي: ${settings.arabicFontSize}` : `Current: ${settings.arabicFontSize}px`}
              </Text>
            </View>
            <Text style={s.fontSizeVal}>{settings.arabicFontSize}</Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={18}
            maximumValue={48}
            step={2}
            value={settings.arabicFontSize}
            onSlidingComplete={(val) => updateSettings({ arabicFontSize: val })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.muted}
            thumbTintColor={colors.primary}
          />
        </View>

        <View style={[s.optionRow, { flexDirection: "column", alignItems: "stretch", gap: 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={s.optionName}>{t("translationFontSize")}</Text>
              <Text style={s.optionSub}>
                {settings.language === "ar" ? `الحجم الحالي: ${settings.translationFontSize}` : `Current: ${settings.translationFontSize}px`}
              </Text>
            </View>
            <Text style={s.fontSizeVal}>{settings.translationFontSize}</Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={12}
            maximumValue={32}
            step={2}
            value={settings.translationFontSize}
            onSlidingComplete={(val) => updateSettings({ translationFontSize: val })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.muted}
            thumbTintColor={colors.primary}
          />
        </View>
      </View>

      {/* Appearance */}
      <Text style={s.sectionTitle}>{t("appearance")}</Text>
      <View style={s.card}>
        {([
          {
            id: "system" as const,
            name: t("systemMode"),
            desc: t("followDevice"),
          },
          {
            id: "light" as const,
            name: t("lightMode"),
            desc: t("alwaysLight"),
          },
          {
            id: "dark" as const,
            name: t("darkMode"),
            desc: t("alwaysDark"),
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
