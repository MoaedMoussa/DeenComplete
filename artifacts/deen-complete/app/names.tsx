import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { namesOfAllah, NameOfAllah } from "@/data/names";

export default function NamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dhikrCounts, incrementDhikr } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NameOfAllah | null>(null);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    if (!search) return namesOfAllah;
    const q = search.toLowerCase();
    return namesOfAllah.filter(n =>
      n.transliteration.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.arabic.includes(q)
    );
  }, [search]);

  const s = styles(colors, bottomPad);

  function renderName({ item }: { item: NameOfAllah }) {
    const count = dhikrCounts[`name-${item.number}`] || 0;
    return (
      <TouchableOpacity
        style={s.nameCard}
        onPress={() => setSelected(item)}
        activeOpacity={0.8}
      >
        <View style={s.nameLeft}>
          <View style={s.numberCircle}>
            <Text style={s.nameNumber}>{item.number}</Text>
          </View>
          <View>
            <Text style={s.nameArabic}>{item.arabic}</Text>
            <Text style={s.nameTrans}>{item.transliteration}</Text>
            <Text style={s.nameMeaning}>{item.meaning}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.countBtn, count > 0 && s.countBtnActive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); incrementDhikr(`name-${item.number}`); }}
        >
          <Text style={[s.countNum, count > 0 && s.countNumActive]}>{count}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        <Text style={s.titleAr}>أَسْمَاءُ اللَّهِ الْحُسْنَى</Text>
        <Text style={s.titleEn}>99 Beautiful Names of Allah</Text>
      </View>

      <View style={s.searchBox}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or meaning..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        renderItem={renderName}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 + bottomPad, gap: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Name Detail Modal */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
            {selected && (
              <>
                <View style={s.modalNumberCircle}>
                  <Text style={s.modalNumber}>{selected.number}</Text>
                </View>
                <Text style={s.modalArabic}>{selected.arabic}</Text>
                <Text style={s.modalTrans}>{selected.transliteration}</Text>
                <Text style={s.modalMeaning}>{selected.meaning}</Text>
                {selected.description && (
                  <Text style={s.modalDesc}>{selected.description}</Text>
                )}
                {selected.quranRef && (
                  <View style={s.modalRef}>
                    <Feather name="book-open" size={14} color={colors.accent} />
                    <Text style={s.modalRefText}>Quran {selected.quranRef}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={s.modalCountBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    incrementDhikr(`name-${selected.number}`);
                  }}
                >
                  <Text style={s.modalCountBtnText}>
                    Recite • {dhikrCounts[`name-${selected.number}`] || 0} times
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    titleRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleAr: { fontFamily: "Amiri_700Bold", fontSize: 20, color: colors.primary, textAlign: "center" },
    titleEn: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
    nameCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nameLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
    numberCircle: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.primary + "15",
      justifyContent: "center", alignItems: "center",
    },
    nameNumber: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    nameArabic: { fontFamily: "Amiri_700Bold", fontSize: 20, color: colors.primary },
    nameTrans: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground },
    nameMeaning: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    countBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.muted,
      justifyContent: "center", alignItems: "center",
    },
    countBtnActive: { backgroundColor: colors.primary + "20" },
    countNum: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.mutedForeground },
    countNumActive: { color: colors.primary },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 28,
      alignItems: "center",
      gap: 8,
      minHeight: 400,
    },
    modalClose: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.muted, justifyContent: "center", alignItems: "center",
    },
    modalNumberCircle: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.primary + "15",
      justifyContent: "center", alignItems: "center",
      marginTop: 16, marginBottom: 8,
    },
    modalNumber: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.primary },
    modalArabic: { fontFamily: "Amiri_700Bold", fontSize: 36, color: colors.primary, textAlign: "center" },
    modalTrans: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    modalMeaning: { fontFamily: "Inter_500Medium", fontSize: 16, color: colors.mutedForeground, textAlign: "center" },
    modalDesc: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    modalRef: { flexDirection: "row", alignItems: "center", gap: 6 },
    modalRefText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.accent },
    modalCountBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      marginTop: 10,
    },
    modalCountBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  });
