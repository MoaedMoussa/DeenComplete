import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { dhikrSets, quickDhikr, DhikrItem } from "@/data/dhikr";

export default function DhikrScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dhikrCounts, incrementDhikr, resetDhikr } = useApp();
  const [activeTab, setActiveTab] = useState<"tasbih" | "sets" | "names">("tasbih");
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeDhikrIdx, setActiveDhikrIdx] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(33);
  const [selectedQuickDhikr, setSelectedQuickDhikr] = useState(quickDhikr[0]);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  function handleTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = tapCount + 1;
    setTapCount(next);
    incrementDhikr(selectedQuickDhikr.id);
    if (next >= currentTarget) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleReset() {
    Haptics.selectionAsync();
    setTapCount(0);
    resetDhikr(selectedQuickDhikr.id);
  }

  const s = styles(colors, topPad, bottomPad);
  const progress = Math.min(tapCount / currentTarget, 1);
  const circumference = 2 * Math.PI * 100;
  const completed = Math.floor(tapCount / currentTarget);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Dhikr</Text>
        <Text style={s.titleArabic}>الذكر</Text>
      </View>

      <View style={s.tabRow}>
        {(["tasbih", "sets", "names"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === "tasbih" ? "Tasbih" : tab === "sets" ? "Dhikr Sets" : "99 Names"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "tasbih" && (
        <ScrollView contentContainerStyle={s.tasbihContainer} showsVerticalScrollIndicator={false}>
          {/* Dhikr selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dhikrSelector} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {quickDhikr.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[s.dhikrChip, selectedQuickDhikr.id === d.id && s.dhikrChipActive]}
                onPress={() => {
                  setSelectedQuickDhikr(d);
                  setCurrentTarget(d.count);
                  setTapCount(0);
                }}
              >
                <Text style={[s.dhikrChipText, selectedQuickDhikr.id === d.id && s.dhikrChipTextActive]}>
                  {d.transliteration}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.currentArabic}>{selectedQuickDhikr.arabic}</Text>
          <Text style={s.currentTrans}>{selectedQuickDhikr.transliteration}</Text>
          <Text style={s.currentMeaning}>{selectedQuickDhikr.translation}</Text>

          {/* Counter */}
          <View style={s.counterWrapper}>
            <View style={s.counterCircle}>
              <Text style={s.counterNum}>{tapCount % (currentTarget || 1) === 0 && tapCount > 0 ? currentTarget : tapCount % (currentTarget || 1)}</Text>
              <Text style={s.counterTarget}>of {currentTarget}</Text>
              {completed > 0 && <Text style={s.completedBadge}>×{completed}</Text>}
            </View>
          </View>

          {/* Tap button */}
          <TouchableOpacity
            style={s.tapButton}
            onPress={handleTap}
            activeOpacity={0.85}
          >
            <Text style={s.tapButtonText}>{selectedQuickDhikr.arabic}</Text>
            <Text style={s.tapLabel}>Tap to count</Text>
          </TouchableOpacity>

          <View style={s.countActions}>
            <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
              <Feather name="rotate-ccw" size={16} color={colors.mutedForeground} />
              <Text style={s.resetText}>Reset</Text>
            </TouchableOpacity>
            <View style={s.targetRow}>
              {[33, 100, 1000].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.targetBtn, currentTarget === t && s.targetBtnActive]}
                  onPress={() => setCurrentTarget(t)}
                >
                  <Text style={[s.targetText, currentTarget === t && s.targetTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ height: 120 + bottomPad }} />
        </ScrollView>
      )}

      {activeTab === "sets" && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + bottomPad }} showsVerticalScrollIndicator={false}>
          {dhikrSets.map(set => (
            <TouchableOpacity
              key={set.id}
              style={[s.setCard, activeSetId === set.id && s.setCardActive]}
              onPress={() => setActiveSetId(activeSetId === set.id ? null : set.id)}
              activeOpacity={0.85}
            >
              <View style={s.setHeader}>
                <View>
                  <Text style={s.setName}>{set.name}</Text>
                  <Text style={s.setNameAr}>{set.nameArabic}</Text>
                  <Text style={s.setDesc}>{set.description}</Text>
                </View>
                <Feather
                  name={activeSetId === set.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              {activeSetId === set.id && (
                <View style={s.setItems}>
                  {set.items.map((item, idx) => {
                    const count = dhikrCounts[`${set.id}-${item.id}`] || 0;
                    return (
                      <View key={item.id} style={s.setItem}>
                        <View style={s.setItemLeft}>
                          <Text style={s.setItemArabic}>{item.arabic}</Text>
                          <Text style={s.setItemTrans}>{item.transliteration}</Text>
                          <Text style={s.setItemMeaning}>{item.translation} (×{item.count})</Text>
                          {item.virtue && <Text style={s.setItemVirtue}>{item.virtue}</Text>}
                        </View>
                        <TouchableOpacity
                          style={[s.setCountBtn, count >= item.count && s.setCountBtnDone]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (count < item.count) incrementDhikr(`${set.id}-${item.id}`);
                          }}
                        >
                          <Text style={s.setCount}>{Math.min(count, item.count)}</Text>
                          <Text style={s.setCountOf}>/{item.count}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {activeTab === "names" && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + bottomPad }} showsVerticalScrollIndicator={false}>
          <Text style={s.namesIntro}>الْأَسْمَاءُ الْحُسْنَى</Text>
          <Text style={s.namesIntroSub}>The 99 Beautiful Names of Allah</Text>
          {Array.from({ length: 9 }, (_, row) =>
            <View key={row} style={s.namesRow}>
              {Array.from({ length: 3 }, (_, col) => {
                const n = row * 3 + col + 1;
                if (n > 99) return null;
                return (
                  <TouchableOpacity
                    key={n}
                    style={s.nameCard}
                    onPress={() => {
                      Haptics.selectionAsync();
                      incrementDhikr(`name-${n}`);
                    }}
                  >
                    <Text style={s.nameNumber}>{n}</Text>
                    <Text style={s.nameCount}>{dhikrCounts[`name-${n}`] || 0}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: colors.foreground,
    },
    titleArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 20,
      color: colors.accent,
      marginTop: 2,
    },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tab: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    tabTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    tasbihContainer: { paddingHorizontal: 16, alignItems: "center" },
    dhikrSelector: { width: "100%", marginBottom: 16 },
    dhikrChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: colors.card, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border,
    },
    dhikrChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dhikrChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.foreground },
    dhikrChipTextActive: { color: "#fff" },
    currentArabic: {
      fontFamily: "Amiri_700Bold",
      fontSize: 28,
      color: colors.primary,
      textAlign: "center",
      marginBottom: 4,
    },
    currentTrans: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 4,
    },
    currentMeaning: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 20,
    },
    counterWrapper: { marginBottom: 20 },
    counterCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 6,
      borderColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "10",
    },
    counterNum: {
      fontFamily: "Inter_700Bold",
      fontSize: 52,
      color: colors.primary,
    },
    counterTarget: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.mutedForeground,
    },
    completedBadge: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: colors.accent,
    },
    tapButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingVertical: 20,
      paddingHorizontal: 40,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
      marginBottom: 20,
      minWidth: 220,
    },
    tapButtonText: {
      fontFamily: "Amiri_700Bold",
      fontSize: 24,
      color: "#fff",
      marginBottom: 4,
    },
    tapLabel: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
    },
    countActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 20,
    },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
    },
    resetText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    targetRow: { flexDirection: "row", gap: 8 },
    targetBtn: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.muted,
    },
    targetBtnActive: { backgroundColor: colors.primary },
    targetText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.mutedForeground },
    targetTextActive: { color: "#fff" },
    setCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    setCardActive: { borderColor: colors.primary },
    setHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    setName: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground },
    setNameAr: { fontFamily: "Amiri_400Regular", fontSize: 16, color: colors.accent },
    setDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    setItems: { borderTopWidth: 1, borderTopColor: colors.border },
    setItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    setItemLeft: { flex: 1, marginRight: 10 },
    setItemArabic: { fontFamily: "Amiri_400Regular", fontSize: 18, color: colors.primary, marginBottom: 2 },
    setItemTrans: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
    setItemMeaning: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground },
    setItemVirtue: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.accent, marginTop: 2, fontStyle: "italic" },
    setCountBtn: {
      flexDirection: "row",
      alignItems: "baseline",
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    setCountBtnDone: { backgroundColor: colors.primary },
    setCount: { fontFamily: "Inter_700Bold", fontSize: 18, color: colors.primary },
    setCountOf: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    namesIntro: {
      fontFamily: "Amiri_700Bold",
      fontSize: 28,
      color: colors.primary,
      textAlign: "center",
      marginBottom: 4,
    },
    namesIntroSub: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      marginBottom: 16,
    },
    namesRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    nameCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    nameNumber: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.primary },
    nameCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  });
