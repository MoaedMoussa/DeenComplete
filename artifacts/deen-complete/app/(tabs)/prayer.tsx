import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
  Modal, TextInput, FlatList, StatusBar,
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
const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const ICONS: Record<string, string> = {
  fajr: "🌙", dhuhr: "☀️", asr: "🌤️", maghrib: "🌅", isha: "🌙",
};

export default function PrayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, logPrayer, prayerLogs, setManualCity, requestLocation, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 0 : insets.top;

  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); setTick(x => x + 1); refreshPrayerTimes(); }, 20000);
    return () => clearInterval(t);
  }, []);

  const tz = location?.timezone;
  const allEntries = getAllPrayerEntries(prayerTimes);
  const sunrise = allEntries.find(e => e.key === "sunrise");
  const displayPrayers = allEntries.filter(e => e.key !== "sunrise");
  const next = getNextPrayerEntry(prayerTimes);

  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);
  const prayedCount = PRAYER_KEYS.filter(k => todayLog?.[k] === "prayed").length;

  function handleLog(key: PrayerKey, status: "prayed" | "missed" | "late") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logPrayer(todayKey, key, status);
  }

  function handleCitySelect(city: City) {
    Haptics.selectionAsync();
    setManualCity(city);
    setShowPicker(false);
    setQuery("");
  }

  const cities = searchCities(query);
  const s = styles(colors, topPad);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Hero Header */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <TouchableOpacity style={s.locationBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <Feather name="map-pin" size={13} color="#fff" />
            <Text style={s.locationTxt}>{location?.city ?? "Set Location"}</Text>
            <Feather name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={s.heroDate}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...(tz ? { timeZone: tz } : {}) })}
          </Text>
        </View>

        {next ? (
          <View style={s.heroBody}>
            <Text style={s.heroLabel}>Next Prayer</Text>
            <Text style={s.heroName}>{next.name}</Text>
            <Text style={s.heroNameAr}>{next.nameArabic}</Text>
            <Text style={s.heroTime}>{formatTime(next.time, tz)}</Text>
            <View style={s.heroBadge}>
              <Feather name="clock" size={12} color={colors.accent} />
              <Text style={s.heroBadgeTxt}>in {formatCountdown(next.time)}</Text>
            </View>
          </View>
        ) : (
          <View style={s.heroBody}>
            <Text style={s.heroLabel}>All Prayers Complete</Text>
            <Text style={s.heroName}>الحمد لله</Text>
          </View>
        )}

        {/* Progress dots */}
        <View style={s.progressRow}>
          {PRAYER_KEYS.map(k => {
            const st = todayLog?.[k];
            return (
              <View key={k} style={[
                s.dot,
                st === "prayed" && { backgroundColor: "#4ADE80" },
                st === "late" && { backgroundColor: "#FCD34D" },
                st === "missed" && { backgroundColor: "#F87171" },
                !st && { backgroundColor: "rgba(255,255,255,0.25)" },
              ]} />
            );
          })}
          <Text style={s.progressTxt}>{prayedCount}/5 prayed</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Sunrise banner */}
        {sunrise && (
          <View style={s.sunriseBanner}>
            <Text style={s.sunriseIcon}>🌅</Text>
            <Text style={s.sunriseTxt}>Sunrise at {formatTime(sunrise.time, tz)}</Text>
          </View>
        )}

        {/* Prayer Rows */}
        <View style={s.prayersCard}>
          {displayPrayers.map((entry, i) => {
            const isNext = next?.key === entry.key;
            const isPast = entry.time < now;
            const key = entry.key as PrayerKey;
            const status = todayLog?.[key] ?? null;

            return (
              <View key={entry.key}>
                <View style={[s.prayerRow, isNext && s.prayerRowActive]}>
                  {isNext && <View style={s.activeBar} />}

                  <View style={s.prayerIcon}>
                    <Text style={{ fontSize: 18 }}>{ICONS[entry.key]}</Text>
                  </View>

                  <View style={s.prayerLeft}>
                    <Text style={[s.prayerName, isNext && s.activeName, isPast && !isNext && s.pastName]}>
                      {entry.name}
                    </Text>
                    <Text style={s.prayerAr}>{entry.nameArabic}</Text>
                  </View>

                  <Text style={[s.prayerTime, isNext && s.activeTime]}>
                    {formatTime(entry.time, tz)}
                  </Text>

                  {/* Log buttons */}
                  <View style={s.logRow}>
                    <TouchableOpacity
                      style={[s.logBtn, status === "prayed" && s.logBtnGreen]}
                      onPress={() => handleLog(key, "prayed")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="check" size={11} color={status === "prayed" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.logBtn, status === "late" && s.logBtnAmber]}
                      onPress={() => handleLog(key, "late")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="clock" size={11} color={status === "late" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.logBtn, status === "missed" && s.logBtnRed]}
                      onPress={() => handleLog(key, "missed")}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Feather name="x" size={11} color={status === "missed" ? "#fff" : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < displayPrayers.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </View>

        {/* Tools */}
        <View style={s.toolsRow}>
          <TouchableOpacity style={s.toolCard} onPress={() => router.push("/qibla")} activeOpacity={0.8}>
            <Text style={s.toolEmoji}>🧭</Text>
            <Text style={s.toolLabel}>Qibla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolCard} onPress={() => router.push("/prayer-tracker")} activeOpacity={0.8}>
            <Text style={s.toolEmoji}>📊</Text>
            <Text style={s.toolLabel}>Tracker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolCard} onPress={() => { requestLocation(); }} activeOpacity={0.8}>
            <Text style={s.toolEmoji}>📡</Text>
            <Text style={s.toolLabel}>GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolCard} onPress={() => router.push("/settings")} activeOpacity={0.8}>
            <Text style={s.toolEmoji}>⚙️</Text>
            <Text style={s.toolLabel}>Method</Text>
          </TouchableOpacity>
        </View>

        {/* Extra times */}
        <View style={s.extraCard}>
          <Text style={s.extraTitle}>Additional Times</Text>
          <View style={s.extraRow}>
            <Text style={s.extraLabel}>🌙  Islamic Midnight</Text>
            <Text style={s.extraVal}>{formatTime(prayerTimes.midnight, tz)}</Text>
          </View>
          <View style={s.extraDivider} />
          <View style={s.extraRow}>
            <Text style={s.extraLabel}>⭐  Last Third of Night</Text>
            <Text style={s.extraVal}>{formatTime(prayerTimes.lastThird, tz)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* City Picker */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Choose City</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setQuery(""); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.gpsRow} onPress={() => { requestLocation(); setShowPicker(false); }}>
            <View style={s.gpsIconWrap}>
              <Feather name="crosshair" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={s.gpsTxt}>Use Current Location (GPS)</Text>
              <Text style={s.gpsSub}>Auto-detect from device</Text>
            </View>
          </TouchableOpacity>

          <View style={s.searchWrap}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={s.searchInput}
              placeholder="Search city or country..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={cities}
            keyExtractor={c => `${c.name}-${c.country}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={s.cityRow} onPress={() => handleCitySelect(item)} activeOpacity={0.7}>
                <View style={s.cityLeft}>
                  <Text style={s.cityName}>{item.name}</Text>
                  <Text style={s.citySub}>{item.country} · {item.timezone}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.border} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hero: {
      backgroundColor: colors.primary,
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    locationBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    locationTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
    heroDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
    heroBody: { marginBottom: 20 },
    heroLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 4 },
    heroName: { fontFamily: "Inter_700Bold", fontSize: 36, color: "#fff" },
    heroNameAr: { fontFamily: "Amiri_400Regular", fontSize: 22, color: "rgba(255,255,255,0.8)", marginTop: 2 },
    heroTime: { fontFamily: "Inter_700Bold", fontSize: 48, color: "#fff", marginTop: 4 },
    heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    heroBadgeTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.accent },
    progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    progressTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 4 },
    content: { padding: 16 },
    sunriseBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.goldLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.accent + "30" },
    sunriseIcon: { fontSize: 18 },
    sunriseTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.accent },
    prayersCard: { backgroundColor: colors.card, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.border, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    prayerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, position: "relative" },
    prayerRowActive: { backgroundColor: colors.primary + "08" },
    activeBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary, borderRadius: 2 },
    prayerIcon: { width: 32, marginRight: 10 },
    prayerLeft: { flex: 1 },
    prayerName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground },
    activeName: { color: colors.primary, fontFamily: "Inter_700Bold" },
    pastName: { color: colors.mutedForeground },
    prayerAr: { fontFamily: "Amiri_400Regular", fontSize: 14, color: colors.mutedForeground, marginTop: 1 },
    prayerTime: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginRight: 10, minWidth: 72, textAlign: "right" },
    activeTime: { color: colors.primary },
    logRow: { flexDirection: "row", gap: 4 },
    logBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.muted, justifyContent: "center", alignItems: "center" },
    logBtnGreen: { backgroundColor: "#22C55E" },
    logBtnAmber: { backgroundColor: "#F59E0B" },
    logBtnRed: { backgroundColor: "#EF4444" },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },
    toolsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    toolCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border },
    toolEmoji: { fontSize: 22 },
    toolLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.foreground },
    extraCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    extraTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground, marginBottom: 12 },
    extraRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    extraLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground },
    extraVal: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    extraDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    // Modal
    modal: { flex: 1, backgroundColor: colors.background },
    modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground },
    gpsRow: { flexDirection: "row", alignItems: "center", gap: 14, margin: 16, padding: 16, backgroundColor: colors.primary + "10", borderRadius: 16, borderWidth: 1, borderColor: colors.primary + "25" },
    gpsIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "20", justifyContent: "center", alignItems: "center" },
    gpsTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.primary },
    gpsSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
    searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
    cityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
    cityLeft: {},
    cityName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    citySub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  });
