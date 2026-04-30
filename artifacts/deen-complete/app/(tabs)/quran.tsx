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
import { allSurahsList, Surah } from "@/data/quran";

const JUZ_COUNT = 30;

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookmarkedSurahs, toggleBookmarkSurah } = useApp();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"surahs" | "juz" | "bookmarks">("surahs");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

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

  const bookmarked = useMemo(() =>
    allSurahsList.filter(s => bookmarkedSurahs.includes(s.id)),
    [bookmarkedSurahs]
  );

  const juzList = useMemo(() =>
    Array.from({ length: JUZ_COUNT }, (_, i) => ({
      juz: i + 1,
      surahs: allSurahsList.filter(s => s.juz.includes(i + 1)),
    })),
    []
  );

  const s = styles(colors, topPad, bottomPad);

  function renderSurah({ item }: { item: Surah }) {
    const isBookmarked = bookmarkedSurahs.includes(item.id);
    return (
      <TouchableOpacity
        style={s.surahRow}
        onPress={() => { Haptics.selectionAsync(); router.push(`/quran/${item.id}`); }}
        activeOpacity={0.7}
      >
        <View style={s.surahNumber}>
          <Text style={s.surahNumberText}>{item.id}</Text>
        </View>
        <View style={s.surahInfo}>
          <Text style={s.surahName}>{item.name}</Text>
          <Text style={s.surahMeta}>{item.nameTranslation} • {item.totalVerses} verses • {item.revelationType}</Text>
        </View>
        <View style={s.surahRight}>
          <Text style={s.surahArabic}>{item.nameArabic}</Text>
          <TouchableOpacity
            style={s.bookmarkBtn}
            onPress={() => { Haptics.selectionAsync(); toggleBookmarkSurah(item.id); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={isBookmarked ? "bookmark" : "bookmark"}
              size={14}
              color={isBookmarked ? colors.accent : colors.mutedForeground}
              style={{ opacity: isBookmarked ? 1 : 0.5 }}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const displayList = activeTab === "bookmarks" ? bookmarked : (search ? filtered : allSurahsList);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Holy Quran</Text>
        <Text style={s.titleArabic}>القرآن الكريم</Text>
      </View>

      <View style={s.searchContainer}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={s.searchInput}
          placeholder="Search surah or topic..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabRow}>
        {(["surahs", "juz", "bookmarks"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => { setActiveTab(tab); setSearch(""); }}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "juz" ? (
        <FlatList
          data={juzList}
          keyExtractor={item => String(item.juz)}
          contentContainerStyle={{ paddingBottom: 120 + bottomPad }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.juzSection}>
              <View style={s.juzHeader}>
                <Text style={s.juzTitle}>Juz {item.juz}</Text>
              </View>
              {item.surahs.slice(0, 3).map(s2 => (
                <TouchableOpacity
                  key={s2.id}
                  style={s.surahRow}
                  onPress={() => router.push(`/quran/${s2.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={s.surahNumber}>
                    <Text style={s.surahNumberText}>{s2.id}</Text>
                  </View>
                  <View style={s.surahInfo}>
                    <Text style={s.surahName}>{s2.name}</Text>
                    <Text style={s.surahMeta}>{s2.totalVerses} verses</Text>
                  </View>
                  <Text style={s.surahArabic}>{s2.nameArabic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => String(item.id)}
          renderItem={renderSurah}
          contentContainerStyle={{ paddingBottom: 120 + bottomPad }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="book-open" size={40} color={colors.border} />
              <Text style={s.emptyText}>No surahs found</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 60 }} />}
        />
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
      backgroundColor: colors.background,
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
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.foreground,
    },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 7,
      alignItems: "center",
      borderRadius: 8,
    },
    tabActive: { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tabText: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    surahRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.background,
    },
    surahNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    surahNumberText: {
      fontFamily: "Inter_700Bold",
      fontSize: 13,
      color: colors.primary,
    },
    surahInfo: { flex: 1 },
    surahName: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      color: colors.foreground,
    },
    surahMeta: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    surahRight: { alignItems: "flex-end", gap: 4 },
    surahArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: colors.primary,
    },
    bookmarkBtn: { padding: 4 },
    juzSection: { marginBottom: 4 },
    juzHeader: {
      backgroundColor: colors.primary + "10",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    juzTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: colors.primary,
    },
    emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyText: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.mutedForeground,
    },
  });
