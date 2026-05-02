import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions, ActivityIndicator,
  ScrollView, Modal,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { allSurahsList, SURAH_START_PAGE } from "@/data/quran";

const { width: SCREEN_W } = Dimensions.get("window");

const ARABIC_NUMS = "٠١٢٣٤٥٦٧٨٩";
function toArabicNum(n: number): string {
  return String(n).split("").map(d => ARABIC_NUMS[parseInt(d)] ?? d).join("");
}

interface PageAyah {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  surahNumber: number;
  surahName: string;
  surahNameAr: string;
  surahRevType: string;
  juz: number;
  sajda: boolean;
}

const pageCache = new Map<string, PageAyah[]>();

async function fetchPage(pageNum: number, edition: string): Promise<PageAyah[]> {
  const key = `${pageNum}_${edition}`;
  if (pageCache.has(key)) return pageCache.get(key)!;

  const storageKey = `qpage_${key}`;
  try {
    const cached = await AsyncStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PageAyah[];
      pageCache.set(key, parsed);
      return parsed;
    }
  } catch {}

  const [arRes, trRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/page/${pageNum}/${edition}`),
  ]);
  if (!arRes.ok) throw new Error("API error");
  const [ar, tr] = await Promise.all([arRes.json(), trRes.json()]);
  if (ar.code !== 200) throw new Error("API error");

  const ayahs: PageAyah[] = (ar.data.ayahs as any[]).map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    translation: (tr.data?.ayahs as any[])?.[i]?.text ?? "",
    surahNumber: a.surah.number,
    surahName: a.surah.englishName,
    surahNameAr: a.surah.name,
    surahRevType: a.surah.revelationType,
    juz: a.juz,
    sajda: !!a.sajda,
  }));

  pageCache.set(key, ayahs);
  try { await AsyncStorage.setItem(storageKey, JSON.stringify(ayahs)); } catch {}
  return ayahs;
}

const EDITIONS = [
  { id: "en.sahih", label: "Sahih International" },
  { id: "en.pickthall", label: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali" },
  { id: "en.asad", label: "Muhammad Asad" },
];

export default function QuranBookReader() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const id = parseInt(surahId ?? "1", 10);
  const startPage = SURAH_START_PAGE[id] ?? 1;

  const [currentPage, setCurrentPage] = useState(startPage);
  const [pageData, setPageData] = useState<PageAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [edition, setEdition] = useState("en.sahih");
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(22);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const surah = allSurahsList.find(s => s.id === id);

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(page, edition);
      setPageData(data);
      if (page < 604) fetchPage(page + 1, edition).catch(() => {});
      if (page > 1) fetchPage(page - 1, edition).catch(() => {});
    } catch {
      setError("Could not load page. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [edition]);

  useEffect(() => { loadPage(currentPage); }, [currentPage, edition]);

  function goToPage(newPage: number) {
    if (isAnimating.current || newPage < 1 || newPage > 604) return;
    const direction = newPage > currentPageRef.current ? -1 : 1;
    isAnimating.current = true;

    Animated.timing(slideAnim, {
      toValue: direction * SCREEN_W * 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(newPage);
      slideAnim.setValue(-direction * SCREEN_W * 0.6);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }).start(() => { isAnimating.current = false; });
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dy) < Math.abs(g.dx) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goToPage(currentPageRef.current + 1);
        else if (g.dx > 50) goToPage(currentPageRef.current - 1);
      },
    })
  ).current;

  const groups: {
    surahNum: number; surahName: string; surahNameAr: string;
    revType: string; ayahs: PageAyah[];
  }[] = [];
  for (const a of pageData) {
    const last = groups[groups.length - 1];
    if (!last || last.surahNum !== a.surahNumber) {
      groups.push({
        surahNum: a.surahNumber, surahName: a.surahName,
        surahNameAr: a.surahNameAr, revType: a.surahRevType, ayahs: [a],
      });
    } else {
      last.ayahs.push(a);
    }
  }

  const juzNum = pageData[0]?.juz ?? "–";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: surah?.name ?? `Surah ${id}`,
          headerStyle: { backgroundColor: "#1A5C3A" },
          headerTitleStyle: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 17 },
          headerTintColor: "#fff",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 18, paddingRight: 4 }}>
              <TouchableOpacity onPress={() => setShowTranslation(v => !v)}>
                <Feather name="type" size={20} color={showTranslation ? "#FFD700" : "rgba(255,255,255,0.5)"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSettings(true)}>
                <Feather name="settings" size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Info bar */}
      <View style={s.infoBar}>
        <Text style={s.infoTxt}>Juz {juzNum}</Text>
        <View style={s.pagePill}>
          <Text style={s.pagePillNum}>{currentPage}</Text>
          <Text style={s.pagePillOf}> / 604</Text>
        </View>
        <Text style={[s.infoTxt, { textAlign: "right" }]}>
          {pageData[0]?.surahName ?? ""}
        </Text>
      </View>

      {/* Swipeable book page */}
      <Animated.View
        style={[s.bookWrap, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        {/* Left binding shadow */}
        <View style={s.bindingLeft} />

        <ScrollView
          style={s.page}
          contentContainerStyle={s.pageInner}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#1A5C3A" />
              <Text style={[s.loadTxt, { color: colors.mutedForeground }]}>
                Loading page {currentPage}…
              </Text>
            </View>
          ) : error ? (
            <View style={s.center}>
              <Feather name="wifi-off" size={36} color="#ccc" />
              <Text style={s.errTxt}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => loadPage(currentPage)}>
                <Text style={s.retryTxt}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Top ornament */}
              <View style={s.ornament}>
                <View style={s.ornamentLine} />
                <Text style={s.ornamentDiamond}>◆</Text>
                <View style={s.ornamentLine} />
              </View>

              {groups.map((group, gi) => (
                <View key={`${group.surahNum}_${gi}`}>
                  {/* Surah header when first ayah of surah appears on this page */}
                  {group.ayahs[0].numberInSurah === 1 && (
                    <View style={s.surahHead}>
                      <View style={s.surahHeadBox}>
                        <Text style={s.surahHeadNum}>
                          سُورَة {toArabicNum(group.surahNum)}
                        </Text>
                        <Text style={s.surahHeadAr}>{group.surahNameAr}</Text>
                        <Text style={s.surahHeadEn}>
                          {group.surahName} · {group.revType}
                        </Text>
                      </View>
                      {group.surahNum !== 1 && group.surahNum !== 9 && (
                        <Text style={s.bismillah}>
                          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
                        </Text>
                      )}
                    </View>
                  )}

                  {/* All ayahs flow as continuous Arabic text.
                      The alquran.cloud API bundles the bismillah as a prefix on verse 1
                      (e.g. "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ"). Strip those
                      first 4 words so they don't duplicate the header we already show. */}
                  {(() => {
                    const isBismillahSurah = group.surahNum !== 1 && group.surahNum !== 9;
                    const displayAyahs = group.ayahs.map((a, idx) => {
                      if (idx === 0 && a.numberInSurah === 1 && isBismillahSurah) {
                        const tokens = a.text.trim().split(/\s+/);
                        const firstBare = tokens[0]?.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "") ?? "";
                        if (firstBare.startsWith("\u0628\u0633\u0645") && tokens.length >= 4) {
                          // strip the 4-word bismillah: بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          const stripped = tokens.slice(4).join(" ").trim();
                          if (!stripped) return null; // rare: entire verse was only bismillah
                          return { ...a, text: stripped };
                        }
                      }
                      return a;
                    }).filter((a): a is PageAyah => a !== null);

                    return (
                      <>
                        <Text style={[s.arabicFlow, { fontSize, lineHeight: fontSize * 2.3 }]}>
                          {displayAyahs.map(a => (
                            <React.Fragment key={a.number}>
                              <Text>{a.text} </Text>
                              <Text style={s.verseMarker}>{`﴿${toArabicNum(a.numberInSurah)}﴾`} </Text>
                            </React.Fragment>
                          ))}
                        </Text>

                        {showTranslation && displayAyahs.length > 0 && (
                          <View style={s.transBlock}>
                            {displayAyahs.map(a => (
                              <View key={a.number} style={s.transRow}>
                                <View style={s.transNum}>
                                  <Text style={s.transNumTxt}>{a.numberInSurah}</Text>
                                </View>
                                <Text style={s.transTxt}>{a.translation}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    );
                  })()}

                  {gi < groups.length - 1 && <View style={s.groupDivider} />}
                </View>
              ))}

              {/* Bottom page number */}
              <View style={s.pageBottom}>
                <View style={s.ornamentLine} />
                <Text style={s.pageBottomNum}>{toArabicNum(currentPage)}</Text>
                <View style={s.ornamentLine} />
              </View>
            </>
          )}
        </ScrollView>

        {/* Right edge shadow */}
        <View style={s.edgeShadow} />
      </Animated.View>

      {/* Navigation */}
      <View style={[s.nav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity
          style={[s.navBtn, currentPage <= 1 && s.navDim]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <Feather name="chevron-right" size={20} color={currentPage <= 1 ? colors.border : "#1A5C3A"} />
          <Text style={[s.navBtnTxt, { color: currentPage <= 1 ? colors.border : "#1A5C3A" }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navMid} onPress={() => setShowSettings(true)}>
          <Text style={[s.navPage, { color: colors.foreground }]}>{currentPage}</Text>
          <Text style={[s.navOf, { color: colors.mutedForeground }]}>of 604</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.navBtn, s.navBtnR, currentPage >= 604 && s.navDim]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage >= 604}
        >
          <Text style={[s.navBtnTxt, { color: currentPage >= 604 ? colors.border : "#1A5C3A" }]}>Next</Text>
          <Feather name="chevron-left" size={20} color={currentPage >= 604 ? colors.border : "#1A5C3A"} />
        </TouchableOpacity>
      </View>

      {/* Settings modal */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={[s.sheet, { backgroundColor: colors.background }]}>
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Reader Settings</Text>

            <Text style={[s.settingLabel, { color: colors.mutedForeground }]}>Arabic Font Size</Text>
            <View style={s.fontRow}>
              <TouchableOpacity
                style={[s.fontBtn, { backgroundColor: colors.muted }]}
                onPress={() => setFontSize(f => Math.max(16, f - 2))}
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.fontVal, { color: colors.foreground }]}>{fontSize}px</Text>
              <TouchableOpacity
                style={[s.fontBtn, { backgroundColor: colors.muted }]}
                onPress={() => setFontSize(f => Math.min(36, f + 2))}
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[s.settingLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Jump to Page</Text>
            <View style={s.jumpRow}>
              {[1, 50, 100, 200, 300, 400, 500, 604].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.jumpBtn, { backgroundColor: currentPage === p ? "#1A5C3A" : colors.muted }]}
                  onPress={() => { goToPage(p); setShowSettings(false); }}
                >
                  <Text style={[s.jumpTxt, { color: currentPage === p ? "#fff" : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.settingLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Translation</Text>
            {EDITIONS.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[s.edRow, { borderColor: colors.border }]}
                onPress={() => { setEdition(e.id); setShowSettings(false); }}
              >
                <Text style={[s.edTxt, { color: colors.foreground }]}>{e.label}</Text>
                {edition === e.id && <Feather name="check" size={16} color="#1A5C3A" />}
              </TouchableOpacity>
            ))}

            <View style={{ height: insets.bottom + 20 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const PRIMARY = "#1A5C3A";
const GOLD = "#C8973A";

const s = StyleSheet.create({
  root: { flex: 1 },

  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: PRIMARY,
  },
  infoTxt: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1 },
  pagePill: { flexDirection: "row", alignItems: "baseline" },
  pagePillNum: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  pagePillOf: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)" },

  bookWrap: { flex: 1, flexDirection: "row", paddingHorizontal: 6, paddingVertical: 6 },
  bindingLeft: {
    width: 10,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: GOLD + "40",
    borderRightWidth: 1,
    borderRightColor: GOLD + "60",
  },
  page: { flex: 1, backgroundColor: "#FFFDF5" },
  pageInner: { padding: 18, paddingBottom: 32 },
  edgeShadow: {
    width: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 14 },
  loadTxt: { fontFamily: "Inter_400Regular", fontSize: 14 },
  errTxt: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", textAlign: "center" },
  retryBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  retryTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },

  ornament: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
  ornamentLine: { flex: 1, height: 1, backgroundColor: GOLD + "80" },
  ornamentDiamond: { fontSize: 10, color: GOLD },

  surahHead: { alignItems: "center", marginBottom: 16 },
  surahHeadBox: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    backgroundColor: GOLD + "0A",
  },
  surahHeadNum: { fontFamily: "Inter_400Regular", fontSize: 11, color: GOLD, marginBottom: 3 },
  surahHeadAr: { fontFamily: "Amiri_700Bold", fontSize: 26, color: PRIMARY },
  surahHeadEn: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#888", marginTop: 3 },
  bismillah: {
    fontFamily: "Amiri_400Regular",
    fontSize: 20,
    textAlign: "center",
    color: PRIMARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  arabicFlow: {
    fontFamily: "Amiri_400Regular",
    textAlign: "right",
    writingDirection: "rtl",
    color: "#1A1A1A",
  },
  verseMarker: { color: GOLD, fontSize: 14 },

  transBlock: {
    borderTopWidth: 1,
    borderTopColor: GOLD + "30",
    paddingTop: 12,
    marginBottom: 8,
  },
  transRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  transNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: PRIMARY + "18",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0, marginTop: 1,
  },
  transNumTxt: { fontFamily: "Inter_700Bold", fontSize: 10, color: PRIMARY },
  transTxt: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: "#555", flex: 1, fontStyle: "italic" },

  groupDivider: { height: 1, backgroundColor: GOLD + "40", marginVertical: 12 },

  pageBottom: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 10 },
  pageBottomNum: { fontFamily: "Amiri_400Regular", fontSize: 16, color: GOLD },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  navBtnR: { justifyContent: "flex-end" },
  navDim: { opacity: 0.3 },
  navBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  navMid: { alignItems: "center" },
  navPage: { fontFamily: "Inter_700Bold", fontSize: 22 },
  navOf: { fontFamily: "Inter_400Regular", fontSize: 11 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  settingLabel: {
    fontFamily: "Inter_600SemiBold", fontSize: 12,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },
  fontRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  fontBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  fontVal: { fontFamily: "Inter_700Bold", fontSize: 18, minWidth: 52, textAlign: "center" },
  jumpRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jumpBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  jumpTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  edRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  edTxt: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
