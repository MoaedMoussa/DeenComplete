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
  timezone: string;
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
  locationLoading: boolean;
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
  calculationMethod: "MuslimWorldLeague",
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

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes>(DEFAULT_PRAYER_TIMES);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState<number[]>([]);
  const [bookmarkedDuas, setBookmarkedDuas] = useState<string[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => { loadStoredData(); }, []);

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

      const loadedSettings: AppSettings = storedSettings
        ? { ...defaultSettings, ...JSON.parse(storedSettings) }
        : defaultSettings;

      if (storedSettings) setSettings(loadedSettings);
      if (storedLogs) setPrayerLogs(JSON.parse(storedLogs));
      if (storedDhikr) setDhikrCounts(JSON.parse(storedDhikr));
      if (storedSurahs) setBookmarkedSurahs(JSON.parse(storedSurahs));
      if (storedDuas) setBookmarkedDuas(JSON.parse(storedDuas));

      if (storedLocation) {
        const loc: LocationInfo = JSON.parse(storedLocation);
        if (!loc.timezone) {
          const cityMatch = CITIES.find(c => c.name === loc.city && c.country === loc.country);
          loc.timezone = cityMatch?.timezone ?? getDeviceTimezone();
          AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
        }
        setLocation(loc);
        recalcPrayerTimes(loc, loadedSettings);
        setLocationLoading(false);
      } else {
        await requestLocation();
      }
    } catch {
      await requestLocation();
    }
  }

  function recalcPrayerTimes(loc: LocationInfo, cfg: AppSettings = settings) {
    try {
      const times = getPrayerTimes(loc.lat, loc.lng, new Date(), cfg.calculationMethod, cfg.madhab);
      setPrayerTimes(times);
    } catch {
    }
  }

  async function guessFromIP(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
      clearTimeout(t);
      const data = await res.json();
      if (data && !data.error && data.latitude && data.longitude) {
        const loc: LocationInfo = {
          lat: parseFloat(String(data.latitude)),
          lng: parseFloat(String(data.longitude)),
          city: data.city ?? "Unknown",
          country: data.country_name ?? "",
          timezone: data.timezone ?? getDeviceTimezone(),
          isGPS: false,
        };
        applyLocation(loc);
        return true;
      }
    } catch {
    }
    return false;
  }

  function guessFromTimezone() {
    const tz = getDeviceTimezone();
    const match = CITIES.find(c => c.timezone === tz);
    if (match) {
      applyLocation({
        lat: match.lat, lng: match.lng, city: match.name,
        country: match.country, timezone: match.timezone, isGPS: false,
      });
    } else {
      applyLocation({ lat: 21.3891, lng: 39.8579, city: "Makkah", country: "Saudi Arabia", timezone: "Asia/Riyadh", isGPS: false });
    }
  }

  function findNearestCity(lat: number, lng: number): City | null {
    let nearest: City | null = null;
    let minDist = Infinity;
    for (const city of CITIES) {
      const d = Math.sqrt((city.lat - lat) ** 2 + (city.lng - lng) ** 2);
      if (d < minDist) { minDist = d; nearest = city; }
    }
    return minDist < 2.5 ? nearest : null;
  }

  function applyLocation(loc: LocationInfo) {
    setLocation(loc);
    setLocationLoading(false);
    AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
    recalcPrayerTimes(loc);
  }

  async function requestLocation(): Promise<void> {
    setLocationLoading(true);

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        return new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            pos => {
              const tz = getDeviceTimezone();
              const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
              const loc: LocationInfo = nearest
                ? { lat: nearest.lat, lng: nearest.lng, city: nearest.name, country: nearest.country, timezone: nearest.timezone, isGPS: true }
                : { lat: pos.coords.latitude, lng: pos.coords.longitude, city: "Current Location", country: "", timezone: tz, isGPS: true };
              applyLocation(loc);
              resolve();
            },
            async () => {
              const ok = await guessFromIP();
              if (!ok) guessFromTimezone();
              resolve();
            },
            { timeout: 8000, maximumAge: 300000 },
          );
        });
      } else {
        const ok = await guessFromIP();
        if (!ok) guessFromTimezone();
        return;
      }
    }

    try {
      const ExpoLocation = await import("expo-location");
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        if (nearest) {
          applyLocation({ lat: nearest.lat, lng: nearest.lng, city: nearest.name, country: nearest.country, timezone: nearest.timezone, isGPS: true });
          return;
        }
        const geocode = await ExpoLocation.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        const tz = getDeviceTimezone();
        applyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: geocode[0]?.city || geocode[0]?.region || "Your Location",
          country: geocode[0]?.country || "",
          timezone: tz,
          isGPS: true,
        });
      } else {
        const ok = await guessFromIP();
        if (!ok) guessFromTimezone();
      }
    } catch {
      const ok = await guessFromIP();
      if (!ok) guessFromTimezone();
    }
  }

  function setManualCity(city: City) {
    applyLocation({ lat: city.lat, lng: city.lng, city: city.name, country: city.country, timezone: city.timezone, isGPS: false });
  }

  function refreshPrayerTimes() {
    if (location) recalcPrayerTimes(location);
  }

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem("settings", JSON.stringify(updated));
      if ((partial.calculationMethod || partial.madhab) && location) {
        recalcPrayerTimes(location, updated);
      }
      return updated;
    });
  }

  function logPrayer(date: string, prayer: keyof Omit<PrayerLog, "date">, status: "prayed" | "missed" | "late") {
    setPrayerLogs(prev => {
      const existing = prev.find(l => l.date === date);
      const updated = existing
        ? prev.map(l => l.date === date ? { ...l, [prayer]: status } : l)
        : [{ date, fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, [prayer]: status } as PrayerLog, ...prev.slice(0, 59)];
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
      bookmarkedSurahs, bookmarkedDuas, locationLoading,
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
