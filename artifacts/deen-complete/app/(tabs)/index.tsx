import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, RefreshControl, useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getNextPrayer, getPrayers, formatPrayerTime, getTimeUntilPrayer, getHijriDate } from "@/data/prayers";
import { getDailyVerse } from "@/data/quran";
import { getDailyHadith } from "@/data/hadith";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { prayerTimes, location, prayerLogs } = useApp();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nextPrayer = getNextPrayer(prayerTimes);
  const prayers = getPrayers(prayerTimes).filter(p => p.key !== "sunrise");
  const hijri = getHijriDate(now);
  const verse = getDailyVerse();
  const hadith = getDailyHadith();

  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);
  const prayedCount = todayLog
    ? Object.values({ fajr: todayLog.fajr, dhuhr: todayLog.dhuhr, asr: todayLog.asr, maghrib: todayLog.maghrib, isha: todayLog.isha }).filter(v => v === "prayed").length
    : 0;

  async function onRefresh() {
    setRefreshing(true);
    setNow(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  }

  const s = styles(colors, topPad, bottomPad);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Text style={s.locationText}>{location?.city ?? "Detecting location..."}</Text>
        </View>
        <View style={s.hijriBox}>
          <Text style={s.hijriDay}>{hijri.day}</Text>
          <Text style={s.hijriMonth}>{hijri.monthName}</Text>
          <Text style={s.hijriYear}>{hijri.year} H</Text>
        </View>
      </View>

      {/* Next Prayer Card */}
      {nextPrayer && (
        <TouchableOpacity style={s.prayerCard} onPress={() => router.push("/(tabs)/prayer")} activeOpacity={0.9}>
          <View>
            <Text style={s.nextLabel}>Next Prayer</Text>
            <Text style={s.nextName}>{nextPrayer.name}</Text>
            <Text style={s.nextNameAr}>{nextPrayer.nameArabic}</Text>
          </View>
          <View style={s.nextRight}>
            <Text style={s.nextTime}>{formatPrayerTime(nextPrayer.time)}</Text>
            <View style={s.countdownBadge}>
              <Feather name="clock" size={12} color={colors.accent} />
              <Text style={s.countdown}>{getTimeUntilPrayer(nextPrayer)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Prayer row */}
      <View style={s.prayerRow}>
        {prayers.map(p => {
          const status = todayLog?.[p.key as keyof typeof todayLog] as string | null;
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.prayerPill, nextPrayer?.key === p.key && s.prayerPillActive]}
              onPress={() => { Haptics.selectionAsync(); router.push("/(tabs)/prayer"); }}
            >
              <Text style={[s.prayerPillName, nextPrayer?.key === p.key && s.prayerPillNameActive]}>{p.name}</Text>
              <Text style={[s.prayerPillTime, nextPrayer?.key === p.key && s.prayerPillTimeActive]}>{formatPrayerTime(p.time)}</Text>
              {status === "prayed" && <View style={s.prayerDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Prayer progress */}
      <View style={s.progressCard}>
        <View style={s.progressHeader}>
          <Text style={s.progressTitle}>Today's Prayers</Text>
          <Text style={s.progressCount}>{prayedCount}/5</Text>
        </View>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${(prayedCount / 5) * 100}%` }]} />
        </View>
      </View>

      {/* Verse of the Day */}
      <View style={s.verseCard}>
        <View style={s.verseHeader}>
          <Feather name="book-open" size={16} color={colors.accent} />
          <Text style={s.verseTitle}>Verse of the Day</Text>
        </View>
        <Text style={s.verseArabic}>{verse.arabic}</Text>
        {verse.translation && <Text style={s.verseTranslation}>{verse.translation}</Text>}
        <Text style={s.verseRef}>Surah {verse.surahId}: {verse.verseNumber}</Text>
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.quickGrid}>
        {[
          { label: "Qibla", icon: "navigation", route: "/qibla" as const, color: colors.greenMid },
          { label: "Dhikr", icon: "refresh-cw", route: "/(tabs)/dhikr" as const, color: colors.accent },
          { label: "Dua", icon: "heart", route: "/duas" as const, color: "#E91E63" },
          { label: "Hadith", icon: "feather", route: "/hadith" as const, color: "#3F51B5" },
          { label: "99 Names", icon: "star", route: "/names" as const, color: colors.accent },
          { label: "Zakat", icon: "dollar-sign", route: "/zakat" as const, color: colors.greenMid },
          { label: "Calendar", icon: "calendar", route: "/calendar" as const, color: "#FF5722" },
          { label: "Hajj", icon: "map-pin", route: "/hajj" as const, color: "#795548" },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={s.quickItem}
            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            activeOpacity={0.75}
          >
            <View style={[s.quickIcon, { backgroundColor: item.color + "20" }]}>
              <Feather name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={s.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Hadith */}
      <TouchableOpacity style={s.hadithCard} onPress={() => router.push("/hadith")} activeOpacity={0.9}>
        <View style={s.hadithHeader}>
          <Feather name="feather" size={16} color={colors.primary} />
          <Text style={s.hadithTitle}>Hadith of the Day</Text>
        </View>
        <Text style={s.hadithText} numberOfLines={4}>{hadith.text}</Text>
        <Text style={s.hadithSource}>{hadith.narrator} — {hadith.collection}</Text>
      </TouchableOpacity>

      <View style={{ height: 100 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 16, paddingHorizontal: 16 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
    },
    bismillah: {
      fontFamily: "Amiri_400Regular",
      fontSize: 20,
      color: colors.accent,
      marginBottom: 4,
    },
    locationText: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.mutedForeground,
    },
    hijriBox: {
      alignItems: "center",
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    hijriDay: {
      fontFamily: "Inter_700Bold",
      fontSize: 22,
      color: colors.primary,
    },
    hijriMonth: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.primary,
    },
    hijriYear: {
      fontFamily: "Inter_400Regular",
      fontSize: 10,
      color: colors.mutedForeground,
    },
    prayerCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    nextLabel: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 4,
    },
    nextName: {
      fontFamily: "Inter_700Bold",
      fontSize: 26,
      color: "#fff",
    },
    nextNameAr: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: "rgba(255,255,255,0.8)",
    },
    nextRight: { alignItems: "flex-end" },
    nextTime: {
      fontFamily: "Inter_700Bold",
      fontSize: 32,
      color: "#fff",
    },
    countdownBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
      marginTop: 4,
    },
    countdown: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      color: colors.goldLight,
    },
    prayerRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    prayerPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    prayerPillActive: {
      backgroundColor: colors.primary + "15",
      borderColor: colors.primary,
    },
    prayerPillName: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 10,
      color: colors.mutedForeground,
    },
    prayerPillNameActive: { color: colors.primary },
    prayerPillTime: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.foreground,
      marginTop: 2,
    },
    prayerPillTimeActive: { color: colors.primary },
    prayerDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 3,
    },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    progressTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
      color: colors.foreground,
    },
    progressCount: {
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.muted,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    verseCard: {
      backgroundColor: colors.goldLight,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    verseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    verseTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      color: colors.accent,
    },
    verseArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 22,
      color: colors.greenDark,
      textAlign: "right",
      lineHeight: 38,
      marginBottom: 10,
    },
    verseTranslation: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: 8,
      fontStyle: "italic",
    },
    verseRef: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: colors.accent,
    },
    sectionTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 18,
      color: colors.foreground,
      marginBottom: 12,
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 20,
    },
    quickItem: {
      width: "22%",
      alignItems: "center",
      gap: 6,
    },
    quickIcon: {
      width: 54,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    quickLabel: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.foreground,
      textAlign: "center",
    },
    hadithCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    hadithHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    hadithTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      color: colors.primary,
    },
    hadithText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: 10,
      fontStyle: "italic",
    },
    hadithSource: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: colors.mutedForeground,
    },
  });
