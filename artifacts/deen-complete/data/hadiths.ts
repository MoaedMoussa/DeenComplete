export interface LocalHadith {
  id: number;
  collectionId: string;
  number: number;
  arabic: string;
  english: string;
  narrator: string;
  grades: string;
  chapter?: string;
}

export const COLLECTIONS = [
  { id: "bukhari", name: "Sahih al-Bukhari", nameAr: "صحيح البخاري", count: 0, grade: "Sahih" },
  { id: "muslim", name: "Sahih Muslim", nameAr: "صحيح مسلم", count: 0, grade: "Sahih" },
  { id: "abudawud", name: "Sunan Abi Dawud", nameAr: "سنن أبي داود", count: 0, grade: "Hasan" },
  { id: "tirmidhi", name: "Jami' al-Tirmidhi", nameAr: "جامع الترمذي", count: 0, grade: "Hasan" },
  { id: "nawawi40", name: "40 Hadith Nawawi", nameAr: "الأربعون النووية", count: 0, grade: "Sahih" },
  { id: "riyadussalihin", name: "Riyad as-Salihin", nameAr: "رياض الصالحين", count: 0, grade: "Sahih" },
];

const ALL_HADITHS: LocalHadith[] = [
  // ── Sahih Bukhari ──
  {
    id: 1, collectionId: "bukhari", number: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english: "Actions are judged by intentions, and every person will get the reward according to what he has intended.",
    narrator: "Narrated Umar ibn al-Khattab (رضي الله عنه)",
    grades: "Sahih", chapter: "Revelation",
  },
  {
    id: 2, collectionId: "bukhari", number: 8,
    arabic: "الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَتُقِيمَ الصَّلاَةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً",
    english: "Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah, to perform the prayers, to pay the zakat, to fast in Ramadan, and to make the pilgrimage to the House if you are able to do so.",
    narrator: "Narrated Ibn Umar (رضي الله عنهما)",
    grades: "Sahih", chapter: "Faith",
  },
  {
    id: 3, collectionId: "bukhari", number: 13,
    arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english: "None of you will have faith till he loves for his brother what he loves for himself.",
    narrator: "Narrated Anas (رضي الله عنه)",
    grades: "Sahih", chapter: "Faith",
  },
  {
    id: 4, collectionId: "bukhari", number: 71,
    arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
    english: "Whoever Allah wants good for him, He gives him understanding of the religion.",
    narrator: "Narrated Muawiya (رضي الله عنه)",
    grades: "Sahih", chapter: "Knowledge",
  },
  {
    id: 5, collectionId: "bukhari", number: 79,
    arabic: "مَثَلُ مَا بَعَثَنِي اللَّهُ بِهِ مِنَ الْهُدَى وَالْعِلْمِ كَمَثَلِ الْغَيْثِ الْكَثِيرِ أَصَابَ أَرْضًا",
    english: "The example of what Allah has sent me with of guidance and knowledge is like abundant rain which falls on land — some of it is good and absorbs water and grows vegetation; some is barren, holds water, and Allah benefits the people through it.",
    narrator: "Narrated Abu Musa al-Ash'ari (رضي الله عنه)",
    grades: "Sahih", chapter: "Knowledge",
  },
  {
    id: 6, collectionId: "bukhari", number: 304,
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    english: "The best among you are those who learn the Quran and teach it.",
    narrator: "Narrated Uthman ibn Affan (رضي الله عنه)",
    grades: "Sahih", chapter: "Virtues of the Quran",
  },
  {
    id: 7, collectionId: "bukhari", number: 481,
    arabic: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    english: "The most beloved deeds to Allah are the most regular and constant, even if they are few.",
    narrator: "Narrated Aisha (رضي الله عنها)",
    grades: "Sahih", chapter: "Prayer",
  },
  {
    id: 8, collectionId: "bukhari", number: 1122,
    arabic: "يَتَنَزَّلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ يَقُولُ مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ",
    english: "Our Lord descends each night to the lowest heaven when one-third of the last part of the night remains, and He says: Who is calling Me so that I may answer him? Who is asking Me so that I may give to him?",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Tahajjud",
  },
  {
    id: 9, collectionId: "bukhari", number: 1395,
    arabic: "لَوْ يَعْلَمُ النَّاسُ مَا فِي النِّدَاءِ وَالصَّفِّ الأَوَّلِ ثُمَّ لَمْ يَجِدُوا إِلاَّ أَنْ يَسْتَهِمُوا عَلَيْهِ لاَسْتَهَمُوا",
    english: "If the people knew what is in the call to prayer and the first row, and then found no other way but to draw lots for it, they would draw lots.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Adhan",
  },
  {
    id: 10, collectionId: "bukhari", number: 5027,
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    english: "A Muslim is the one from whose tongue and hands the Muslims are safe.",
    narrator: "Narrated Abdullah ibn Amr (رضي الله عنهما)",
    grades: "Sahih", chapter: "Faith",
  },
  {
    id: 11, collectionId: "bukhari", number: 6018,
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    english: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Good Manners",
  },
  {
    id: 12, collectionId: "bukhari", number: 6412,
    arabic: "كُونُوا فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ",
    english: "Be in this world as though you are a stranger or a wayfarer.",
    narrator: "Narrated Ibn Umar (رضي الله عنهما)",
    grades: "Sahih", chapter: "Zuhd (Abstinence)",
  },
  {
    id: 13, collectionId: "bukhari", number: 6491,
    arabic: "لاَ تَغْضَبْ وَلَكَ الْجَنَّةُ",
    english: "Do not get angry, and Paradise is yours.",
    narrator: "Narrated Abu Darda (رضي الله عنه)",
    grades: "Sahih", chapter: "Good Manners",
  },
  {
    id: 14, collectionId: "bukhari", number: 2697,
    arabic: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ فِيهِ فَهُوَ رَدٌّ",
    english: "Whoever introduces anything into this matter of ours that is not part of it will have it rejected.",
    narrator: "Narrated Aisha (رضي الله عنها)",
    grades: "Sahih", chapter: "Reconciliation",
  },
  {
    id: 15, collectionId: "bukhari", number: 3605,
    arabic: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
    english: "The world is a prison for the believer and a paradise for the disbeliever.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Zuhd",
  },
  // ── Sahih Muslim ──
  {
    id: 16, collectionId: "muslim", number: 223,
    arabic: "الطَّهُورُ شَطْرُ الإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلآنِ أَوْ تَمْلأُ مَا بَيْنَ السَّمَوَاتِ وَالأَرْضِ",
    english: "Purity is half of faith. Alhamdulillah fills the scales, and SubhanAllah and Alhamdulillah together fill — or each fills — whatever is between the heavens and the earth.",
    narrator: "Narrated Abu Malik al-Ash'ari (رضي الله عنه)",
    grades: "Sahih", chapter: "Purification",
  },
  {
    id: 17, collectionId: "muslim", number: 2553,
    arabic: "صِلْ مَنْ قَطَعَكَ، وَأَعْطِ مَنْ حَرَمَكَ، وَاعْفُ عَمَّنْ ظَلَمَكَ",
    english: "Maintain relations with those who cut you off, give to those who deprive you, and forgive those who wrong you.",
    narrator: "Narrated Uqba ibn Amir (رضي الله عنه)",
    grades: "Sahih", chapter: "Goodness and Ties of Kinship",
  },
  {
    id: 18, collectionId: "muslim", number: 2699,
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    english: "Whoever treads a path in search of knowledge, Allah will make easy for him a path to Paradise.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Dhikr and Du'a",
  },
  {
    id: 19, collectionId: "muslim", number: 1631,
    arabic: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ",
    english: "When a person dies, his deeds come to an end except for three: ongoing charity, knowledge that benefits others, or a righteous child who prays for him.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Wasiyyah (Bequests)",
  },
  {
    id: 20, collectionId: "muslim", number: 2564,
    arabic: "حَقُّ الْمُسْلِمِ عَلَى الْمُسْلِمِ سِتٌّ: إِذَا لَقِيتَهُ فَسَلِّمْ عَلَيْهِ، وَإِذَا دَعَاكَ فَأَجِبْهُ",
    english: "The Muslim has six rights over the Muslim: when you meet him greet him with peace; when he invites you, accept his invitation; when he asks you for advice, give it to him; when he sneezes and praises Allah, say 'yarhamuk Allah'; when he is sick, visit him; when he dies, follow his funeral.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Greetings",
  },
  {
    id: 21, collectionId: "muslim", number: 2956,
    arabic: "الدُّنْيَا مَتَاعٌ وَخَيْرُ مَتَاعِهَا الْمَرْأَةُ الصَّالِحَةُ",
    english: "The world is a provision, and the best provision of the world is a righteous woman.",
    narrator: "Narrated Abdullah ibn Amr (رضي الله عنهما)",
    grades: "Sahih", chapter: "Marriage",
  },
  {
    id: 22, collectionId: "muslim", number: 769,
    arabic: "أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ",
    english: "The closest that a servant can be to his Lord is when he is in prostration, so make frequent supplication.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Prayer",
  },
  {
    id: 23, collectionId: "muslim", number: 55,
    arabic: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ — أَوْ بِضْعٌ وَسِتُّونَ — شُعْبَةً فَأَفْضَلُهَا قَوْلُ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَدْنَاهَا إِمَاطَةُ الأَذَى عَنِ الطَّرِيقِ وَالْحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ",
    english: "Faith has seventy-odd — or sixty-odd — branches. The highest is saying 'there is no god but Allah,' and the lowest is removing something harmful from the road. And modesty is a branch of faith.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Faith",
  },
  {
    id: 24, collectionId: "muslim", number: 2588,
    arabic: "لاَ تَحَاسَدُوا وَلاَ تَنَاجَشُوا وَلاَ تَبَاغَضُوا وَلاَ تَدَابَرُوا وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا",
    english: "Do not envy one another, do not artificially inflate prices, do not hate one another, do not turn away from one another, but rather be servants of Allah as brothers.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Virtue and Joining of Ties",
  },
  {
    id: 25, collectionId: "muslim", number: 2586,
    arabic: "لاَ تَدْخُلُونَ الْجَنَّةَ حَتَّى تُؤْمِنُوا وَلاَ تُؤْمِنُوا حَتَّى تَحَابُّوا أَوَلاَ أَدُلُّكُمْ عَلَى شَيْءٍ إِذَا فَعَلْتُمُوهُ تَحَابَبْتُمْ أَفْشُوا السَّلاَمَ بَيْنَكُمْ",
    english: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I not tell you of something that if you do it you will love one another? Spread greetings of peace among yourselves.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Faith",
  },
  // ── Sunan Abi Dawud ──
  {
    id: 26, collectionId: "abudawud", number: 4800,
    arabic: "إِنَّمَا بُعِثْتُ لأُتَمِّمَ مَكَارِمَ الأَخْلاَقِ",
    english: "I was sent only to perfect good character.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Hasan", chapter: "Good Manners",
  },
  {
    id: 27, collectionId: "abudawud", number: 1474,
    arabic: "مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا",
    english: "Whoever reads a letter from the Book of Allah will receive a good deed, and a good deed is multiplied ten times over.",
    narrator: "Narrated Ibn Mas'ud (رضي الله عنه)",
    grades: "Hasan Sahih", chapter: "Prayer",
  },
  {
    id: 28, collectionId: "abudawud", number: 3566,
    arabic: "اليَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى",
    english: "The upper hand is better than the lower hand (i.e., the giving hand is better than the taking hand).",
    narrator: "Narrated Ibn Umar (رضي الله عنهما)",
    grades: "Sahih", chapter: "Zakat",
  },
  {
    id: 29, collectionId: "abudawud", number: 1285,
    arabic: "عَلَيْكُمْ بِقِيَامِ اللَّيْلِ فَإِنَّهُ دَأَبُ الصَّالِحِينَ قَبْلَكُمْ وَهُوَ قُرْبَةٌ إِلَى رَبِّكُمْ",
    english: "You must pray Qiyam al-Layl (night prayer), for it is the practice of the righteous people before you, and it brings you closer to your Lord.",
    narrator: "Narrated Abu Umamah (رضي الله عنه)",
    grades: "Hasan", chapter: "Prayer at Night",
  },
  {
    id: 30, collectionId: "abudawud", number: 512,
    arabic: "الصَّلاَةُ عَمُودُ الدِّينِ مَنْ أَقَامَهَا فَقَدْ أَقَامَ الدِّينَ وَمَنْ تَرَكَهَا فَقَدْ هَدَمَ الدِّينَ",
    english: "Prayer is the pillar of the religion. Whoever establishes it has established the religion, and whoever abandons it has demolished the religion.",
    narrator: "Narrated Muadh ibn Jabal (رضي الله عنه)",
    grades: "Hasan", chapter: "Prayer",
  },
  // ── Jami' al-Tirmidhi ──
  {
    id: 31, collectionId: "tirmidhi", number: 2416,
    arabic: "الزُّهْدُ فِي الدُّنْيَا لَيْسَ بِتَحْرِيمِ الْحَلاَلِ وَلاَ إِضَاعَةِ الْمَالِ وَلَكِنَّ الزُّهْدَ فِي الدُّنْيَا أَنْ لاَ تَكُونَ بِمَا فِي يَدَيْكَ أَوْثَقَ مِمَّا فِي يَدِ اللَّهِ",
    english: "Abstinence in the world is not making the lawful forbidden or wasting wealth; rather, abstinence in the world means that you are not more certain about what is in your hands than about what is in the hands of Allah.",
    narrator: "Narrated Abu Dharr (رضي الله عنه)",
    grades: "Hasan", chapter: "Zuhd",
  },
  {
    id: 32, collectionId: "tirmidhi", number: 2388,
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
    english: "Fear Allah wherever you are, follow a bad deed with a good one and it will wipe it out, and behave well towards people.",
    narrator: "Narrated Abu Dharr (رضي الله عنه)",
    grades: "Hasan", chapter: "Good Deeds",
  },
  {
    id: 33, collectionId: "tirmidhi", number: 1162,
    arabic: "خَيْرُكُمْ خَيْرُكُمْ لأَهْلِهِ وَأَنَا خَيْرُكُمْ لأَهْلِي",
    english: "The best of you is the best to his family, and I am the best of you to my family.",
    narrator: "Narrated Aisha (رضي الله عنها)",
    grades: "Hasan Sahih", chapter: "Virtues of Jihad",
  },
  {
    id: 34, collectionId: "tirmidhi", number: 2516,
    arabic: "احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلاَ تَعْجَزَنَّ",
    english: "Be eager for what benefits you, seek help from Allah, and do not be helpless.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Qadar",
  },
  {
    id: 35, collectionId: "tirmidhi", number: 3375,
    arabic: "أَفْضَلُ الذِّكْرِ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَفْضَلُ الدُّعَاءِ الْحَمْدُ لِلَّهِ",
    english: "The best remembrance is 'La ilaha illallah' (there is no god but Allah) and the best supplication is 'Al-hamdu lillah' (all praise is due to Allah).",
    narrator: "Narrated Jabir (رضي الله عنه)",
    grades: "Hasan", chapter: "Du'a",
  },
  // ── 40 Hadith Nawawi ──
  {
    id: 36, collectionId: "nawawi40", number: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english: "Verily actions are by intentions, and for every person is what he intended.",
    narrator: "Narrated Umar ibn al-Khattab (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 37, collectionId: "nawawi40", number: 2,
    arabic: "بَيْنَمَا نَحْنُ عِنْدَ رَسُولِ اللَّهِ ﷺ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ شَدِيدُ سَوَادِ الشَّعَرِ",
    english: "One day while we were sitting with the Messenger of Allah (ﷺ) there appeared before us a man whose clothes were exceedingly white and whose hair was exceedingly black... He asked: 'What is Islam?' He (ﷺ) said: 'Islam is to testify that there is none worthy of worship but Allah and that Muhammad is the Messenger of Allah, to perform the prayers, pay zakat, fast Ramadan, and make pilgrimage to the House if you are able.'",
    narrator: "Narrated Umar ibn al-Khattab (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 38, collectionId: "nawawi40", number: 5,
    arabic: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",
    english: "Whoever introduces something new into this matter of ours that does not belong to it will have it rejected.",
    narrator: "Narrated Aisha (رضي الله عنها)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 39, collectionId: "nawawi40", number: 6,
    arabic: "إِنَّ الْحَلاَلَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لاَ يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ",
    english: "Truly the halal is clear and the haram is clear, and between the two of them are doubtful matters that many people do not know about.",
    narrator: "Narrated Nu'man ibn Bashir (رضي الله عنهما)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 40, collectionId: "nawawi40", number: 7,
    arabic: "الدِّينُ النَّصِيحَةُ قُلْنَا لِمَنْ قَالَ لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ",
    english: "The religion is sincere advice. We asked: 'To whom?' He said: 'To Allah, to His Book, to His Messenger, and to the leaders of the Muslims and their common folk.'",
    narrator: "Narrated Tamim al-Dari (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 41, collectionId: "nawawi40", number: 9,
    arabic: "مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ وَمَا أَمَرْتُكُمْ بِهِ فَافْعَلُوا مِنْهُ مَا اسْتَطَعْتُمْ",
    english: "Whatever I forbid you from, avoid it; and whatever I command you with, do of it as much as you are able.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 42, collectionId: "nawawi40", number: 12,
    arabic: "مِنْ حُسْنِ إِسْلاَمِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ",
    english: "Part of the perfection of a person's Islam is his leaving that which does not concern him.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Hasan", chapter: "Nawawi 40",
  },
  {
    id: 43, collectionId: "nawawi40", number: 13,
    arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english: "None of you truly believes until he loves for his brother what he loves for himself.",
    narrator: "Narrated Anas ibn Malik (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 44, collectionId: "nawawi40", number: 17,
    arabic: "إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ",
    english: "Verily Allah has ordained proficiency in all things. So when you kill, do so proficiently; and when you slaughter, do so proficiently.",
    narrator: "Narrated Shaddad ibn Aws (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 45, collectionId: "nawawi40", number: 18,
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا",
    english: "Fear Allah wherever you are; follow up a bad deed with a good deed and it will blot it out; and treat people with good character.",
    narrator: "Narrated Abu Dharr (رضي الله عنه)",
    grades: "Hasan", chapter: "Nawawi 40",
  },
  {
    id: 46, collectionId: "nawawi40", number: 19,
    arabic: "احْفَظِ اللَّهَ يَحْفَظْكَ احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ",
    english: "Be mindful of Allah, and Allah will protect you. Be mindful of Allah, and you will find Him in front of you.",
    narrator: "Narrated Ibn Abbas (رضي الله عنهما)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 47, collectionId: "nawawi40", number: 29,
    arabic: "لَوْ تَعْلَمُونَ مَا أَعْلَمُ لَضَحِكْتُمْ قَلِيلاً وَلَبَكَيْتُمْ كَثِيرًا",
    english: "If you knew what I know, you would laugh little and weep much.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  {
    id: 48, collectionId: "nawawi40", number: 34,
    arabic: "مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ وَذَلِكَ أَضْعَفُ الإِيمَانِ",
    english: "Whoever of you sees an evil, let him change it with his hand; if he cannot, then with his tongue; and if he cannot, then with his heart — and that is the weakest of faith.",
    narrator: "Narrated Abu Sa'id al-Khudri (رضي الله عنه)",
    grades: "Sahih", chapter: "Nawawi 40",
  },
  // ── Riyad as-Salihin ──
  {
    id: 49, collectionId: "riyadussalihin", number: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    english: "Verily deeds are by intentions.",
    narrator: "Narrated Umar ibn al-Khattab (رضي الله عنه)",
    grades: "Sahih", chapter: "Sincerity",
  },
  {
    id: 50, collectionId: "riyadussalihin", number: 68,
    arabic: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ",
    english: "Whoever guides to something good will have a reward similar to the one who does it.",
    narrator: "Narrated Abu Mas'ud (رضي الله عنه)",
    grades: "Sahih", chapter: "Good Deeds",
  },
  {
    id: 51, collectionId: "riyadussalihin", number: 85,
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ",
    english: "Whoever believes in Allah and the Last Day, let him honor his guest.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Hospitality",
  },
  {
    id: 52, collectionId: "riyadussalihin", number: 100,
    arabic: "أَفْضَلُ الصِّيَامِ بَعْدَ رَمَضَانَ شَهْرُ اللَّهِ الْمُحَرَّمُ وَأَفْضَلُ الصَّلاَةِ بَعْدَ الْفَرِيضَةِ صَلاَةُ اللَّيْلِ",
    english: "The best fasting after Ramadan is the month of Allah, al-Muharram, and the best prayer after the obligatory is the night prayer.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Voluntary Fasts",
  },
  {
    id: 53, collectionId: "riyadussalihin", number: 126,
    arabic: "إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
    english: "Verily Allah does not look at your appearances or your wealth, but He looks at your hearts and your deeds.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Inner Life",
  },
  {
    id: 54, collectionId: "riyadussalihin", number: 155,
    arabic: "السَّلاَمُ قَبْلَ الْكَلاَمِ",
    english: "Greeting with peace comes before speaking.",
    narrator: "Narrated Jabir (رضي الله عنه)",
    grades: "Hasan", chapter: "Salam",
  },
  {
    id: 55, collectionId: "riyadussalihin", number: 186,
    arabic: "مَا يَزَالُ الْبَلاَءُ بِالْمُؤْمِنِ وَالْمُؤْمِنَةِ فِي نَفْسِهِ وَوَلَدِهِ وَمَالِهِ حَتَّى يَلْقَى اللَّهَ وَمَا عَلَيْهِ خَطِيئَةٌ",
    english: "Trials never cease to afflict the believing man and woman in his person, his children, and his wealth, until he meets Allah with no sin on him.",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Patience",
  },
  {
    id: 56, collectionId: "riyadussalihin", number: 243,
    arabic: "يَقُولُ اللَّهُ تَعَالَى أَنَا عِنْدَ ظَنِّ عَبْدِي بِي",
    english: "Allah the Exalted says: 'I am as My servant thinks of Me.'",
    narrator: "Narrated Abu Hurairah (رضي الله عنه)",
    grades: "Sahih", chapter: "Hope",
  },
  {
    id: 57, collectionId: "riyadussalihin", number: 312,
    arabic: "مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا أَوْ يَزْرَعُ زَرْعًا فَيَأْكُلُ مِنْهُ إِنْسَانٌ أَوْ طَيْرٌ أَوْ بَهِيمَةٌ إِلاَّ كَانَ لَهُ بِهِ صَدَقَةٌ",
    english: "There is no Muslim who plants a tree or sows crops from which a human, a bird, or an animal eats, except that it will be charity for him.",
    narrator: "Narrated Anas ibn Malik (رضي الله عنه)",
    grades: "Sahih", chapter: "Planting and Cultivation",
  },
];

// Compute counts per collection
COLLECTIONS.forEach(col => {
  col.count = ALL_HADITHS.filter(h => h.collectionId === col.id).length;
});

export function getHadithsByCollection(collectionId: string): LocalHadith[] {
  return ALL_HADITHS.filter(h => h.collectionId === collectionId);
}

export function searchHadiths(query: string): LocalHadith[] {
  const q = query.toLowerCase();
  return ALL_HADITHS.filter(
    h =>
      h.english.toLowerCase().includes(q) ||
      h.arabic.includes(query) ||
      h.narrator.toLowerCase().includes(q),
  );
}

export function getRandomHadith(): LocalHadith {
  return ALL_HADITHS[Math.floor(Math.random() * ALL_HADITHS.length)];
}

export { ALL_HADITHS };
