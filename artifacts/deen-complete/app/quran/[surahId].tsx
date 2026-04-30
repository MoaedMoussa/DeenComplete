import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, Share, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList } from "@/data/quran";

interface ApiVerse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

interface ApiTranslation {
  number: number;
  text: string;
  numberInSurah: number;
}

interface FetchedVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
  juz: number;
  page: number;
  sajda: boolean;
}

const QURAN_API = "https://api.alquran.cloud/v1";
const CACHE_PREFIX = "quran_surah_";

async function fetchSurahVerses(surahId: number, edition: string): Promise<FetchedVerse[]> {
  const cacheKey = `${CACHE_PREFIX}${surahId}_${edition}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const [arabicRes, transRes] = await Promise.all([
    fetch(`${QURAN_API}/surah/${surahId}`),
    fetch(`${QURAN_API}/surah/${surahId}/${edition}`),
  ]);

  const [arabicData, transData] = await Promise.all([arabicRes.json(), transRes.json()]);

  if (arabicData.code !== 200 || transData.code !== 200) {
    throw new Error("API error");
  }

  const arabicVerses: ApiVerse[] = arabicData.data.ayahs;
  const transVerses: ApiTranslation[] = transData.data.ayahs;

  const verses: FetchedVerse[] = arabicVerses.map((av, i) => ({
    numberInSurah: av.numberInSurah,
    arabic: av.text,
    translation: transVerses[i]?.text ?? "",
    juz: av.juz,
    page: av.page,
    sajda: av.sajda,
  }));

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(verses));
  } catch {}

  return verses;
}

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, bookmarkedSurahs, toggleBookmarkSurah } = useApp();

  const [verses, setVerses] = useState<FetchedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(settings.arabicFontSize);
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [edition, setEdition] = useState(settings.translationEdition || "en.sahih");

  const id = parseInt(surahId ?? "1", 10);
  const surah = allSurahsList.find(s => s.id === id);
  const isBookmarked = bookmarkedSurahs.includes(id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const EDITIONS = [
    { id: "en.sahih", label: "Sahih International" },
    { id: "en.pickthall", label: "Pickthall" },
    { id: "en.yusufali", label: "Yusuf Ali" },
    { id: "en.asad", label: "Muhammad Asad" },
    { id: "fr.hamidullah", label: "French (Hamidullah)" },
    { id: "de.aburida", label: "German (Abu Rida)" },
    { id: "es.cortes", label: "Spanish (Cortes)" },
    { id: "tr.diyanet", label: "Turkish (Diyanet)" },
    { id: "ur.ahmedali", label: "Urdu (Ahmed Ali)" },
    { id: "bn.bengali", label: "Bengali" },
    { id: "id.indonesian", label: "Indonesian" },
    { id: "ms.basmeih", label: "Malay" },
  ];

  const loadVerses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSurahVerses(id, edition);
      setVerses(data);
    } catch {
      setError("Failed to load. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [id, edition]);

  useEffect(() => { loadVerses(); }, [loadVerses]);

  async function shareVerse(v: FetchedVerse) {
    try {
      await Share.share({
        message: `${v.arabic}\n\n"${v.translation}"\n\n— Quran ${id}:${v.numberInSurah}`,
      });
    } catch {}
  }

  const s = styles(colors, fontSize, bottomPad);

  function renderVerse({ item }: { item: FetchedVerse }) {
    return (
      <View style={s.verseContainer}>
        <View style={s.verseHeader}>
          <View style={s.verseNumberBadge}>
            <Text style={s.verseNumber}>{item.numberInSurah}</Text>
          </View>
          <View style={s.verseMeta}>
            <Text style={s.verseJuz}>Juz {item.juz} • Page {item.page}</Text>
            {item.sajda && (
              <View style={s.sajdaBadge}>
                <Text style={s.sajdaText}>Sajda</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => shareVerse(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={s.arabicText}>{item.arabic}</Text>
        {showTranslation && item.translation ? (
          <Text style={s.translationText}>{item.translation}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: surah?.name ?? `Surah ${id}`,
          headerBackTitle: "Quran",
          headerRight: () => (
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); toggleBookmarkSurah(id); }}>
              <Feather
                name="bookmark"
                size={20}
                color={isBookmarked ? colors.accent : colors.mutedForeground}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity
          style={[s.controlBtn, showTranslation && s.controlBtnOn]}
          onPress={() => setShowTranslation(v => !v)}
        >
          <Text style={[s.controlText, showTranslation && s.controlTextOn]}>Translation</Text>
        </TouchableOpacity>

        <View style={s.fontControls}>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.max(16, v - 2))}>
            <Feather name="minus" size={14} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.fontLabel}>Aa</Text>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.min(42, v + 2))}>
            <Feather name="plus" size={14} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edition selector */}
      <FlatList
        horizontal
        data={EDITIONS}
        keyExtractor={e => e.id}
        showsHorizontalScrollIndicator={false}
        style={s.editionList}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.editionChip, edition === item.id && s.editionChipOn]}
            onPress={() => setEdition(item.id)}
          >
            <Text style={[s.editionText, edition === item.id && s.editionTextOn]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Surah Header */}
      <View style={s.surahHeader}>
        <Text style={s.surahName}>{surah?.name}</Text>
        <Text style={s.surahArabic}>{surah?.nameArabic}</Text>
        <Text style={s.surahMeta}>{surah?.nameTranslation} • {surah?.totalVerses} Verses • {surah?.revelationType}</Text>
        {id !== 1 && id !== 9 && (
          <Text style={s.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading {surah?.name}...</Text>
          <Text style={s.loadingSubText}>Fetching {surah?.totalVerses} verses</Text>
        </View>
      ) : error ? (
        <View style={s.errorContainer}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadVerses}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={v => String(v.numberInSurah)}
          renderItem={renderVerse}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 + bottomPad }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.verseDivider} />}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, fontSize: number, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    controlBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 8, backgroundColor: colors.muted,
    },
    controlBtnOn: { backgroundColor: colors.primary },
    controlText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    controlTextOn: { color: "#fff" },
    fontControls: { flexDirection: "row", alignItems: "center", marginLeft: "auto", gap: 6 },
    fontBtn: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.muted, justifyContent: "center", alignItems: "center",
    },
    fontLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground },
    editionList: { maxHeight: 42, borderBottomWidth: 1, borderBottomColor: colors.border },
    editionChip: {
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 8, backgroundColor: colors.muted,
      alignSelf: "center",
    },
    editionChipOn: { backgroundColor: colors.primary + "20", borderWidth: 1, borderColor: colors.primary },
    editionText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    editionTextOn: { color: colors.primary, fontFamily: "Inter_600SemiBold" },
    surahHeader: {
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.primary + "08",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    surahName: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.primary },
    surahArabic: { fontFamily: "Amiri_700Bold", fontSize: 28, color: colors.primary, marginTop: 4 },
    surahMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
    bismillah: { fontFamily: "Amiri_400Regular", fontSize: 20, color: colors.accent, marginTop: 12, textAlign: "center" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    loadingText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground },
    loadingSubText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    errorText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
    retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    retryText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
    verseContainer: { paddingVertical: 16 },
    verseHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    verseNumberBadge: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    verseNumber: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary },
    verseMeta: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
    verseJuz: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    sajdaBadge: {
      backgroundColor: colors.primary + "20", borderRadius: 4,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    sajdaText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.primary },
    arabicText: {
      fontFamily: "Amiri_400Regular",
      fontSize: fontSize,
      color: colors.foreground,
      textAlign: "right",
      lineHeight: fontSize * 1.9,
      marginBottom: 10,
    },
    translationText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      fontStyle: "italic",
    },
    verseDivider: { height: 1, backgroundColor: colors.border },
  });
