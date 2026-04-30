export interface Dua {
  id: string;
  title: string;
  category: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

export const duaCategories = [
  "Morning", "Evening", "Food & Drink", "Travel", "Home", "Mosque",
  "Sleep", "Distress", "Illness", "Rain", "Parents", "General", "Ramadan",
];

export const duas: Dua[] = [
  {
    id: "entering-home",
    title: "Entering the Home",
    category: "Home",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allāhumma innī as'aluka khayra l-mawliji wa khayra l-makhraji, bismillāhi walajnā wa bismillāhi kharajnā wa ʿalā llāhi rabbanā tawakkalnā",
    translation: "O Allah, I ask You for the good of entering and leaving. In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.",
    source: "Abu Dawud",
  },
  {
    id: "leaving-home",
    title: "Leaving the Home",
    category: "Home",
    arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillāh, tawakkaltu ʿalā llāh, wa lā ḥawla wa lā quwwata illā billāh",
    translation: "In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.",
    source: "Abu Dawud, Tirmidhi",
  },
  {
    id: "before-eating",
    title: "Before Eating",
    category: "Food & Drink",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillāh",
    translation: "In the name of Allah.",
    source: "Bukhari, Muslim",
  },
  {
    id: "after-eating",
    title: "After Eating",
    category: "Food & Drink",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdu lillāhil-ladhī aṭʿamanā wa saqānā wa jaʿalanā muslimīn",
    translation: "All praise is due to Allah who has fed us and given us drink, and who has made us Muslims.",
    source: "Abu Dawud, Tirmidhi",
  },
  {
    id: "travel",
    title: "Starting a Journey",
    category: "Travel",
    arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    transliteration: "Allāhu Akbar, Allāhu Akbar, Allāhu Akbar. Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn",
    translation: "Allah is the Greatest x3. How perfect He is, the One who has given us power over this, and we could never have done it on our own.",
    source: "Muslim",
  },
  {
    id: "before-sleep",
    title: "Before Sleeping",
    category: "Sleep",
    arabic: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا",
    transliteration: "Allāhumma bismika amūtu wa aḥyā",
    translation: "O Allah, in Your name I die and I live.",
    source: "Bukhari",
  },
  {
    id: "waking-up",
    title: "Upon Waking Up",
    category: "Morning",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillāhil-ladhī ahyānā baʿda mā amātanā wa ilayhin-nushūr",
    translation: "All praise is due to Allah who restored us to life after causing us to die, and to Him is the resurrection.",
    source: "Bukhari",
  },
  {
    id: "entering-mosque",
    title: "Entering the Mosque",
    category: "Mosque",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allāhum-maf-taḥ lī abwāba raḥmatik",
    translation: "O Allah, open the doors of Your mercy for me.",
    source: "Muslim",
  },
  {
    id: "distress",
    title: "Dua for Distress",
    category: "Distress",
    arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ",
    transliteration: "Allāhumma innī ʿabduka wa ibnu ʿabdika wa ibnu amatika, nāṣiyatī bi-yadik, māḍin fiyya ḥukmuk",
    translation: "O Allah, I am Your slave and the son of Your slave and the son of Your maid slave. My forelock is in Your hand, Your command over me is ever executed.",
    source: "Ahmad",
  },
  {
    id: "illness",
    title: "Dua for the Sick",
    category: "Illness",
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ",
    transliteration: "Allāhumma rabban-nās, adh-hibil-bās, ishfi anta sh-Shāfī, lā shifāʾa illā shifāʾuk",
    translation: "O Allah, Lord of mankind, remove the affliction. Heal, for You are the Healer. There is no cure but Your cure.",
    source: "Bukhari, Muslim",
  },
  {
    id: "rain",
    title: "When it Rains",
    category: "Rain",
    arabic: "اللَّهُمَّ صَيِّباً نَافِعاً",
    transliteration: "Allāhumma ṣayyiban nāfiʿā",
    translation: "O Allah, may it be a beneficial rain.",
    source: "Bukhari",
  },
  {
    id: "parents",
    title: "For Parents",
    category: "Parents",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbi r-ḥamhumā kamā rabbayānī ṣaghīrā",
    translation: "My Lord, have mercy upon them as they brought me up when I was small.",
    source: "Quran 17:24",
  },
  {
    id: "iftar",
    title: "Breaking Fast (Iftar)",
    category: "Ramadan",
    arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ",
    transliteration: "Dhahaba ẓ-ẓamaʾu wabtallatil-ʿurūqu wa thabata l-ajru in shāʾ Allāh",
    translation: "The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.",
    source: "Abu Dawud",
  },
  {
    id: "laylat-qadr",
    title: "Laylat Al-Qadr",
    category: "Ramadan",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allāhumma innaka ʿafuwwun tuḥibbul-ʿafwa faʿfu ʿannī",
    translation: "O Allah, indeed You are Pardoning. You love to pardon, so pardon me.",
    source: "Tirmidhi",
  },
];
