import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Modal, TextInput, FlatList, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getAllPrayerEntries, getNextPrayerEntry, formatTime, formatCountdown } from "@/data/prayers";
import { searchCities, City } from "@/data/cities";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
const KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const EMOJI: Record<string, string> = { fajr: "🌙", dhuhr: "☀️", asr: "🌤", maghrib: "🌅", isha: "🌙" };

export default function PrayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, logPrayer, prayerLogs, setManualCity, requestLocation, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 0 : insets.top;

  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); refreshPrayerTimes(); }, 20000);
    return () => clearInterval(t);
  }, []);

  const tz = location?.timezone;
  const allEntries = getAllPrayerEntries(prayerTimes);
  const sunrise = allEntries.find(e => e.key === "sunrise");
  const prayers = allEntries.filter(e => e.key !== "sunrise");
  const next = getNextPrayerEntry(prayerTimes);
  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);
  const prayedCount = KEYS.filter(k => todayLog?.[k] === "prayed").length;
  const cities = searchCities(query);

  function log(key: PrayerKey, status: "prayed" | "late" | "missed") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logPrayer(todayKey, key, status);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HERO ── */}
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPad + 16 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity
            style={styles.locBtn}
            onPress={() => setShowPicker(true)}
          >
            <Feather name="map-pin" size={12} color="#fff" />
            <Text style={styles.locTxt}>{location?.city ?? "Set Location"}</Text>
            <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>
          <Text style={styles.heroDate}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...(tz ? { timeZone: tz } : {}) })}
          </Text>
        </View>

        {next ? (
          <View style={styles.heroMain}>
            <Text style={styles.heroLabel}>Next Prayer</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.heroEmoji}>{EMOJI[next.key]}</Text>
              <Text style={styles.heroName}>{next.name}</Text>
            </View>
            <Text style={[styles.heroNameAr, { fontFamily: "Amiri_400Regular" }]}>{next.nameArabic}</Text>
            <Text style={styles.heroTime}>{formatTime(next.time, tz)}</Text>
            <View style={[styles.heroBadge, { backgroundColor: "rgba(0,0,0,0.22)" }]}>
              <Feather name="clock" size={11} color={colors.accent} />
              <Text style={[styles.heroBadgeTxt, { color: colors.accent }]}>
                in {formatCountdown(next.time)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.heroMain}>
            <Text style={[styles.heroName, { color: "#fff" }]}>All Prayers Done</Text>
            <Text style={[styles.heroNameAr, { fontFamily: "Amiri_400Regular" }]}>الحمد لله</Text>
          </View>
        )}

        <View style={styles.heroDots}>
          {KEYS.map(k => {
            const st = todayLog?.[k];
            return (
              <View key={k} style={[
                styles.dot,
                st === "prayed" && { backgroundColor: "#4ADE80" },
                st === "late" && { backgroundColor: "#FBBF24" },
                st === "missed" && { backgroundColor: "#F87171" },
                !st && { backgroundColor: "rgba(255,255,255,0.22)" },
              ]} />
            );
          })}
          <Text style={styles.dotLabel}>{prayedCount}/5 prayed</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* Sunrise */}
        {sunrise && (
          <View style={[styles.sunriseRow, { backgroundColor: colors.goldLight, borderColor: colors.accent + "30" }]}>
            <Text style={{ fontSize: 18 }}>🌅</Text>
            <Text style={[styles.sunriseTxt, { color: colors.accent }]}>
              Sunrise · {formatTime(sunrise.time, tz)}
            </Text>
          </View>
        )}

        {/* Prayer list card */}
        <View style={[styles.prayerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {prayers.map((entry, i) => {
            const isNext = next?.key === entry.key;
            const isPast = entry.time < now;
            const key = entry.key as PrayerKey;
            const st = todayLog?.[key] ?? null;

            return (
              <View key={key}>
                <View style={[
                  styles.prayerRow,
                  isNext && { backgroundColor: colors.primary + "07" },
                ]}>
                  {/* Active indicator */}
                  {isNext && <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />}

                  <Text style={styles.prayerEmoji}>{EMOJI[key]}</Text>

                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.prayerName,
                      { color: isNext ? colors.primary : isPast ? colors.mutedForeground : colors.foreground },
                      isNext && { fontFamily: "Inter_700Bold" },
                    ]}>
                      {entry.name}
                    </Text>
                    <Text style={[styles.prayerAr, { color: colors.mutedForeground, fontFamily: "Amiri_400Regular" }]}>
                      {entry.nameArabic}
                    </Text>
                  </View>

                  <Text style={[styles.prayerTime, { color: isNext ? colors.primary : colors.foreground }]}>
                    {formatTime(entry.time, tz)}
                  </Text>

                  {/* Log buttons */}
                  <View style={styles.logRow}>
                    <TouchableOpacity
                      style={[styles.logBtn, st === "prayed" && styles.logGreen]}
                      onPress={() => log(key, "prayed")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="check" size={11} color={st === "prayed" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.logBtn, st === "late" && styles.logAmber]}
                      onPress={() => log(key, "late")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="clock" size={11} color={st === "late" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.logBtn, st === "missed" && styles.logRed]}
                      onPress={() => log(key, "missed")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="x" size={11} color={st === "missed" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < prayers.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 54 }]} />}
              </View>
            );
          })}
        </View>

        {/* Tool row */}
        <View style={styles.toolRow}>
          {[
            { emoji: "🧭", label: "Qibla", action: () => router.push("/qibla") },
            { emoji: "📊", label: "Tracker", action: () => router.push("/prayer-tracker") },
            { emoji: "📡", label: "GPS", action: () => requestLocation() },
            { emoji: "⚙️", label: "Settings", action: () => router.push("/settings") },
          ].map(t => (
            <TouchableOpacity
              key={t.label}
              style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={t.action}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              <Text style={[styles.toolLabel, { color: colors.foreground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Extra times */}
        <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.extraTitle, { color: colors.foreground }]}>Additional Times</Text>
          <View style={styles.extraRow}>
            <Text style={[styles.extraLabel, { color: colors.foreground }]}>🌙  Islamic Midnight</Text>
            <Text style={[styles.extraVal, { color: colors.primary }]}>{formatTime(prayerTimes.midnight, tz)}</Text>
          </View>
          <View style={[styles.extraSep, { backgroundColor: colors.border }]} />
          <View style={styles.extraRow}>
            <Text style={[styles.extraLabel, { color: colors.foreground }]}>⭐  Last Third of Night</Text>
            <Text style={[styles.extraVal, { color: colors.primary }]}>{formatTime(prayerTimes.lastThird, tz)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* City Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHdr, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choose City</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setQuery(""); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.gpsRow, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "25" }]}
            onPress={() => { requestLocation(); setShowPicker(false); }}
          >
            <View style={[styles.gpsIcon, { backgroundColor: colors.primary + "1A" }]}>
              <Feather name="crosshair" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.gpsTxt, { color: colors.primary }]}>Use GPS Location</Text>
              <Text style={[styles.gpsSub, { color: colors.mutedForeground }]}>Auto-detect from device</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.searchRow, { backgroundColor: colors.muted }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search city or country…"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={cities}
            keyExtractor={c => `${c.name}-${c.country}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.cityRow, { borderBottomColor: colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setManualCity(item); setShowPicker(false); setQuery(""); }}
              >
                <View>
                  <Text style={[styles.cityName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.citySub, { color: colors.mutedForeground }]}>{item.country} · {item.timezone}</Text>
                </View>
                <Feather name="chevron-right" size={15} color={colors.border} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 22 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  locBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  locTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  heroDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)" },
  heroMain: { marginBottom: 18 },
  heroLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  heroEmoji: { fontSize: 26 },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 34, color: "#fff" },
  heroNameAr: { fontSize: 22, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  heroTime: { fontFamily: "Inter_700Bold", fontSize: 50, color: "#fff", marginTop: 6 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  heroBadgeTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  heroDots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  dotLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: 4 },
  sunriseRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1 },
  sunriseTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  prayerCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  prayerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, position: "relative" },
  activeBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  prayerEmoji: { fontSize: 18, width: 28, marginRight: 10 },
  prayerName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#2C2C2C" },
  prayerAr: { fontSize: 14, marginTop: 1 },
  prayerTime: { fontFamily: "Inter_700Bold", fontSize: 15, minWidth: 68, textAlign: "right", marginRight: 10 },
  logRow: { flexDirection: "row", gap: 4 },
  logBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },
  logGreen: { backgroundColor: "#22C55E" },
  logAmber: { backgroundColor: "#F59E0B" },
  logRed: { backgroundColor: "#EF4444" },
  sep: { height: StyleSheet.hairlineWidth },
  toolRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  toolCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  toolLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  extraCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  extraTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 12 },
  extraRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  extraLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  extraVal: { fontFamily: "Inter_700Bold", fontSize: 14 },
  extraSep: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  modal: { flex: 1 },
  modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 28, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 14, margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  gpsIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  gpsTxt: { fontFamily: "Inter_700Bold", fontSize: 15 },
  gpsSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  cityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cityName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  citySub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
