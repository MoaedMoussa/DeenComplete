import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { duas, duaCategories, Dua } from "@/data/duas";

export default function DuasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookmarkedDuas, toggleBookmarkDua } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let result = duas;
    if (selectedCategory) result = result.filter(d => d.category === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedCategory]);

  const s = styles(colors, bottomPad);

  function renderDua({ item }: { item: Dua }) {
    const isExpanded = expanded === item.id;
    const isBookmarked = bookmarkedDuas.includes(item.id);
    return (
      <View style={s.duaCard}>
        <TouchableOpacity style={s.duaHeader} onPress={() => setExpanded(isExpanded ? null : item.id)} activeOpacity={0.8}>
          <View style={s.duaHeaderLeft}>
            <View style={s.categoryBadge}>
              <Text style={s.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={s.duaTitle}>{item.title}</Text>
          </View>
          <View style={s.duaHeaderRight}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); toggleBookmarkDua(item.id); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="bookmark" size={16} color={isBookmarked ? colors.accent : colors.mutedForeground} />
            </TouchableOpacity>
            <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={s.duaBody}>
            <Text style={s.duaArabic}>{item.arabic}</Text>
            <Text style={s.duaTranslit}>{item.transliteration}</Text>
            <View style={s.duaDivider} />
            <Text style={s.duaTranslation}>{item.translation}</Text>
            <Text style={s.duaSource}>Source: {item.source}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.searchBox}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={s.searchInput}
          placeholder="Search duas..."
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
        data={[null, ...duaCategories]}
        keyExtractor={item => item ?? "all"}
        showsHorizontalScrollIndicator={false}
        style={s.categories}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.catChip, selectedCategory === item && s.catChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[s.catChipText, selectedCategory === item && s.catChipTextActive]}>
              {item ?? "All"}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderDua}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Feather name="heart" size={40} color={colors.border} />
            <Text style={s.emptyText}>No duas found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      margin: 16,
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
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.muted,
      borderRadius: 20,
    },
    catChipActive: { backgroundColor: colors.primary },
    catChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    catChipTextActive: { color: "#fff" },
    duaCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    duaHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 14,
    },
    duaHeaderLeft: { flex: 1, marginRight: 10 },
    duaHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    categoryBadge: {
      backgroundColor: colors.primary + "15",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    categoryBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: colors.primary },
    duaTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    duaBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border },
    duaArabic: {
      fontFamily: "Amiri_400Regular",
      fontSize: settings.arabicFontSize || 20,
      color: colors.primary,
      textAlign: "right",
      lineHeight: (settings.arabicFontSize || 20) * 1.8,
      paddingVertical: 14,
    },
    duaTranslit: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.mutedForeground,
      fontStyle: "italic",
      lineHeight: 20,
      marginBottom: 10,
    },
    duaDivider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },
    duaTranslation: {
      fontFamily: "Inter_400Regular",
      fontSize: settings.translationFontSize || 14,
      color: colors.foreground,
      lineHeight: (settings.translationFontSize || 14) * 1.5,
      marginBottom: 8,
    },
    duaSource: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.accent },
    emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
    emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.mutedForeground },
  });
