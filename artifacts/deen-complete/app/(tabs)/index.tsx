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
const PRAYER_ICONS: Record<string, string> = { fajr: "🌙", dhuhr: "☀️", asr: "🌤️", maghrib: "🌅", isha: "🌙" };

const QUICK_ACTIONS = [
  { icon: "🧭", label: "Qibla", labelAr: "القبلة", route: "/qibla" },
  { icon: "📿", label: "Dhikr", labelAr: "الذكر", route: "/(tabs)/dhikr" },
  { icon: "🤲", label: "Duas", labelAr: "الدعاء", route: "/duas" },
  { icon: "📖", label: "Hadith", labelAr: "الحديث", route: "/hadith" },
  { icon: "✨", label: "99 Names", labelAr: "الأسماء", route: "/names" },
  { icon: "💰", label: "Zakat", labelAr: "الزكاة", route: "/zakat" },
  { icon: "🕋", label: "Hajj", labelAr: "الحج", route: "/hajj" },
  { icon: "📅", label: "Calendar", labelAr: "التقويم", route: "/calendar" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, prayerLogs, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 0 : insets.top;

  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); }, 20000);
    return () => clearInterval(t);
  }, []);

  const tz = location?.timezone;
  const allEntries = getAllPrayerEntries(prayerTimes);
  const displayPrayers = allEntries.filter(e => e.key !== "sunrise");
  const next = getNextPrayerEntry(prayerTimes);
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
    setTimeout(() => setRefreshing(false), 700);
  }

  const s = styles(colors, topPad);
  const STATUS_COLOR: Record<string, string> = { prayed: "#22C55E", late: "#F59E0B", missed: "#EF4444" };

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
          <Text style={s.greeting}>
            {now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening"} 🌿
          </Text>
          <TouchableOpacity style={s.locationRow} onPress={() => router.push("/(tabs)/prayer")} activeOpacity={0.7}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            <Text style={s.locationTxt}>{location?.city ?? "Detecting location..."}{location?.country ? `, ${location.country}` : ""}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.hijriCard} onPress={() => router.push("/calendar")} activeOpacity={0.8}>
          <Text style={s.hijriDay}>{hijri.day}</Text>
          <Text style={s.hijriMonAr}>{hijri.monthNameAr.split(" ")[0]}</Text>
          <Text style={s.hijriYear}>{hijri.year}H</Text>
        </TouchableOpacity>
      </View>

      {/* Next Prayer Banner */}
      <TouchableOpacity style={s.nextPrayerCard} onPress={() => router.push("/(tabs)/prayer")} activeOpacity={0.92}>
        {next ? (
          <>
            <View style={s.nextLeft}>
              <Text style={s.nextLabel}>Next Prayer</Text>
              <View style={s.nextNameRow}>
                <Text style={s.nextEmoji}>{PRAYER_ICONS[next.key]}</Text>
                <Text style={s.nextName}>{next.name}</Text>
              </View>
              <Text style={s.nextAr}>{next.nameArabic}</Text>
            </View>
            <View style={s.nextRight}>
              <Text style={s.nextTime}>{formatTime(next.time, tz)}</Text>
              <View style={s.nextBadge}>
                <Feather name="clock" size={11} color={colors.accent} />
                <Text style={s.nextCountdown}>{formatCountdown(next.time)}</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={s.nextLabel}>All prayers completed today 🌙</Text>
        )}
      </TouchableOpacity>

      {/* Prayer Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll} contentContainerStyle={s.pillsContent}>
        {displayPrayers.map(p => {
          const st = todayLog?.[p.key as keyof typeof todayLog] as string | null | undefined;
          const isNext = next?.key === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                s.pill,
                isNext && { backgroundColor: colors.primary + "12", borderColor: colors.primary },
                st && { borderColor: STATUS_COLOR[st] + "80" },
              ]}
              onPress={() => router.push("/(tabs)/prayer")}
              activeOpacity={0.8}
            >
              <Text style={s.pillEmoji}>{PRAYER_ICONS[p.key]}</Text>
              <Text style={[s.pillName, isNext && { color: colors.primary }]}>{p.name}</Text>
              <Text style={[s.pillTime, isNext && { color: colors.primary }]}>{formatTime(p.time, tz)}</Text>
              {st && <View style={[s.pillDot, { backgroundColor: STATUS_COLOR[st] }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Prayer Progress */}
      <TouchableOpacity style={s.progressCard} onPress={() => router.push("/prayer-tracker")} activeOpacity={0.85}>
        <View style={s.progressRow}>
          <Text style={s.progressLabel}>Today's Prayers</Text>
          <Text style={s.progressCount}>{prayedCount} / 5</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(prayedCount / 5) * 100}%` as any }]} />
        </View>
        <View style={s.progressDots}>
          {PRAYER_KEYS.map(k => {
            const st = todayLog?.[k];
            return (
              <View key={k} style={[
                s.progressDot,
                st === "prayed" && { backgroundColor: "#22C55E" },
                st === "late" && { backgroundColor: "#F59E0B" },
                st === "missed" && { backgroundColor: "#EF4444" },
              ]} />
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Verse of the Day */}
      <View style={s.verseCard}>
        <View style={s.cardTag}>
          <Feather name="book-open" size={12} color={colors.primary} />
          <Text style={s.cardTagTxt}>Verse of the Day</Text>
          <Text style={s.cardTagRef}>Surah {verse.surahId}:{verse.verseNumber}</Text>
        </View>
        <Text style={s.verseArabic}>{verse.arabic}</Text>
        <Text style={s.verseTranslation}>{verse.translation}</Text>
        <TouchableOpacity style={s.readMoreBtn} onPress={() => router.push(`/quran/${verse.surahId}`)}>
          <Text style={s.readMoreTxt}>Read Full Surah</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hadith of the Day */}
      <View style={s.hadithCard}>
        <View style={[s.cardTag, { backgroundColor: colors.goldLight }]}>
          <Text style={s.cardTagTxt}>Hadith of the Day</Text>
          <Text style={[s.cardTagRef, { color: colors.accent }]}>{hadith.collection}</Text>
        </View>
        {hadith.arabic && (
          <Text style={s.hadithArabic}>{hadith.arabic}</Text>
        )}
        <Text style={s.hadithTxt}>"{hadith.text}"</Text>
        <Text style={s.hadithNarrator}>— {hadith.narrator}</Text>
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Explore</Text>
      <View style={s.grid}>
        {QUICK_ACTIONS.map(item => (
          <TouchableOpacity
            key={item.label}
            style={s.gridCard}
            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            activeOpacity={0.8}
          >
            <Text style={s.gridEmoji}>{item.icon}</Text>
            <Text style={s.gridLabel}>{item.label}</Text>
            <Text style={s.gridLabelAr}>{item.labelAr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 16, paddingHorizontal: 16 },
    header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
    bismillah: { fontFamily: "Amiri_400Regular", fontSize: 18, color: colors.accent },
    greeting: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground, marginTop: 2 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    locationTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary },
    hijriCard: { backgroundColor: colors.primary, borderRadius: 14, padding: 10, alignItems: "center", minWidth: 64, shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
    hijriDay: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff" },
    hijriMonAr: { fontFamily: "Amiri_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", textAlign: "center" },
    hijriYear: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.7)" },
    nextPrayerCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 8 },
    nextLeft: {},
    nextLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
    nextNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    nextEmoji: { fontSize: 22 },
    nextName: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff" },
    nextAr: { fontFamily: "Amiri_400Regular", fontSize: 18, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    nextRight: { alignItems: "flex-end" },
    nextTime: { fontFamily: "Inter_700Bold", fontSize: 34, color: "#fff" },
    nextBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
    nextCountdown: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.accent },
    pillsScroll: { marginBottom: 10 },
    pillsContent: { paddingRight: 4, gap: 8 },
    pill: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border, minWidth: 76 },
    pillEmoji: { fontSize: 16, marginBottom: 3 },
    pillName: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground },
    pillTime: { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.foreground, marginTop: 2 },
    pillDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
    progressCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
    progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    progressLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    progressCount: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    progressTrack: { height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
    progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
    progressDots: { flexDirection: "row", gap: 6 },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    verseCard: { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary },
    cardTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, backgroundColor: colors.primary + "10", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    cardTagTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary },
    cardTagRef: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    verseArabic: { fontFamily: "Amiri_400Regular", fontSize: 24, color: colors.primary, textAlign: "right", lineHeight: 42, marginBottom: 10 },
    verseTranslation: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, lineHeight: 22, fontStyle: "italic", marginBottom: 10 },
    readMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
    readMoreTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    hadithCard: { backgroundColor: colors.goldLight, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.accent + "30", borderLeftWidth: 4, borderLeftColor: colors.accent },
    hadithArabic: { fontFamily: "Amiri_400Regular", fontSize: 20, color: colors.accent, textAlign: "right", lineHeight: 36, marginBottom: 10 },
    hadithTxt: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, lineHeight: 22, fontStyle: "italic", marginBottom: 8 },
    hadithNarrator: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.accent },
    sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    gridCard: { width: "22%", flexGrow: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border, minWidth: 76 },
    gridEmoji: { fontSize: 24, marginBottom: 2 },
    gridLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.foreground, textAlign: "center" },
    gridLabelAr: { fontFamily: "Amiri_400Regular", fontSize: 12, color: colors.accent, textAlign: "center" },
  });
