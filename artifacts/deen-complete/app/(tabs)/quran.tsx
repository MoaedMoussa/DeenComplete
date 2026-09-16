import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, PanResponder, Dimensions, ActivityIndicator,
  ScrollView, Modal, FlatList, TextInput, Platform, StatusBar, useWindowDimensions
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Path, Line } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { allSurahsList, SURAH_START_PAGE } from "@/data/quran";
import { useT } from "@/constants/i18n";

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
  bismillahStripped?: boolean;
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

const tafsirCache = new Map<string, Record<number, string>>();

async function fetchTafsir(pageNum: number, language: string, edition?: string): Promise<Record<number, string>> {
  const isAr = language === "ar";
  const editId = isAr ? "ar.muyassar" : (edition || "en.sahih");
  const key = `tafsir_${pageNum}_${editId}`;
  
  if (tafsirCache.has(key)) return tafsirCache.get(key)!;
  
  const storageKey = `mushaf_tafsir_v1_${key}`;
  try {
    const cached = await AsyncStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      tafsirCache.set(key, parsed);
      return parsed;
    }
  } catch {}
  
  const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNum}/${editId}`);
  if (!res.ok) throw new Error("API error");
  const json = await res.json();
  if (json.code !== 200) throw new Error("API error");
  
  const data: Record<number, string> = {};
  for (const a of json.data.ayahs) {
    data[a.number] = a.text;
  }
  
  tafsirCache.set(key, data);
  AsyncStorage.setItem(storageKey, JSON.stringify(data)).catch(() => {});
  return data;
}

const RECITERS = [
  { id: 2, name: "AbdulBaset AbdulSamad" },
  { id: 3, name: "Abdur-Rahman as-Sudais" },
  { id: 4, name: "Abu Bakr al-Shatri" },
  { id: 7, name: "Mishari Rashid al-`Afasy" },
];

function SurahFrame({ name, onPress, isPlaying }: { name: string, onPress?: () => void, isPlaying?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={s.surahFrameContainer}>
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
      <View style={[s.surahTitleAbs, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
        <Text style={s.surahTitleTxt}>{name}</Text>
        {isPlaying && <Feather name="volume-2" size={18} color="#111" />}
      </View>
    </TouchableOpacity>
  );
}

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { settings, updateSettings, bookmarkedSurahs, toggleBookmarkSurah, logQuranPage, quranNotes, saveQuranNote, deleteQuranNote } = useApp();
  const t = useT(settings.language);

  const [currentPage, setCurrentPage] = useState(settings.lastReadQuranPage ?? 1);
  const [pageData, setPageData] = useState<PageAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirData, setTafsirData] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [currentNoteVerse, setCurrentNoteVerse] = useState<{ surah: number, verse: number } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  function openNoteModal(surah: number, verse: number) {
    setCurrentNoteVerse({ surah, verse });
    const key = `${surah}:${verse}`;
    setNoteInput(quranNotes[key] || "");
    setNoteModalVisible(true);
  }

  function handleSaveNote() {
    if (!currentNoteVerse) return;
    const key = `${currentNoteVerse.surah}:${currentNoteVerse.verse}`;
    if (noteInput.trim()) {
      saveQuranNote(key, noteInput.trim());
    } else {
      deleteQuranNote(key);
    }
    setNoteModalVisible(false);
  }

  function handleDeleteNote() {
    if (!currentNoteVerse) return;
    const key = `${currentNoteVerse.surah}:${currentNoteVerse.verse}`;
    deleteQuranNote(key);
    setNoteModalVisible(false);
  }

  const [search, setSearch] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const [indexTab, setIndexTab] = useState<"surahs" | "bookmarks">("surahs");

  // Focus search input when index opens (if user tapped search)
  const openSearch = () => {
    setShowIndex(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const [showReciters, setShowReciters] = useState(false);
  const [selectedSurahForAudio, setSelectedSurahForAudio] = useState<number | null>(null);
  
  const [playingSurah, setPlayingSurah] = useState<number | null>(null);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [activeReciterId, setActiveReciterId] = useState<number | null>(null);
  
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const cyclePlaybackRate = async () => {
    const nextRates = { 0.5: 0.75, 0.75: 1.0, 1.0: 1.25, 1.25: 1.5, 1.5: 1.75, 1.75: 2.0, 2.0: 0.5 } as Record<number, number>;
    const nextRate = nextRates[playbackRate] || 1.0;
    setPlaybackRate(nextRate);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextRate, true);
      } catch (e) {
        console.warn("Failed to set rate", e);
      }
    }
  };

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSurahAudio = async (surahId: number, reciterId: number) => {
    try {
      setShowReciters(false);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingSurah(surahId);
      setActiveReciterId(reciterId);
      setIsAudioPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
      
      const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahId}`);
      const json = await res.json();
      if (json.audio_file?.audio_url) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: json.audio_file.audio_url },
          { rate: playbackRate, shouldCorrectPitch: true }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis);
            setPlaybackDuration(status.durationMillis ?? 0);
            setIsAudioPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setPlayingSurah(null);
              setIsAudioPlaying(false);
            }
          }
        });
        await sound.playAsync();
      } else {
        setPlayingSurah(null);
      }
    } catch (e) {
      setPlayingSurah(null);
      console.warn("Failed to play surah", e);
    }
  };

  const togglePlayPause = async () => {
    if (soundRef.current) {
      if (isAudioPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const seekAudio = async (value: number) => {
    if (soundRef.current && playbackDuration > 0) {
      await soundRef.current.setPositionAsync(value * playbackDuration);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingSurah(null);
    setPlayingWordKey(null);
    setIsAudioPlaying(false);
  };

  const playWordAudio = async (surahId: number, ayahInSurah: number, wordIndex: number, hasBismillahStripped: boolean) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingSurah(null);
      setIsAudioPlaying(true);
      const key = `${surahId}:${ayahInSurah}:${wordIndex}`;
      setPlayingWordKey(key);
      
      const actualIndex = hasBismillahStripped ? wordIndex + 4 : wordIndex;
      const sStr = String(surahId).padStart(3, '0');
      const aStr = String(ayahInSurah).padStart(3, '0');
      const wStr = String(actualIndex + 1).padStart(3, '0');
      const url = `https://audio.qurancdn.com/wbw/${sStr}_${aStr}_${wStr}.mp3`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { rate: playbackRate, shouldCorrectPitch: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsAudioPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setPlayingWordKey(null);
            setIsAudioPlaying(false);
          }
        }
      });
      await sound.playAsync();
    } catch (e) {
      setPlayingWordKey(null);
      setIsAudioPlaying(false);
      console.warn("Failed to play word", e);
    }
  };

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

  useEffect(() => { 
    loadPage(currentPage); 
    const today = new Date().toISOString().split("T")[0];
    logQuranPage(today, currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!showTafsir) return;
    setTafsirLoading(true);
    fetchTafsir(currentPage, settings.language, settings.translationEdition)
      .then(d => {
        if (d) setTafsirData(d);
      })
      .finally(() => {
        setTafsirLoading(false);
      });
  }, [currentPage, showTafsir, settings.language, settings.translationEdition]);

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
    <View style={[s.root, { backgroundColor: colors.background }]}>
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
                  <Text style={s.pageHeaderTxt}>{t("juz")} {toArabicNum(juzNum)}</Text>
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
                      <Text style={s.loadTxt}>{t("loadingPage")} {currentPage}…</Text>
                    </View>
                  ) : error ? (
                    <View style={s.center}>
                      <Feather name="wifi-off" size={36} color="#3B5743" opacity={0.5} />
                      <Text style={s.errTxt}>{error}</Text>
                      <TouchableOpacity style={s.retryBtn} onPress={() => loadPage(currentPage)}>
                        <Text style={s.retryTxt}>{t("tryAgain")}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    groups.map((group, gi) => (
                      <View key={`${group.surahNum}_${gi}`} style={{ marginBottom: 12 }}>
                        {group.ayahs[0].numberInSurah === 1 && (
                          <SurahFrame 
                            name={group.surahNameAr.replace("سُورَةُ", "").trim()} 
                            isPlaying={playingSurah === group.surahNum}
                            onPress={() => {
                              setSelectedSurahForAudio(group.surahNum);
                              setShowReciters(true);
                            }}
                          />
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
                                return { ...a, text: stripped, bismillahStripped: true };
                              }
                            }
                            return a;
                          }).filter((a): a is PageAyah => a !== null);

                          return (
                            <>
                              {group.ayahs[0].numberInSurah === 1 && isBismillahSurah && (
                                <View style={s.bismillahWrap}>
                                  <Text style={[s.bismillahTxt, { color: colors.foreground }]}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ</Text>
                                </View>
                              )}

                              {displayAyahs.length > 0 && (
                                showTafsir ? (
                                  <View style={s.tafsirFlow}>
                                    {displayAyahs.map(a => {
                                      const words = a.text.trim().split(/\s+/);
                                      const tafsirText = tafsirData[a.number] || (tafsirLoading ? "..." : "");
                                      const verseKey = `${a.surahNumber}:${a.numberInSurah}`;
                                      const hasNote = !!quranNotes[verseKey];
                                      const highlightStyle = hasNote ? { backgroundColor: colors.primary + "33" } : undefined;
                                      
                                      return (
                                        <View key={a.number} style={s.tafsirAyahBlock}>
                                          <Text style={[s.arabicFlow, { fontSize, lineHeight: currentLineHeight, color: colors.foreground }]}>
                                            {words.map((w, i) => {
                                              const key = `${a.surahNumber}:${a.numberInSurah}:${i}`;
                                              const isPlaying = playingWordKey === key;
                                              return (
                                                <Text 
                                                  key={i} 
                                                  onPress={() => playWordAudio(a.surahNumber, a.numberInSurah, i, !!a.bismillahStripped)}
                                                  onLongPress={() => openNoteModal(a.surahNumber, a.numberInSurah)}
                                                  style={[isPlaying ? { color: GOLD } : undefined, !isPlaying && highlightStyle]}
                                                >
                                                  {w}{" "}
                                                </Text>
                                              );
                                            })}
                                            <Text 
                                              style={[s.verseMarker, highlightStyle]}
                                              onLongPress={() => openNoteModal(a.surahNumber, a.numberInSurah)}
                                            >
                                              {`﴿${toArabicNum(a.numberInSurah)}﴾`} 
                                            </Text>
                                          </Text>
                                          {!!tafsirText && (
                                            <Text style={[s.tafsirText, { fontSize: settings.translationFontSize || 16, color: colors.foreground, textAlign: settings.language === "ar" ? "right" : "left", writingDirection: settings.language === "ar" ? "rtl" : "ltr" }]}>
                                              {tafsirText}
                                            </Text>
                                          )}
                                        </View>
                                      );
                                    })}
                                  </View>
                                ) : (
                                  <Text style={[s.arabicFlow, { fontSize, lineHeight: currentLineHeight, color: colors.foreground }]}>
                                    {displayAyahs.map(a => {
                                      const words = a.text.trim().split(/\s+/);
                                      const verseKey = `${a.surahNumber}:${a.numberInSurah}`;
                                      const hasNote = !!quranNotes[verseKey];
                                      const highlightStyle = hasNote ? { backgroundColor: colors.primary + "33" } : undefined;

                                      return (
                                        <React.Fragment key={a.number}>
                                          {words.map((w, i) => {
                                            const key = `${a.surahNumber}:${a.numberInSurah}:${i}`;
                                            const isPlaying = playingWordKey === key;
                                            return (
                                              <Text 
                                                key={i} 
                                                onPress={() => playWordAudio(a.surahNumber, a.numberInSurah, i, !!a.bismillahStripped)}
                                                onLongPress={() => openNoteModal(a.surahNumber, a.numberInSurah)}
                                                style={[isPlaying ? { color: GOLD } : undefined, !isPlaying && highlightStyle]}
                                              >
                                                {w}{" "}
                                              </Text>
                                            );
                                          })}
                                          <Text 
                                            style={[s.verseMarker, highlightStyle]}
                                            onLongPress={() => openNoteModal(a.surahNumber, a.numberInSurah)}
                                          >
                                            {`﴿${toArabicNum(a.numberInSurah)}﴾`} 
                                          </Text>
                                        </React.Fragment>
                                      );
                                    })}
                                  </Text>
                                )
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

            <TouchableOpacity 
              onPress={() => setShowTafsir(!showTafsir)} 
              style={[s.overlayBtn, showTafsir && { backgroundColor: colors.primary, borderRadius: 8 }]} 
              hitSlop={{top:10,bottom:10,left:10,right:10}}
            >
              <Feather name="book-open" size={24} color={showTafsir ? "#fff" : colors.foreground} />
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={openSearch}
              style={[s.quickSearchBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <Text style={[s.quickSearchTxt, { color: colors.mutedForeground }]} numberOfLines={1}>{t("quranSearchPrompt")}</Text>
            </TouchableOpacity>

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
                 <Text style={[s.navOf, { color: colors.mutedForeground }]}>{t("of604")}</Text>
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
            <Text style={[s.modalTitle, { color: colors.foreground }]}>{t("index")}</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={[s.searchBox, { backgroundColor: colors.muted }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              ref={searchInputRef}
              style={[s.searchInput, { color: colors.foreground }]}
              placeholder={t("search")}
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
            {(["surahs", "bookmarks"] as const).map(tabKey => (
              <TouchableOpacity
                key={tabKey}
                style={[s.tabBtn, tabKey === indexTab && [s.tabBtnActive, { backgroundColor: colors.card }]]}
                onPress={() => { setIndexTab(tabKey); setSearch(""); }}
              >
                <Text style={[s.tabTxt, { color: tabKey === indexTab ? colors.foreground : colors.mutedForeground }]}>
                  {tabKey === "surahs" ? t("allSurahs") : t("bookmarked")}
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
                    <Text style={[s.rowName, { color: colors.foreground }]}>{settings.language === "ar" ? item.nameArabic : item.name}</Text>
                    <View style={s.rowMeta}>
                      <Text style={[s.rowTrans, { color: colors.mutedForeground }]}>{settings.language === "ar" ? item.name : item.nameTranslation}</Text>
                      <View style={[s.typeDot, { backgroundColor: isMeccan ? "#16A34A" : "#2563EB" }]} />
                      <Text style={[s.rowVerses, { color: colors.mutedForeground }]}>{item.totalVerses} {t("verses")}</Text>
                    </View>
                  </View>
                  <View style={s.rowRight}>
                    <Text style={[s.rowArabic, { color: colors.primary }]}>{settings.language === "ar" ? "" : item.nameArabic}</Text>
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
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>{t("readerSettings")}</Text>

            <Text style={[s.settingLabel, { color: colors.mutedForeground }]}>{t("arabicFontSize")}</Text>
            <View style={[s.fontRow, { paddingHorizontal: 16 }]}>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={18}
                maximumValue={48}
                step={2}
                value={fontSize}
                onValueChange={(val) => updateSettings({ arabicFontSize: val })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>

            <Text style={[s.settingLabel, { color: colors.mutedForeground, marginTop: 10 }]}>{t("translationFontSize")}</Text>
            <View style={[s.fontRow, { paddingHorizontal: 16 }]}>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={12}
                maximumValue={32}
                step={2}
                value={settings.translationFontSize || 16}
                onValueChange={(val) => updateSettings({ translationFontSize: val })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
            </View>

            <Text style={[s.settingLabel, { color: colors.mutedForeground, marginTop: 20 }]}>{t("jumpToPage")}</Text>
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

      {/* Note Modal */}
      <Modal visible={noteModalVisible} transparent animationType="fade" onRequestClose={() => setNoteModalVisible(false)}>
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={() => setNoteModalVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={[s.modalCenter, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.foreground }]}>
                  {currentNoteVerse ? `Note: Surah ${currentNoteVerse.surah}, Verse ${currentNoteVerse.verse}` : "Note"}
                </Text>
                <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Write your private note here..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                autoFocus
              />
              <View style={s.noteActions}>
                {!!quranNotes[`${currentNoteVerse?.surah}:${currentNoteVerse?.verse}`] && (
                  <TouchableOpacity style={s.noteBtnDelete} onPress={handleDeleteNote}>
                    <Feather name="trash-2" size={16} color="#ef4444" />
                    <Text style={s.noteBtnDeleteTxt}>Delete</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={[s.noteBtnSave, { backgroundColor: colors.primary }]} onPress={handleSaveNote}>
                  <Text style={s.noteBtnSaveTxt}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Reciters Modal */}
      <Modal visible={showReciters} transparent animationType="slide" onRequestClose={() => setShowReciters(false)}>
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={() => setShowReciters(false)}>
          <View style={[s.sheet, { backgroundColor: colors.background, maxHeight: '80%' }]}>
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>{t("selectReciter")}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {RECITERS.map(r => (
                <TouchableOpacity 
                  key={r.id} 
                  style={[s.row, { borderBottomColor: colors.border, justifyContent: 'space-between' }]}
                  onPress={() => {
                    if (selectedSurahForAudio) {
                      playSurahAudio(selectedSurahForAudio, r.id);
                    }
                  }}
                >
                  <Text style={[s.rowName, { color: colors.foreground }]}>{r.name}</Text>
                  <Feather name="play-circle" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: (insets.bottom || 20) + 20 }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Audio Player Footer */}
      {(playingSurah || playingWordKey) && (
        <View style={[s.audioPlayerBlock, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={s.audioPlayerInner}>
            <View style={s.audioInfo}>
              <Text style={[s.audioSurahName, { color: colors.foreground }]} numberOfLines={1}>
                {playingWordKey ? "Reciting Word" : (allSurahsList.find(s => s.number === playingSurah)?.name || "Reciting...")}
              </Text>
              <Text style={[s.audioReciterName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {playingWordKey ? "Word-by-word" : (RECITERS.find(r => r.id === activeReciterId)?.name || "Audio")}
              </Text>
            </View>
            
            <View style={s.audioControls}>
              <TouchableOpacity onPress={cyclePlaybackRate} style={[s.speedBtn, { backgroundColor: colors.muted }]}>
                <Text style={[s.speedBtnTxt, { color: colors.foreground }]}>{playbackRate}x</Text>
              </TouchableOpacity>
              {playingSurah && (
                <TouchableOpacity onPress={togglePlayPause} style={[s.playPauseBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name={isAudioPlaying ? "pause" : "play"} size={22} color={colors.primaryForeground} style={{ marginLeft: isAudioPlaying ? 0 : 2 }} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={stopAudio} style={[s.stopBtn, { backgroundColor: colors.muted }]}>
                <Feather name="square" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
          
          {playingSurah && playbackDuration > 0 && (
            <View style={s.sliderContainer}>
              <Text style={[s.timeText, { color: colors.mutedForeground }]}>
                {Math.floor(playbackPosition / 60000)}:{String(Math.floor((playbackPosition % 60000) / 1000)).padStart(2, '0')}
              </Text>
              <Slider
                style={s.slider}
                minimumValue={0}
                maximumValue={1}
                value={playbackDuration > 0 ? playbackPosition / playbackDuration : 0}
                onSlidingComplete={seekAudio}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={[s.timeText, { color: colors.mutedForeground }]}>
                {Math.floor(playbackDuration / 60000)}:{String(Math.floor((playbackDuration % 60000) / 1000)).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      )}
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
  tafsirFlow: { marginTop: 4 },
  tafsirAyahBlock: { marginBottom: 24 },
  tafsirText: { fontFamily: "Inter_400Regular", color: "#555", marginTop: 8 },
  
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 14 },
  loadTxt: { fontFamily: "Inter_400Regular", fontSize: 14, color: DARK_GREEN },
  errTxt: { fontFamily: "Inter_400Regular", fontSize: 13, color: DARK_GREEN, textAlign: "center" },
  retryBtn: { backgroundColor: DARK_GREEN, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  retryTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },

  overlayLayer: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  overlayTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.9)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.1)" },
  quickSearchBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  quickSearchTxt: { fontFamily: "Inter_400Regular", fontSize: 13 },
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

  audioPlayerBlock: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20 },
  audioPlayerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  audioInfo: { flex: 1, marginRight: 16 },
  audioSurahName: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 2 },
  audioReciterName: { fontFamily: "Inter_500Medium", fontSize: 12 },
  audioControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  speedBtn: { width: 44, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  speedBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  playPauseBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  stopBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  sliderContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  slider: { flex: 1, height: 40 },
  timeText: { fontFamily: "Inter_500Medium", fontSize: 11, width: 36, textAlign: "center" },
  modalCenter: { width: "85%", borderRadius: 16, padding: 20, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  noteInput: { minHeight: 120, borderWidth: 1, borderRadius: 10, padding: 12, textAlignVertical: "top", fontFamily: "Inter_400Regular", fontSize: 16, marginBottom: 16 },
  noteActions: { flexDirection: "row", alignItems: "center" },
  noteBtnDelete: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 12 },
  noteBtnDeleteTxt: { color: "#ef4444", fontFamily: "Inter_500Medium", fontSize: 15 },
  noteBtnSave: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  noteBtnSaveTxt: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
