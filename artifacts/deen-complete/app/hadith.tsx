import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput,
  Share, ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";

const SUNNAH_API = "https://api.sunnah.com/v1";
const SUNNAH_API_KEY = "SqD712P3E82xnwOAEOkGd5JZXwal9ruparT4zwdi";

const headers = { "X-API-Key": SUNNAH_API_KEY, "Content-Type": "application/json" };

const COLLECTIONS = [
  { id: "bukhari", name: "Sahih al-Bukhari", nameAr: "صحيح البخاري", count: 7563, grade: "Sahih" },
  { id: "muslim", name: "Sahih Muslim", nameAr: "صحيح مسلم", count: 5362, grade: "Sahih" },
  { id: "nasai", name: "Sunan an-Nasa'i", nameAr: "سنن النسائي", count: 5761, grade: "Hasan" },
  { id: "abudawud", name: "Sunan Abu Dawud", nameAr: "سنن أبي داود", count: 5274, grade: "Hasan" },
  { id: "tirmidhi", name: "Jami' at-Tirmidhi", nameAr: "جامع الترمذي", count: 3956, grade: "Hasan" },
  { id: "ibnmajah", name: "Sunan Ibn Majah", nameAr: "سنن ابن ماجه", count: 4341, grade: "Hasan" },
  { id: "malik", name: "Muwatta Malik", nameAr: "موطأ مالك", count: 1594, grade: "Sahih" },
  { id: "nawawi40", name: "40 Hadith Nawawi", nameAr: "الأربعون النووية", count: 42, grade: "Sahih" },
  { id: "riyadussalihin", name: "Riyad as-Salihin", nameAr: "رياض الصالحين", count: 1896, grade: "Sahih" },
  { id: "adab", name: "Al-Adab Al-Mufrad", nameAr: "الأدب المفرد", count: 1322, grade: "Hasan" },
  { id: "bulugh", name: "Bulugh al-Maram", nameAr: "بلوغ المرام", count: 1358, grade: "Hasan" },
  { id: "shamail", name: "Ash-Shama'il Al-Muhammadiyya", nameAr: "الشمائل المحمدية", count: 397, grade: "Hasan" },
];

interface SunnahHadith {
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithArabic?: string;
  bookName?: string;
  chapterName?: string;
  grades?: Array<{ name: string; grade: string }>;
}

interface HadithBook {
  bookNumber: string;
  bookName: string;
  chapterName?: string;
  hadithCount: number;
}

async function fetchHadiths(collection: string, page: number, limit: number = 20): Promise<{ hadiths: SunnahHadith[]; total: number }> {
  const cacheKey = `hadith_${collection}_${page}_${limit}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const offset = (page - 1) * limit;
  const res = await fetch(
    `${SUNNAH_API}/collections/${collection}/hadiths?limit=${limit}&page=${page}`,
    { headers }
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const result = {
    hadiths: data.data ?? [],
    total: data.total ?? 0,
  };

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {}

  return result;
}

async function searchHadiths(query: string): Promise<SunnahHadith[]> {
  const res = await fetch(
    `${SUNNAH_API}/search?q=${encodeURIComponent(query)}&collection=bukhari&limit=20`,
    { headers }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

async function fetchBooks(collection: string): Promise<HadithBook[]> {
  const cacheKey = `books_${collection}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const res = await fetch(`${SUNNAH_API}/collections/${collection}/books`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  const books = data.data ?? [];

  try { await AsyncStorage.setItem(cacheKey, JSON.stringify(books)); } catch {}
  return books;
}

export default function HadithScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"browse" | "search" | "books">("browse");
  const [selectedCollection, setSelectedCollection] = useState(COLLECTIONS[0]);
  const [hadiths, setHadiths] = useState<SunnahHadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SunnahHadith[]>([]);
  const [searching, setSearching] = useState(false);
  const [books, setBooks] = useState<HadithBook[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const loadHadiths = useCallback(async (col: string, pg: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchHadiths(col, pg);
      setHadiths(prev => append ? [...prev, ...result.hadiths] : result.hadiths);
      setTotal(result.total);
    } catch (e: any) {
      setError("Unable to load hadiths. Check your connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHadiths([]);
    loadHadiths(selectedCollection.id, 1);
  }, [selectedCollection]);

  useEffect(() => {
    if (activeTab === "books") {
      fetchBooks(selectedCollection.id).then(setBooks);
    }
  }, [activeTab, selectedCollection]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchHadiths(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  function loadMore() {
    if (loadingMore || hadiths.length >= total) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadHadiths(selectedCollection.id, nextPage, true);
  }

  async function shareHadith(h: SunnahHadith) {
    try {
      await Share.share({
        message: `${h.hadithArabic ? h.hadithArabic + "\n\n" : ""}"${h.hadithEnglish}"\n\n— ${h.englishNarrator}\n${selectedCollection.name} #${h.hadithNumber}`,
      });
    } catch {}
  }

  const gradeColor = (grade?: string) => {
    if (!grade) return colors.mutedForeground;
    const g = grade.toLowerCase();
    if (g.includes("sahih")) return "#22C55E";
    if (g.includes("hasan")) return "#3B82F6";
    if (g.includes("da")) return "#EF4444";
    return colors.mutedForeground;
  };

  const s = styles(colors, bottomPad);

  function renderHadith({ item }: { item: SunnahHadith }) {
    const key = `${selectedCollection.id}-${item.hadithNumber}`;
    const isExpanded = expanded === key;
    const mainGrade = item.grades?.[0]?.grade ?? selectedCollection.grade;

    return (
      <View style={s.hadithCard}>
        <TouchableOpacity onPress={() => setExpanded(isExpanded ? null : key)} activeOpacity={0.85} style={s.hadithHeader}>
          <View style={s.hadithMeta}>
            <Text style={s.hadithNum}>#{item.hadithNumber}</Text>
            <View style={[s.gradeBadge, { backgroundColor: gradeColor(mainGrade) + "20" }]}>
              <Text style={[s.gradeText, { color: gradeColor(mainGrade) }]}>{mainGrade}</Text>
            </View>
          </View>
          {item.hadithArabic ? (
            <Text style={s.hadithArabic} numberOfLines={isExpanded ? undefined : 2}>
              {item.hadithArabic}
            </Text>
          ) : null}
          <Text style={s.hadithText} numberOfLines={isExpanded ? undefined : 3}>
            {item.hadithEnglish}
          </Text>
          {isExpanded && (
            <>
              <Text style={s.narrator}>— {item.englishNarrator}</Text>
              <View style={s.hadithActions}>
                <TouchableOpacity style={s.shareBtn} onPress={() => shareHadith(item)}>
                  <Feather name="share-2" size={14} color={colors.primary} />
                  <Text style={s.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {!isExpanded && (
            <Text style={s.narrator} numberOfLines={1}>— {item.englishNarrator}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Collection picker */}
      <TouchableOpacity style={s.collectionHeader} onPress={() => setShowCollectionPicker(true)} activeOpacity={0.8}>
        <View>
          <Text style={s.collectionNameAr}>{selectedCollection.nameAr}</Text>
          <Text style={s.collectionName}>{selectedCollection.name}</Text>
          <Text style={s.collectionCount}>{selectedCollection.count.toLocaleString()} hadiths</Text>
        </View>
        <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["browse", "search", "books"] as const).map(tab => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Browse */}
      {activeTab === "browse" && (
        loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Loading {selectedCollection.name}...</Text>
          </View>
        ) : error ? (
          <View style={s.errorBox}>
            <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => loadHadiths(selectedCollection.id, 1)}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={hadiths}
            keyExtractor={h => `${selectedCollection.id}-${h.hadithNumber}`}
            renderItem={renderHadith}
            contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 40 + bottomPad }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={s.loadingText}>Loading more...</Text>
                </View>
              ) : hadiths.length > 0 && hadiths.length >= total ? (
                <Text style={[s.loadingText, { padding: 16, textAlign: "center" }]}>
                  All {total} hadiths loaded
                </Text>
              ) : null
            }
          />
        )
      )}

      {/* Search */}
      {activeTab === "search" && (
        <View style={{ flex: 1 }}>
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              placeholder="Search hadith..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="search" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={h => `search-${h.hadithNumber}`}
              renderItem={renderHadith}
              contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 40 + bottomPad }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={s.emptySearch}>
              <Feather name="search" size={36} color={colors.border} />
              <Text style={s.emptyText}>Search across all hadiths</Text>
              <Text style={s.emptySubText}>Enter keywords in English to search</Text>
            </View>
          )}
        </View>
      )}

      {/* Books */}
      {activeTab === "books" && (
        <FlatList
          data={books}
          keyExtractor={b => b.bookNumber}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 40 + bottomPad }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.bookCard}>
              <View style={s.bookNum}>
                <Text style={s.bookNumText}>{item.bookNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bookName}>{item.bookName}</Text>
                {item.chapterName && <Text style={s.bookChapter}>{item.chapterName}</Text>}
                <Text style={s.bookCount}>{item.hadithCount ?? "—"} hadiths</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={s.loadingText}>Loading books...</Text>
            </View>
          )}
        />
      )}

      {/* Collection Picker Modal */}
      <Modal
        visible={showCollectionPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCollectionPicker(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Collection</Text>
            <TouchableOpacity onPress={() => setShowCollectionPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COLLECTIONS}
            keyExtractor={c => c.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.collectionCard, selectedCollection.id === item.id && s.collectionCardActive]}
                onPress={() => {
                  setSelectedCollection(item);
                  setShowCollectionPicker(false);
                  setHadiths([]);
                  setPage(1);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.collectionCardNameAr}>{item.nameAr}</Text>
                  <Text style={s.collectionCardName}>{item.name}</Text>
                  <Text style={s.collectionCardCount}>{item.count.toLocaleString()} hadiths</Text>
                </View>
                <View style={[s.gradeTag, { backgroundColor: gradeColor(item.grade) + "20" }]}>
                  <Text style={[s.gradeTagText, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
                </View>
                {selectedCollection.id === item.id && (
                  <Feather name="check-circle" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    collectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.primary + "08",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    collectionNameAr: { fontFamily: "Amiri_700Bold", fontSize: 16, color: colors.primary },
    collectionName: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground },
    collectionCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    tabRow: {
      flexDirection: "row",
      margin: 12,
      marginBottom: 4,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tab: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    tabTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground },
    errorBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
    errorText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
    retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    retryText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
    hadithCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    hadithHeader: { padding: 14 },
    hadithMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    hadithNum: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    gradeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
    hadithArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: colors.primary,
      textAlign: "right",
      lineHeight: 32,
      marginBottom: 10,
    },
    hadithText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: 6,
    },
    narrator: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
    hadithActions: { flexDirection: "row", marginTop: 8 },
    shareBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    shareBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary },
    searchBox: {
      flexDirection: "row",
      gap: 8,
      margin: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    emptySearch: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
    emptyText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground },
    emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground },
    bookCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "flex-start",
    },
    bookNum: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    bookNumText: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary },
    bookName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    bookChapter: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    bookCount: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.accent, marginTop: 4 },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground },
    collectionCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    collectionCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + "05" },
    collectionCardNameAr: { fontFamily: "Amiri_700Bold", fontSize: 16, color: colors.primary },
    collectionCardName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    collectionCardCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    gradeTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    gradeTagText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  });
