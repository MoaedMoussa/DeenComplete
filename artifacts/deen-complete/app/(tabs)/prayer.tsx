import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Modal, TextInput, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getAllPrayerEntries, getNextPrayerEntry, formatTime, formatCountdown, PrayerTimeEntry } from "@/data/prayers";
import { searchCities, City } from "@/data/cities";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = typeof PRAYER_KEYS[number];

const STATUS_COLORS: Record<string, string> = { prayed: "#22C55E", late: "#F59E0B", missed: "#EF4444" };

export default function PrayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, location, logPrayer, prayerLogs, setManualCity, requestLocation, refreshPrayerTimes } = useApp();
  const [now, setNow] = useState(new Date());
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      refreshPrayerTimes();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const allEntries = getAllPrayerEntries(prayerTimes);
  const displayPrayers = allEntries.filter(e => e.key !== "sunrise");
  const sunrise = allEntries.find(e => e.key === "sunrise");
  const nextPrayer = getNextPrayerEntry(prayerTimes);
  const countdown = nextPrayer ? formatCountdown(nextPrayer.time) : "--";

  const todayKey = now.toISOString().split("T")[0];
  const todayLog = prayerLogs.find(l => l.date === todayKey);

  function handleLog(prayerKey: PrayerKey, status: "prayed" | "missed" | "late") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logPrayer(todayKey, prayerKey, status);
  }

  function handleCitySelect(city: City) {
    Haptics.selectionAsync();
    setManualCity(city);
    setShowCityPicker(false);
    setCityQuery("");
  }

  const filteredCities = searchCities(cityQuery);

  const s = styles(colors, topPad, bottomPad);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Location Header */}
        <TouchableOpacity style={s.locationRow} onPress={() => setShowCityPicker(true)} activeOpacity={0.7}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={s.locationText}>{location?.city ?? "Set Location"}{location?.country ? `, ${location.country}` : ""}</Text>
          <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={s.heading}>Prayer Times</Text>
        <Text style={s.dateText}>{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <View style={s.countdownCard}>
            <Text style={s.countdownLabel}>Next Prayer</Text>
            <View style={s.countdownRow}>
              <View>
                <Text style={s.nextPrayerName}>{nextPrayer.name}</Text>
                <Text style={s.nextPrayerAr}>{nextPrayer.nameArabic}</Text>
              </View>
              <View style={s.countdownRight}>
                <Text style={s.countdownTime}>{countdown}</Text>
                <Text style={s.countdownAt}>{formatTime(nextPrayer.time)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Prayer Times Table */}
        <View style={s.prayersCard}>
          {sunrise && (
            <View style={s.sunriseRow}>
              <Feather name="sunrise" size={15} color={colors.accent} />
              <Text style={s.sunriseLabel}>Sunrise</Text>
              <Text style={s.sunriseTime}>{formatTime(sunrise.time)}</Text>
            </View>
          )}

          {displayPrayers.map((entry, index) => {
            const isNext = nextPrayer?.key === entry.key;
            const isPast = entry.time < now && entry.key !== nextPrayer?.key;
            const pKey = entry.key as PrayerKey;
            const status = todayLog?.[pKey] ?? null;

            return (
              <View key={entry.key}>
                <View style={[s.prayerRow, isNext && s.prayerRowActive]}>
                  {isNext && <View style={s.activePulse} />}
                  <View style={s.prayerLeft}>
                    <Text style={[s.prayerName, isNext && s.prayerNameActive, isPast && s.prayerPast]}>
                      {entry.name}
                    </Text>
                    <Text style={s.prayerAr}>{entry.nameArabic}</Text>
                  </View>
                  <Text style={[s.prayerTime, isNext && s.prayerTimeActive, isPast && s.prayerPast]}>
                    {formatTime(entry.time)}
                  </Text>
                  <View style={s.logBtns}>
                    {(["prayed", "late", "missed"] as const).map(st => (
                      <TouchableOpacity
                        key={st}
                        style={[s.logBtn, status === st && { backgroundColor: STATUS_COLORS[st] }]}
                        onPress={() => handleLog(pKey, st)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Feather
                          name={st === "prayed" ? "check" : st === "late" ? "clock" : "x"}
                          size={11}
                          color={status === st ? "#fff" : colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {index < displayPrayers.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </View>

        {/* Quick Tools */}
        <View style={s.toolRow}>
          <TouchableOpacity style={s.toolCard} onPress={() => router.push("/qibla")} activeOpacity={0.8}>
            <View style={[s.toolIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="navigation" size={22} color={colors.primary} />
            </View>
            <Text style={s.toolLabel}>Qibla</Text>
            <Text style={s.toolSub}>Live compass</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolCard} onPress={() => router.push("/prayer-tracker")} activeOpacity={0.8}>
            <View style={[s.toolIcon, { backgroundColor: "#3F51B515" }]}>
              <Feather name="bar-chart-2" size={22} color="#3F51B5" />
            </View>
            <Text style={s.toolLabel}>Tracker</Text>
            <Text style={s.toolSub}>Prayer history</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.toolCard} onPress={() => requestLocation()} activeOpacity={0.8}>
            <View style={[s.toolIcon, { backgroundColor: "#22C55E15" }]}>
              <Feather name="crosshair" size={22} color="#22C55E" />
            </View>
            <Text style={s.toolLabel}>GPS</Text>
            <Text style={s.toolSub}>Auto-detect</Text>
          </TouchableOpacity>
        </View>

        {/* More Prayer Info */}
        <View style={s.extraCard}>
          <Text style={s.extraTitle}>Additional Times</Text>
          <View style={s.extraRow}>
            <Text style={s.extraLabel}>🌙 Midnight</Text>
            <Text style={s.extraValue}>{formatTime(prayerTimes.midnight)}</Text>
          </View>
          <View style={s.extraDivider} />
          <View style={s.extraRow}>
            <Text style={s.extraLabel}>⭐ Last Third</Text>
            <Text style={s.extraValue}>{formatTime(prayerTimes.lastThird)}</Text>
          </View>
        </View>

        <View style={{ height: 100 + bottomPad }} />
      </ScrollView>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCityPicker(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Choose City</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.gpsBtn}
            onPress={() => { requestLocation(); setShowCityPicker(false); }}
          >
            <Feather name="crosshair" size={18} color={colors.primary} />
            <Text style={s.gpsBtnText}>Use GPS (Auto-detect)</Text>
          </TouchableOpacity>

          <View style={s.searchBox}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={s.searchInput}
              placeholder="Search city..."
              placeholderTextColor={colors.mutedForeground}
              value={cityQuery}
              onChangeText={setCityQuery}
              autoFocus
            />
            {cityQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCityQuery("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={item => `${item.name}-${item.country}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.cityRow}
                onPress={() => handleCitySelect(item)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={s.cityName}>{item.name}</Text>
                  <Text style={s.cityCountry}>{item.country}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 8, paddingHorizontal: 16 },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      alignSelf: "flex-start",
    },
    locationText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary },
    heading: { fontFamily: "Inter_700Bold", fontSize: 28, color: colors.foreground, marginTop: 4 },
    dateText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginBottom: 16 },
    countdownCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 8,
    },
    countdownLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
    countdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    nextPrayerName: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff" },
    nextPrayerAr: { fontFamily: "Amiri_400Regular", fontSize: 18, color: "rgba(255,255,255,0.8)" },
    countdownRight: { alignItems: "flex-end" },
    countdownTime: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#fff" },
    countdownAt: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
    prayersCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    sunriseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.goldLight,
    },
    sunriseLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.accent, flex: 1 },
    sunriseTime: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.accent },
    prayerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      position: "relative",
    },
    prayerRowActive: { backgroundColor: colors.primary + "08" },
    activePulse: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    prayerLeft: { flex: 1 },
    prayerName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground },
    prayerNameActive: { color: colors.primary, fontFamily: "Inter_700Bold" },
    prayerPast: { color: colors.mutedForeground },
    prayerAr: { fontFamily: "Amiri_400Regular", fontSize: 14, color: colors.mutedForeground },
    prayerTime: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginRight: 10 },
    prayerTimeActive: { color: colors.primary },
    logBtns: { flexDirection: "row", gap: 4 },
    logBtn: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.muted, justifyContent: "center", alignItems: "center",
    },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    toolRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    toolCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    toolIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    toolLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground },
    toolSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
    extraCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    extraTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground, marginBottom: 12 },
    extraRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    extraLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground },
    extraValue: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    extraDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    // Modal
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      margin: 16,
      padding: 14,
      backgroundColor: colors.primary + "10",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    gpsBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.primary },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
    cityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    cityName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    cityCountry: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  });
