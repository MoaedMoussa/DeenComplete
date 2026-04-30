export interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  totalVerses: number;
  revelationType: "Meccan" | "Medinan";
  juz: number[];
}

export interface Verse {
  surahId: number;
  verseNumber: number;
  arabic: string;
  transliteration: string;
  translation: string;
}

export const surahs: Surah[] = [
  { id: 1, name: "Al-Fatihah", nameArabic: "الْفَاتِحَة", nameTranslation: "The Opening", totalVerses: 7, revelationType: "Meccan", juz: [1] },
  { id: 2, name: "Al-Baqarah", nameArabic: "الْبَقَرَة", nameTranslation: "The Cow", totalVerses: 286, revelationType: "Medinan", juz: [1,2,3] },
  { id: 3, name: "Ali 'Imran", nameArabic: "آل عِمْرَان", nameTranslation: "Family of Imran", totalVerses: 200, revelationType: "Medinan", juz: [3,4] },
  { id: 4, name: "An-Nisa", nameArabic: "النِّسَاء", nameTranslation: "The Women", totalVerses: 176, revelationType: "Medinan", juz: [4,5,6] },
  { id: 5, name: "Al-Ma'idah", nameArabic: "الْمَائِدَة", nameTranslation: "The Table Spread", totalVerses: 120, revelationType: "Medinan", juz: [6,7] },
  { id: 6, name: "Al-An'am", nameArabic: "الْأَنْعَام", nameTranslation: "The Cattle", totalVerses: 165, revelationType: "Meccan", juz: [7,8] },
  { id: 7, name: "Al-A'raf", nameArabic: "الْأَعْرَاف", nameTranslation: "The Heights", totalVerses: 206, revelationType: "Meccan", juz: [8,9] },
  { id: 8, name: "Al-Anfal", nameArabic: "الْأَنْفَال", nameTranslation: "The Spoils of War", totalVerses: 75, revelationType: "Medinan", juz: [9,10] },
  { id: 9, name: "At-Tawbah", nameArabic: "التَّوْبَة", nameTranslation: "The Repentance", totalVerses: 129, revelationType: "Medinan", juz: [10,11] },
  { id: 10, name: "Yunus", nameArabic: "يُونُس", nameTranslation: "Jonah", totalVerses: 109, revelationType: "Meccan", juz: [11] },
  { id: 11, name: "Hud", nameArabic: "هُود", nameTranslation: "Hud", totalVerses: 123, revelationType: "Meccan", juz: [11,12] },
  { id: 12, name: "Yusuf", nameArabic: "يُوسُف", nameTranslation: "Joseph", totalVerses: 111, revelationType: "Meccan", juz: [12,13] },
  { id: 13, name: "Ar-Ra'd", nameArabic: "الرَّعْد", nameTranslation: "The Thunder", totalVerses: 43, revelationType: "Medinan", juz: [13] },
  { id: 14, name: "Ibrahim", nameArabic: "إِبْرَاهِيم", nameTranslation: "Abraham", totalVerses: 52, revelationType: "Meccan", juz: [13] },
  { id: 15, name: "Al-Hijr", nameArabic: "الْحِجْر", nameTranslation: "The Rocky Tract", totalVerses: 99, revelationType: "Meccan", juz: [14] },
  { id: 36, name: "Ya-Sin", nameArabic: "يس", nameTranslation: "Ya Sin", totalVerses: 83, revelationType: "Meccan", juz: [22,23] },
  { id: 55, name: "Ar-Rahman", nameArabic: "الرَّحْمَٰن", nameTranslation: "The Beneficent", totalVerses: 78, revelationType: "Medinan", juz: [27] },
  { id: 67, name: "Al-Mulk", nameArabic: "الْمُلْك", nameTranslation: "The Sovereignty", totalVerses: 30, revelationType: "Meccan", juz: [29] },
  { id: 78, name: "An-Naba", nameArabic: "النَّبَأ", nameTranslation: "The Tidings", totalVerses: 40, revelationType: "Meccan", juz: [30] },
  { id: 112, name: "Al-Ikhlas", nameArabic: "الْإِخْلَاص", nameTranslation: "The Sincerity", totalVerses: 4, revelationType: "Meccan", juz: [30] },
  { id: 113, name: "Al-Falaq", nameArabic: "الْفَلَق", nameTranslation: "The Daybreak", totalVerses: 5, revelationType: "Meccan", juz: [30] },
  { id: 114, name: "An-Nas", nameArabic: "النَّاس", nameTranslation: "Mankind", totalVerses: 6, revelationType: "Meccan", juz: [30] },
];

export const allSurahsList: { id: number; name: string; nameArabic: string; nameTranslation: string; totalVerses: number; revelationType: "Meccan" | "Medinan"; juz: number[] }[] = Array.from({ length: 114 }, (_, i) => {
  const found = surahs.find(s => s.id === i + 1);
  if (found) return found;
  return {
    id: i + 1,
    name: `Surah ${i + 1}`,
    nameArabic: `السورة ${i + 1}`,
    nameTranslation: "Chapter",
    totalVerses: 10,
    revelationType: "Meccan" as const,
    juz: [Math.ceil((i + 1) / 4)],
  };
});

export const verses: Record<number, Verse[]> = {
  1: [
    { surahId: 1, verseNumber: 1, arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", transliteration: "Bismillāhi r-raḥmāni r-raḥīm", translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
    { surahId: 1, verseNumber: 2, arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", transliteration: "Al-ḥamdu lillāhi rabbi l-ʿālamīn", translation: "All praise is due to Allah, Lord of the worlds." },
    { surahId: 1, verseNumber: 3, arabic: "الرَّحْمَٰنِ الرَّحِيمِ", transliteration: "Ar-raḥmāni r-raḥīm", translation: "The Entirely Merciful, the Especially Merciful." },
    { surahId: 1, verseNumber: 4, arabic: "مَالِكِ يَوْمِ الدِّينِ", transliteration: "Māliki yawmi d-dīn", translation: "Sovereign of the Day of Recompense." },
    { surahId: 1, verseNumber: 5, arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", transliteration: "Iyyāka naʿbudu wa-iyyāka nastaʿīn", translation: "It is You we worship and You we ask for help." },
    { surahId: 1, verseNumber: 6, arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", transliteration: "Ihdinā ṣ-ṣirāṭa l-mustaqīm", translation: "Guide us to the straight path." },
    { surahId: 1, verseNumber: 7, arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", transliteration: "Ṣirāṭa lladhīna anʿamta ʿalayhim ġayri l-maġḍūbi ʿalayhim wa-lā ḍ-ḍāllīn", translation: "The path of those upon whom You have bestowed favor, not of those who have earned anger or of those who are astray." },
  ],
  112: [
    { surahId: 112, verseNumber: 1, arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", transliteration: "Qul huwa llāhu aḥad", translation: "Say, He is Allah, the One." },
    { surahId: 112, verseNumber: 2, arabic: "اللَّهُ الصَّمَدُ", transliteration: "Allāhu ṣ-ṣamad", translation: "Allah, the Eternal Refuge." },
    { surahId: 112, verseNumber: 3, arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ", transliteration: "Lam yalid wa-lam yūlad", translation: "He neither begets nor is born." },
    { surahId: 112, verseNumber: 4, arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", transliteration: "Wa-lam yakun lahū kufuwan aḥad", translation: "Nor is there to Him any equivalent." },
  ],
  113: [
    { surahId: 113, verseNumber: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", transliteration: "Qul aʿūdhu bi-rabbi l-falaq", translation: "Say, I seek refuge in the Lord of daybreak." },
    { surahId: 113, verseNumber: 2, arabic: "مِن شَرِّ مَا خَلَقَ", transliteration: "Min sharri mā khalaq", translation: "From the evil of that which He created." },
    { surahId: 113, verseNumber: 3, arabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", transliteration: "Wa-min sharri ġāsiqin idhā waqab", translation: "And from the evil of darkness when it settles." },
    { surahId: 113, verseNumber: 4, arabic: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", transliteration: "Wa-min sharri n-naffāthāti fī l-ʿuqad", translation: "And from the evil of the blowers in knots." },
    { surahId: 113, verseNumber: 5, arabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", transliteration: "Wa-min sharri ḥāsidin idhā ḥasad", translation: "And from the evil of an envier when he envies." },
  ],
  114: [
    { surahId: 114, verseNumber: 1, arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", transliteration: "Qul aʿūdhu bi-rabbi n-nās", translation: "Say, I seek refuge in the Lord of mankind." },
    { surahId: 114, verseNumber: 2, arabic: "مَلِكِ النَّاسِ", transliteration: "Maliki n-nās", translation: "The Sovereign of mankind." },
    { surahId: 114, verseNumber: 3, arabic: "إِلَٰهِ النَّاسِ", transliteration: "Ilāhi n-nās", translation: "The God of mankind." },
    { surahId: 114, verseNumber: 4, arabic: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", transliteration: "Min sharri l-waswāsi l-khannās", translation: "From the evil of the retreating whisperer." },
    { surahId: 114, verseNumber: 5, arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", transliteration: "Alladhī yuwaswisu fī ṣudūri n-nās", translation: "Who whispers evil into the breasts of mankind." },
    { surahId: 114, verseNumber: 6, arabic: "مِنَ الْجِنَّةِ وَالنَّاسِ", transliteration: "Mina l-jinnati wa-n-nās", translation: "From among the jinn and mankind." },
  ],
};

export const verseOfTheDay: Verse[] = [
  { surahId: 2, verseNumber: 255, arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", transliteration: "Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm", translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence." },
  { surahId: 94, verseNumber: 6, arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", transliteration: "Inna maʿa l-ʿusri yusrā", translation: "Indeed, with hardship will be ease." },
  { surahId: 3, verseNumber: 139, arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ", transliteration: "Wa-lā tahinū wa-lā taḥzanū wa-antumu l-aʿlawn", translation: "So do not weaken and do not grieve, and you will be superior." },
  { surahId: 65, verseNumber: 3, arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", transliteration: "Wa-man yatawakkal ʿalā llāhi fa-huwa ḥasbuh", translation: "And whoever relies upon Allah — then He is sufficient for him." },
  { surahId: 2, verseNumber: 286, arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", transliteration: "Lā yukalliful-lāhu nafsan illā wusʿahā", translation: "Allah does not burden a soul beyond that it can bear." },
  { surahId: 13, verseNumber: 28, arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", transliteration: "Alā bi-dhikri llāhi taṭmaʾinnu l-qulūb", translation: "Verily, in the remembrance of Allah do hearts find rest." },
  { surahId: 55, verseNumber: 13, arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", transliteration: "Fa-bi-ayyi ālāʾi rabbikumā tukadhdhibān", translation: "So which of the favors of your Lord would you deny?" },
];

export function getDailyVerse(): Verse {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return verseOfTheDay[dayOfYear % verseOfTheDay.length];
}
