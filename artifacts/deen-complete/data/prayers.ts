import {
  Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes,
  Madhab, SunnahTimes,
} from "adhan";

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

// ─── Aladhan method number mapping ─────────────────────────────────────────
const ALADHAN_METHOD: Record<string, number> = {
  MuslimWorldLeague: 3,
  NorthAmerica: 2,
  Egyptian: 5,
  UmmAlQura: 4,
  Karachi: 1,
  Gulf: 8,
  Dubai: 8,       // UAE / Gulf Region — Fajr 18.2°, Isha 18.2°
  Kuwait: 3,
  Qatar: 10,
  MoonsightingCommittee: 15,
  Turkey: 13,
  Tehran: 7,
  Singapore: 11,
};

/**
 * Returns the UTC offset of `timezone` at the current moment, in milliseconds.
 * Uses Intl.DateTimeFormat.formatToParts — works on V8, JSC, and Hermes alike.
 * Positive = east of UTC (e.g. Asia/Riyadh = +10_800_000), negative = west.
 */
function getTimezoneOffsetMs(timezone: string): number {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts: Record<string, string> = {};
    fmt.formatToParts(now).forEach(p => { parts[p.type] = p.value; });
    let h = parseInt(parts["hour"] ?? "0", 10);
    if (h === 24) h = 0; // midnight edge-case
    const tzAsUTC = Date.UTC(
      parseInt(parts["year"]   ?? "2000", 10),
      parseInt(parts["month"]  ?? "1",    10) - 1,
      parseInt(parts["day"]    ?? "1",    10),
      h,
      parseInt(parts["minute"] ?? "0", 10),
      parseInt(parts["second"] ?? "0", 10),
    );
    return tzAsUTC - now.getTime();
  } catch {
    // last-resort: device local offset
    return -new Date().getTimezoneOffset() * 60_000;
  }
}

/**
 * Parses an Aladhan API time string (e.g. "04:13" or "04:13 (+05:30)")
 * and the date string "YYYY-MM-DD" into a proper UTC-based Date object.
 */
function parseAladhanTime(timeStr: string, dateStr: string, timezone: string): Date {
  // Strip any trailing timezone annotation (e.g. " (+05:30)" or " (PKT)")
  const base = (timeStr ?? "00:00").split(" ")[0].trim();
  const [hPart, mPart] = base.split(":");
  const h = parseInt(hPart ?? "0", 10);
  const m = parseInt(mPart ?? "0", 10);

  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) {
    return new Date(); // safe current-time fallback
  }

  // Parse dateStr "YYYY-MM-DD" into components
  const [y, mo, d] = (dateStr || new Date().toISOString().split("T")[0])
    .split("-")
    .map(Number);

  if (!y || !mo || !d) return new Date();

  const midnightUTC = Date.UTC(y, mo - 1, d); // UTC midnight of that calendar date
  const offsetMs    = getTimezoneOffsetMs(timezone); // positive = east

  // local midnight in UTC = UTC midnight − offset
  // prayer time in UTC     = local midnight in UTC + (h * 3600 + m * 60) seconds
  const result = new Date(midnightUTC - offsetMs + (h * 3600 + m * 60) * 1000);

  // Final sanity check
  return isNaN(result.getTime()) ? new Date() : result;
}

// ─── API: Aladhan prayer times ─────────────────────────────────────────────
export async function fetchPrayerTimesFromAladhan(
  lat: number,
  lng: number,
  method = "MuslimWorldLeague",
  madhab = "Shafi",
  timezone = "UTC",
): Promise<DailyPrayerTimes> {
  const methodNum = ALADHAN_METHOD[method] ?? 3;
  const school = madhab === "Hanafi" ? 1 : 0;
  const ts = Math.floor(Date.now() / 1000);
  const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=${methodNum}&school=${school}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);

  const json = await res.json();
  if (json.code !== 200) throw new Error("Aladhan API error");

  const { timings, meta, date } = json.data;
  const tz: string = meta?.timezone || timezone;

  // dateStr from API: "DD-MM-YYYY" → convert to "YYYY-MM-DD"
  const rawDate: string = date?.gregorian?.date ?? "";
  const [dd, mm, yyyy] = rawDate.split("-");
  const dateStr = (yyyy && mm && dd) ? `${yyyy}-${mm}-${dd}` : new Date().toISOString().split("T")[0];

  function pt(key: string): Date {
    return parseAladhanTime(timings[key] ?? "00:00", dateStr, tz);
  }

  const fajr    = pt("Fajr");
  const sunrise = pt("Sunrise");
  const dhuhr   = pt("Dhuhr");
  const asr     = pt("Asr");
  const maghrib = pt("Maghrib");
  const isha    = pt("Isha");

  // Reject entirely if any core time is invalid
  const core = [fajr, sunrise, dhuhr, asr, maghrib, isha];
  if (core.some(d => isNaN(d.getTime()))) {
    throw new Error("Aladhan: one or more times parsed as Invalid Date");
  }

  // Sanity-check ordering: fajr < sunrise < dhuhr < asr < maghrib < isha
  if (!(fajr < sunrise && sunrise < dhuhr && dhuhr < asr && asr < maghrib && maghrib < isha)) {
    throw new Error("Aladhan: prayer time ordering is wrong — likely a timezone parsing error");
  }

  // Midnight = midpoint between Maghrib and Fajr (next day)
  const nextFajr  = new Date(fajr.getTime() + 86_400_000);
  const midnight  = new Date((maghrib.getTime() + nextFajr.getTime()) / 2);
  const lastThird = new Date(maghrib.getTime() + (nextFajr.getTime() - maghrib.getTime()) * (2 / 3));

  return { fajr, sunrise, dhuhr, asr, maghrib, isha, midnight, lastThird };
}

/** Returns true when all fields in a DailyPrayerTimes object are valid Dates. */
export function isPrayerTimesValid(t: DailyPrayerTimes): boolean {
  return [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha]
    .every(d => d instanceof Date && !isNaN(d.getTime()));
}

// ─── API: Aladhan qibla direction ──────────────────────────────────────────
export async function fetchQiblaFromAladhan(lat: number, lng: number): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(
    `https://api.aladhan.com/v1/qibla/${lat}/${lng}`,
    { signal: controller.signal },
  );
  clearTimeout(timeout);
  const json = await res.json();
  if (json.code !== 200 || typeof json.data?.direction !== "number") {
    throw new Error("Aladhan qibla API error");
  }
  return json.data.direction as number;
}

// ─── Local adhan library fallback ──────────────────────────────────────────
function getMethodParams(method: string) {
  switch (method) {
    case "MuslimWorldLeague": return CalculationMethod.MuslimWorldLeague();
    case "Egyptian":          return CalculationMethod.Egyptian();
    case "UmmAlQura":         return CalculationMethod.UmmAlQura();
    case "Karachi":           return CalculationMethod.Karachi();
    case "Gulf":              return CalculationMethod.Dubai();   // Gulf uses Dubai angles
    case "Dubai":             return CalculationMethod.Dubai();   // UAE / Gulf Region
    case "Kuwait":            return CalculationMethod.Kuwait();
    case "Qatar":             return CalculationMethod.Qatar();
    case "MoonsightingCommittee": return CalculationMethod.MoonsightingCommittee();
    case "Turkey":            return CalculationMethod.Turkey();
    case "Tehran":            return CalculationMethod.Tehran();
    case "Singapore":         return CalculationMethod.Singapore();
    case "NorthAmerica":
    default:                  return CalculationMethod.NorthAmerica();
  }
}

export function getPrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  method = "NorthAmerica",
  madhab = "Shafi",
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

export function formatTime(date: Date, timezone?: string): string {
  try {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
}

export function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
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
  return {
    day, month, year,
    monthName: monthNames[month - 1] ?? "",
    monthNameAr: monthNamesAr[month - 1] ?? "",
  };
}

export function getQiblaDirection(lat: number, lng: number): number {
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const latRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(dLng);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export function getDistanceToMakkah(lat: number, lng: number): number {
  const R = 6371;
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLon = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat * Math.PI) / 180) * Math.cos((KAABA_LAT * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CALCULATION_METHODS = [
  { id: "Dubai",              name: "UAE / Dubai Authority",     region: "UAE, Abu Dhabi, Dubai (Recommended)" },
  { id: "MuslimWorldLeague",  name: "Muslim World League",       region: "Global" },
  { id: "NorthAmerica",       name: "ISNA – North America",      region: "USA / Canada" },
  { id: "Egyptian",           name: "Egyptian General Authority", region: "Egypt & Africa" },
  { id: "UmmAlQura",          name: "Umm Al-Qura University",    region: "Saudi Arabia" },
  { id: "Karachi",            name: "Univ. of Islamic Sciences", region: "Pakistan & South Asia" },
  { id: "Kuwait",             name: "Kuwait",                    region: "Kuwait" },
  { id: "Qatar",              name: "Qatar",                     region: "Qatar" },
  { id: "Gulf",               name: "Gulf Region",               region: "Bahrain, Oman" },
  { id: "MoonsightingCommittee", name: "Moonsighting Committee", region: "UK" },
  { id: "Turkey",             name: "Diyanet – Turkey",          region: "Turkey" },
  { id: "Tehran",             name: "Tehran Institute",          region: "Iran (Shia)" },
  { id: "Singapore",          name: "Majlis Ugama Islam",        region: "Singapore & SE Asia" },
];

export type PrayerTimes = DailyPrayerTimes;
export const DEFAULT_PRAYER_TIMES: DailyPrayerTimes = getPrayerTimes(21.4225, 39.8262);
