import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

interface MoreItem {
  icon: string;
  label: string;
  labelArabic?: string;
  sub: string;
  route: string;
  color: string;
}

const MORE_SECTIONS: { title: string; items: MoreItem[] }[] = [
  {
    title: "Knowledge",
    items: [
      { icon: "feather", label: "Hadith Library", labelArabic: "الحديث", sub: "50,000+ authentic hadiths", route: "/hadith", color: "#3F51B5" },
      { icon: "book", label: "99 Names of Allah", labelArabic: "أسماء الله الحسنى", sub: "With meanings and dhikr counter", route: "/names", color: "#9C27B0" },
      { icon: "heart", label: "Dua Library", labelArabic: "الدعاء", sub: "Hisnul Muslim & more", route: "/duas", color: "#E91E63" },
    ],
  },
  {
    title: "Worship",
    items: [
      { icon: "map-pin", label: "Hajj & Umrah Guide", labelArabic: "الحج والعمرة", sub: "Complete step-by-step guide", route: "/hajj", color: "#795548" },
      { icon: "dollar-sign", label: "Zakat Calculator", labelArabic: "حاسبة الزكاة", sub: "Gold, silver, cash & more", route: "/zakat", color: "#4CAF50" },
      { icon: "bar-chart-2", label: "Prayer Tracker", labelArabic: "متتبع الصلاة", sub: "Daily prayer log & streaks", route: "/prayer-tracker", color: "#2196F3" },
    ],
  },
  {
    title: "Islamic Calendar",
    items: [
      { icon: "calendar", label: "Islamic Calendar", labelArabic: "التقويم الهجري", sub: "Hijri dates & Islamic events", route: "/calendar", color: "#FF5722" },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: "settings", label: "App Settings", sub: "Language, method, notifications", route: "/settings", color: "#607D8B" },
    ],
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const s = styles(colors, topPad, bottomPad);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>Explore Deen</Text>
        <Text style={s.titleArabic}>استكشف الدين</Text>
      </View>

      {MORE_SECTIONS.map(section => (
        <View key={section.title} style={s.section}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          <View style={s.sectionCard}>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[s.itemRow, idx < section.items.length - 1 && s.itemBorder]}
                onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
                activeOpacity={0.75}
              >
                <View style={[s.itemIcon, { backgroundColor: item.color + "18" }]}>
                  <Feather name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={s.itemText}>
                  <View style={s.itemLabelRow}>
                    <Text style={s.itemLabel}>{item.label}</Text>
                    {item.labelArabic && <Text style={s.itemLabelAr}>{item.labelArabic}</Text>}
                  </View>
                  <Text style={s.itemSub}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Bismillah footer */}
      <View style={s.footer}>
        <Text style={s.footerArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        <Text style={s.footerText}>Deen Complete v1.0</Text>
      </View>

      <View style={{ height: 100 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 16, paddingHorizontal: 16 },
    header: { marginBottom: 24 },
    title: { fontFamily: "Inter_700Bold", fontSize: 28, color: colors.foreground },
    titleArabic: { fontFamily: "Amiri_400Regular", fontSize: 20, color: colors.accent, marginTop: 2 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
      paddingLeft: 4,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    itemIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    itemText: { flex: 1 },
    itemLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    itemLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    itemLabelAr: { fontFamily: "Amiri_400Regular", fontSize: 14, color: colors.accent },
    itemSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    footer: { alignItems: "center", paddingVertical: 16 },
    footerArabic: { fontFamily: "Amiri_400Regular", fontSize: 18, color: colors.accent, marginBottom: 4 },
    footerText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
  });
