export interface Hadith {
  id: string;
  text: string;
  arabic: string;
  narrator: string;
  collection: string;
  number?: string;
  grade?: string;
  topic: string;
}

export const hadithCollections = ["Sahih Bukhari", "Sahih Muslim", "Tirmidhi", "Abu Dawud", "Ibn Majah", "Nasai", "40 Nawawi"];
export const hadithTopics = ["Faith", "Prayer", "Fasting", "Charity", "Quran", "Ethics", "Family", "Knowledge", "Dua", "Remembrance"];

export const hadiths: Hadith[] = [
  {
    id: "1",
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    text: "Actions are judged by intentions, and every person will get the reward according to what he has intended.",
    narrator: "Umar ibn Al-Khattab (RA)",
    collection: "Sahih Bukhari",
    number: "1",
    grade: "Sahih",
    topic: "Faith",
  },
  {
    id: "2",
    arabic: "الدِّينُ النَّصِيحَةُ",
    text: "The religion is sincerity (and sincere advice).",
    narrator: "Tamim Ad-Dari (RA)",
    collection: "Sahih Muslim",
    number: "55",
    grade: "Sahih",
    topic: "Faith",
  },
  {
    id: "3",
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ",
    text: "The best of you are those who learn the Quran and teach it.",
    narrator: "Uthman ibn Affan (RA)",
    collection: "Sahih Bukhari",
    number: "5027",
    grade: "Sahih",
    topic: "Quran",
  },
  {
    id: "4",
    arabic: "مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ",
    text: "Whoever prays Fajr is under the protection of Allah.",
    narrator: "Jundub (RA)",
    collection: "Sahih Muslim",
    number: "657",
    grade: "Sahih",
    topic: "Prayer",
  },
  {
    id: "5",
    arabic: "الطُّهُورُ شَطْرُ الإِيمَانِ",
    text: "Purity is half of faith.",
    narrator: "Abu Malik Al-Ash'ari (RA)",
    collection: "Sahih Muslim",
    number: "223",
    grade: "Sahih",
    topic: "Prayer",
  },
  {
    id: "6",
    arabic: "إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
    text: "Verily Allah does not look to your faces and your wealth but He looks to your hearts and to your deeds.",
    narrator: "Abu Hurairah (RA)",
    collection: "Sahih Muslim",
    number: "2564",
    grade: "Sahih",
    topic: "Ethics",
  },
  {
    id: "7",
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    text: "A Muslim is one from whose tongue and hands the Muslims are safe.",
    narrator: "Abdullah ibn Amr (RA)",
    collection: "Sahih Bukhari",
    number: "10",
    grade: "Sahih",
    topic: "Ethics",
  },
  {
    id: "8",
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    text: "Whoever believes in Allah and the Last Day should say what is good or keep silent.",
    narrator: "Abu Hurairah (RA)",
    collection: "Sahih Bukhari",
    number: "6018",
    grade: "Sahih",
    topic: "Ethics",
  },
  {
    id: "9",
    arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    text: "Your smile in the face of your brother is charity for you.",
    narrator: "Abu Dharr (RA)",
    collection: "Tirmidhi",
    number: "1956",
    grade: "Hasan",
    topic: "Charity",
  },
  {
    id: "10",
    arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
    text: "Whoever Allah wants good for him, He gives him understanding of the religion.",
    narrator: "Muawiyah (RA)",
    collection: "Sahih Bukhari",
    number: "71",
    grade: "Sahih",
    topic: "Knowledge",
  },
  {
    id: "11",
    arabic: "لاَ تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا",
    text: "Do not belittle any act of kindness, even meeting your brother with a cheerful face.",
    narrator: "Abu Dharr (RA)",
    collection: "Sahih Muslim",
    number: "2626",
    grade: "Sahih",
    topic: "Ethics",
  },
  {
    id: "12",
    arabic: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    text: "The most beloved of deeds to Allah are those that are most consistent, even if they are small.",
    narrator: "Aisha (RA)",
    collection: "Sahih Bukhari",
    number: "6465",
    grade: "Sahih",
    topic: "Faith",
  },
  {
    id: "13",
    arabic: "إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ",
    text: "Verily Allah has prescribed excellence (ihsan) in all things.",
    narrator: "Shaddad ibn Aws (RA)",
    collection: "Sahih Muslim",
    number: "1955",
    grade: "Sahih",
    topic: "Ethics",
  },
  {
    id: "14",
    arabic: "خَيْرُ الصَّدَقَةِ مَا كَانَ عَنْ ظَهْرِ غِنًى",
    text: "The best charity is that given when you are self-sufficient.",
    narrator: "Abu Hurairah (RA)",
    collection: "Sahih Bukhari",
    number: "1426",
    grade: "Sahih",
    topic: "Charity",
  },
  {
    id: "15",
    arabic: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
    text: "Whoever fasts Ramadan with faith and hoping for reward, his previous sins will be forgiven.",
    narrator: "Abu Hurairah (RA)",
    collection: "Sahih Bukhari",
    number: "38",
    grade: "Sahih",
    topic: "Fasting",
  },
];

export function getDailyHadith(): Hadith {
  const day = Math.floor(Date.now() / 86400000);
  return hadiths[day % hadiths.length];
}
