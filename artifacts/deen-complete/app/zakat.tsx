import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const GOLD_PRICE_PER_GRAM = 90;
const SILVER_PRICE_PER_GRAM = 1;
const ZAKAT_RATE = 0.025;

interface ZakatItem {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
}

export default function ZakatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [cash, setCash] = useState("");
  const [gold, setGold] = useState("");
  const [silver, setSilver] = useState("");
  const [investments, setInvestments] = useState("");
  const [businessAssets, setBusinessAssets] = useState("");
  const [receivables, setReceivables] = useState("");
  const [debts, setDebts] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [calculated, setCalculated] = useState(false);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const goldValue = parseFloat(gold || "0") * GOLD_PRICE_PER_GRAM;
  const silverValue = parseFloat(silver || "0") * SILVER_PRICE_PER_GRAM;
  const totalAssets =
    parseFloat(cash || "0") +
    goldValue +
    silverValue +
    parseFloat(investments || "0") +
    parseFloat(businessAssets || "0") +
    parseFloat(receivables || "0");
  const totalDebts = parseFloat(debts || "0");
  const netWorth = totalAssets - totalDebts;

  const goldNisab = GOLD_NISAB_GRAMS * GOLD_PRICE_PER_GRAM;
  const silverNisab = SILVER_NISAB_GRAMS * SILVER_PRICE_PER_GRAM;
  const nisabThreshold = Math.min(goldNisab, silverNisab);
  const meetsNisab = netWorth >= nisabThreshold;
  const zakatDue = meetsNisab ? netWorth * ZAKAT_RATE : 0;

  const s = styles(colors, bottomPad);

  const items: ZakatItem[] = [
    { label: "Cash & Bank Savings", value: cash, onChange: setCash, unit: currency },
    { label: "Gold Value", value: gold, onChange: setGold, unit: "grams" },
    { label: "Silver Value", value: silver, onChange: setSilver, unit: "grams" },
    { label: "Investments & Stocks", value: investments, onChange: setInvestments, unit: currency },
    { label: "Business Assets", value: businessAssets, onChange: setBusinessAssets, unit: currency },
    { label: "Money Owed to You", value: receivables, onChange: setReceivables, unit: currency },
    { label: "Debts Owed by You", value: debts, onChange: setDebts, unit: currency },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.infoBox}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={s.infoText}>
          Zakat is 2.5% of your total net wealth held for one lunar year above the Nisab threshold.
          Current Nisab: ~{currency} {nisabThreshold.toLocaleString()} (silver standard)
        </Text>
      </View>

      <Text style={s.sectionTitle}>Your Assets</Text>
      <View style={s.inputCard}>
        {items.map((item, idx) => (
          <View key={item.label}>
            <View style={s.inputRow}>
              <Text style={s.inputLabel}>{item.label}</Text>
              <View style={s.inputWrapper}>
                <Text style={s.inputUnit}>{item.unit}</Text>
                <TextInput
                  style={s.input}
                  value={item.value}
                  onChangeText={item.onChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            {idx < items.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>Calculation Summary</Text>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Assets</Text>
          <Text style={s.summaryValue}>{currency} {totalAssets.toFixed(2)}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Debts</Text>
          <Text style={[s.summaryValue, { color: "#EF4444" }]}>- {currency} {totalDebts.toFixed(2)}</Text>
        </View>
        <View style={[s.summaryRow, s.summaryNet]}>
          <Text style={s.summaryNetLabel}>Net Zakatable Wealth</Text>
          <Text style={s.summaryNetValue}>{currency} {netWorth.toFixed(2)}</Text>
        </View>
        <View style={s.nisabRow}>
          <View style={[s.nisabBadge, { backgroundColor: meetsNisab ? "#22C55E20" : "#EF444420" }]}>
            <Feather
              name={meetsNisab ? "check-circle" : "alert-circle"}
              size={14}
              color={meetsNisab ? "#22C55E" : "#EF4444"}
            />
            <Text style={[s.nisabText, { color: meetsNisab ? "#22C55E" : "#EF4444" }]}>
              {meetsNisab ? "Above Nisab — Zakat is due" : "Below Nisab — Zakat not yet due"}
            </Text>
          </View>
        </View>
      </View>

      {/* Zakat Due */}
      <View style={[s.zakatCard, !meetsNisab && s.zakatCardDisabled]}>
        <Text style={s.zakatLabel}>Zakat Due</Text>
        <Text style={s.zakatAmount}>{currency} {zakatDue.toFixed(2)}</Text>
        <Text style={s.zakatRate}>@ 2.5% of net wealth</Text>
      </View>

      {/* Zakat Al-Fitr */}
      <View style={s.fitrCard}>
        <Text style={s.fitrTitle}>Zakat Al-Fitr</Text>
        <Text style={s.fitrDesc}>
          Obligatory at end of Ramadan for every Muslim.
          Pay before Eid prayer. Approximately {currency} 7-15 per person.
        </Text>
      </View>

      {/* Charity Directory */}
      <Text style={s.sectionTitle}>Trusted Charities</Text>
      {[
        { name: "Islamic Relief", category: "International Aid", website: "islamic-relief.org" },
        { name: "Human Appeal", category: "Global Humanitarian", website: "humanappeal.org.uk" },
        { name: "Muslim Aid", category: "Development & Relief", website: "muslimaid.org" },
      ].map(charity => (
        <View key={charity.name} style={s.charityCard}>
          <View style={s.charityIcon}>
            <Feather name="heart" size={18} color={colors.primary} />
          </View>
          <View style={s.charityInfo}>
            <Text style={s.charityName}>{charity.name}</Text>
            <Text style={s.charityCategory}>{charity.category}</Text>
          </View>
          <Feather name="external-link" size={14} color={colors.mutedForeground} />
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
    infoBox: {
      flexDirection: "row",
      backgroundColor: colors.primary + "10",
      borderRadius: 12,
      padding: 14,
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 20,
    },
    infoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 20 },
    sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 },
    inputCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    inputRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, flex: 1 },
    inputWrapper: { flexDirection: "row", alignItems: "center", gap: 6 },
    inputUnit: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
    input: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      color: colors.foreground,
      textAlign: "right",
      minWidth: 80,
      padding: 4,
    },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, marginBottom: 12 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground },
    summaryValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    summaryNet: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
    summaryNetLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground },
    summaryNetValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.primary },
    nisabRow: { marginTop: 10 },
    nisabBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 8,
      padding: 10,
    },
    nisabText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
    zakatCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    zakatCardDisabled: { backgroundColor: colors.muted, shadowOpacity: 0 },
    zakatLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
    zakatAmount: { fontFamily: "Inter_700Bold", fontSize: 40, color: "#fff" },
    zakatRate: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    fitrCard: {
      backgroundColor: colors.goldLight,
      borderRadius: 14,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      marginBottom: 20,
    },
    fitrTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.accent, marginBottom: 6 },
    fitrDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, lineHeight: 20 },
    charityCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    charityIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center",
    },
    charityInfo: { flex: 1 },
    charityName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
    charityCategory: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
  });
