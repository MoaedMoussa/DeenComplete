import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab, SunnahTimes } from "adhan";

export interface PrayerTimeEntry {
  name: string;
  nameArabic: string;
  key: string;
  time: Date;
}

export interface DailyPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
  lastThird: Date;
}

function getMethodParams(method: string) {
  switch (method) {
    case "MuslimWorldLeague": return CalculationMethod.MuslimWorldLeague();
    case "Egyptian": return CalculationMethod.Egyptian();
    case "UmmAlQura": return CalculationMethod.UmmAlQura();
    case "Karachi": return CalculationMethod.Karachi();
    case "Gulf": return CalculationMethod.Gulf();
    case "MoonsightingCommittee": return CalculationMethod.MoonsightingCommittee();
    case "Turkey": return CalculationMethod.Turkey();
    case "Tehran": return CalculationMethod.Tehran();
    case "Singapore": return CalculationMethod.Singapore();
    case "NorthAmerica":
    default: return CalculationMethod.NorthAmerica();
  }
}

export function getPrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  method: string = "NorthAmerica",
  madhab: string = "Shafi"
): DailyPrayerTimes {
  const coords = new Coordinates(lat, lng);
  const params = getMethodParams(method);
  params.madhab = madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;

  const times = new AdhanPrayerTimes(coords, date, params);
  const sunnah = new SunnahTimes(times);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    midnight: sunnah.middleOfTheNight,
    lastThird: sunnah.lastThirdOfTheNight,
  };
}

export function getAllPrayerEntries(times: DailyPrayerTimes): PrayerTimeEntry[] {
  return [
    { name: "Fajr", nameArabic: "الفجر", key: "fajr", time: times.fajr },
    { name: "Sunrise", nameArabic: "الشروق", key: "sunrise", time: times.sunrise },
    { name: "Dhuhr", nameArabic: "الظهر", key: "dhuhr", time: times.dhuhr },
    { name: "Asr", nameArabic: "العصر", key: "asr", time: times.asr },
    { name: "Maghrib", nameArabic: "المغرب", key: "maghrib", time: times.maghrib },
    { name: "Isha", nameArabic: "العشاء", key: "isha", time: times.isha },
  ];
}

export function getNextPrayerEntry(times: DailyPrayerTimes): PrayerTimeEntry | null {
  const now = new Date();
  const entries = getAllPrayerEntries(times).filter(e => e.key !== "sunrise");
  return entries.find(e => e.time > now) ?? null;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCountdown(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function getHijriDate(date: Date = new Date()): {
  day: number; month: number; year: number; monthName: string; monthNameAr: string;
} {
  const jd = Math.floor(date.getTime() / 86400000 + 2440587.5);
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  const monthNames = [
    "Muharram", "Safar", "Rabi' Al-Awwal", "Rabi' Al-Thani",
    "Jumada Al-Awwal", "Jumada Al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
  ];
  const monthNamesAr = [
    "مُحَرَّم", "صَفَر", "رَبِيع الأَوَّل", "رَبِيع الثَّانِي",
    "جُمَادَى الأُولَى", "جُمَادَى الآخِرَة", "رَجَب", "شَعْبَان",
    "رَمَضَان", "شَوَّال", "ذُو الْقَعْدَة", "ذُو الْحِجَّة",
  ];
  return { day, month, year, monthName: monthNames[month - 1] ?? "", monthNameAr: monthNamesAr[month - 1] ?? "" };
}

export function getQiblaDirection(lat: number, lng: number): number {
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const latRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(dLng);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export function getDistanceToMakkah(lat: number, lng: number): number {
  const R = 6371;
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLon = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((KAABA_LAT * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CALCULATION_METHODS = [
  { id: "MuslimWorldLeague", name: "Muslim World League", region: "Global (Recommended)" },
  { id: "NorthAmerica", name: "ISNA – North America", region: "USA / Canada" },
  { id: "Egyptian", name: "Egyptian General Authority", region: "Egypt & Africa" },
  { id: "UmmAlQura", name: "Umm Al-Qura University", region: "Saudi Arabia" },
  { id: "Karachi", name: "Univ. of Islamic Sciences", region: "Pakistan & South Asia" },
  { id: "Gulf", name: "Gulf Region", region: "UAE & Gulf States" },
  { id: "MoonsightingCommittee", name: "Moonsighting Committee", region: "UK" },
  { id: "Turkey", name: "Diyanet – Turkey", region: "Turkey" },
  { id: "Tehran", name: "Tehran Institute", region: "Iran (Shia)" },
  { id: "Singapore", name: "Majlis Ugama Islam", region: "Singapore & SE Asia" },
];

export type PrayerTimes = DailyPrayerTimes;

export const DEFAULT_PRAYER_TIMES: DailyPrayerTimes = getPrayerTimes(21.4225, 39.8262);
