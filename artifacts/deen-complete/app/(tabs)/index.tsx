import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, StatusBar, ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getAllPrayerEntries, getNextPrayerEntry, formatTime, formatCountdown, getHijriDate } from "@/data/prayers";
import { getDailyVerse, allSurahsList } from "@/data/quran";
import { getDailyHadith } from "@/data/hadith";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_EMOJI: Record<string, string> = { fajr: "🌙", dhuhr: "☀️", asr: "🌤", maghrib: "🌅", isha: "🌙" };

const ACTIONS = [
  { icon: "🧭", label: "Qibla", route: "/qibla" },
  { icon: "🤲", label: "Duas", route: "/duas" },
  { icon: "📖", label: "Hadith", route: "/hadith" },
  { icon: "☪️", label: "99 Names", route: "/names" },
  { icon: "💰", label: "Zakat", route: "/zakat" },
  { icon: "🕋", label: "Hajj Guide", route: "/hajj" },
  { icon: "📅", label: "Calendar", route: "/calendar" },
  { icon: "📊", label: "Tracker", route: "/prayer-tracker" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, prayerLogs, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const tz = location?.timezone;
  const entries = getAllPrayerEntries(prayerTimes).filter(e => e.key !== "sunrise");
  const next = getNextPrayerEntry(prayerTimes);
  const hijri = getHijriDate(now);
  const verse = getDailyVerse();
  const verseSurahName = allSurahsList.find(s => s.id === verse.surahId)?.name ?? `Surah ${verse.surahId}`;
  const hadith = getDailyHadith();
  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);
  const prayedCount = PRAYER_KEYS.filter(p => todayLog?.[p] === "prayed").length;

  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── TOP HEADER ── */}
        <View style={[styles.topBar, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.bismillah, { color: colors.accent, fontFamily: "Amiri_400Regular" }]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting} 🌿</Text>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => router.push("/(tabs)/prayer")}
            >
              <Feather name="map-pin" size={11} color={colors.primary} />
              <Text style={[styles.locationTxt, { color: colors.primary }]}>
                {location ? `${location.city}, ${location.country}` : "Detecting location…"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.hijriBox, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/calendar")}
          >
            <Text style={styles.hijriDay}>{hijri.day}</Text>
            <Text style={[styles.hijriMon, { fontFamily: "Amiri_400Regular" }]}>{hijri.monthNameAr.split(" ")[0]}</Text>
            <Text style={styles.hijriYear}>{hijri.year}H</Text>
          </TouchableOpacity>
        </View>

        {/* ── NEXT PRAYER HERO ── */}
        <TouchableOpacity
          style={[styles.heroCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/prayer")}
          activeOpacity={0.92}
        >
          {next ? (
            <>
              <View>
                <Text style={styles.heroLabel}>Next Prayer</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Text style={styles.heroEmoji}>{PRAYER_EMOJI[next.key]}</Text>
                  <Text style={styles.heroName}>{next.name}</Text>
                </View>
                <Text style={[styles.heroNameAr, { fontFamily: "Amiri_400Regular" }]}>{next.nameArabic}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.heroTime}>{formatTime(next.time, tz)}</Text>
                <View style={[styles.heroPill, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
                  <Feather name="clock" size={10} color={colors.accent} />
                  <Text style={[styles.heroPillTxt, { color: colors.accent }]}>
                    {formatCountdown(next.time)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={[styles.heroName, { color: "#fff" }]}>All Prayers Complete 🌙</Text>
          )}

          {/* Progress dots */}
          <View style={styles.heroDots}>
            {PRAYER_KEYS.map(k => {
              const st = todayLog?.[k];
              return (
                <View
                  key={k}
                  style={[
                    styles.heroDot,
                    st === "prayed" && { backgroundColor: "#4ADE80" },
                    st === "late" && { backgroundColor: "#FBBF24" },
                    st === "missed" && { backgroundColor: "#F87171" },
                    !st && { backgroundColor: "rgba(255,255,255,0.25)" },
                  ]}
                />
              );
            })}
            <Text style={styles.heroDotsLabel}>{prayedCount}/5</Text>
          </View>
        </TouchableOpacity>

        {/* ── PRAYER PILLS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {entries.map(p => {
            const isNext = next?.key === p.key;
            const st = todayLog?.[p.key as keyof typeof todayLog] as string | undefined;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.pill,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isNext && { backgroundColor: colors.primary + "15", borderColor: colors.primary },
                  st === "prayed" && { borderColor: "#22C55E40" },
                  st === "missed" && { borderColor: "#EF444440" },
                ]}
                onPress={() => router.push("/(tabs)/prayer")}
                activeOpacity={0.8}
              >
                <Text style={styles.pillEmoji}>{PRAYER_EMOJI[p.key]}</Text>
                <Text style={[styles.pillName, { color: isNext ? colors.primary : colors.mutedForeground }]}>
                  {p.name}
                </Text>
                <Text style={[styles.pillTime, { color: isNext ? colors.primary : colors.foreground }]}>
                  {formatTime(p.time, tz)}
                </Text>
                {st && (
                  <View style={[
                    styles.pillDot,
                    { backgroundColor: st === "prayed" ? "#22C55E" : st === "late" ? "#F59E0B" : "#EF4444" },
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── VERSE OF THE DAY ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
          <View style={styles.cardTag}>
            <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.tagTxt, { color: colors.primary }]}>Verse of the Day</Text>
            <Text style={[styles.tagRef, { color: colors.mutedForeground }]}>
              {verseSurahName} {verse.surahId}:{verse.verseNumber}
            </Text>
          </View>
          <Text style={[styles.verseAr, { color: colors.primary, fontFamily: "Amiri_400Regular" }]}>
            {verse.arabic}
          </Text>
          <Text style={[styles.verseEn, { color: colors.foreground }]}>{verse.translation}</Text>
          <TouchableOpacity
            style={[styles.readBtn, { borderColor: colors.primary + "40" }]}
            onPress={() => router.push(`/quran/${verse.surahId}`)}
          >
            <Text style={[styles.readBtnTxt, { color: colors.primary }]}>Read Full Surah</Text>
            <Feather name="chevron-right" size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── HADITH OF THE DAY ── */}
        <View style={[styles.card, {
          backgroundColor: colors.goldLight,
          borderColor: colors.accent + "30",
          marginHorizontal: 16,
          marginTop: 12,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
        }]}>
          <View style={styles.cardTag}>
            <View style={[styles.tagDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.tagTxt, { color: colors.accent }]}>Hadith of the Day</Text>
            <Text style={[styles.tagRef, { color: colors.mutedForeground }]}>{hadith.collection}</Text>
          </View>
          <Text style={[styles.hadithAr, { color: colors.accent, fontFamily: "Amiri_400Regular" }]}>
            {hadith.arabic}
          </Text>
          <Text style={[styles.hadithEn, { color: colors.foreground }]}>"{hadith.text}"</Text>
          <Text style={[styles.hadithNarrator, { color: colors.accent }]}>— {hadith.narrator}</Text>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <Text style={[styles.sectionHead, { color: colors.foreground, marginTop: 20 }]}>Explore</Text>
        <View style={styles.actionsGrid}>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionEmoji}>{a.icon}</Text>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 16 },
  bismillah: { fontSize: 17 },
  greeting: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
  hijriBox: { borderRadius: 16, padding: 10, alignItems: "center", minWidth: 58, shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
  hijriDay: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff" },
  hijriMon: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  hijriYear: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.65)" },
  heroCard: { marginHorizontal: 16, borderRadius: 24, padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 8, position: "relative" },
  heroLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  heroEmoji: { fontSize: 24 },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 30, color: "#fff" },
  heroNameAr: { fontSize: 18, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  heroTime: { fontFamily: "Inter_700Bold", fontSize: 38, color: "#fff" },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
  heroPillTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  heroDots: { position: "absolute", bottom: 14, left: 22, flexDirection: "row", alignItems: "center", gap: 6 },
  heroDot: { width: 8, height: 8, borderRadius: 4 },
  heroDotsLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.55)", marginLeft: 2 },
  pillsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  pill: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", minWidth: 72 },
  pillEmoji: { fontSize: 16, marginBottom: 2 },
  pillName: { fontFamily: "Inter_500Medium", fontSize: 10 },
  pillTime: { fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 2 },
  pillDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 0 },
  cardTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  tagRef: { fontFamily: "Inter_400Regular", fontSize: 11, marginLeft: 2 },
  verseAr: { fontSize: 24, textAlign: "right", lineHeight: 44, marginBottom: 10 },
  verseEn: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, fontStyle: "italic", marginBottom: 12 },
  readBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  readBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  hadithAr: { fontSize: 20, textAlign: "right", lineHeight: 36, marginBottom: 10 },
  hadithEn: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, fontStyle: "italic", marginBottom: 8 },
  hadithNarrator: { fontFamily: "Inter_700Bold", fontSize: 12 },
  sectionHead: { fontFamily: "Inter_700Bold", fontSize: 18, marginHorizontal: 20, marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  actionCard: { width: "22%", flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: "center", gap: 6, minWidth: 78 },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center" },
});
