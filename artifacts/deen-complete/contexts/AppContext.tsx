import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  getPrayerTimes,
  fetchPrayerTimesFromAladhan,
  isPrayerTimesValid,
  DailyPrayerTimes,
  DEFAULT_PRAYER_TIMES,
} from "@/data/prayers";
import { City, CITIES } from "@/data/cities";
import type { Language } from "@/constants/i18n";

// ── Notification handler — must be set at module level ──────────────────────
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
}

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
  quranReadingMode: "both" | "arabic" | "translation";
  translationEdition: string;
  language: Language;
  lastReadQuranPage: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  country: string;
  timezone: string;
  isGPS: boolean;
  _v?: number;
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
  prayerTimesSource: "api" | "local";
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
  calculationMethod: "UmmAlQura",
  madhab: "Shafi",
  notifications: true,
  notificationsEnabled: true,
  adhanEnabled: true,
  darkMode: "system",
  theme: "system",
  arabicFontSize: 26,
  showTransliteration: true,
  showTranslation: true,
  quranReadingMode: "both",
  translationEdition: "en.sahih",
  language: "en",
  lastReadQuranPage: 1,
};

const AppContext = createContext<AppContextValue | null>(null);

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function applyColorScheme(theme: "system" | "light" | "dark") {
  try {
    Appearance.setColorScheme(theme === "system" ? null : theme);
  } catch {}
}

// ── Schedule prayer notifications for the next 7 days ───────────────────────
async function schedulePrayerNotifications(
  loc: LocationInfo,
  cfg: AppSettings,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (!cfg.notifications) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const prayerDefs = [
      { key: "fajr" as const,    name: "Fajr",    nameAr: "الفجر" },
      { key: "dhuhr" as const,   name: "Dhuhr",   nameAr: "الظهر" },
      { key: "asr" as const,     name: "Asr",     nameAr: "العصر" },
      { key: "maghrib" as const, name: "Maghrib", nameAr: "المغرب" },
      { key: "isha" as const,    name: "Isha",    nameAr: "العشاء" },
    ];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const times = getPrayerTimes(
        loc.lat, loc.lng, targetDate,
        cfg.calculationMethod, cfg.madhab,
      );

      for (const p of prayerDefs) {
        const pTime = new Date(times[p.key]);
        if (pTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${p.name} · ${p.nameAr}`,
              body: "It's time for prayer. الله أكبر",
              sound: true,
            },
            trigger: { date: pTime } as Notifications.DateTriggerInput,
          });
        }
      }
    }
  } catch {
    // Notifications unavailable on this device/platform — silently skip
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
  const [prayerTimesSource, setPrayerTimesSource] = useState<"api" | "local">("local");

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

      applyColorScheme(loadedSettings.theme ?? "system");

      if (storedLocation) {
        const loc: LocationInfo = JSON.parse(storedLocation);

        if (!loc._v || loc._v < 2) {
          AsyncStorage.removeItem("savedLocation");
          await requestLocation();
          return;
        }

        if (!loc.timezone) {
          const cityMatch = CITIES.find(c => c.name === loc.city && c.country === loc.country);
          loc.timezone = cityMatch?.timezone ?? getDeviceTimezone();
          AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
        }
        setLocation(loc);
        await fetchAndSetPrayerTimes(loc, loadedSettings, true);
        setLocationLoading(false);
      } else {
        await requestLocation();
      }
    } catch {
      await requestLocation();
    }
  }

  async function fetchAndSetPrayerTimes(
    loc: LocationInfo,
    cfg: AppSettings = settings,
    rescheduleNotifications = false,
  ) {
    const localTimes = getPrayerTimes(loc.lat, loc.lng, new Date(), cfg.calculationMethod, cfg.madhab);
    if (isPrayerTimesValid(localTimes)) {
      setPrayerTimes(localTimes);
      setPrayerTimesSource("local");
    }

    if (rescheduleNotifications) {
      schedulePrayerNotifications(loc, cfg).catch(() => {});
    }

    try {
      const apiTimes = await fetchPrayerTimesFromAladhan(
        loc.lat, loc.lng,
        cfg.calculationMethod,
        cfg.madhab,
        loc.timezone,
      );
      if (isPrayerTimesValid(apiTimes)) {
        setPrayerTimes(apiTimes);
        setPrayerTimesSource("api");
      }
    } catch {}
  }

  async function guessFromIP(): Promise<boolean> {
    const services = [
      async () => {
        const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(6000) });
        const d = await r.json();
        if (d?.latitude && !d.error) return {
          lat: parseFloat(d.latitude), lng: parseFloat(d.longitude),
          city: d.city ?? "Unknown", country: d.country_name ?? "",
          timezone: d.timezone ?? getDeviceTimezone(),
        };
        return null;
      },
      async () => {
        const r = await fetch("https://ip-api.com/json/?fields=lat,lon,city,country,timezone", { signal: AbortSignal.timeout(6000) });
        const d = await r.json();
        if (d?.lat && d.status !== "fail") return {
          lat: d.lat, lng: d.lon,
          city: d.city ?? "Unknown", country: d.country ?? "",
          timezone: d.timezone ?? getDeviceTimezone(),
        };
        return null;
      },
      async () => {
        const r = await fetch("https://freeipapi.com/api/json", { signal: AbortSignal.timeout(6000) });
        const d = await r.json();
        if (d?.latitude) return {
          lat: d.latitude, lng: d.longitude,
          city: d.cityName ?? "Unknown", country: d.countryName ?? "",
          timezone: d.timeZone ?? getDeviceTimezone(),
        };
        return null;
      },
    ];

    for (const svc of services) {
      try {
        const result = await svc();
        if (result) {
          applyLocation({ ...result, isGPS: false });
          return true;
        }
      } catch {
        continue;
      }
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
    const stamped: LocationInfo = { ...loc, _v: 2 };
    setLocation(stamped);
    setLocationLoading(false);
    AsyncStorage.setItem("savedLocation", JSON.stringify(stamped));
    fetchAndSetPrayerTimes(stamped, settings, true);
  }

  async function nominatimReverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{ displayName: string; country: string } | null> {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DeenComplete/1.0" },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address ?? {};
      const district =
        addr.suburb || addr.neighbourhood || addr.quarter ||
        addr.residential || addr.district || addr.county || null;
      const city =
        addr.city || addr.town || addr.village || addr.state_district || addr.state || "";
      const country = addr.country || "";
      const displayName =
        district && district !== city
          ? `${district}, ${city}`
          : city || data.display_name?.split(",")[0] || "Current Location";
      return { displayName, country };
    } catch {
      return null;
    }
  }

  async function requestLocation(): Promise<void> {
    setLocationLoading(true);

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        return new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            async pos => {
              const exactLat = pos.coords.latitude;
              const exactLng = pos.coords.longitude;
              const nearest = findNearestCity(exactLat, exactLng);
              const tz = nearest?.timezone ?? getDeviceTimezone();
              const geo = await nominatimReverseGeocode(exactLat, exactLng);
              applyLocation({
                lat: exactLat,
                lng: exactLng,
                city: geo?.displayName ?? nearest?.name ?? "Current Location",
                country: geo?.country ?? nearest?.country ?? "",
                timezone: tz,
                isGPS: true,
              });
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
        const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
        const exactLat = pos.coords.latitude;
        const exactLng = pos.coords.longitude;

        const nearest = findNearestCity(exactLat, exactLng);
        const tz = nearest?.timezone ?? getDeviceTimezone();

        let displayName = nearest?.name ?? "Current Location";
        let country = nearest?.country ?? "";
        try {
          const geocode = await ExpoLocation.reverseGeocodeAsync({
            latitude: exactLat,
            longitude: exactLng,
          });
          const g = geocode[0];
          if (g) {
            const district = g.district || g.subregion || g.name || null;
            const cityName = g.city || g.region || "";
            displayName =
              district && district !== cityName
                ? `${district}, ${cityName}`
                : cityName || displayName;
            country = g.country || country;
          }
        } catch {
          const geo = await nominatimReverseGeocode(exactLat, exactLng);
          if (geo) { displayName = geo.displayName; country = geo.country; }
        }

        applyLocation({ lat: exactLat, lng: exactLng, city: displayName, country, timezone: tz, isGPS: true });
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
    // Timer-driven refresh — don't reschedule notifications on every tick
    if (location) fetchAndSetPrayerTimes(location, settings, false);
  }

  function updateSettings(partial: Partial<AppSettings>) {
    if (partial.theme !== undefined) {
      applyColorScheme(partial.theme);
    }

    // Build updated settings synchronously — never call side-effects inside setState
    const updated: AppSettings = { ...settings, ...partial };
    AsyncStorage.setItem("settings", JSON.stringify(updated));
    setSettings(updated);

    // Recalculate prayer times when method/madhab changes
    if (
      (partial.calculationMethod !== undefined || partial.madhab !== undefined)
      && location
    ) {
      fetchAndSetPrayerTimes(location, updated, true);
    }

    // Reschedule notifications when notification settings change
    if (
      (partial.notifications !== undefined || partial.adhanEnabled !== undefined)
      && location
    ) {
      schedulePrayerNotifications(location, updated).catch(() => {});
    }
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
      bookmarkedSurahs, bookmarkedDuas, locationLoading, prayerTimesSource,
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
