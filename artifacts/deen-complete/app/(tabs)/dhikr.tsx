import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, withSpring, useSharedValue } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { dhikrSets, quickDhikr } from "@/data/dhikr";

// ── Animated SVG ring ──────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 200;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DhikrProgressRing({
  progress, displayCount, target, cycle,
  primaryColor, borderColor, mutedForeground, accentColor,
}: {
  progress: number; displayCount: number; target: number; cycle: number;
  primaryColor: string; borderColor: string; mutedForeground: string; accentColor: string;
}) {
  const progressAnim = useSharedValue(progress);

  useEffect(() => {
    progressAnim.value = withSpring(progress, { damping: 18, stiffness: 55 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progressAnim.value))),
  }));

  return (
    <View style={styles.counterWrap}>
      {/* SVG ring rotated so arc starts at 12 o'clock */}
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={borderColor} strokeWidth={STROKE} fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={primaryColor} strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {/* Centre labels — absolute, unaffected by SVG rotation */}
      <View style={styles.ringCenter}>
        <Text style={[styles.counterNum, { color: primaryColor }]}>{displayCount}</Text>
        <Text style={[styles.counterOf, { color: mutedForeground }]}>of {target}</Text>
        {cycle > 0 && (
          <View style={[styles.cycleBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.cycleTxt}>×{cycle}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

type Tab = "tasbih" | "sets" | "names";
const NAMES_DATA = [
  { n: 1, ar: "ٱللَّهُ", en: "Allah", mean: "The One God" },
  { n: 2, ar: "ٱلرَّحْمَـٰنُ", en: "Ar-Rahman", mean: "The Most Gracious" },
  { n: 3, ar: "ٱلرَّحِيمُ", en: "Ar-Rahim", mean: "The Most Merciful" },
  { n: 4, ar: "ٱلْمَلِكُ", en: "Al-Malik", mean: "The King" },
  { n: 5, ar: "ٱلْقُدُّوسُ", en: "Al-Quddus", mean: "The Most Sacred" },
  { n: 6, ar: "ٱلسَّلَامُ", en: "As-Salam", mean: "The Source of Peace" },
  { n: 7, ar: "ٱلْمُؤْمِنُ", en: "Al-Mu'min", mean: "The Guardian of Faith" },
  { n: 8, ar: "ٱلْمُهَيْمِنُ", en: "Al-Muhaymin", mean: "The Protector" },
  { n: 9, ar: "ٱلْعَزِيزُ", en: "Al-Aziz", mean: "The Almighty" },
  { n: 10, ar: "ٱلْجَبَّارُ", en: "Al-Jabbar", mean: "The Compeller" },
  { n: 11, ar: "ٱلْمُتَكَبِّرُ", en: "Al-Mutakabbir", mean: "The Dominant" },
  { n: 12, ar: "ٱلْخَالِقُ", en: "Al-Khaliq", mean: "The Creator" },
];

export default function DhikrScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dhikrCounts, incrementDhikr, resetDhikr } = useApp();
  const [tab, setTab] = useState<Tab>("tasbih");
  const [selected, setSelected] = useState(quickDhikr[0]);
  const [target, setTarget] = useState(33);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const progress = Math.min(count / target, 1);
  const cycle = Math.floor(count / target);
  const displayCount = count === 0 ? 0 : count % target === 0 ? target : count % target;

  function tap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = count + 1;
    setCount(next);
    incrementDhikr(selected.id);
    if (next % target === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function reset() {
    Haptics.selectionAsync();
    setCount(0);
    resetDhikr(selected.id);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 18 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Dhikr</Text>
          <Text style={[styles.titleAr, { color: colors.accent, fontFamily: "Amiri_400Regular" }]}>الذكر</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/names")} style={[styles.namesBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.namesBtnTxt, { color: colors.primary }]}>99 Names</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
        {(["tasbih", "sets", "names"] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, t === tab && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTxt, { color: t === tab ? colors.foreground : colors.mutedForeground },
              t === tab && { fontFamily: "Inter_700Bold" }]}>
              {t === "tasbih" ? "Tasbih" : t === "sets" ? "Dhikr Sets" : "Quick Names"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TASBIH ── */}
      {tab === "tasbih" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tasbihScroll}>
          {/* Dhikr selector chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {quickDhikr.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip,
                  { backgroundColor: selected.id === d.id ? colors.primary : colors.card, borderColor: selected.id === d.id ? colors.primary : colors.border }
                ]}
                onPress={() => { setSelected(d); setTarget(d.count); setCount(0); }}
              >
                <Text style={[styles.chipTxt, { color: selected.id === d.id ? "#fff" : colors.foreground }]}>
                  {d.transliteration}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected dhikr display */}
          <Text style={[styles.dhikrAr, { color: colors.primary, fontFamily: "Amiri_700Bold" }]}>
            {selected.arabic}
          </Text>
          <Text style={[styles.dhikrTrans, { color: colors.mutedForeground }]}>{selected.transliteration}</Text>
          <Text style={[styles.dhikrMean, { color: colors.foreground }]}>{selected.translation}</Text>

          {/* ── ANIMATED PROGRESS RING ── */}
          <DhikrProgressRing
            progress={progress}
            displayCount={displayCount}
            target={target}
            cycle={cycle}
            primaryColor={colors.primary}
            borderColor={colors.border}
            mutedForeground={colors.mutedForeground}
            accentColor={colors.accent}
          />

          {/* Tap button */}
          <TouchableOpacity
            style={[styles.tapBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={tap}
            activeOpacity={0.88}
          >
            <Text style={[styles.tapBtnAr, { fontFamily: "Amiri_700Bold" }]}>{selected.arabic}</Text>
            <Text style={styles.tapBtnLabel}>Tap to count</Text>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Feather name="rotate-ccw" size={15} color={colors.mutedForeground} />
              <Text style={[styles.resetTxt, { color: colors.mutedForeground }]}>Reset</Text>
            </TouchableOpacity>
            <View style={styles.targetRow}>
              {[33, 100, 1000].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.targetBtn, { backgroundColor: target === t ? colors.primary : colors.muted }]}
                  onPress={() => setTarget(t)}
                >
                  <Text style={[styles.targetTxt, { color: target === t ? "#fff" : colors.mutedForeground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── DHIKR SETS ── */}
      {tab === "sets" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {dhikrSets.map(set => (
            <View key={set.id} style={[styles.setCard, { backgroundColor: colors.card, borderColor: expanded === set.id ? colors.primary : colors.border }]}>
              <TouchableOpacity
                style={styles.setCardHdr}
                onPress={() => setExpanded(expanded === set.id ? null : set.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.setName, { color: colors.foreground }]}>{set.name}</Text>
                  <Text style={[styles.setNameAr, { color: colors.accent, fontFamily: "Amiri_400Regular" }]}>{set.nameArabic}</Text>
                  <Text style={[styles.setDesc, { color: colors.mutedForeground }]}>{set.description}</Text>
                </View>
                <Feather name={expanded === set.id ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              {expanded === set.id && (
                <View style={[styles.setItems, { borderTopColor: colors.border }]}>
                  {set.items.map(item => {
                    const c = dhikrCounts[`${set.id}-${item.id}`] ?? 0;
                    const done = c >= item.count;
                    return (
                      <View key={item.id} style={[styles.setItem, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={[styles.setItemAr, { color: colors.primary, fontFamily: "Amiri_400Regular" }]}>{item.arabic}</Text>
                          <Text style={[styles.setItemTrans, { color: colors.mutedForeground }]}>{item.transliteration}</Text>
                          <Text style={[styles.setItemMean, { color: colors.foreground }]}>{item.translation} · ×{item.count}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.setItemBtn, { backgroundColor: done ? colors.primary : colors.primary + "15" }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (!done) incrementDhikr(`${set.id}-${item.id}`);
                          }}
                        >
                          <Text style={[styles.setItemCount, { color: done ? "#fff" : colors.primary }]}>
                            {Math.min(c, item.count)}
                          </Text>
                          <Text style={[styles.setItemOf, { color: done ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                            /{item.count}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── QUICK NAMES ── */}
      {tab === "names" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Text style={[styles.namesIntro, { color: colors.primary, fontFamily: "Amiri_700Bold" }]}>
            أَسْمَاءُ اللَّهِ الْحُسْنَى
          </Text>
          <Text style={[styles.namesIntroSub, { color: colors.mutedForeground }]}>
            Tap a name to count your recitation
          </Text>
          <View style={styles.namesGrid}>
            {NAMES_DATA.map(n => {
              const c = dhikrCounts[`name-${n.n}`] ?? 0;
              return (
                <TouchableOpacity
                  key={n.n}
                  style={[styles.nameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); incrementDhikr(`name-${n.n}`); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.nameNum, { color: colors.mutedForeground }]}>{n.n}</Text>
                  <Text style={[styles.nameAr, { color: colors.primary, fontFamily: "Amiri_400Regular" }]}>{n.ar}</Text>
                  <Text style={[styles.nameEn, { color: colors.foreground }]}>{n.en}</Text>
                  <Text style={[styles.nameMean, { color: colors.mutedForeground }]}>{n.mean}</Text>
                  {c > 0 && <View style={[styles.nameCount, { backgroundColor: colors.primary }]}><Text style={styles.nameCountTxt}>{c}</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.viewAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/names")}
          >
            <Text style={styles.viewAllTxt}>View All 99 Names</Text>
            <Feather name="chevron-right" size={16} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  titleAr: { fontSize: 20, marginTop: 2 },
  namesBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  namesBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
  tasbihScroll: { paddingHorizontal: 16, alignItems: "center", paddingBottom: 120 },
  chipRow: { gap: 8, paddingRight: 4, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  dhikrAr: { fontSize: 32, textAlign: "center", marginBottom: 4 },
  dhikrTrans: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginBottom: 4 },
  dhikrMean: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 24 },
  counterWrap: { marginBottom: 28, width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  counterNum: { fontFamily: "Inter_700Bold", fontSize: 58 },
  counterOf: { fontFamily: "Inter_400Regular", fontSize: 13 },
  cycleBadge: { position: "absolute", top: 10, right: 10, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  cycleTxt: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  tapBtn: { borderRadius: 28, paddingVertical: 22, paddingHorizontal: 48, alignItems: "center", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 24, minWidth: 240 },
  tapBtnAr: { fontSize: 26, color: "#fff", marginBottom: 4 },
  tapBtnLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  controls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10 },
  resetTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  targetRow: { flexDirection: "row", gap: 8 },
  targetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  targetTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  setCard: { borderRadius: 16, marginBottom: 10, borderWidth: 1, overflow: "hidden" },
  setCardHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  setName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  setNameAr: { fontSize: 16, marginTop: 2 },
  setDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  setItems: { borderTopWidth: 1 },
  setItem: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  setItemAr: { fontSize: 18, marginBottom: 2 },
  setItemTrans: { fontFamily: "Inter_500Medium", fontSize: 12 },
  setItemMean: { fontFamily: "Inter_400Regular", fontSize: 12 },
  setItemBtn: { flexDirection: "row", alignItems: "baseline", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  setItemCount: { fontFamily: "Inter_700Bold", fontSize: 18 },
  setItemOf: { fontFamily: "Inter_400Regular", fontSize: 12 },
  namesIntro: { fontSize: 28, textAlign: "center", marginBottom: 4 },
  namesIntroSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 16 },
  namesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nameCard: { width: "30%", flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 2, position: "relative" },
  nameNum: { fontFamily: "Inter_400Regular", fontSize: 10, alignSelf: "flex-start" },
  nameAr: { fontSize: 20, textAlign: "center", marginBottom: 2 },
  nameEn: { fontFamily: "Inter_700Bold", fontSize: 11, textAlign: "center" },
  nameMean: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  nameCount: { position: "absolute", top: 6, right: 6, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  nameCountTxt: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  viewAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, padding: 16, marginTop: 16 },
  viewAllTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
