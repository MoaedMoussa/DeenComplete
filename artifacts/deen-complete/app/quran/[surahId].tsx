import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Platform, Share, ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList } from "@/data/quran";

interface FetchedVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
  juz: number;
  page: number;
  sajda: boolean;
}

const EDITIONS = [
  { id: "en.sahih", label: "Sahih Intl." },
  { id: "en.pickthall", label: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali" },
  { id: "en.asad", label: "M. Asad" },
  { id: "ur.ahmedali", label: "اردو" },
  { id: "bn.bengali", label: "বাংলা" },
  { id: "id.indonesian", label: "Indonesia" },
  { id: "tr.diyanet", label: "Türkçe" },
  { id: "fr.hamidullah", label: "Français" },
  { id: "de.aburida", label: "Deutsch" },
];

async function fetchSurahVerses(surahId: number, edition: string): Promise<FetchedVerse[]> {
  const key = `quran_v2_${surahId}_${edition}`;
  try {
    const c = await AsyncStorage.getItem(key);
    if (c) return JSON.parse(c);
  } catch {}

  const [arRes, trRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}`),
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${edition}`),
  ]);
  const [arData, trData] = await Promise.all([arRes.json(), trRes.json()]);
  if (arData.code !== 200) throw new Error("Arabic fetch failed");

  const verses: FetchedVerse[] = arData.data.ayahs.map((av: any, i: number) => ({
    numberInSurah: av.numberInSurah,
    arabic: av.text,
    translation: trData.data?.ayahs?.[i]?.text ?? "",
    juz: av.juz,
    page: av.page,
    sajda: !!av.sajda,
  }));

  try { await AsyncStorage.setItem(key, JSON.stringify(verses)); } catch {}
  return verses;
}

export default function SurahScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, bookmarkedSurahs, toggleBookmarkSurah } = useApp();

  const id = parseInt(surahId ?? "1", 10);
  const surah = allSurahsList.find(s => s.id === id);
  const isBookmarked = bookmarkedSurahs.includes(id);

  const [verses, setVerses] = useState<FetchedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edition, setEdition] = useState(settings.translationEdition || "en.sahih");
  const [fontSize, setFontSize] = useState(settings.arabicFontSize);
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [showEditions, setShowEditions] = useState(false);
  const [shareVerse, setShareVerse] = useState<FetchedVerse | null>(null);

  const isWeb = Platform.OS === "web";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVerses([]);
    try {
      const data = await fetchSurahVerses(id, edition);
      setVerses(data);
    } catch {
      setError("No internet connection. Please connect and try again.");
    } finally {
      setLoading(false);
    }
  }, [id, edition]);

  useEffect(() => { load(); }, [load]);

  async function doShare(v: FetchedVerse) {
    try {
      await Share.share({
        message: `${v.arabic}\n\n"${v.translation}"\n\n— Quran ${id}:${v.numberInSurah}`,
      });
    } catch {}
  }

  const s = styles(colors, fontSize);

  function renderVerse({ item, index }: { item: FetchedVerse; index: number }) {
    const showPage = index === 0 || item.page !== verses[index - 1]?.page;
    return (
      <View>
        {/* Page marker */}
        {showPage && (
          <View style={s.pageMarker}>
            <View style={s.pageLine} />
            <Text style={s.pageTxt}>Page {item.page} · Juz {item.juz}</Text>
            <View style={s.pageLine} />
          </View>
        )}

        <View style={s.verseWrap}>
          {/* Arabic text — full width right-to-left */}
          <Text style={s.arabicText}>{item.arabic} </Text>

          {/* Verse number inline (Arabic style) */}
          <View style={s.verseNumRow}>
            <View style={s.verseNumBadge}>
              <Text style={s.verseNumTxt}>{item.numberInSurah}</Text>
            </View>
            {item.sajda && (
              <View style={s.sajdaBadge}>
                <Text style={s.sajdaTxt}>Sajda ﷲ</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => doShare(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.shareBtn}
            >
              <Feather name="share-2" size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Translation */}
          {showTranslation && item.translation ? (
            <Text style={s.translationText}>{item.translation}</Text>
          ) : null}

          {/* Divider */}
          <View style={s.verseDivider} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: surah?.name ?? `Surah ${id}`,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: "Inter_700Bold", color: colors.foreground },
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 14, marginRight: 4 }}>
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); toggleBookmarkSurah(id); }}>
                <Feather name="bookmark" size={20} color={isBookmarked ? colors.accent : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditions(true)}>
                <Feather name="globe" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Toolbar */}
      <View style={s.toolbar}>
        <TouchableOpacity
          style={[s.tbBtn, showTranslation && s.tbBtnOn]}
          onPress={() => setShowTranslation(v => !v)}
        >
          <Feather name="type" size={14} color={showTranslation ? "#fff" : colors.foreground} />
          <Text style={[s.tbTxt, showTranslation && s.tbTxtOn]}>Translation</Text>
        </TouchableOpacity>

        <View style={s.fontRow}>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.max(16, v - 2))}>
            <Text style={[s.fontBtnTxt, { fontSize: 14 }]}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fontBtn} onPress={() => setFontSize(v => Math.min(44, v + 2))}>
            <Text style={[s.fontBtnTxt, { fontSize: 20 }]}>A</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.editionLabel} numberOfLines={1}>
          {EDITIONS.find(e => e.id === edition)?.label ?? "English"}
        </Text>
      </View>

      {/* Surah header — book style */}
      {!loading && !error && (
        <View style={s.surahCover}>
          <Text style={s.surahCoverArabic}>{surah?.nameArabic}</Text>
          <Text style={s.surahCoverName}>{surah?.name} — {surah?.nameTranslation}</Text>
          <Text style={s.surahCoverMeta}>{surah?.revelationType} · {surah?.totalVerses} Verses · {verses[0]?.page ? `Pages ${verses[0].page}–${verses[verses.length - 1]?.page}` : ""}</Text>
          {id !== 1 && id !== 9 && (
            <Text style={s.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
          )}
        </View>
      )}

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingTxt}>Loading {surah?.name ?? "Surah"}…</Text>
          <Text style={s.loadingSub}>{surah?.totalVerses} verses · fetching from alquran.cloud</Text>
        </View>
      ) : error ? (
        <View style={s.errorWrap}>
          <Feather name="wifi-off" size={48} color={colors.border} />
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={v => String(v.numberInSurah)}
          renderItem={renderVerse}
          contentContainerStyle={s.verseList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={25}
          windowSize={8}
          ListFooterComponent={
            <View style={s.surahEnd}>
              <Text style={s.surahEndTxt}>— End of {surah?.name} —</Text>
              <View style={s.navBtns}>
                {id > 1 && (
                  <TouchableOpacity style={s.navBtn} onPress={() => router.replace(`/quran/${id - 1}`)}>
                    <Feather name="chevron-left" size={16} color={colors.primary} />
                    <Text style={s.navBtnTxt}>{allSurahsList[id - 2]?.name}</Text>
                  </TouchableOpacity>
                )}
                {id < 114 && (
                  <TouchableOpacity style={[s.navBtn, s.navBtnRight]} onPress={() => router.replace(`/quran/${id + 1}`)}>
                    <Text style={s.navBtnTxt}>{allSurahsList[id]?.name}</Text>
                    <Feather name="chevron-right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
        />
      )}

      {/* Edition Modal */}
      <Modal visible={showEditions} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditions(false)}>
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Translation</Text>
            <TouchableOpacity onPress={() => setShowEditions(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {EDITIONS.map(e => (
            <TouchableOpacity
              key={e.id}
              style={s.edRow}
              onPress={() => { setEdition(e.id); setShowEditions(false); }}
            >
              <Text style={[s.edName, edition === e.id && { color: colors.primary }]}>{e.label}</Text>
              <Text style={s.edId}>{e.id}</Text>
              {edition === e.id && <Feather name="check" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, fontSize: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    toolbar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
    tbBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.muted },
    tbBtnOn: { backgroundColor: colors.primary },
    tbTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.foreground },
    tbTxtOn: { color: "#fff" },
    fontRow: { flexDirection: "row", gap: 2, marginLeft: "auto" as any },
    fontBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.muted, borderRadius: 6 },
    fontBtnTxt: { fontFamily: "Inter_700Bold", color: colors.foreground },
    editionLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary, maxWidth: 80 },
    surahCover: { backgroundColor: colors.primary, padding: 24, alignItems: "center" },
    surahCoverArabic: { fontFamily: "Amiri_700Bold", fontSize: 36, color: "#fff", textAlign: "center" },
    surahCoverName: { fontFamily: "Inter_700Bold", fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 6 },
    surahCoverMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 },
    bismillah: { fontFamily: "Amiri_400Regular", fontSize: 22, color: colors.accent, marginTop: 14, textAlign: "center" },
    verseList: { paddingHorizontal: 18, paddingBottom: 60 },
    pageMarker: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
    pageLine: { flex: 1, height: 1, backgroundColor: colors.border },
    pageTxt: { fontFamily: "Inter_500Medium", fontSize: 11, color: colors.mutedForeground },
    verseWrap: { paddingVertical: 4 },
    arabicText: { fontFamily: "Amiri_400Regular", fontSize: fontSize, color: colors.foreground, textAlign: "right", lineHeight: fontSize * 1.95, writingDirection: "rtl" },
    verseNumRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 8 },
    verseNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" },
    verseNumTxt: { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.primary },
    sajdaBadge: { backgroundColor: colors.accent + "20", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
    sajdaTxt: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.accent },
    shareBtn: { padding: 4 },
    translationText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, lineHeight: 22, marginBottom: 10 },
    verseDivider: { height: 1, backgroundColor: colors.border, marginBottom: 4 },
    loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
    loadingTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground },
    loadingSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground },
    errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 32 },
    errorTxt: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
    retryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
    retryTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
    surahEnd: { paddingVertical: 32, alignItems: "center", gap: 16 },
    surahEndTxt: { fontFamily: "Amiri_400Regular", fontSize: 18, color: colors.mutedForeground },
    navBtns: { flexDirection: "row", gap: 12, width: "100%" },
    navBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
    navBtnRight: { justifyContent: "flex-end" },
    navBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    modal: { flex: 1, backgroundColor: colors.background },
    modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    edRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    edName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, flex: 1 },
    edId: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
  });
