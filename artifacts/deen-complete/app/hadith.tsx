import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { hadiths, hadithCollections, hadithTopics, getDailyHadith, Hadith } from "@/data/hadith";

export default function HadithScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "daily">("all");

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;
  const daily = getDailyHadith();

  const filtered = useMemo(() => {
    let result = hadiths;
    if (selectedCollection) result = result.filter(h => h.collection === selectedCollection);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(h =>
        h.text.toLowerCase().includes(q) ||
        h.narrator.toLowerCase().includes(q) ||
        h.topic.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedCollection]);

  const s = styles(colors, bottomPad);

  async function shareHadith(h: Hadith) {
    try {
      await Share.share({
        message: `"${h.text}"\n\n— ${h.narrator} | ${h.collection}${h.number ? ` #${h.number}` : ""}`,
      });
    } catch {}
  }

  function renderHadith({ item }: { item: Hadith }) {
    const isExpanded = expanded === item.id;
    const gradeColor = item.grade === "Sahih" ? "#22C55E" : item.grade === "Hasan" ? "#F59E0B" : "#94A3B8";
    return (
      <View style={s.hadithCard}>
        <TouchableOpacity style={s.hadithHeader} onPress={() => setExpanded(isExpanded ? null : item.id)} activeOpacity={0.8}>
          <View style={s.hadithMeta}>
            <View style={[s.gradeBadge, { backgroundColor: gradeColor + "20" }]}>
              <Text style={[s.gradeText, { color: gradeColor }]}>{item.grade ?? "N/A"}</Text>
            </View>
            <Text style={s.topicBadge}>{item.topic}</Text>
          </View>
          <Text style={s.hadithText} numberOfLines={isExpanded ? undefined : 3}>{item.text}</Text>
          {isExpanded && (
            <>
              {item.arabic && <Text style={s.hadithArabic}>{item.arabic}</Text>}
              <View style={s.hadithFooter}>
                <Text style={s.hadithSource}>{item.narrator}</Text>
                <Text style={s.hadithCollection}>{item.collection}{item.number ? ` #${item.number}` : ""}</Text>
              </View>
              <TouchableOpacity style={s.shareBtn} onPress={() => shareHadith(item)}>
                <Feather name="share-2" size={14} color={colors.primary} />
                <Text style={s.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </>
          )}
          {!isExpanded && <Text style={s.narrator}>— {item.narrator}</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.tabRow}>
        {(["all", "daily"] as const).map(tab => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab === "all" ? "All Hadiths" : "Daily Hadith"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "daily" ? (
        <View style={s.dailyWrapper}>
          <View style={s.dailyCard}>
            <Text style={s.dailyLabel}>Hadith of the Day</Text>
            <Text style={s.dailyArabic}>{daily.arabic}</Text>
            <Text style={s.dailyText}>{daily.text}</Text>
            <View style={s.dailyMeta}>
              <Text style={s.dailyNarrator}>{daily.narrator}</Text>
              <Text style={s.dailyCollection}>{daily.collection}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={s.searchBox}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              style={s.searchInput}
              placeholder="Search hadiths..."
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
            horizontal
            data={[null, ...hadithCollections]}
            keyExtractor={item => item ?? "all"}
            showsHorizontalScrollIndicator={false}
            style={s.categories}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.catChip, selectedCollection === item && s.catChipActive]}
                onPress={() => setSelectedCollection(item)}
              >
                <Text style={[s.catChipText, selectedCollection === item && s.catChipTextActive]}>
                  {item ?? "All"}
                </Text>
              </TouchableOpacity>
            )}
          />

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderHadith}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 + bottomPad }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabRow: {
      flexDirection: "row",
      margin: 16,
      marginBottom: 8,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tab: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    tabTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    dailyWrapper: { flex: 1, padding: 16 },
    dailyCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    dailyLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary, marginBottom: 16 },
    dailyArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 22,
      color: colors.primary,
      textAlign: "right",
      lineHeight: 36,
      marginBottom: 16,
    },
    dailyText: {
      fontFamily: "Inter_400Regular",
      fontSize: 16,
      color: colors.foreground,
      lineHeight: 26,
      fontStyle: "italic",
      marginBottom: 16,
    },
    dailyMeta: { flexDirection: "row", justifyContent: "space-between" },
    dailyNarrator: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    dailyCollection: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground },
    categories: { flexGrow: 0, marginBottom: 8 },
    catChip: {
      paddingHorizontal: 12, paddingVertical: 7,
      backgroundColor: colors.muted, borderRadius: 20,
    },
    catChipActive: { backgroundColor: colors.primary },
    catChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
    catChipTextActive: { color: "#fff" },
    hadithCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    hadithHeader: { padding: 14 },
    hadithMeta: { flexDirection: "row", gap: 6, marginBottom: 10 },
    gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    gradeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
    topicBadge: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.mutedForeground,
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    hadithText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 22,
      fontStyle: "italic",
      marginBottom: 8,
    },
    hadithArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: 18,
      color: colors.primary,
      textAlign: "right",
      lineHeight: 32,
      marginBottom: 10,
    },
    hadithFooter: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    hadithSource: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary },
    hadithCollection: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    shareBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    shareBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary },
    narrator: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
  });
