import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  getPrayerTimes,
  fetchPrayerTimesFromAladhan,
  isPrayerTimesValid,
  DailyPrayerTimes,
  DEFAULT_PRAYER_TIMES,
} from "@/data/prayers";
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

      if (storedLocation) {
        const loc: LocationInfo = JSON.parse(storedLocation);
        if (!loc.timezone) {
          const cityMatch = CITIES.find(c => c.name === loc.city && c.country === loc.country);
          loc.timezone = cityMatch?.timezone ?? getDeviceTimezone();
          AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
        }
        setLocation(loc);
        await fetchAndSetPrayerTimes(loc, loadedSettings);
        setLocationLoading(false);
      } else {
        await requestLocation();
      }
    } catch {
      await requestLocation();
    }
  }

  // Compute prayer times: adhan library first (instant, no network),
  // then try Aladhan API for verified accuracy.
  async function fetchAndSetPrayerTimes(loc: LocationInfo, cfg: AppSettings = settings) {
    // 1. Always start with the local adhan library — guaranteed valid dates, no network
    const localTimes = getPrayerTimes(loc.lat, loc.lng, new Date(), cfg.calculationMethod, cfg.madhab);
    if (isPrayerTimesValid(localTimes)) {
      setPrayerTimes(localTimes);
      setPrayerTimesSource("local");
    }

    // 2. Try Aladhan API for scholar-verified accuracy
    try {
      const apiTimes = await fetchPrayerTimesFromAladhan(
        loc.lat, loc.lng,
        cfg.calculationMethod,
        cfg.madhab,
        loc.timezone,
      );
      // Only adopt API times if every single date is valid and ordered correctly
      if (isPrayerTimesValid(apiTimes)) {
        setPrayerTimes(apiTimes);
        setPrayerTimesSource("api");
      }
    } catch {
      // API unavailable or returned bad data — adhan library times remain active
    }
  }

  // Multiple IP geolocation services for better coverage
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
    setLocation(loc);
    setLocationLoading(false);
    AsyncStorage.setItem("savedLocation", JSON.stringify(loc));
    fetchAndSetPrayerTimes(loc);
  }

  // Use Nominatim (OpenStreetMap) to get a district-level display name.
  // Returns e.g. "Khalifa City, Abu Dhabi" or "Downtown, Dubai".
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
      // Prefer the most specific district-level label available
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
              // Use nearest city ONLY for timezone lookup
              const nearest = findNearestCity(exactLat, exactLng);
              const tz = nearest?.timezone ?? getDeviceTimezone();
              // Try to get district-level name from Nominatim
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

        // Use nearest city ONLY for timezone — never snap coordinates or display name to city center
        const nearest = findNearestCity(exactLat, exactLng);
        const tz = nearest?.timezone ?? getDeviceTimezone();

        // Prefer Expo reverse geocode (works offline) for district-level name
        let displayName = nearest?.name ?? "Current Location";
        let country = nearest?.country ?? "";
        try {
          const geocode = await ExpoLocation.reverseGeocodeAsync({
            latitude: exactLat,
            longitude: exactLng,
          });
          const g = geocode[0];
          if (g) {
            // district > subregion > name as the neighborhood identifier
            const district = g.district || g.subregion || g.name || null;
            const cityName = g.city || g.region || "";
            displayName =
              district && district !== cityName
                ? `${district}, ${cityName}`
                : cityName || displayName;
            country = g.country || country;
          }
        } catch {
          // Expo geocode failed — try Nominatim as fallback
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
    if (location) fetchAndSetPrayerTimes(location);
  }

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem("settings", JSON.stringify(updated));
      if ((partial.calculationMethod || partial.madhab) && location) {
        fetchAndSetPrayerTimes(location, updated);
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
