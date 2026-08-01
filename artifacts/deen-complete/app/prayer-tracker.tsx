import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = typeof PRAYERS[number];

const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const STATUS_COLORS: Record<string, string> = {
  prayed: "#22C55E",
  late: "#F59E0B",
  missed: "#EF4444",
  none: "#E2E8F0",
};

export default function PrayerTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerLogs } = useApp();

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  // Build last 30 days
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const logs = Object.fromEntries(prayerLogs.map(l => [l.date, l]));

  // Stats
  const totalPrayed = prayerLogs.reduce((acc, l) => {
    return acc + PRAYERS.filter(p => l[p] === "prayed").length;
  }, 0);
  const totalMissed = prayerLogs.reduce((acc, l) => {
    return acc + PRAYERS.filter(p => l[p] === "missed").length;
  }, 0);
  const totalLate = prayerLogs.reduce((acc, l) => {
    return acc + PRAYERS.filter(p => l[p] === "late").length;
  }, 0);

  // Streak
  let streak = 0;
  for (let i = last30Days.length - 1; i >= 0; i--) {
    const l = logs[last30Days[i]];
    if (!l) break;
    const dayPrayed = PRAYERS.filter(p => l[p] === "prayed").length;
    if (dayPrayed >= 5) streak++;
    else break;
  }

  const s = styles(colors, bottomPad);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Feather name="check-circle" size={20} color="#22C55E" />
          <Text style={s.statNum}>{totalPrayed}</Text>
          <Text style={s.statLabel}>Prayed</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="clock" size={20} color="#F59E0B" />
          <Text style={s.statNum}>{totalLate}</Text>
          <Text style={s.statLabel}>Late</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="x-circle" size={20} color="#EF4444" />
          <Text style={s.statNum}>{totalMissed}</Text>
          <Text style={s.statLabel}>Missed</Text>
        </View>
        <View style={[s.statCard, s.streakCard]}>
          <Ionicons name="flame" size={22} color="#F59E0B" />
          <Text style={[s.statNum, s.streakNum]}>{streak}</Text>
          <Text style={s.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Heatmap Grid */}
      <Text style={s.sectionTitle}>Prayer Heatmap (Last 30 Days)</Text>
      <View style={s.heatmapCard}>
        <View style={s.heatmapHeader}>
          <Text style={s.heatmapDate}>Date</Text>
          {PRAYERS.map(p => (
            <Text key={p} style={s.heatmapPrayer}>{PRAYER_LABELS[p][0]}</Text>
          ))}
        </View>
        {last30Days.slice(-14).map(date => {
          const l = logs[date];
          const d = new Date(date);
          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isToday = date === today.toISOString().split("T")[0];
          return (
            <View key={date} style={[s.heatmapRow, isToday && s.heatmapRowToday]}>
              <Text style={[s.heatmapDateLabel, isToday && s.heatmapDateToday]}>{label}</Text>
              {PRAYERS.map(p => {
                const status = l?.[p] ?? "none";
                return (
                  <View
                    key={p}
                    style={[s.heatmapCell, { backgroundColor: STATUS_COLORS[status] + (status === "none" ? "" : "CC") }]}
                  >
                    {status !== "none" && (
                      <Feather
                        name={status === "prayed" ? "check" : status === "late" ? "clock" : "x"}
                        size={10}
                        color="#fff"
                      />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={s.legend}>
          {(["prayed", "late", "missed", "none"] as const).map(s2 => (
            <View key={s2} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: STATUS_COLORS[s2] }]} />
              <Text style={s.legendText}>{s2.charAt(0).toUpperCase() + s2.slice(1)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bar chart by prayer */}
      <Text style={s.sectionTitle}>Prayer Completion Rate</Text>
      <View style={s.barsCard}>
        {PRAYERS.map(p => {
          const prayed = prayerLogs.filter(l => l[p] === "prayed").length;
          const total = Math.max(prayerLogs.length, 1);
          const pct = (prayed / total) * 100;
          return (
            <View key={p} style={s.barRow}>
              <Text style={s.barLabel}>{PRAYER_LABELS[p]}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={s.barPct}>{Math.round(pct)}%</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakCard: { borderColor: colors.accent + "50" },
    statNum: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    streakNum: { color: colors.accent },
    statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 },
    heatmapCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    heatmapHeader: { flexDirection: "row", marginBottom: 6 },
    heatmapDate: { flex: 2, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground },
    heatmapPrayer: { flex: 1, textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground },
    heatmapRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    heatmapRowToday: { backgroundColor: colors.primary + "08", borderRadius: 8 },
    heatmapDateLabel: { flex: 2, fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground },
    heatmapDateToday: { fontFamily: "Inter_700Bold", color: colors.primary },
    heatmapCell: {
      flex: 1,
      height: 28,
      borderRadius: 6,
      marginHorizontal: 2,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#E2E8F0",
    },
    legend: { flexDirection: "row", gap: 14, marginTop: 10, flexWrap: "wrap" },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    barsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    barLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.foreground, width: 60 },
    barTrack: { flex: 1, height: 10, backgroundColor: colors.muted, borderRadius: 5, overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },
    barPct: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary, width: 36, textAlign: "right" },
  });
