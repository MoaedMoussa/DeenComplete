import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, PanResponder, Dimensions, ActivityIndicator,
  ScrollView, Modal, FlatList, TextInput, Platform, StatusBar, useWindowDimensions
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Path, Line } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList, SURAH_START_PAGE } from "@/data/quran";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const ARABIC_NUMS = "٠١٢٣٤٥٦٧٨٩";
function toArabicNum(n: number): string {
  return String(n).split("").map(d => ARABIC_NUMS[parseInt(d)] ?? d).join("");
}

interface PageAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surahNumber: number;
  surahName: string;
  surahNameAr: string;
  surahRevType: string;
  juz: number;
  sajda: boolean;
}

const pageCache = new Map<string, PageAyah[]>();

async function fetchPage(pageNum: number): Promise<PageAyah[]> {
  const key = `page_${pageNum}`;
  if (pageCache.has(key)) return pageCache.get(key)!;

  const storageKey = `mushaf_v1_${key}`;
  try {
    const cached = await AsyncStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PageAyah[];
      pageCache.set(key, parsed);
      return parsed;
    }
  } catch {}

  const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`);
  if (!res.ok) throw new Error("API error");
  const json = await res.json();
  if (json.code !== 200) throw new Error("API error");

  const ayahs: PageAyah[] = (json.data.ayahs as any[]).map((a: any) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
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

function SurahFrame({ name }: { name: string }) {
  return (
    <View style={s.surahFrameContainer}>
      <Svg width="100%" height="54" viewBox="0 0 340 54" preserveAspectRatio="none">
        <Rect x="2" y="2" width="336" height="50" fill="#FDF8E7" stroke="#3B5743" strokeWidth="1.5" />
        <Rect x="6" y="6" width="328" height="42" fill="none" stroke="#3B5743" strokeWidth="1" />
        
        <Rect x="10" y="10" width="30" height="34" fill="#3B5743" opacity="0.1" />
        <Rect x="300" y="10" width="30" height="34" fill="#3B5743" opacity="0.1" />
        
        <Rect x="44" y="10" width="252" height="34" fill="none" stroke="#3B5743" strokeWidth="1" />
        <Rect x="46" y="12" width="248" height="30" fill="none" stroke="#3B5743" strokeWidth="0.5" />
        
        <Path d="M25,20 L30,27 L25,34 L20,27 Z" fill="#3B5743" />
        <Path d="M315,20 L320,27 L315,34 L310,27 Z" fill="#3B5743" />
      </Svg>
      <View style={s.surahTitleAbs}>
        <Text style={s.surahTitleTxt}>{name}</Text>
      </View>
    </View>
  );
}

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { settings, updateSettings, bookmarkedSurahs, toggleBookmarkSurah } = useApp();

  const [currentPage, setCurrentPage] = useState(settings.lastReadQuranPage ?? 1);
  const [pageData, setPageData] = useState<PageAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [search, setSearch] = useState("");
  const [indexTab, setIndexTab] = useState<"surahs" | "bookmarks">("surahs");

  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const topPad = Platform.OS === "web" ? 16 : insets.top || 16;
  const bottomPad = insets.bottom || 16;

  // Calculate dynamic dimensions for a perfect page layout
  // A standard Quran page has a tall aspect ratio (~0.65 to 0.7)
  const availableHeight = windowHeight - topPad - bottomPad;
  const targetPageWidth = Math.min(windowWidth, availableHeight * 0.72, 800);

  // Calculate optimal font size to perfectly fit ~15 lines per page
  // Subtracting ~150px to account for the top and bottom headers/padding inside the frame
  const optimalLineHeight = Math.max(30, (availableHeight - 150) / 15);
  const optimalFontSize = optimalLineHeight / 2.2;
  
  // If the user has manually changed the font size from the default (26), respect it.
  // Otherwise, use the dynamically calculated "perfect" font size for this screen.
  const userHasCustomFontSize = settings.arabicFontSize && settings.arabicFontSize !== 26;
  const fontSize = userHasCustomFontSize ? settings.arabicFontSize : optimalFontSize;
  const currentLineHeight = fontSize * 2.2;

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(page);
      setPageData(data);
      if (page < 604) fetchPage(page + 1).catch(() => {});
      if (page > 1) fetchPage(page - 1).catch(() => {});
    } catch {
      setError("Could not load page. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(currentPage); }, [currentPage]);

  function goToPage(newPage: number) {
    if (isAnimating.current || newPage < 1 || newPage > 604) return;
    const direction = newPage > currentPageRef.current ? 1 : -1;
    isAnimating.current = true;
    setShowOverlay(false);

    Animated.timing(slideAnim, {
      toValue: direction * SCREEN_W * 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(newPage);
      updateSettings({ lastReadQuranPage: newPage });
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
        if (g.dx < -50) goToPage(currentPageRef.current + 1); // Swipe left -> next page
        else if (g.dx > 50) goToPage(currentPageRef.current - 1); // Swipe right -> prev page
      },
    })
  ).current;

  const handleTap = (e: any) => {
    const x = e.nativeEvent.locationX;
    if (x < SCREEN_W * 0.25) {
      goToPage(currentPage + 1); // Tap left -> next page
    } else if (x > SCREEN_W * 0.75) {
      goToPage(currentPage - 1); // Tap right -> prev page
    } else {
      setShowOverlay(!showOverlay); // Tap center -> toggle overlay
    }
  };

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

  const juzNum = pageData[0]?.juz ?? 1;
  const firstSurah = allSurahsList.find(s => s.id === (groups[0]?.surahNum ?? 1));
  const headerSurahName = firstSurah ? `${firstSurah.nameArabic}` : "";

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
  const listData = indexTab === "bookmarks" ? bookmarked : (search ? filtered : allSurahsList);

  return (
    <View style={s.root}>
      <StatusBar hidden={!showOverlay} animated />
      
      {/* Immersive Reader Layer */}
      <Animated.View
        style={[s.bookWrap, { maxWidth: targetPageWidth, transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={s.pageContainer}>
            <View style={s.pageBorderOuter}>
              <View style={s.pageBorderInner}>
                
                {/* Page Header */}
                <View style={s.pageHeader}>
                  <Text style={s.pageHeaderTxt}>الجزء {toArabicNum(juzNum)}</Text>
                  <Text style={s.pageHeaderTxt}>{toArabicNum(currentPage)}</Text>
                  <Text style={s.pageHeaderTxt}>{headerSurahName}</Text>
                </View>
                <View style={s.dashedLineContainer}>
                  <Svg height="2" width="100%">
                    <Line x1="0" y1="1" x2="100%" y2="1" stroke="#3B5743" strokeWidth="1.5" strokeDasharray="3, 3" />
                  </Svg>
                </View>

                {/* Content */}
                <ScrollView 
                  style={s.pageContent} 
                  contentContainerStyle={s.pageContentInner}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {loading ? (
                    <View style={s.center}>
                      <ActivityIndicator size="large" color="#3B5743" />
                      <Text style={s.loadTxt}>Loading page {currentPage}…</Text>
                    </View>
                  ) : error ? (
                    <View style={s.center}>
                      <Feather name="wifi-off" size={36} color="#3B5743" opacity={0.5} />
                      <Text style={s.errTxt}>{error}</Text>
                      <TouchableOpacity style={s.retryBtn} onPress={() => loadPage(currentPage)}>
                        <Text style={s.retryTxt}>Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    groups.map((group, gi) => (
                      <View key={`${group.surahNum}_${gi}`} style={{ marginBottom: 12 }}>
                        {group.ayahs[0].numberInSurah === 1 && (
                          <SurahFrame name={group.surahNameAr.replace("سُورَةُ", "").trim()} />
                        )}

                        {(() => {
                          const isBismillahSurah = group.surahNum !== 1 && group.surahNum !== 9;
                          const displayAyahs = group.ayahs.map((a, idx) => {
                            if (idx === 0 && a.numberInSurah === 1 && isBismillahSurah) {
                              const tokens = a.text.trim().split(/\s+/);
                              const firstBare = tokens[0]?.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "") ?? "";
                              if (firstBare.startsWith("\u0628\u0633\u0645") && tokens.length >= 4) {
                                const stripped = tokens.slice(4).join(" ").trim();
                                if (!stripped) return null;
                                return { ...a, text: stripped };
                              }
                            }
                            return a;
                          }).filter((a): a is PageAyah => a !== null);

                          return (
                            <>
                              {group.ayahs[0].numberInSurah === 1 && isBismillahSurah && (
                                <View style={s.bismillahWrap}>
                                  <Text style={s.bismillahTxt}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ</Text>
                                </View>
                              )}

                              {displayAyahs.length > 0 && (
                                <Text style={[s.arabicFlow, { fontSize, lineHeight: currentLineHeight }]}>
                                  {displayAyahs.map(a => (
                                    <React.Fragment key={a.number}>
                                      <Text>{a.text} </Text>
                                      <Text style={s.verseMarker}>{`﴿${toArabicNum(a.numberInSurah)}﴾`} </Text>
                                    </React.Fragment>
                                  ))}
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </View>
                    ))
                  )}
                </ScrollView>

              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Overlay UI */}
      {showOverlay && (
        <View style={s.overlayLayer} pointerEvents="box-none">
          <View style={[s.overlayTopBar, { paddingTop: topPad }]}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={s.overlayBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Feather name="settings" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{flex: 1}} />
            <TouchableOpacity onPress={() => setShowIndex(true)} style={s.overlayBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Feather name="list" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <View style={s.overlayBottomBar}>
            {/* Quick page navigator */}
            <View style={[s.pageSliderBlock, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
               <TouchableOpacity style={[s.navBtn, currentPage >= 604 && s.navDim]} onPress={() => goToPage(currentPage + 1)}>
                  <Feather name="chevron-left" size={24} color={colors.foreground} />
               </TouchableOpacity>
               <View style={s.navMid}>
                 <Text style={[s.navPage, { color: colors.foreground }]}>{currentPage}</Text>
                 <Text style={[s.navOf, { color: colors.mutedForeground }]}>of 604</Text>
               </View>
               <TouchableOpacity style={[s.navBtn, currentPage <= 1 && s.navDim]} onPress={() => goToPage(currentPage - 1)}>
                  <Feather name="chevron-right" size={24} color={colors.foreground} />
               </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Index Modal */}
      <Modal visible={showIndex} animationType="slide" onRequestClose={() => setShowIndex(false)}>
        <View style={[s.modalRoot, { backgroundColor: colors.background, paddingTop: topPad }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowIndex(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Index</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={[s.searchBox, { backgroundColor: colors.muted }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.searchInput, { color: colors.foreground }]}
              placeholder="Search surah…"
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={v => { setSearch(v); if (v) setIndexTab("surahs"); }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[s.tabs, { backgroundColor: colors.muted }]}>
            {(["surahs", "bookmarks"] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tabBtn, t === indexTab && [s.tabBtnActive, { backgroundColor: colors.card }]]}
                onPress={() => { setIndexTab(t); setSearch(""); }}
              >
                <Text style={[s.tabTxt, { color: t === indexTab ? colors.foreground : colors.mutedForeground }]}>
                  {t === "surahs" ? "Surahs" : "Bookmarks"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={listData}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const bm = bookmarkedSurahs.includes(item.id);
              const isMeccan = item.revelationType === "Meccan";
              return (
                <TouchableOpacity
                  style={[s.row, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    const page = SURAH_START_PAGE[item.id] ?? 1;
                    goToPage(page);
                    setShowIndex(false);
                  }}
                >
                  <View style={[s.numWrap, { backgroundColor: colors.primary + "10" }]}>
                    <Text style={[s.numTxt, { color: colors.primary }]}>{item.id}</Text>
                  </View>
                  <View style={s.rowInfo}>
                    <Text style={[s.rowName, { color: colors.foreground }]}>{item.name}</Text>
                    <View style={s.rowMeta}>
                      <Text style={[s.rowTrans, { color: colors.mutedForeground }]}>{item.nameTranslation}</Text>
                      <View style={[s.typeDot, { backgroundColor: isMeccan ? "#16A34A" : "#2563EB" }]} />
                      <Text style={[s.rowVerses, { color: colors.mutedForeground }]}>{item.totalVerses} v.</Text>
                    </View>
                  </View>
                  <View style={s.rowRight}>
                    <Text style={[s.rowArabic, { color: colors.primary }]}>{item.nameArabic}</Text>
                    <TouchableOpacity onPress={() => toggleBookmarkSurah(item.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons name={bm ? "bookmark" : "bookmark-outline"} size={16} color={bm ? colors.accent : colors.border} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={[s.sheet, { backgroundColor: colors.background }]}>
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Reader Settings</Text>

            <Text style={[s.settingLabel, { color: colors.mutedForeground }]}>Arabic Font Size</Text>
            <View style={s.fontRow}>
              <TouchableOpacity style={[s.fontBtn, { backgroundColor: colors.muted }]} onPress={() => updateSettings({ arabicFontSize: Math.max(16, fontSize - 2) })}>
                <Feather name="minus" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.fontVal, { color: colors.foreground }]}>{fontSize}px</Text>
              <TouchableOpacity style={[s.fontBtn, { backgroundColor: colors.muted }]} onPress={() => updateSettings({ arabicFontSize: Math.min(36, fontSize + 2) })}>
                <Feather name="plus" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[s.settingLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Jump to Page</Text>
            <View style={s.jumpRow}>
              {[1, 50, 100, 200, 300, 400, 500, 604].map(p => (
                <TouchableOpacity key={p} style={[s.jumpBtn, { backgroundColor: currentPage === p ? "#1A5C3A" : colors.muted }]} onPress={() => { goToPage(p); setShowSettings(false); }}>
                  <Text style={[s.jumpTxt, { color: currentPage === p ? "#fff" : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: (insets.bottom || 20) + 20 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const CREAM = "#FDF8E7";
const DARK_GREEN = "#3B5743";
const GOLD = "#A58B55";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center" }, // Black background underneath gives immersive feel
  bookWrap: { flex: 1, width: "100%" },
  pageContainer: { flex: 1, backgroundColor: CREAM, padding: 8, width: "100%" },
  pageBorderOuter: { flex: 1, borderWidth: 2, borderColor: DARK_GREEN, padding: 3 },
  pageBorderInner: { flex: 1, borderWidth: 1, borderColor: DARK_GREEN, padding: 6, paddingBottom: 0 },
  
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 4 },
  pageHeaderTxt: { fontFamily: "Amiri_400Regular", fontSize: 16, color: DARK_GREEN },
  dashedLineContainer: { marginBottom: 6 },
  
  pageContent: { flex: 1 },
  pageContentInner: { paddingHorizontal: 4, paddingBottom: 24 },
  
  surahFrameContainer: { alignItems: "center", justifyContent: "center", marginVertical: 12 },
  surahTitleAbs: { position: "absolute", zIndex: 10 },
  surahTitleTxt: { fontFamily: "Amiri_700Bold", fontSize: 22, color: "#111" },
  
  bismillahWrap: { alignItems: "center", marginVertical: 8 },
  bismillahTxt: { fontFamily: "Amiri_700Bold", fontSize: 20, color: "#111" },
  
  arabicFlow: { fontFamily: "Amiri_700Bold", textAlign: "justify", writingDirection: "rtl", color: "#111" },
  verseMarker: { color: GOLD },
  
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 14 },
  loadTxt: { fontFamily: "Inter_400Regular", fontSize: 14, color: DARK_GREEN },
  errTxt: { fontFamily: "Inter_400Regular", fontSize: 13, color: DARK_GREEN, textAlign: "center" },
  retryBtn: { backgroundColor: DARK_GREEN, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  retryTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },

  overlayLayer: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  overlayTopBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.9)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.1)" },
  overlayBtn: { padding: 8 },
  overlayBottomBar: { backgroundColor: "rgba(255,255,255,0.95)" },
  pageSliderBlock: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  navBtn: { padding: 12 },
  navDim: { opacity: 0.3 },
  navMid: { flex: 1, alignItems: "center" },
  navPage: { fontFamily: "Inter_700Bold", fontSize: 20 },
  navOf: { fontFamily: "Inter_400Regular", fontSize: 12 },

  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  settingLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  fontRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  fontBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  fontVal: { fontFamily: "Inter_700Bold", fontSize: 18, minWidth: 52, textAlign: "center" },
  jumpRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jumpBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  jumpTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontFamily: "Inter_500Medium", fontSize: 12 },
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
  rowArabic: { fontFamily: "Amiri_700Bold", fontSize: 22 },
});
