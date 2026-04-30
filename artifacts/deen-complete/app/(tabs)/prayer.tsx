import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import {
  getPrayers, formatPrayerTime, getNextPrayer, getTimeUntilPrayer, Prayer,
} from "@/data/prayers";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = typeof PRAYER_KEYS[number];

export default function PrayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, logPrayer, prayerLogs } = useApp();
  const [now, setNow] = useState(new Date());

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const allPrayers = getPrayers(prayerTimes);
  const prayers = allPrayers.filter(p => p.key !== "sunrise");
  const sunrise = allPrayers.find(p => p.key === "sunrise");
  const nextPrayer = getNextPrayer(prayerTimes);

  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);

  function formatCountdown(): string {
    if (!nextPrayer) return "--:--";
    const diff = nextPrayer.time.getTime() - now.getTime();
    if (diff <= 0) return "Now";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleLogPrayer(prayerKey: PrayerKey, status: "prayed" | "missed" | "late") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logPrayer(todayKey, prayerKey, status);
  }

  const s = styles(colors, topPad, bottomPad);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>Prayer Times</Text>
      <Text style={s.locationText}>{location?.city ?? "Detecting location..."}</Text>

      {nextPrayer && (
        <View style={s.countdownCard}>
          <Text style={s.countdownLabel}>{nextPrayer.name} in</Text>
          <Text style={s.countdownTime}>{formatCountdown()}</Text>
          <Text style={s.countdownPrayerTime}>{formatPrayerTime(nextPrayer.time)}</Text>
        </View>
      )}

      <View style={s.prayersCard}>
        {sunrise && (
          <View style={s.sunriseRow}>
            <Feather name="sunrise" size={16} color={colors.accent} />
            <Text style={s.sunriseLabel}>Sunrise</Text>
            <Text style={s.sunriseTime}>{formatPrayerTime(sunrise.time)}</Text>
          </View>
        )}
        {prayers.map((prayer, index) => {
          const isNext = nextPrayer?.key === prayer.key;
          const pKey = prayer.key as PrayerKey;
          const status = todayLog?.[pKey] ?? null;
          return (
            <View key={prayer.key}>
              <View style={[s.prayerRow, isNext && s.prayerRowActive]}>
                <View style={s.prayerLeft}>
                  {isNext && <View style={s.activeDot} />}
                  <View>
                    <Text style={[s.prayerName, isNext && s.prayerNameActive]}>{prayer.name}</Text>
                    <Text style={s.prayerNameAr}>{prayer.nameArabic}</Text>
                  </View>
                </View>
                <View style={s.prayerRight}>
                  <Text style={[s.prayerTime, isNext && s.prayerTimeActive]}>{formatPrayerTime(prayer.time)}</Text>
                  <View style={s.statusRow}>
                    {(["prayed", "late", "missed"] as const).map(st => (
                      <TouchableOpacity
                        key={st}
                        style={[s.statusBtn, status === st && s.statusBtnActive(st, colors)]}
                        onPress={() => handleLogPrayer(pKey, st)}
                      >
                        <Feather
                          name={st === "prayed" ? "check" : st === "late" ? "clock" : "x"}
                          size={12}
                          color={status === st ? "#fff" : colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              {index < prayers.length - 1 && <View style={s.divider} />}
            </View>
          );
        })}
      </View>

      <View style={s.toolRow}>
        <TouchableOpacity style={s.toolCard} onPress={() => router.push("/qibla")} activeOpacity={0.8}>
          <View style={s.toolIcon}>
            <Feather name="navigation" size={24} color={colors.primary} />
          </View>
          <Text style={s.toolLabel}>Qibla</Text>
          <Text style={s.toolSub}>Direction to Makkah</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.toolCard} onPress={() => router.push("/prayer-tracker")} activeOpacity={0.8}>
          <View style={s.toolIcon}>
            <Feather name="bar-chart-2" size={24} color={colors.primary} />
          </View>
          <Text style={s.toolLabel}>Tracker</Text>
          <Text style={s.toolSub}>View prayer history</Text>
        </TouchableOpacity>
      </View>

      {/* How to Pray Section */}
      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>Salah Guides</Text>
        {[
          { icon: "droplet", label: "How to Make Wudhu", sub: "Step-by-step ablution guide" },
          { icon: "user", label: "How to Pray (Beginner)", sub: "Complete illustrated guide" },
          { icon: "moon", label: "Tahajjud Prayer Guide", sub: "Night prayer guide" },
          { icon: "sun", label: "Duha Prayer Guide", sub: "Morning optional prayer" },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.guideRow} activeOpacity={0.7}>
            <View style={s.guideIcon}>
              <Feather name={item.icon as any} size={18} color={colors.primary} />
            </View>
            <View style={s.guideText}>
              <Text style={s.guideName}>{item.label}</Text>
              <Text style={s.guideSub}>{item.sub}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 100 + bottomPad }} />
    </ScrollView>
  );
}

const statusColors: Record<string, string> = {
  prayed: "#22C55E",
  late: "#F59E0B",
  missed: "#EF4444",
};

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 16, paddingHorizontal: 16 },
    heading: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: colors.foreground,
    },
    locationText: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.mutedForeground,
      marginBottom: 20,
    },
    countdownCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    countdownLabel: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 4,
    },
    countdownTime: {
      fontFamily: "Inter_700Bold",
      fontSize: 48,
      color: "#fff",
      letterSpacing: 2,
    },
    countdownPrayerTime: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: "rgba(255,255,255,0.6)",
      marginTop: 4,
    },
    prayersCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    sunriseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.goldLight,
      gap: 8,
    },
    sunriseLabel: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.accent,
      flex: 1,
    },
    sunriseTime: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      color: colors.accent,
    },
    prayerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    prayerRowActive: { backgroundColor: colors.primary + "08" },
    prayerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    prayerName: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 16,
      color: colors.foreground,
    },
    prayerNameActive: { color: colors.primary },
    prayerNameAr: {
      fontFamily: "Amiri_400Regular",
      fontSize: 14,
      color: colors.mutedForeground,
    },
    prayerRight: { alignItems: "flex-end", gap: 6 },
    prayerTime: {
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      color: colors.foreground,
    },
    prayerTimeActive: { color: colors.primary },
    statusRow: { flexDirection: "row", gap: 4 },
    statusBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.muted,
      justifyContent: "center",
      alignItems: "center",
    },
    statusBtnActive: (st: string, c: ReturnType<typeof useColors>) => ({
      backgroundColor: statusColors[st] ?? c.primary,
    }),
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    toolRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    toolCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    toolIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
    },
    toolLabel: {
      fontFamily: "Inter_700Bold",
      fontSize: 15,
      color: colors.foreground,
    },
    toolSub: {
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      color: colors.foreground,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    guideRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    guideIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
    },
    guideText: { flex: 1 },
    guideName: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
      color: colors.foreground,
    },
    guideSub: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
