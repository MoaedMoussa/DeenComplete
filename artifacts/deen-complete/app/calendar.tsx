import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' Al-Awwal", "Rabi' Al-Thani",
  "Jumada Al-Awwal", "Jumada Al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
];

const HIJRI_MONTHS_AR = [
  "مُحَرَّم", "صَفَر", "رَبِيع الأَوَّل", "رَبِيع الثَّانِي",
  "جُمَادَى الأُولَى", "جُمَادَى الآخِرَة", "رَجَب", "شَعْبَان",
  "رَمَضَان", "شَوَّال", "ذُو الْقَعْدَة", "ذُو الْحِجَّة",
];

function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
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
  return { year, month, day };
}

const ISLAMIC_EVENTS = [
  { month: 1, day: 1, event: "Islamic New Year", arabic: "رأس السنة الهجرية", importance: "high" },
  { month: 1, day: 10, event: "Day of Ashura", arabic: "يوم عاشوراء", importance: "high" },
  { month: 3, day: 12, event: "Mawlid Al-Nabawi", arabic: "المولد النبوي الشريف", importance: "medium" },
  { month: 7, day: 27, event: "Isra & Mi'raj", arabic: "الإسراء والمعراج", importance: "high" },
  { month: 8, day: 15, event: "Night of Bara'at", arabic: "ليلة البراءة", importance: "medium" },
  { month: 9, day: 1, event: "Start of Ramadan", arabic: "بداية رمضان", importance: "high" },
  { month: 9, day: 27, event: "Laylat Al-Qadr", arabic: "ليلة القدر", importance: "high" },
  { month: 10, day: 1, event: "Eid Al-Fitr", arabic: "عيد الفطر المبارك", importance: "high" },
  { month: 12, day: 8, event: "Day of Tarwiyah", arabic: "يوم التروية", importance: "medium" },
  { month: 12, day: 9, event: "Day of Arafah", arabic: "يوم عرفة", importance: "high" },
  { month: 12, day: 10, event: "Eid Al-Adha", arabic: "عيد الأضحى المبارك", importance: "high" },
  { month: 12, day: 11, event: "Days of Tashreeq", arabic: "أيام التشريق", importance: "medium" },
];

function getDayInfo(date: Date) {
  const hijri = gregorianToHijri(date);
  const events = ISLAMIC_EVENTS.filter(e => e.month === hijri.month && e.day === hijri.day);
  return { hijri, events };
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { hijri: todayHijri, events: todayEvents } = getDayInfo(today);

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function prevMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  const s = styles(colors, bottomPad);

  const importanceColors: Record<string, string> = {
    high: colors.primary,
    medium: colors.accent,
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Today Hijri Card */}
      <View style={s.todayCard}>
        <Text style={s.todayLabel}>Today</Text>
        <Text style={s.todayGregorian}>{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>
        <Text style={s.todayHijri}>
          {todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year} AH
        </Text>
        <Text style={s.todayHijriAr}>
          {todayHijri.day} {HIJRI_MONTHS_AR[todayHijri.month - 1]} {todayHijri.year} هـ
        </Text>
        {todayEvents.length > 0 && todayEvents.map(e => (
          <View key={e.event} style={s.todayEvent}>
            <Feather name="star" size={14} color={colors.accent} />
            <Text style={s.todayEventText}>{e.event} — {e.arabic}</Text>
          </View>
        ))}
      </View>

      {/* Gregorian Calendar */}
      <View style={s.calendarCard}>
        <View style={s.calHeader}>
          <TouchableOpacity onPress={prevMonth}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.calMonth}>
            {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={nextMonth}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={s.weekRow}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <Text key={d} style={[s.weekDay, i === 5 && s.fridayLabel]}>{d}</Text>
          ))}
        </View>

        <View style={s.daysGrid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`e${i}`} style={s.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const thisDate = new Date(year, month, dayNum);
            const { hijri, events } = getDayInfo(thisDate);
            const isToday =
              dayNum === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isFriday = thisDate.getDay() === 5;
            const hasEvent = events.length > 0;
            return (
              <View key={dayNum} style={[s.dayCell, isToday && s.dayToday]}>
                <Text style={[s.dayNum, isToday && s.dayNumToday, isFriday && !isToday && s.dayFriday]}>
                  {dayNum}
                </Text>
                <Text style={[s.dayHijri, isToday && s.dayHijriToday]}>{hijri.day}</Text>
                {hasEvent && <View style={[s.eventDot, { backgroundColor: importanceColors[events[0].importance] }]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Hijri month name */}
      <View style={s.hijriMonthCard}>
        <Text style={s.hijriMonthEng}>{HIJRI_MONTHS[todayHijri.month - 1]}</Text>
        <Text style={s.hijriMonthAr}>{HIJRI_MONTHS_AR[todayHijri.month - 1]}</Text>
        <Text style={s.hijriMonthYear}>{todayHijri.year} AH</Text>
      </View>

      {/* All Islamic Events */}
      <Text style={s.sectionTitle}>Islamic Calendar Events</Text>
      {ISLAMIC_EVENTS.map(event => (
        <View key={event.event} style={[s.eventCard, { borderLeftColor: importanceColors[event.importance] }]}>
          <View style={s.eventLeft}>
            <Text style={s.eventDate}>{event.day} {HIJRI_MONTHS[event.month - 1]}</Text>
            <Text style={s.eventName}>{event.event}</Text>
            <Text style={s.eventArabic}>{event.arabic}</Text>
          </View>
          {event.importance === "high" && (
            <Feather name="star" size={14} color={colors.accent} />
          )}
        </View>
      ))}

      <View style={{ height: 40 + bottomPad }} />
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    todayCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    todayLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
    todayGregorian: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 8 },
    todayHijri: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", marginBottom: 2 },
    todayHijriAr: { fontFamily: "Amiri_400Regular", fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 10 },
    todayEvent: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    todayEventText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.accent },
    calendarCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    calMonth: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground },
    weekRow: { flexDirection: "row", marginBottom: 8 },
    weekDay: { flex: 1, textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground },
    fridayLabel: { color: colors.primary },
    daysGrid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 0.85,
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
    },
    dayToday: {
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    dayNum: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    dayNumToday: { color: "#fff" },
    dayFriday: { color: colors.primary },
    dayHijri: { fontFamily: "Inter_400Regular", fontSize: 9, color: colors.mutedForeground },
    dayHijriToday: { color: "rgba(255,255,255,0.7)" },
    eventDot: { width: 4, height: 4, borderRadius: 2 },
    hijriMonthCard: {
      backgroundColor: colors.primary + "10",
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    hijriMonthEng: { fontFamily: "Inter_700Bold", fontSize: 18, color: colors.primary },
    hijriMonthAr: { fontFamily: "Amiri_400Regular", fontSize: 22, color: colors.primary, marginTop: 4 },
    hijriMonthYear: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
    sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 },
    eventCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    eventLeft: { flex: 1 },
    eventDate: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground, marginBottom: 2 },
    eventName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    eventArabic: { fontFamily: "Amiri_400Regular", fontSize: 14, color: colors.accent, marginTop: 2 },
  });
