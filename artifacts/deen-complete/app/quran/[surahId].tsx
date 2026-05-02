import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Platform, Share, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList } from "@/data/quran";

interface Verse {
  numberInSurah: number;
  arabic: string;
  translation: string;
  juz: number;
  page: number;
  sajda: boolean;
}

const EDITIONS = [
  { id: "en.sahih", label: "Sahih International", lang: "EN" },
  { id: "en.pickthall", label: "Pickthall", lang: "EN" },
  { id: "en.yusufali", label: "Yusuf Ali", lang: "EN" },
  { id: "en.asad", label: "Muhammad Asad", lang: "EN" },
  { id: "ur.ahmedali", label: "احمد علي", lang: "UR" },
  { id: "bn.bengali", label: "Bengali", lang: "BN" },
  { id: "id.indonesian", label: "Indonesian", lang: "ID" },
  { id: "tr.diyanet", label: "Türkçe", lang: "TR" },
  { id: "fr.hamidullah", label: "Français", lang: "FR" },
  { id: "de.aburida", label: "Deutsch", lang: "DE" },
];

async function loadVerses(surahId: number, edition: string): Promise<Verse[]> {
  const key = `quran_v3_${surahId}_${edition}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}

  const [arRes, trRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}`),
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${edition}`),
  ]);
  const [ar, tr] = await Promise.all([arRes.json(), trRes.json()]);
  if (ar.code !== 200) throw new Error("Failed");

  const verses: Verse[] = ar.data.ayahs.map((a: any, i: number) => ({
    numberInSurah: a.numberInSurah,
    arabic: a.text,
    translation: tr.data?.ayahs?.[i]?.text ?? "",
    juz: a.juz,
    page: a.page,
    sajda: !!a.sajda,
  }));

  try { await AsyncStorage.setItem(key, JSON.stringify(verses)); } catch {}
  return verses;
}

export default function SurahReader() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, bookmarkedSurahs, toggleBookmarkSurah } = useApp();

  const id = parseInt(surahId ?? "1", 10);
  const surah = allSurahsList.find(s => s.id === id);
  const bm = bookmarkedSurahs.includes(id);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edition, setEdition] = useState(settings.translationEdition ?? "en.sahih");
  const [fontSize, setFontSize] = useState(settings.arabicFontSize ?? 26);
  const [showTrans, setShowTrans] = useState(settings.showTranslation ?? true);
  const [showEditions, setShowEditions] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null); setVerses([]);
    try {
      setVerses(await loadVerses(id, edition));
    } catch {
      setError("Could not load surah. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [id, edition]);

  useEffect(() => { load(); }, [load]);

  function renderVerse({ item, index }: { item: Verse; index: number }) {
    const showPageMark = index === 0 || item.page !== verses[index - 1]?.page;
    return (
      <View>
        {showPageMark && (
          <View style={styles.pageMark}>
            <View style={[styles.pageMarkLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.pageMarkTxt, { color: colors.mutedForeground }]}>
              Page {item.page} · Juz {item.juz}
            </Text>
            <View style={[styles.pageMarkLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        <View style={[styles.verseBlock, { borderBottomColor: colors.border }]}>
          {/* Full-width Arabic */}
          <Text style={[styles.arabic, {
            fontFamily: "Amiri_400Regular",
            fontSize,
            lineHeight: fontSize * 2,
            color: colors.foreground,
          }]}>
            {item.arabic}
          </Text>

          {/* Verse number row */}
          <View style={styles.verseNumRow}>
            <View style={[styles.verseNumBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.verseNum, { color: colors.primary }]}>{item.numberInSurah}</Text>
            </View>
            {item.sajda && (
              <View style={[styles.sajdaBadge, { backgroundColor: colors.accent + "25" }]}>
                <Text style={[styles.sajdaTxt, { color: colors.accent }]}>Sajda</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => Share.share({ message: `${item.arabic}\n\n"${item.translation}"\n\n— Quran ${id}:${item.numberInSurah}` })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="share-2" size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Translation */}
          {showTrans && item.translation ? (
            <Text style={[styles.translation, { color: colors.mutedForeground }]}>
              {item.translation}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: surah?.name ?? `Surah ${id}`,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: "Inter_700Bold", color: colors.foreground, fontSize: 17 },
          headerTintColor: colors.primary,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, paddingRight: 4 }}>
              <TouchableOpacity onPress={() => toggleBookmarkSurah(id)}>
                <Feather name="bookmark" size={20} color={bm ? colors.accent : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditions(true)}>
                <Feather name="globe" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* ── TOOLBAR ── */}
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tbChip, { backgroundColor: showTrans ? colors.primary : colors.muted }]}
          onPress={() => setShowTrans(v => !v)}
        >
          <Feather name="type" size={13} color={showTrans ? "#fff" : colors.foreground} />
          <Text style={[styles.tbChipTxt, { color: showTrans ? "#fff" : colors.foreground }]}>Translation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tbChip, { backgroundColor: colors.muted }]}
          onPress={() => setShowEditions(true)}
        >
          <Text style={[styles.tbChipTxt, { color: colors.foreground }]}>
            {EDITIONS.find(e => e.id === edition)?.lang ?? "EN"}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <View style={[styles.fontRow, { backgroundColor: colors.muted }]}>
          <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(v => Math.max(18, v - 2))}>
            <Text style={[styles.fontBtnTxt, { fontSize: 14, color: colors.foreground }]}>A</Text>
          </TouchableOpacity>
          <View style={[styles.fontDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(v => Math.min(46, v + 2))}>
            <Text style={[styles.fontBtnTxt, { fontSize: 20, color: colors.foreground }]}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SURAH HEADER ── */}
      {!loading && !error && (
        <View style={[styles.surahHeader, { backgroundColor: colors.primary }]}>
          <Text style={[styles.surahAr, { fontFamily: "Amiri_700Bold" }]}>{surah?.nameArabic}</Text>
          <Text style={styles.surahName}>{surah?.name} · {surah?.nameTranslation}</Text>
          <Text style={styles.surahMeta}>{surah?.revelationType} · {surah?.totalVerses} Verses</Text>
          {id !== 1 && id !== 9 && (
            <View style={[styles.bismillahWrap, { borderTopColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={[styles.bismillah, { fontFamily: "Amiri_400Regular", color: colors.accent }]}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadTxt, { color: colors.foreground }]}>Loading {surah?.name}…</Text>
          <Text style={[styles.loadSub, { color: colors.mutedForeground }]}>{surah?.totalVerses} verses</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={48} color={colors.border} />
          <Text style={[styles.errTxt, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={load}>
            <Text style={styles.retryTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={v => String(v.numberInSurah)}
          renderItem={renderVerse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          initialNumToRender={12}
          maxToRenderPerBatch={20}
          windowSize={8}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={[styles.footerEnd, { fontFamily: "Amiri_400Regular", color: colors.mutedForeground }]}>
                — End of {surah?.name} —
              </Text>
              <View style={styles.navRow}>
                {id > 1 && (
                  <TouchableOpacity
                    style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.replace(`/quran/${id - 1}` as any)}
                  >
                    <Feather name="chevron-left" size={16} color={colors.primary} />
                    <Text style={[styles.navBtnTxt, { color: colors.primary }]}>{allSurahsList[id - 2]?.name}</Text>
                  </TouchableOpacity>
                )}
                {id < 114 && (
                  <TouchableOpacity
                    style={[styles.navBtn, styles.navBtnRight, { backgroundColor: colors.primary }]}
                    onPress={() => router.replace(`/quran/${id + 1}` as any)}
                  >
                    <Text style={[styles.navBtnTxt, { color: "#fff" }]}>{allSurahsList[id]?.name}</Text>
                    <Feather name="chevron-right" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
        />
      )}

      {/* ── EDITION MODAL ── */}
      <Modal visible={showEditions} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditions(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHdr, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Translation</Text>
            <TouchableOpacity onPress={() => setShowEditions(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {EDITIONS.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[styles.edRow, { borderBottomColor: colors.border }, e.id === edition && { backgroundColor: colors.primary + "08" }]}
                onPress={() => { setEdition(e.id); setShowEditions(false); }}
              >
                <View style={[styles.langBadge, { backgroundColor: e.id === edition ? colors.primary : colors.muted }]}>
                  <Text style={[styles.langBadgeTxt, { color: e.id === edition ? "#fff" : colors.mutedForeground }]}>{e.lang}</Text>
                </View>
                <Text style={[styles.edName, { color: e.id === edition ? colors.primary : colors.foreground }]}>{e.label}</Text>
                {e.id === edition && <Feather name="check" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tbChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tbChipTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  fontRow: { flexDirection: "row", borderRadius: 8, overflow: "hidden" },
  fontBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  fontBtnTxt: { fontFamily: "Inter_700Bold" },
  fontDivider: { width: 1 },
  surahHeader: { paddingVertical: 24, paddingHorizontal: 20, alignItems: "center" },
  surahAr: { fontSize: 40, color: "#fff", textAlign: "center" },
  surahName: { fontFamily: "Inter_700Bold", fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 6 },
  surahMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  bismillahWrap: { borderTopWidth: 1, marginTop: 16, paddingTop: 16, width: "100%" },
  bismillah: { fontSize: 24, textAlign: "center" },
  pageMark: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  pageMarkLine: { flex: 1, height: StyleSheet.hairlineWidth },
  pageMarkTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },
  verseBlock: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  arabic: { textAlign: "right", writingDirection: "rtl" },
  verseNumRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  verseNumBadge: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  verseNum: { fontFamily: "Inter_700Bold", fontSize: 12 },
  sajdaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  sajdaTxt: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  translation: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 32 },
  loadTxt: { fontFamily: "Inter_700Bold", fontSize: 17 },
  loadSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  errTxt: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  retryBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 8 },
  retryTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  footer: { paddingVertical: 32, paddingHorizontal: 18, alignItems: "center", gap: 20 },
  footerEnd: { fontSize: 20 },
  navRow: { flexDirection: "row", gap: 10, width: "100%" },
  navBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, padding: 14, borderWidth: 1 },
  navBtnRight: { justifyContent: "flex-end" },
  navBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  modal: { flex: 1 },
  modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 28, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  edRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  langBadge: { width: 36, height: 26, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  langBadgeTxt: { fontFamily: "Inter_700Bold", fontSize: 11 },
  edName: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
});
