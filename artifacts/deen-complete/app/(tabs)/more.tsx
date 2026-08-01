import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";

type SectionIcon = { lib: "Ionicons" | "MaterialCommunityIcons"; name: string };

const SECTIONS: { title: string; items: { icon: SectionIcon; label: string; sub: string; route: string }[] }[] = [
  {
    title: "Knowledge",
    items: [
      { icon: { lib: "Ionicons", name: "book-outline" }, label: "Hadith Library", sub: "Authentic hadiths by collection", route: "/hadith" },
      { icon: { lib: "Ionicons", name: "infinite-outline" }, label: "99 Names of Allah", sub: "With meanings and dhikr counter", route: "/names" },
      { icon: { lib: "Ionicons", name: "hand-left-outline" }, label: "Dua Library", sub: "Hisnul Muslim & more", route: "/duas" },
    ],
  },
  {
    title: "Worship",
    items: [
      { icon: { lib: "MaterialCommunityIcons", name: "mosque" }, label: "Hajj & Umrah Guide", sub: "Step-by-step pilgrimage guide", route: "/hajj" },
      { icon: { lib: "Ionicons", name: "calculator-outline" }, label: "Zakat Calculator", sub: "Gold, silver, cash & investments", route: "/zakat" },
      { icon: { lib: "Ionicons", name: "stats-chart-outline" }, label: "Prayer Tracker", sub: "Daily log & streaks", route: "/prayer-tracker" },
    ],
  },
  {
    title: "Tools",
    items: [
      { icon: { lib: "Ionicons", name: "calendar-outline" }, label: "Islamic Calendar", sub: "Hijri dates & Islamic events", route: "/calendar" },
      { icon: { lib: "Ionicons", name: "compass-outline" }, label: "Qibla Compass", sub: "Find the direction of prayer", route: "/qibla" },
      { icon: { lib: "Ionicons", name: "settings-outline" }, label: "Settings", sub: "Calculation method, theme & more", route: "/settings" },
    ],
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
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
