import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/constants/i18n";

type SectionIcon = { lib: "Ionicons" | "MaterialCommunityIcons"; name: string };

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const t = useT(settings.language);
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const SECTIONS: { title: string; items: { icon: SectionIcon; label: string; sub: string; route: string }[] }[] = [
    {
      title: t("knowledge"),
      items: [
        { icon: { lib: "Ionicons", name: "book-outline" }, label: t("hadithLibrary"), sub: t("hadithDesc"), route: "/hadith" },
        { icon: { lib: "Ionicons", name: "infinite-outline" }, label: t("names99"), sub: t("namesDesc"), route: "/names" },
        { icon: { lib: "Ionicons", name: "hand-left-outline" }, label: t("duaLibrary"), sub: t("duaDesc"), route: "/duas" },
      ],
    },
    {
      title: t("worship"),
      items: [
        { icon: { lib: "MaterialCommunityIcons", name: "mosque" }, label: t("hajjGuide"), sub: t("hajjDesc"), route: "/hajj" },
        { icon: { lib: "Ionicons", name: "calculator-outline" }, label: t("zakatCalc"), sub: t("zakatDesc"), route: "/zakat" },
        { icon: { lib: "Ionicons", name: "stats-chart-outline" }, label: t("prayerTracker"), sub: t("trackerDesc"), route: "/prayer-tracker" },
      ],
    },
    {
      title: t("tools"),
      items: [
        { icon: { lib: "Ionicons", name: "calendar-outline" }, label: t("islamicCalendar"), sub: t("calendarDesc"), route: "/calendar" },
        { icon: { lib: "Ionicons", name: "compass-outline" }, label: t("qiblaCompass"), sub: t("qiblaDesc"), route: "/qibla" },
        { icon: { lib: "Ionicons", name: "settings-outline" }, label: t("settings"), sub: t("settingsDesc"), route: "/settings" },
      ],
    },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("explore")}</Text>
          <Text style={[styles.titleAr, { color: colors.accent, fontFamily: "Amiri_400Regular" }]}>
            استكشف الدين
          </Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: colors.primary + "10" }]}>
                      {item.icon.lib === "MaterialCommunityIcons"
                        ? <MaterialCommunityIcons name={item.icon.name as any} size={22} color={colors.primary} />
                        : <Ionicons name={item.icon.name as any} size={22} color={colors.primary} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                      <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={17} color={colors.border} />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 70 }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Amiri_700Bold" }]}>
            دين كامل
          </Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>Deen Complete · Islamic Companion</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30 },
  titleAr: { fontSize: 20, marginTop: 2 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  rowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth },
  appInfo: { alignItems: "center", paddingVertical: 24, gap: 4 },
  appName: { fontSize: 24 },
  appSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
