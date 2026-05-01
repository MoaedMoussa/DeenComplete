import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList } from "@/data/quran";

type Tab = "surahs" | "juz" | "bookmarks";
const JUZ_COUNT = 30;

// Map of juz -> which surah/ayah it starts at (approximate)
const JUZ_STARTS: Record<number, { surah: number; name: string }> = {
  1: { surah: 1, name: "Al-Fatihah" }, 2: { surah: 2, name: "Al-Baqarah (v.142)" },
  3: { surah: 2, name: "Al-Baqarah (v.253)" }, 4: { surah: 3, name: "Al-'Imran (v.92)" },
  5: { surah: 4, name: "An-Nisa (v.24)" }, 6: { surah: 4, name: "An-Nisa (v.148)" },
  7: { surah: 5, name: "Al-Ma'idah (v.82)" }, 8: { surah: 6, name: "Al-An'am (v.111)" },
  9: { surah: 7, name: "Al-A'raf (v.88)" }, 10: { surah: 8, name: "Al-Anfal (v.41)" },
  11: { surah: 9, name: "At-Tawbah (v.93)" }, 12: { surah: 11, name: "Hud (v.6)" },
  13: { surah: 12, name: "Yusuf (v.53)" }, 14: { surah: 15, name: "Al-Hijr (v.1)" },
  15: { surah: 17, name: "Al-Isra (v.1)" }, 16: { surah: 18, name: "Al-Kahf (v.75)" },
  17: { surah: 21, name: "Al-Anbiya (v.1)" }, 18: { surah: 23, name: "Al-Mu'minun (v.1)" },
  19: { surah: 25, name: "Al-Furqan (v.21)" }, 20: { surah: 27, name: "An-Naml (v.56)" },
  21: { surah: 29, name: "Al-'Ankabut (v.46)" }, 22: { surah: 33, name: "Al-Ahzab (v.31)" },
  23: { surah: 36, name: "Ya-Sin (v.28)" }, 24: { surah: 39, name: "Az-Zumar (v.32)" },
  25: { surah: 41, name: "Fussilat (v.47)" }, 26: { surah: 46, name: "Al-Ahqaf (v.1)" },
  27: { surah: 51, name: "Adh-Dhariyat (v.31)" }, 28: { surah: 58, name: "Al-Mujadila (v.1)" },
  29: { surah: 67, name: "Al-Mulk (v.1)" }, 30: { surah: 78, name: "An-Naba (v.1)" },
};

const TYPE_COLORS: Record<string, string> = { Meccan: "#16A34A", Medinan: "#2563EB" };

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookmarkedSurahs, toggleBookmarkSurah } = useApp();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("surahs");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 0 : insets.top;

  const filtered = useMemo(() => {
    if (!search) return allSurahsList;
    const q = search.toLowerCase();
    return allSurahsList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.nameTranslation.toLowerCase().includes(q) ||
      s.nameArabic.includes(q) ||
      String(s.id).includes(q)
    );
  }, [search]);

  const bookmarked = useMemo(
    () => allSurahsList.filter(s => bookmarkedSurahs.includes(s.id)),
    [bookmarkedSurahs],
  );

  const juzData = useMemo(
    () => Array.from({ length: JUZ_COUNT }, (_, i) => ({
      juz: i + 1,
      surahs: allSurahsList.filter(s => s.juz.includes(i + 1)),
      startInfo: JUZ_STARTS[i + 1],
    })),
    [],
  );

  const s = styles(colors, topPad);
  const displayList = activeTab === "bookmarks" ? bookmarked : (search ? filtered : allSurahsList);

  function renderSurah(item: typeof allSurahsList[0]) {
    const isBm = bookmarkedSurahs.includes(item.id);
    const typeColor = TYPE_COLORS[item.revelationType] ?? colors.primary;
    return (
      <TouchableOpacity
        key={item.id}
        style={s.surahRow}
        onPress={() => { Haptics.selectionAsync(); router.push(`/quran/${item.id}`); }}
        activeOpacity={0.75}
      >
        {/* Number badge */}
        <View style={s.numBadge}>
          <Text style={s.numText}>{item.id}</Text>
        </View>

        {/* Info */}
        <View style={s.surahInfo}>
          <Text style={s.surahName}>{item.name}</Text>
          <View style={s.surahMetaRow}>
            <Text style={s.surahMeta}>{item.nameTranslation}</Text>
            <View style={[s.typeTag, { backgroundColor: typeColor + "18" }]}>
              <Text style={[s.typeText, { color: typeColor }]}>{item.revelationType}</Text>
            </View>
            <Text style={s.versesText}>{item.totalVerses} v.</Text>
          </View>
        </View>

        {/* Arabic */}
        <View style={s.surahRight}>
          <Text style={s.surahArabic}>{item.nameArabic}</Text>
          <TouchableOpacity
            style={s.bmBtn}
            onPress={e => { e.stopPropagation(); Haptics.selectionAsync(); toggleBookmarkSurah(item.id); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name={isBm ? "bookmark" : "bookmark"} size={14} color={isBm ? colors.accent : colors.border} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>القرآن الكريم</Text>
          <Text style={s.headerSub}>The Holy Quran · 114 Surahs · 6,236 Verses</Text>
        </View>
        <TouchableOpacity style={s.settingsBtn} onPress={() => router.push("/settings")} activeOpacity={0.8}>
          <Feather name="settings" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={s.searchInput}
          placeholder="Search surah name, meaning, number..."
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

      {/* Tabs */}
      <View style={s.tabs}>
        {(["surahs", "juz", "bookmarks"] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => { setActiveTab(t); setSearch(""); }}>
            <Text style={[s.tabTxt, activeTab === t && s.tabTxtActive]}>
              {t === "surahs" ? "Surahs" : t === "juz" ? "Juz" : `Bookmarks (${bookmarked.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "juz" ? (
        <FlatList
          data={juzData}
          keyExtractor={item => String(item.juz)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={s.juzSection}>
              <View style={s.juzHeader}>
                <View style={s.juzNumBox}>
                  <Text style={s.juzNum}>{item.juz}</Text>
                </View>
                <View>
                  <Text style={s.juzTitle}>Juz {item.juz}</Text>
                  <Text style={s.juzSub}>{item.startInfo?.name ?? ""}</Text>
                </View>
                <Text style={s.juzCount}>{item.surahs.length} Surahs</Text>
              </View>
              {item.surahs.map(s2 => (
                <TouchableOpacity key={s2.id} style={s.juzSurahRow} onPress={() => router.push(`/quran/${s2.id}`)} activeOpacity={0.75}>
                  <Text style={s.juzSurahNum}>{s2.id}</Text>
                  <Text style={s.juzSurahName}>{s2.name}</Text>
                  <Text style={s.juzSurahVerse}>{s2.totalVerses} v.</Text>
                  <Text style={s.juzSurahAr}>{s2.nameArabic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => renderSurah(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📖</Text>
              <Text style={s.emptyTxt}>
                {activeTab === "bookmarks" ? "No bookmarks yet" : "No surahs found"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, topPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle: { fontFamily: "Amiri_700Bold", fontSize: 30, color: colors.primary },
    headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    settingsBtn: { padding: 8 },
    searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
    searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground },
    tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 6, backgroundColor: colors.muted, borderRadius: 12, padding: 3 },
    tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
    tabActive: { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabTxt: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
    tabTxtActive: { color: colors.foreground, fontFamily: "Inter_700Bold" },
    surahRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background },
    numBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary + "12", justifyContent: "center", alignItems: "center", marginRight: 12 },
    numText: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    surahInfo: { flex: 1 },
    surahName: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground },
    surahMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
    surahMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    typeTag: { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    typeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
    versesText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    surahRight: { alignItems: "flex-end", gap: 4 },
    surahArabic: { fontFamily: "Amiri_700Bold", fontSize: 20, color: colors.primary },
    bmBtn: { padding: 2 },
    sep: { height: 1, backgroundColor: colors.border, marginLeft: 70 },
    juzSection: { marginBottom: 4 },
    juzHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary + "08", borderBottomWidth: 1, borderBottomColor: colors.border },
    juzNumBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
    juzNum: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
    juzTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    juzSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    juzCount: { marginLeft: "auto", fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
    juzSurahRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    juzSurahNum: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary, width: 28, textAlign: "center" },
    juzSurahName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground, flex: 1 },
    juzSurahVerse: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    juzSurahAr: { fontFamily: "Amiri_400Regular", fontSize: 16, color: colors.primary },
    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyTxt: { fontFamily: "Inter_500Medium", fontSize: 15, color: colors.mutedForeground },
  });
