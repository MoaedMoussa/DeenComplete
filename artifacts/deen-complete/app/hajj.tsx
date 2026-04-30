import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const HAJJ_STEPS = [
  { step: 1, title: "Enter Ihram", location: "Miqat", description: "Make intention (Niyyah) and wear Ihram garments. Recite Talbiyah: Labbayk Allāhumma Labbayk..." },
  { step: 2, title: "Arrival in Makkah", location: "Masjid Al-Haram", description: "Perform Tawaf Al-Qudum (arrival Tawaf) — 7 circuits around the Kaaba counterclockwise." },
  { step: 3, title: "Sa'i Between Safa & Marwa", location: "Mas'a", description: "Walk 7 times between Safa and Marwa, starting at Safa and ending at Marwa." },
  { step: 4, title: "Day of Tarwiyah", location: "Mina", description: "Travel to Mina on 8 Dhul Hijjah. Pray Dhuhr, Asr, Maghrib, Isha, and Fajr there." },
  { step: 5, title: "Day of Arafah", location: "Arafah", description: "The most important pillar of Hajj. Stand at Arafah from Dhuhr until sunset. Make abundant dua." },
  { step: 6, title: "Night at Muzdalifah", location: "Muzdalifah", description: "After sunset, travel to Muzdalifah. Pray Maghrib and Isha combined. Collect 70 pebbles." },
  { step: 7, title: "Stoning of Jamarat", location: "Mina", description: "On 10 Dhul Hijjah, stone the large pillar (Jamarat Al-Aqaba) with 7 pebbles." },
  { step: 8, title: "Hady (Sacrifice)", location: "Mina", description: "Sacrifice an animal. The meat is distributed to the poor." },
  { step: 9, title: "Shaving/Cutting Hair", location: "Mina", description: "Men shave their heads or cut hair. Women cut a finger's length. This is partial Ihram release." },
  { step: 10, title: "Tawaf Al-Ifadah", location: "Masjid Al-Haram", description: "Perform the obligatory Tawaf Al-Ifadah — 7 circuits. This is a pillar of Hajj." },
  { step: 11, title: "Days of Tashreeq", location: "Mina", description: "Stay in Mina on 11, 12 (and optionally 13) Dhul Hijjah. Stone all three pillars each day." },
  { step: 12, title: "Tawaf Al-Wada", location: "Masjid Al-Haram", description: "The farewell Tawaf — obligatory before leaving Makkah. Final 7 circuits around the Kaaba." },
];

const UMRAH_STEPS = [
  { step: 1, title: "Enter Ihram at Miqat", location: "Miqat", description: "Make intention for Umrah, wear Ihram, and begin reciting Talbiyah." },
  { step: 2, title: "Arrival at Masjid Al-Haram", location: "Makkah", description: "Enter the Haram saying the dua for entering the mosque. Face the Kaaba." },
  { step: 3, title: "Tawaf", location: "Masjid Al-Haram", description: "Perform 7 circuits around the Kaaba counterclockwise, starting and ending at the Black Stone." },
  { step: 4, title: "Two Rakaat Prayer", location: "Maqam Ibrahim", description: "Pray 2 rakaat behind Maqam Ibrahim if possible, or anywhere in the mosque." },
  { step: 5, title: "Sa'i", location: "Mas'a", description: "Walk 7 times between Safa and Marwa. Start at Safa. End at Marwa." },
  { step: 6, title: "Halq or Taqsir", location: "Makkah", description: "Men shave the head or cut hair. Women cut a finger's length from their hair. Umrah is complete." },
];

export default function HajjScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeGuide, setActiveGuide] = useState<"hajj" | "umrah">("umrah");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [tawafCount, setTawafCount] = useState(0);
  const [saiCount, setSaiCount] = useState(0);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const steps = activeGuide === "hajj" ? HAJJ_STEPS : UMRAH_STEPS;
  const s = styles(colors, bottomPad);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.tabRow}>
        {(["umrah", "hajj"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeGuide === tab && s.tabActive]}
            onPress={() => setActiveGuide(tab)}
          >
            <Text style={[s.tabText, activeGuide === tab && s.tabTextActive]}>
              {tab === "umrah" ? "Umrah Guide" : "Hajj Guide"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Counters */}
      <View style={s.countersRow}>
        <View style={s.counterCard}>
          <Text style={s.counterTitle}>Tawaf</Text>
          <Text style={s.counterNum}>{tawafCount}/7</Text>
          <View style={s.counterBtns}>
            <TouchableOpacity style={s.counterBtn} onPress={() => setTawafCount(v => Math.max(0, v - 1))}>
              <Feather name="minus" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.counterBtn} onPress={() => setTawafCount(v => Math.min(7, v + 1))}>
              <Feather name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {tawafCount === 7 && (
            <View style={s.completeBadge}>
              <Feather name="check" size={12} color="#fff" />
              <Text style={s.completeText}>Done!</Text>
            </View>
          )}
        </View>
        <View style={s.counterCard}>
          <Text style={s.counterTitle}>Sa'i</Text>
          <Text style={s.counterNum}>{saiCount}/7</Text>
          <View style={s.counterBtns}>
            <TouchableOpacity style={s.counterBtn} onPress={() => setSaiCount(v => Math.max(0, v - 1))}>
              <Feather name="minus" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.counterBtn} onPress={() => setSaiCount(v => Math.min(7, v + 1))}>
              <Feather name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {saiCount === 7 && (
            <View style={s.completeBadge}>
              <Feather name="check" size={12} color="#fff" />
              <Text style={s.completeText}>Done!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Steps */}
      <Text style={s.guideTitle}>{activeGuide === "hajj" ? "Hajj" : "Umrah"} Steps</Text>
      {steps.map((step) => {
        const isExpanded = expandedStep === step.step;
        return (
          <TouchableOpacity
            key={step.step}
            style={s.stepCard}
            onPress={() => setExpandedStep(isExpanded ? null : step.step)}
            activeOpacity={0.85}
          >
            <View style={s.stepHeader}>
              <View style={s.stepNumberCircle}>
                <Text style={s.stepNumber}>{step.step}</Text>
              </View>
              <View style={s.stepLeft}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <View style={s.locationRow}>
                  <Feather name="map-pin" size={11} color={colors.accent} />
                  <Text style={s.stepLocation}>{step.location}</Text>
                </View>
              </View>
              <Feather
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            {isExpanded && (
              <Text style={s.stepDescription}>{step.description}</Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Duas Section */}
      <View style={s.duaSection}>
        <Text style={s.guideTitle}>Key Duas</Text>
        {[
          { label: "Talbiyah", arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ" },
          { label: "Dua at Arafah", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ" },
          { label: "Dua at Black Stone", arabic: "بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ" },
        ].map(dua => (
          <View key={dua.label} style={s.duaCard}>
            <Text style={s.duaLabel}>{dua.label}</Text>
            <Text style={s.duaArabic}>{dua.arabic}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    tabRow: {
      flexDirection: "row",
      marginBottom: 16,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground },
    tabTextActive: { fontFamily: "Inter_600SemiBold", color: colors.foreground },
    countersRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    counterCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    counterTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.mutedForeground, marginBottom: 4 },
    counterNum: { fontFamily: "Inter_700Bold", fontSize: 32, color: colors.primary, marginBottom: 8 },
    counterBtns: { flexDirection: "row", gap: 8 },
    counterBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    completeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
    },
    completeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
    guideTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 12 },
    stepCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    stepNumberCircle: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
    },
    stepNumber: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
    stepLeft: { flex: 1 },
    stepTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    stepLocation: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.accent },
    stepDescription: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    duaSection: { marginTop: 8 },
    duaCard: {
      backgroundColor: colors.goldLight,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    duaLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.accent, marginBottom: 8 },
    duaArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: colors.primary,
      textAlign: "right",
      lineHeight: 32,
    },
  });
