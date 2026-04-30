import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getPrayerTimes, DailyPrayerTimes, DEFAULT_PRAYER_TIMES } from "@/data/prayers";
import { City, CITIES } from "@/data/cities";

export interface PrayerLog {
  date: string;
  fajr: "prayed" | "missed" | "late" | null;
  dhuhr: "prayed" | "missed" | "late" | null;
  asr: "prayed" | "missed" | "late" | null;
  maghrib: "prayed" | "missed" | "late" | null;
  isha: "prayed" | "missed" | "late" | null;
}

export interface AppSettings {
  calculationMethod: string;
  madhab: string;
  notifications: boolean;
  notificationsEnabled: boolean;
  adhanEnabled: boolean;
  darkMode: "system" | "light" | "dark";
  theme: "system" | "light" | "dark";
  arabicFontSize: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  translationEdition: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  country: string;
  isGPS: boolean;
}

interface AppContextValue {
  prayerTimes: DailyPrayerTimes;
  location: LocationInfo | null;
  settings: AppSettings;
  prayerLogs: PrayerLog[];
  dhikrCounts: Record<string, number>;
  bookmarkedSurahs: number[];
  bookmarkedDuas: string[];
  updateSettings: (s: Partial<AppSettings>) => void;
  logPrayer: (date: string, prayer: keyof Omit<PrayerLog, "date">, status: "prayed" | "missed" | "late") => void;
  incrementDhikr: (id: string) => void;
  resetDhikr: (id: string) => void;
  toggleBookmarkSurah: (id: number) => void;
  toggleBookmarkDua: (id: string) => void;
  requestLocation: () => Promise<void>;
  setManualCity: (city: City) => void;
  refreshPrayerTimes: () => void;
}

const defaultSettings: AppSettings = {
  calculationMethod: "NorthAmerica",
  madhab: "Shafi",
  notifications: true,
  notificationsEnabled: true,
  adhanEnabled: true,
  darkMode: "system",
  theme: "system",
  arabicFontSize: 26,
  showTransliteration: true,
  showTranslation: true,
  translationEdition: "en.sahih",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes>(DEFAULT_PRAYER_TIMES);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState<number[]>([]);
  const [bookmarkedDuas, setBookmarkedDuas] = useState<string[]>([]);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const [storedSettings, storedLogs, storedDhikr, storedSurahs, storedDuas, storedLocation] =
        await Promise.all([
          AsyncStorage.getItem("settings"),
          AsyncStorage.getItem("prayerLogs"),
          AsyncStorage.getItem("dhikrCounts"),
          AsyncStorage.getItem("bookmarkedSurahs"),
          AsyncStorage.getItem("bookmarkedDuas"),
          AsyncStorage.getItem("savedLocation"),
        ]);

      const loadedSettings = storedSettings
        ? { ...defaultSettings, ...JSON.parse(storedSettings) }
        : defaultSettings;
      if (storedSettings) setSettings(loadedSettings);
      if (storedLogs) setPrayerLogs(JSON.parse(storedLogs));
      if (storedDhikr) setDhikrCounts(JSON.parse(storedDhikr));
      if (storedSurahs) setBookmarkedSurahs(JSON.parse(storedSurahs));
      if (storedDuas) setBookmarkedDuas(JSON.parse(storedDuas));

      if (storedLocation) {
        const loc: LocationInfo = JSON.parse(storedLocation);
        setLocation(loc);
        setPrayerTimes(getPrayerTimes(loc.lat, loc.lng, new Date(), loadedSettings.calculationMethod, loadedSettings.madhab));
      } else {
        requestLocation();
      }
    } catch {
      requestLocation();
    }
  }

  async function requestLocation() {
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const loc: LocationInfo = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                city: "Current Location",
                country: "",
                isGPS: true,
              };
              // Try to find nearest city
              const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
              const finalLoc: LocationInfo = nearest
                ? { lat: nearest.lat, lng: nearest.lng, city: nearest.name, country: nearest.country, isGPS: true }
                : loc;
              applyLocation(finalLoc);
            },
            () => setMakkahDefault()
          );
        } else {
          setMakkahDefault();
        }
        return;
      }
      const ExpoLocation = await import("expo-location");
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        const geocode = await ExpoLocation.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const cityName = geocode[0]?.city || geocode[0]?.region || "Your Location";
        const countryName = geocode[0]?.country || "";
        const loc: LocationInfo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: cityName,
          country: countryName,
          isGPS: true,
        };
        applyLocation(loc);
      } else {
        setMakkahDefault();
      }
    } catch {
      setMakkahDefault();
    }
  }

  function findNearestCity(lat: number, lng: number): City | null {
    let nearest: City | null = null;
    let minDist = Infinity;
    for (const city of CITIES) {
      const d = Math.sqrt((city.lat - lat) ** 2 + (city.lng - lng) ** 2);
      if (d < minDist) { minDist = d; nearest = city; }
    }
    return minDist < 2 ? nearest : null;
  }

  function setMakkahDefault() {
    const loc: LocationInfo = { lat: 21.3891, lng: 39.8579, city: "Makkah", country: "Saudi Arabia", isGPS: false };
    applyLocation(loc);
  }

  function applyLocation(loc: LocationInfo) {
    setLocation(loc);
    AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
    const times = getPrayerTimes(loc.lat, loc.lng, new Date(), settings.calculationMethod, settings.madhab);
    setPrayerTimes(times);
  }

  function setManualCity(city: City) {
    const loc: LocationInfo = {
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country,
      isGPS: false,
    };
    applyLocation(loc);
  }

  function refreshPrayerTimes() {
    if (location) {
      const times = getPrayerTimes(location.lat, location.lng, new Date(), settings.calculationMethod, settings.madhab);
      setPrayerTimes(times);
    }
  }

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem("settings", JSON.stringify(updated));
      // Recalculate prayer times if method/madhab changed
      if ((partial.calculationMethod || partial.madhab) && location) {
        const times = getPrayerTimes(location.lat, location.lng, new Date(), updated.calculationMethod, updated.madhab);
        setPrayerTimes(times);
      }
      return updated;
    });
  }

  function logPrayer(date: string, prayer: keyof Omit<PrayerLog, "date">, status: "prayed" | "missed" | "late") {
    setPrayerLogs(prev => {
      const existing = prev.find(l => l.date === date);
      let updated: PrayerLog[];
      if (existing) {
        updated = prev.map(l => l.date === date ? { ...l, [prayer]: status } : l);
      } else {
        const newLog: PrayerLog = { date, fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, [prayer]: status };
        updated = [newLog, ...prev.slice(0, 59)];
      }
      AsyncStorage.setItem("prayerLogs", JSON.stringify(updated));
      return updated;
    });
  }

  function incrementDhikr(id: string) {
    setDhikrCounts(prev => {
      const updated = { ...prev, [id]: (prev[id] || 0) + 1 };
      AsyncStorage.setItem("dhikrCounts", JSON.stringify(updated));
      return updated;
    });
  }

  function resetDhikr(id: string) {
    setDhikrCounts(prev => {
      const updated = { ...prev, [id]: 0 };
      AsyncStorage.setItem("dhikrCounts", JSON.stringify(updated));
      return updated;
    });
  }

  function toggleBookmarkSurah(id: number) {
    setBookmarkedSurahs(prev => {
      const updated = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      AsyncStorage.setItem("bookmarkedSurahs", JSON.stringify(updated));
      return updated;
    });
  }

  function toggleBookmarkDua(id: string) {
    setBookmarkedDuas(prev => {
      const updated = prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id];
      AsyncStorage.setItem("bookmarkedDuas", JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AppContext.Provider value={{
      prayerTimes, location, settings, prayerLogs, dhikrCounts,
      bookmarkedSurahs, bookmarkedDuas,
      updateSettings, logPrayer, incrementDhikr, resetDhikr,
      toggleBookmarkSurah, toggleBookmarkDua, requestLocation,
      setManualCity, refreshPrayerTimes,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
