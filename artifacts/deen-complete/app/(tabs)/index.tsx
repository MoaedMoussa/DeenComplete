import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import {
  getAllPrayerEntries, getNextPrayerEntry, formatTime, formatCountdown, getHijriDate,
} from "@/data/prayers";
import { getDailyVerse } from "@/data/quran";
import { getDailyHadith } from "@/data/hadith";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, prayerLogs, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTick(t => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const allEntries = getAllPrayerEntries(prayerTimes);
  const displayPrayers = allEntries.filter(e => e.key !== "sunrise");
  const nextPrayer = getNextPrayerEntry(prayerTimes);
  const hijri = getHijriDate(now);
  const verse = getDailyVerse();
  const hadith = getDailyHadith();

  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);
  const prayedCount = PRAYER_KEYS.filter(p => todayLog?.[p] === "prayed").length;

  async function onRefresh() {
    setRefreshing(true);
    setNow(new Date());
    refreshPrayerTimes();
    setTimeout(() => setRefreshing(false), 800);
  }

  const s = styles(colors, topPad, bottomPad);

  const STATUS_COLOR: Record<string, string> = {
    prayed: "#22C55E",
    late: "#F59E0B",
    missed: "#EF4444",
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <TouchableOpacity
            style={s.locationRow}
            onPress={() => router.push("/(tabs)/prayer")}
            activeOpacity={0.7}
          >
            <Feather name="map-pin" size={12} color={colors.primary} />
            <Text style={s.locationText}>{location?.city ?? "Detecting location..."}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.hijriBox}>
          <Text style={s.hijriDay}>{hijri.day}</Text>
          <Text style={s.hijriMonth}>{hijri.monthName.split(" ")[0]}</Text>
          <Text style={s.hijriYear}>{hijri.year} H</Text>
        </View>
      </View>

      {/* Next Prayer Card */}
      {nextPrayer ? (
        <TouchableOpacity style={s.prayerCard} onPress={() => router.push("/(tabs)/prayer")} activeOpacity={0.92}>
          <View>
            <Text style={s.nextLabel}>Next Prayer</Text>
            <Text style={s.nextName}>{nextPrayer.name}</Text>
            <Text style={s.nextNameAr}>{nextPrayer.nameArabic}</Text>
          </View>
          <View style={s.nextRight}>
            <Text style={s.nextTime}>{formatTime(nextPrayer.time)}</Text>
            <View style={s.countdownBadge}>
              <Feather name="clock" size={12} color={colors.accent} />
              <Text style={s.countdown}>{formatCountdown(nextPrayer.time)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={s.prayerCard}>
          <Text style={s.nextLabel}>All prayers completed for today 🌙</Text>
        </View>
      )}

      {/* Prayer Pills Row */}
      <View style={s.prayerPillsRow}>
        {displayPrayers.map(p => {
          const status = todayLog?.[p.key as keyof typeof todayLog] as string | null | undefined;
          const isNext = nextPrayer?.key === p.key;
          const isPast = p.time < now && !isNext;
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                s.prayerPill,
                isNext && s.prayerPillActive,
                status && { borderColor: STATUS_COLOR[status] + "60" },
              ]}
              onPress={() => router.push("/(tabs)/prayer")}
              activeOpacity={0.8}
            >
              <Text style={[s.pillName, isNext && s.pillNameActive, isPast && !status && s.pillPast]}>
                {p.name}
              </Text>
              <Text style={[s.pillTime, isNext && s.pillTimeActive, isPast && !status && s.pillPast]}>
                {formatTime(p.time)}
              </Text>
              {status && (
                <View style={[s.pillDot, { backgroundColor: STATUS_COLOR[status] }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today's Prayer Progress */}
      <TouchableOpacity style={s.progressCard} onPress={() => router.push("/prayer-tracker")} activeOpacity={0.85}>
        <View style={s.progressTop}>
          <Text style={s.progressTitle}>Today's Prayers</Text>
          <Text style={s.progressCount}>{prayedCount}/5</Text>
        </View>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${(prayedCount / 5) * 100}%` as any }]} />
        </View>
        <Text style={s.progressHint}>Tap to view full tracker →</Text>
      </TouchableOpacity>

      {/* Verse of the Day */}
      <View style={s.verseCard}>
        <View style={s.cardTitleRow}>
          <Feather name="book-open" size={14} color={colors.primary} />
          <Text style={s.cardTitle}>Verse of the Day</Text>
        </View>
        <Text style={s.verseArabic}>{verse.arabic}</Text>
        <Text style={s.verseTranslation}>{verse.translation}</Text>
        <Text style={s.verseRef}>Surah {verse.surahId}: {verse.verseNumber}</Text>
        <TouchableOpacity
          style={s.readBtn}
          onPress={() => router.push(`/quran/${verse.surahId}`)}
        >
          <Text style={s.readBtnText}>Read Full Surah</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hadith of the Day */}
      <View style={s.hadithCard}>
        <View style={s.cardTitleRow}>
          <Feather name="feather" size={14} color={colors.accent} />
          <Text style={[s.cardTitle, { color: colors.accent }]}>Hadith of the Day</Text>
        </View>
        {hadith.arabic && (
          <Text style={s.hadithArabic}>{hadith.arabic}</Text>
        )}
        <Text style={s.hadithText}>"{hadith.text}"</Text>
        <Text style={s.hadithNarrator}>— {hadith.narrator}</Text>
        <Text style={s.hadithSource}>{hadith.collection}</Text>
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        {[
          { icon: "navigation", label: "Qibla", labelAr: "القبلة", route: "/qibla", bg: "#1A5C3A15" },
          { icon: "refresh-cw", label: "Dhikr", labelAr: "الذكر", route: "/(tabs)/dhikr", bg: "#9C27B015" },
          { icon: "heart", label: "Duas", labelAr: "الدعاء", route: "/duas", bg: "#E91E6315" },
          { icon: "feather", label: "Hadith", labelAr: "الحديث", route: "/hadith", bg: "#3F51B515" },
          { icon: "star", label: "99 Names", labelAr: "الأسماء", route: "/names", bg: "#FF572215" },
          { icon: "dollar-sign", label: "Zakat", labelAr: "الزكاة", route: "/zakat", bg: "#4CAF5015" },
          { icon: "map-pin", label: "Hajj", labelAr: "الحج", route: "/hajj", bg: "#79554815" },
          { icon: "calendar", label: "Calendar", labelAr: "التقويم", route: "/calendar", bg: "#FF572215" },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={[s.actionCard, { backgroundColor: item.bg }]}
            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            activeOpacity={0.8}
          >
            <Feather name={item.icon as any} size={22} color={colors.primary} />
            <Text style={s.actionLabel}>{item.label}</Text>
            <Text style={s.actionLabelAr}>{item.labelAr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 100 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 8, paddingHorizontal: 16 },
    header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
    bismillah: { fontFamily: "Amiri_400Regular", fontSize: 18, color: colors.accent },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    locationText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.primary },
    hijriBox: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
      minWidth: 70,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hijriDay: { fontFamily: "Inter_700Bold", fontSize: 22, color: colors.primary },
    hijriMonth: { fontFamily: "Inter_500Medium", fontSize: 10, color: colors.mutedForeground, textAlign: "center" },
    hijriYear: { fontFamily: "Inter_400Regular", fontSize: 10, color: colors.mutedForeground },
    prayerCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 8,
    },
    nextLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
    nextName: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff" },
    nextNameAr: { fontFamily: "Amiri_400Regular", fontSize: 18, color: "rgba(255,255,255,0.8)" },
    nextRight: { alignItems: "flex-end" },
    nextTime: { fontFamily: "Inter_700Bold", fontSize: 30, color: "#fff" },
    countdownBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 6,
    },
    countdown: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.accent },
    prayerPillsRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
    prayerPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    prayerPillActive: { backgroundColor: colors.primary + "10", borderColor: colors.primary },
    pillName: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.mutedForeground },
    pillNameActive: { color: colors.primary },
    pillPast: { color: colors.border },
    pillTime: { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.foreground, marginTop: 3 },
    pillTimeActive: { color: colors.primary },
    pillDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    progressCount: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    progressBar: {
      height: 6,
      backgroundColor: colors.muted,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
    progressHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    verseCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    verseArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 22,
      color: colors.primary,
      textAlign: "right",
      lineHeight: 38,
      marginBottom: 8,
    },
    verseTranslation: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      fontStyle: "italic",
      marginBottom: 8,
    },
    verseRef: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.accent, marginBottom: 8 },
    readBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    readBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    hadithCard: {
      backgroundColor: colors.goldLight,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    hadithArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: "#7A5C2E",
      textAlign: "right",
      lineHeight: 32,
      marginBottom: 8,
    },
    hadithText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      fontStyle: "italic",
      marginBottom: 8,
    },
    hadithNarrator: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.accent },
    hadithSource: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    sectionTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 18,
      color: colors.foreground,
      marginBottom: 12,
    },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    actionCard: {
      width: "22%",
      flexGrow: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.foreground, textAlign: "center" },
    actionLabelAr: { fontFamily: "Amiri_400Regular", fontSize: 12, color: colors.accent, textAlign: "center" },
  });
