export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  virtue?: string;
}

export interface DhikrSet {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  items: DhikrItem[];
}

export const dhikrSets: DhikrSet[] = [
  {
    id: "post-salah",
    name: "Post-Salah Adhkar",
    nameArabic: "أذكار بعد الصلاة",
    description: "Recite after every obligatory prayer",
    items: [
      { id: "subhanallah", arabic: "سُبْحَانَ اللَّهِ", transliteration: "Subhān'Allāh", translation: "Glory be to Allah", count: 33, virtue: "Forgives sins even if they are as abundant as the foam of the sea" },
      { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdu lillāh", translation: "All praise is due to Allah", count: 33 },
      { id: "allahuakbar", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allāhu Akbar", translation: "Allah is the Greatest", count: 33 },
      { id: "la-ilaha", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", transliteration: "Lā ilāha illa Allāh wahdahu lā sharīka lah, lahul mulku wa lahul ḥamd, wa huwa ʿalā kulli shayʾin qadīr", translation: "None has the right to be worshipped but Allah, alone, without partner. His is the dominion and His the praise and He is over all things omnipotent.", count: 1 },
    ],
  },
  {
    id: "morning",
    name: "Morning Adhkar",
    nameArabic: "أذكار الصباح",
    description: "Recite after Fajr prayer",
    items: [
      { id: "ayat-kursi", arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", transliteration: "Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm", translation: "Allah! There is no god but He, the Living, the Self-Subsisting, the All-Sustaining.", count: 1, virtue: "Whoever recites Ayat al-Kursi after every prayer, only death will prevent him from entering Paradise" },
      { id: "morning-dua", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", transliteration: "Asbahna wa asbahal mulku lillah", translation: "We have reached the morning and at this very time all dominion belongs to Allah.", count: 1 },
      { id: "sayyid-istighfar", arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ", transliteration: "Allāhumma anta rabbī lā ilāha illā ant, khalaqtanī wa anā ʿabduk", translation: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant.", count: 1, virtue: "The Master of seeking forgiveness" },
    ],
  },
  {
    id: "evening",
    name: "Evening Adhkar",
    nameArabic: "أذكار المساء",
    description: "Recite after Asr prayer",
    items: [
      { id: "evening-dua", arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", transliteration: "Amsayna wa amsal mulku lillah", translation: "We have reached the evening and at this very time all dominion belongs to Allah.", count: 1 },
      { id: "protection-eve", arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", transliteration: "Allāhumma bika amsayna wa bika asbahna wa bika nahya wa bika namūtu wa ilayka l-masīr", translation: "O Allah, by You we have reached the evening, by You we live and by You we die, and to You is the return.", count: 1 },
    ],
  },
  {
    id: "sleep",
    name: "Sleep Adhkar",
    nameArabic: "أذكار النوم",
    description: "Recite before sleeping",
    items: [
      { id: "sleep-dua", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismika Allāhumma amūtu wa aḥyā", translation: "In Your name O Allah, I die and I live.", count: 1 },
      { id: "three-quls", arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", transliteration: "Al-Ikhlas, Al-Falaq, An-Nas", translation: "Recite Surah Al-Ikhlas, Al-Falaq, and An-Nas each 3 times", count: 3, virtue: "Sufficient for all protection" },
    ],
  },
  {
    id: "istighfar",
    name: "Istighfar",
    nameArabic: "الاستغفار",
    description: "Seeking forgiveness from Allah",
    items: [
      { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfiru llāh", translation: "I seek forgiveness from Allah", count: 100, virtue: "Whoever recites 100 times, all his sins are forgiven" },
      { id: "sayyid-istighfar-full", arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ", transliteration: "Allāhumma anta rabbī lā ilāha illā ant", translation: "O Allah, You are my Lord, none has the right to be worshipped except You.", count: 1 },
    ],
  },
];

export const quickDhikr: DhikrItem[] = [
  { id: "subhanallah-q", arabic: "سُبْحَانَ اللَّهِ", transliteration: "Subhān'Allāh", translation: "Glory be to Allah", count: 33 },
  { id: "alhamdulillah-q", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdu lillāh", translation: "Praise be to Allah", count: 33 },
  { id: "allahuakbar-q", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allāhu Akbar", translation: "Allah is the Greatest", count: 33 },
  { id: "la-ilaha-q", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", transliteration: "Lā ilāha illā Allāh", translation: "There is no god but Allah", count: 100 },
  { id: "salawat", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", transliteration: "Allāhumma ṣalli ʿalā Muḥammad", translation: "O Allah, send prayers upon Muhammad", count: 100 },
  { id: "hauqala", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration: "Lā ḥawla wa lā quwwata illā billāh", translation: "There is no power nor strength except with Allah", count: 100 },
];
