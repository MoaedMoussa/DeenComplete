export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface Prayer {
  name: string;
  nameArabic: string;
  time: Date;
  key: keyof PrayerTimes;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
function fixAngle(a: number): number {
  return a - 360 * Math.floor(a / 360);
}
function fixHour(a: number): number {
  return a - 24 * Math.floor(a / 24);
}

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const eqt = q / 15 - fixHour(RA);
  const decl = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  return { declination: decl, equation: eqt };
}

function computeTime(lat: number, lng: number, jd: number, angle: number, direction: number): number {
  const { declination: D, equation: EqT } = sunPosition(jd);
  const cosHour = -Math.sin(toRad(angle - direction)) / (Math.cos(toRad(lat)) * Math.cos(toRad(D)));
  if (cosHour > 1) return 0;
  if (cosHour < -1) return 12;
  const H = toDeg(Math.acos(cosHour)) / 15;
  return 12 - direction * H - lng / 15 - EqT;
}

function computeAsr(lat: number, lng: number, jd: number, shadowFactor: number): number {
  const { declination: D, equation: EqT } = sunPosition(jd);
  const A = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(toRad(lat - D)))));
  const cosHour = (Math.sin(A) - Math.sin(toRad(lat)) * Math.sin(toRad(D))) / (Math.cos(toRad(lat)) * Math.cos(toRad(D)));
  if (cosHour > 1) return 0;
  if (cosHour < -1) return 12;
  const H = toDeg(Math.acos(cosHour)) / 15;
  return 12 + H - lng / 15 - EqT;
}

function decimalToDate(base: Date, decimalHours: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setTime(d.getTime() + decimalHours * 3600 * 1000);
  return d;
}

export function calculatePrayerTimes(lat: number, lng: number, date: Date = new Date()): PrayerTimes {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const timezone = -date.getTimezoneOffset() / 60;
  const jd = julianDate(y, m, d) - lng / (15 * 24);

  const fajrDec = computeTime(lat, lng, jd, 18, -1) + timezone;
  const sunriseDec = computeTime(lat, lng, jd, 0.833, -1) + timezone;
  const dhuhrDec = 12 - lng / 15 + timezone - sunPosition(jd).equation;
  const asrDec = computeAsr(lat, lng, jd, 1) + timezone;
  const maghribDec = computeTime(lat, lng, jd, 0.833, 1) + timezone;
  const ishaDec = computeTime(lat, lng, jd, 17, 1) + timezone;

  const base = new Date(y, m - 1, d);
  return {
    fajr: decimalToDate(base, fajrDec),
    sunrise: decimalToDate(base, sunriseDec),
    dhuhr: decimalToDate(base, dhuhrDec),
    asr: decimalToDate(base, asrDec),
    maghrib: decimalToDate(base, maghribDec),
    isha: decimalToDate(base, ishaDec),
  };
}

export const DEFAULT_PRAYER_TIMES: PrayerTimes = (() => {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    fajr: new Date(base.getTime() + 5 * 3600000),
    sunrise: new Date(base.getTime() + 6.5 * 3600000),
    dhuhr: new Date(base.getTime() + 12.5 * 3600000),
    asr: new Date(base.getTime() + 16 * 3600000),
    maghrib: new Date(base.getTime() + 19 * 3600000),
    isha: new Date(base.getTime() + 20.5 * 3600000),
  };
})();

export function getPrayers(times: PrayerTimes): Prayer[] {
  return [
    { name: "Fajr", nameArabic: "الفجر", time: times.fajr, key: "fajr" },
    { name: "Sunrise", nameArabic: "الشروق", time: times.sunrise, key: "sunrise" },
    { name: "Dhuhr", nameArabic: "الظهر", time: times.dhuhr, key: "dhuhr" },
    { name: "Asr", nameArabic: "العصر", time: times.asr, key: "asr" },
    { name: "Maghrib", nameArabic: "المغرب", time: times.maghrib, key: "maghrib" },
    { name: "Isha", nameArabic: "العشاء", time: times.isha, key: "isha" },
  ];
}

export function getNextPrayer(times: PrayerTimes): Prayer | null {
  const prayers = getPrayers(times).filter(p => p.key !== "sunrise");
  const now = new Date();
  for (const prayer of prayers) {
    if (prayer.time > now) return prayer;
  }
  return null;
}

export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getTimeUntilPrayer(prayer: Prayer): string {
  const now = new Date();
  const diff = prayer.time.getTime() - now.getTime();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getHijriDate(date: Date = new Date()): { day: number; month: number; year: number; monthName: string } {
  const hijriMonths = [
    "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
  ];
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const z = Math.floor(jd);
  const a = Math.floor((z - 1867216.25) / 36524.25);
  const alpha = z + 1 + a - Math.floor(a / 4);
  const b = alpha + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d2 = Math.floor(365.25 * c);
  const e = Math.floor((b - d2) / 30.6001);
  const day2 = b - d2 - Math.floor(30.6001 * e);
  const month2 = e < 14 ? e - 1 : e - 13;
  const year2 = month2 > 2 ? c - 4716 : c - 4715;
  const jdGreg = Math.floor(julianDate(year2, month2, day2)) + 0.5;
  const l = jdGreg - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const j = (Math.floor((10985 - ll) / 5316)) * Math.floor((50 * ll) / 17719) + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const ll2 = ll - (Math.floor((30 - j) / 15)) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m3 = Math.floor((24 * ll2) / 709);
  const d3 = ll2 - Math.floor((709 * m3) / 24);
  const y3 = 30 * n + j - 30;
  return { day: d3, month: m3, year: y3, monthName: hijriMonths[(m3 - 1) % 12] };
}
