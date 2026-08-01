import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Platform, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList } from "@/data/quran";

type Tab = "surahs" | "juz" | "bookmarks";

const JUZ_STARTS: Record<number, string> = {
  1: "Al-Fatihah 1:1", 2: "Al-Baqarah 2:142", 3: "Al-Baqarah 2:253",
  4: "Al-'Imran 3:92", 5: "An-Nisa 4:24", 6: "An-Nisa 4:148",
  7: "Al-Ma'idah 5:82", 8: "Al-An'am 6:111", 9: "Al-A'raf 7:88",
  10: "Al-Anfal 8:41", 11: "At-Tawbah 9:93", 12: "Hud 11:6",
  13: "Yusuf 12:53", 14: "Al-Hijr 15:1", 15: "Al-Isra 17:1",
  16: "Al-Kahf 18:75", 17: "Al-Anbiya 21:1", 18: "Al-Mu'minun 23:1",
  19: "Al-Furqan 25:21", 20: "An-Naml 27:56", 21: "Al-'Ankabut 29:46",
  22: "Al-Ahzab 33:31", 23: "Ya-Sin 36:28", 24: "Az-Zumar 39:32",
  25: "Fussilat 41:47", 26: "Al-Ahqaf 46:1", 27: "Adh-Dhariyat 51:31",
  28: "Al-Mujadila 58:1", 29: "Al-Mulk 67:1", 30: "An-Naba 78:1",
};

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookmarkedSurahs, toggleBookmarkSurah } = useApp();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("surahs");
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const filtered = useMemo(() => {
    if (!search.trim()) return allSurahsList;
    const q = search.toLowerCase();
    return allSurahsList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.nameTranslation.toLowerCase().includes(q) ||
      s.nameArabic.includes(q) ||
      String(s.id).includes(q)
    );
  }, [search]);

  const bookmarked = useMemo(() => allSurahsList.filter(s => bookmarkedSurahs.includes(s.id)), [bookmarkedSurahs]);

  const juzData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      juz: i + 1,
      start: JUZ_STARTS[i + 1] ?? "",
      surahs: allSurahsList.filter(s => s.juz.includes(i + 1)),
    })), []);

  const listData = tab === "bookmarks" ? bookmarked : (search ? filtered : allSurahsList);

  function SurahRow({ item }: { item: typeof allSurahsList[0] }) {
    const bm = bookmarkedSurahs.includes(item.id);
    const isMeccan = item.revelationType === "Meccan";
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/quran/${item.id}`)}
        activeOpacity={0.72}
      >
        {/* Number badge */}
        <View style={[styles.numWrap, { backgroundColor: colors.primary + "10" }]}>
          {/* Diamond shape via overlapping rotated view */}
          <Text style={[styles.numTxt, { color: colors.primary }]}>{item.id}</Text>
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: colors.foreground }]}>{item.name}</Text>
          <View style={styles.rowMeta}>
            <Text style={[styles.rowTrans, { color: colors.mutedForeground }]}>{item.nameTranslation}</Text>
            <View style={[styles.typeDot, { backgroundColor: isMeccan ? "#16A34A" : "#2563EB" }]} />
            <Text style={[styles.rowVerses, { color: colors.mutedForeground }]}>{item.totalVerses} verses</Text>
          </View>
        </View>

        {/* Arabic + bookmark */}
        <View style={styles.rowRight}>
          <Text style={[styles.rowArabic, { color: colors.primary, fontFamily: "Amiri_700Bold" }]}>
            {item.nameArabic}
          </Text>
          <TouchableOpacity
            onPress={() => toggleBookmarkSurah(item.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={bm ? "bookmark" : "bookmark-outline"}
              size={16}
              color={bm ? colors.accent : colors.border}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerAr, { color: colors.primary, fontFamily: "Amiri_700Bold" }]}>
            القرآن الكريم
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            114 Surahs · 6,236 Verses
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
          <Feather name="settings" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH ── */}
      <View style={[styles.searchBox, { backgroundColor: colors.muted }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search surah, meaning or number…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={v => { setSearch(v); if (v) setTab("surahs"); }}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── TABS ── */}
      <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
        {(["surahs", "juz", "bookmarks"] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, t === tab && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => { setTab(t); setSearch(""); }}
          >
            <Text style={[styles.tabTxt, { color: t === tab ? colors.foreground : colors.mutedForeground },
              t === tab && { fontFamily: "Inter_700Bold" }]}>
              {t === "surahs" ? "Surahs" : t === "juz" ? "Juz" : `Bookmarks (${bookmarked.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── LIST ── */}
      {tab === "juz" ? (
        <FlatList
          data={juzData}
          keyExtractor={item => String(item.juz)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View>
              <View style={[styles.juzHeader, { backgroundColor: colors.primary + "0A", borderBottomColor: colors.border }]}>
                <View style={[styles.juzBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.juzBadgeTxt}>{item.juz}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.juzTitle, { color: colors.primary }]}>Juz {item.juz}</Text>
                  <Text style={[styles.juzSub, { color: colors.mutedForeground }]}>{item.start}</Text>
                </View>
                <Text style={[styles.juzCount, { color: colors.mutedForeground }]}>{item.surahs.length} surahs</Text>
              </View>
              {item.surahs.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.juzRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push(`/quran/${s.id}`)}
                  activeOpacity={0.72}
                >
                  <Text style={[styles.juzRowNum, { color: colors.primary }]}>{s.id}</Text>
                  <Text style={[styles.juzRowName, { color: colors.foreground }]}>{s.name}</Text>
                  <Text style={[styles.juzRowVerse, { color: colors.mutedForeground }]}>{s.totalVerses} v.</Text>
                  <Text style={[styles.juzRowAr, { color: colors.primary, fontFamily: "Amiri_400Regular" }]}>{s.nameArabic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => <SurahRow item={item} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name={tab === "bookmarks" ? "bookmark-outline" : "book-outline"} size={48} color={colors.border} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>
                {tab === "bookmarks" ? "No bookmarks yet" : "No surahs found"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  headerTitles: {},
  headerAr: { fontSize: 32 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  settingsBtn: { padding: 6 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
  // Surah rows
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  numWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 14 },
  numTxt: { fontFamily: "Inter_700Bold", fontSize: 15 },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  rowTrans: { fontFamily: "Inter_400Regular", fontSize: 12 },
  typeDot: { width: 5, height: 5, borderRadius: 2.5 },
  rowVerses: { fontFamily: "Inter_400Regular", fontSize: 12 },
  rowRight: { alignItems: "flex-end", gap: 8 },
  rowArabic: { fontSize: 22 },
  // Juz
  juzHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  juzBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  juzBadgeTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  juzTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  juzSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  juzCount: { fontFamily: "Inter_500Medium", fontSize: 12 },
  juzRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  juzRowNum: { fontFamily: "Inter_700Bold", fontSize: 13, width: 28, textAlign: "center" },
  juzRowName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  juzRowVerse: { fontFamily: "Inter_400Regular", fontSize: 12 },
  juzRowAr: { fontSize: 16 },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTxt: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
