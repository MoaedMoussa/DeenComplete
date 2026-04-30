import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList, verses, Verse } from "@/data/quran";

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, bookmarkedSurahs, toggleBookmarkSurah } = useApp();
  const [showTranslit, setShowTranslit] = useState(settings.showTransliteration);
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [fontSize, setFontSize] = useState(settings.arabicFontSize);

  const id = parseInt(surahId ?? "1", 10);
  const surah = allSurahsList.find(s => s.id === id);
  const surahVerses: Verse[] = verses[id] ?? Array.from({ length: surah?.totalVerses ?? 10 }, (_, i) => ({
    surahId: id,
    verseNumber: i + 1,
    arabic: `آيَة ${i + 1}`,
    transliteration: `Verse ${i + 1}`,
    translation: `Translation not available for verse ${i + 1} of Surah ${id}.`,
  }));

  const isBookmarked = bookmarkedSurahs.includes(id);
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  async function shareVerse(v: Verse) {
    try {
      await Share.share({
        message: `${v.arabic}\n\n"${v.translation}"\n\n— Quran ${id}:${v.verseNumber}`,
      });
    } catch {}
  }

  const s = styles(colors, fontSize, bottomPad);

  function renderVerse({ item }: { item: Verse }) {
    return (
      <View style={s.verseContainer}>
        <View style={s.verseHeader}>
          <View style={s.verseNumberBadge}>
            <Text style={s.verseNumberText}>{item.verseNumber}</Text>
          </View>
          <TouchableOpacity
            onPress={() => shareVerse(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={s.arabicText}>{item.arabic}</Text>
        {showTranslit && item.transliteration && (
          <Text style={s.translitText}>{item.transliteration}</Text>
        )}
        {showTranslation && item.translation && (
          <Text style={s.translationText}>{item.translation}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: surah?.name ?? `Surah ${id}`,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, marginRight: 4 }}>
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); toggleBookmarkSurah(id); }}>
                <Feather name="bookmark" size={20} color={isBookmarked ? colors.accent : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity style={[s.controlBtn, showTranslit && s.controlBtnActive]} onPress={() => setShowTranslit(v => !v)}>
          <Text style={[s.controlText, showTranslit && s.controlTextActive]}>Latin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.controlBtn, showTranslation && s.controlBtnActive]} onPress={() => setShowTranslation(v => !v)}>
          <Text style={[s.controlText, showTranslation && s.controlTextActive]}>Translation</Text>
        </TouchableOpacity>
        <View style={s.fontControls}>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.max(18, v - 2))}>
            <Feather name="minus" size={14} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.fontSizeLabel}>Aa</Text>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.min(38, v + 2))}>
            <Feather name="plus" size={14} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Surah header */}
      <View style={s.surahHeader}>
        <Text style={s.surahName}>{surah?.name}</Text>
        <Text style={s.surahNameAr}>{surah?.nameArabic}</Text>
        <Text style={s.surahMeta}>{surah?.nameTranslation} • {surah?.totalVerses} Verses • {surah?.revelationType}</Text>
        <Text style={s.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      </View>

      <FlatList
        data={surahVerses}
        keyExtractor={v => String(v.verseNumber)}
        renderItem={renderVerse}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={s.verseDivider} />}
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, fontSize: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
      backgroundColor: colors.card,
    },
    controlBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.muted,
    },
    controlBtnActive: { backgroundColor: colors.primary },
    controlText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    controlTextActive: { color: "#fff" },
    fontControls: { flexDirection: "row", alignItems: "center", marginLeft: "auto", gap: 4 },
    fontBtn: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.muted, justifyContent: "center", alignItems: "center",
    },
    fontSizeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground, paddingHorizontal: 4 },
    surahHeader: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 16,
      backgroundColor: colors.primary + "08",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    surahName: { fontFamily: "Inter_700Bold", fontSize: 22, color: colors.primary },
    surahNameAr: { fontFamily: "Amiri_700Bold", fontSize: 26, color: colors.primary, marginTop: 4 },
    surahMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
    bismillah: {
      fontFamily: "Amiri_400Regular",
      fontSize: 20,
      color: colors.accent,
      marginTop: 14,
      textAlign: "center",
    },
    verseContainer: { paddingVertical: 16 },
    verseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    verseNumberBadge: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    verseNumberText: { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.primary },
    arabicText: {
      fontFamily: "Amiri_400Regular",
      fontSize: fontSize,
      color: colors.foreground,
      textAlign: "right",
      lineHeight: fontSize * 1.8,
      marginBottom: 10,
    },
    translitText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 22,
      marginBottom: 8,
      fontStyle: "italic",
    },
    translationText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
    },
    verseDivider: { height: 1, backgroundColor: colors.border },
  });
