import React from "react";
import {
  View, Text, ScrollView, StyleSheet, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

export default function QuranTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quranLogs } = useApp();

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  // Build last 30 days
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const logs = Object.fromEntries(quranLogs.map(l => [l.date, l]));

  // Stats
  const totalPagesRead = quranLogs.reduce((acc, l) => acc + (l.pagesRead?.length || 0), 0);
  const totalDaysRead = quranLogs.filter(l => l.pagesRead && l.pagesRead.length > 0).length;

  // Streak
  let streak = 0;
  for (let i = last30Days.length - 1; i >= 0; i--) {
    const l = logs[last30Days[i]];
    if (l && l.pagesRead && l.pagesRead.length > 0) {
      streak++;
    } else {
      // Allow missing today if it's not the end of the day yet
      if (i === last30Days.length - 1) continue;
      break;
    }
  }

  const s = styles(colors, bottomPad);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Feather name="book-open" size={20} color={colors.primary} />
          <Text style={s.statNum}>{totalPagesRead}</Text>
          <Text style={s.statLabel}>Pages Read</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="calendar" size={20} color={colors.primary} />
          <Text style={s.statNum}>{totalDaysRead}</Text>
          <Text style={s.statLabel}>Days Active</Text>
        </View>
        <View style={[s.statCard, s.streakCard]}>
          <Ionicons name="flame" size={22} color="#F59E0B" />
          <Text style={[s.statNum, s.streakNum]}>{streak}</Text>
          <Text style={s.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Heatmap Grid */}
      <Text style={s.sectionTitle}>Reading History (Last 30 Days)</Text>
      <View style={s.heatmapCard}>
        {last30Days.map(date => {
          const l = logs[date];
          const d = new Date(date);
          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isToday = date === today.toISOString().split("T")[0];
          
          const pages = l?.pagesRead?.length || 0;
          let color = "#E2E8F0";
          if (pages > 0) color = colors.primary + "60";
          if (pages > 2) color = colors.primary + "99";
          if (pages >= 5) color = colors.primary;

          return (
            <View key={date} style={[s.heatmapRow, isToday && s.heatmapRowToday]}>
              <Text style={[s.heatmapDateLabel, isToday && s.heatmapDateToday]}>{label}</Text>
              <View style={[s.barTrack, { width: 150 }]}>
                 <View style={[s.barFill, { width: `${Math.min((pages / 10) * 100, 100)}%`, backgroundColor: color }]} />
              </View>
              <Text style={s.pagesText}>{pages} {pages === 1 ? 'page' : 'pages'}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: any, bottomPad: number) =>
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
    streakCard: { borderColor: "#F59E0B" + "50" },
    statNum: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    streakNum: { color: "#F59E0B" },
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
    heatmapRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    heatmapRowToday: { backgroundColor: colors.primary + "08", borderRadius: 8, padding: 4 },
    heatmapDateLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground },
    heatmapDateToday: { fontFamily: "Inter_700Bold", color: colors.primary },
    barTrack: { flex: 2, height: 10, backgroundColor: colors.muted, borderRadius: 5, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 5 },
    pagesText: { flex: 1, textAlign: "right", fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
  });
