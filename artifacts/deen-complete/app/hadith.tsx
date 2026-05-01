import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import {
  COLLECTIONS,
  ALL_HADITHS,
  getHadithsByCollection,
  searchHadiths,
  type LocalHadith,
} from "@/data/hadiths";

export default function HadithScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedCollection, setSelectedCollection] = useState(COLLECTIONS[0]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [query, setQuery] = useState("");
  const [selectedHadith, setSelectedHadith] = useState<LocalHadith | null>(null);

  const browsedHadiths = useMemo(
    () => getHadithsByCollection(selectedCollection.id),
    [selectedCollection.id],
  );

  const searchResults = useMemo(
    () => (query.length > 1 ? searchHadiths(query) : []),
    [query],
  );

  const displayHadiths = tab === "search" ? searchResults : browsedHadiths;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 8 },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground },
    collectionBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 8,
    },
    collectionAr: { fontSize: 15, fontFamily: "Amiri_400Regular", color: colors.accent, textAlign: "right" },
    collectionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    gradeBadge: {
      backgroundColor: colors.primary + "22", paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: 6,
    },
    gradeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.primary },
    collectionName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    collectionCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    tabs: { flexDirection: "row", margin: 16, backgroundColor: colors.card, borderRadius: 10, padding: 3 },
    tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, flexDirection: "row", justifyContent: "center", gap: 6 },
    tabActive: { backgroundColor: colors.background },
    tabTxt: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    tabTxtActive: { color: colors.foreground },
    searchBar: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: 12, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, gap: 8,
    },
    searchInput: { flex: 1, height: 44, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
    hadithCard: {
      backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 10,
      padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    hadithNum: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 6 },
    hadithAr: { fontSize: 16, fontFamily: "Amiri_400Regular", color: colors.foreground, textAlign: "right", lineHeight: 28, marginBottom: 8 },
    hadithEn: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 20 },
    hadithNarrator: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.primary, marginTop: 8 },
    tapHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 8, fontStyle: "italic" },
    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyTxt: { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.mutedForeground },
    // Collection modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12 },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 16 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, paddingHorizontal: 20, marginBottom: 12 },
    colItem: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    colItemSel: { backgroundColor: colors.primary + "11" },
    colName: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    colNameAr: { fontSize: 13, fontFamily: "Amiri_400Regular", color: colors.mutedForeground },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    detailSheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingBottom: insets.bottom + 16 },
    detailHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 10 },
    detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
    detailHeaderTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    detailClose: { padding: 4 },
    detailBody: { paddingHorizontal: 20 },
    detailAr: { fontSize: 22, fontFamily: "Amiri_400Regular", textAlign: "right", color: colors.foreground, lineHeight: 40, marginBottom: 16 },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
    detailEn: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 24, marginBottom: 16 },
    detailNarrator: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary, marginBottom: 8 },
    detailGrade: { flexDirection: "row", gap: 8, marginBottom: 16 },
    detailGradeBadge: { backgroundColor: colors.primary + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    detailGradeTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary },
    shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 12, padding: 14, margin: 20, justifyContent: "center" },
    shareBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });

  const renderHadith = ({ item }: { item: LocalHadith }) => (
    <TouchableOpacity style={s.hadithCard} onPress={() => setSelectedHadith(item)} activeOpacity={0.8}>
      <Text style={s.hadithNum}>#{item.number} · {COLLECTIONS.find(c => c.id === item.collectionId)?.name}</Text>
      <Text style={s.hadithAr} numberOfLines={3}>{item.arabic}</Text>
      <Text style={s.hadithEn} numberOfLines={3}>{item.english}</Text>
      <Text style={s.hadithNarrator}>{item.narrator}</Text>
      <Text style={s.tapHint}>Tap to read full hadith →</Text>
    </TouchableOpacity>
  );

  const handleShare = async (h: LocalHadith) => {
    const colName = COLLECTIONS.find(c => c.id === h.collectionId)?.name ?? "";
    await Share.share({
      message: `${h.arabic}\n\n"${h.english}"\n\n— ${h.narrator}\n${colName} #${h.number}`,
    });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Hadith</Text>
      </View>

      {/* Collection picker button */}
      <TouchableOpacity style={s.collectionBtn} onPress={() => setCollectionOpen(true)} activeOpacity={0.8}>
        <View>
          <View style={s.collectionRow}>
            <View style={s.gradeBadge}>
              <Text style={s.gradeTxt}>{selectedCollection.grade}</Text>
            </View>
            <Text style={s.collectionName}>{selectedCollection.name}</Text>
          </View>
          <Text style={s.collectionCount}>{selectedCollection.count} hadiths</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.collectionAr}>{selectedCollection.nameAr}</Text>
          <Feather name="chevron-down" size={16} color={colors.mutedForeground} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={s.tabs}>
        {(["browse", "search"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Feather name={t === "browse" ? "list" : "search"} size={14} color={tab === t ? colors.foreground : colors.mutedForeground} />
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t === "browse" ? "Browse" : "Search"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "search" && (
        <View style={s.searchBar}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            placeholder="Search hadiths..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayHadiths}
        keyExtractor={item => String(item.id)}
        renderItem={renderHadith}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="book-open" size={40} color={colors.border} />
            <Text style={s.emptyTxt}>
              {tab === "search" && query.length <= 1 ? "Type to search hadiths" : "No hadiths found"}
            </Text>
          </View>
        }
      />

      {/* Collection picker modal */}
      <Modal visible={collectionOpen} transparent animationType="slide" onRequestClose={() => setCollectionOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setCollectionOpen(false)}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Collection</Text>
            <ScrollView>
              {COLLECTIONS.map(col => (
                <TouchableOpacity
                  key={col.id}
                  style={[s.colItem, col.id === selectedCollection.id && s.colItemSel]}
                  onPress={() => { setSelectedCollection(col); setCollectionOpen(false); }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={s.colName}>{col.name}</Text>
                    <Text style={[s.colNameAr, { fontFamily: "Amiri_400Regular" }]}>{col.nameAr}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>{col.count} hadiths</Text>
                    {col.id === selectedCollection.id && <Feather name="check" size={16} color={colors.primary} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Hadith detail modal */}
      {selectedHadith && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setSelectedHadith(null)}>
          <View style={s.detailOverlay}>
            <View style={s.detailSheet}>
              <View style={s.detailHandle} />
              <View style={s.detailHeader}>
                <Text style={s.detailHeaderTxt}>
                  {COLLECTIONS.find(c => c.id === selectedHadith.collectionId)?.name} #{selectedHadith.number}
                </Text>
                <TouchableOpacity style={s.detailClose} onPress={() => setSelectedHadith(null)}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <ScrollView style={s.detailBody} showsVerticalScrollIndicator={false}>
                <Text style={s.detailAr}>{selectedHadith.arabic}</Text>
                <View style={s.divider} />
                <Text style={s.detailEn}>{selectedHadith.english}</Text>
                <Text style={s.detailNarrator}>{selectedHadith.narrator}</Text>
                <View style={s.detailGrade}>
                  <View style={s.detailGradeBadge}>
                    <Text style={s.detailGradeTxt}>{selectedHadith.grades}</Text>
                  </View>
                </View>
              </ScrollView>
              <TouchableOpacity style={s.shareBtn} onPress={() => handleShare(selectedHadith)} activeOpacity={0.85}>
                <Feather name="share-2" size={18} color="#fff" />
                <Text style={s.shareBtnTxt}>Share Hadith</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
