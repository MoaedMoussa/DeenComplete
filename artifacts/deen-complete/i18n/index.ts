import { AppSettings } from "@/contexts/AppContext";

const en = {
  // Tabs
  tabHome: "Home",
  tabQuran: "Quran",
  tabPrayer: "Prayer",
  tabQibla: "Qibla",
  tabMore: "More",
  
  // Home
  quickLinks: "Quick Links",
  zakat: "Zakat",
  hajjGuide: "Hajj Guide",
  calendar: "Calendar",
  prayers: "Prayers",
  quranLog: "Quran Log",
  dailyAyah: "Daily Ayah",
  
  // Settings (partial)
  settingsTitle: "Settings",
  languageTitle: "Language / اللغة",
};

const ar = {
  // Tabs
  tabHome: "الرئيسية",
  tabQuran: "القرآن",
  tabPrayer: "الصلاة",
  tabQibla: "القبلة",
  tabMore: "المزيد",

  // Home
  quickLinks: "روابط سريعة",
  zakat: "الزكاة",
  hajjGuide: "دليل الحج",
  calendar: "التقويم",
  prayers: "الصلوات",
  quranLog: "سجل القرآن",
  dailyAyah: "آية اليوم",
  
  // Settings (partial)
  settingsTitle: "الإعدادات",
  languageTitle: "Language / اللغة",
};

export const translations = { en, ar };
export type TranslationKey = keyof typeof en;

export function useTranslations(language: string | null) {
  const lang = (language === "ar") ? "ar" : "en";
  return (key: TranslationKey) => translations[lang][key] || key;
}
