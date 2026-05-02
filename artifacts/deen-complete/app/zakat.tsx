import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const TROY_OZ_TO_GRAMS = 31.1035;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const ZAKAT_RATE = 0.025;

interface MetalPrices {
  goldPerGram: number;
  silverPerGram: number;
  fetchedAt: string;
  isLive: boolean;
}

const FALLBACK_PRICES: MetalPrices = {
  goldPerGram: 4614 / TROY_OZ_TO_GRAMS,
  silverPerGram: 75 / TROY_OZ_TO_GRAMS,
  fetchedAt: "",
  isLive: false,
};

async function fetchMetalPrices(): Promise<MetalPrices> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const [goldRes, silverRes] = await Promise.all([
      fetch("https://api.coinbase.com/v2/prices/XAU-USD/spot", { signal: controller.signal }),
      fetch("https://api.coinbase.com/v2/prices/XAG-USD/spot", { signal: controller.signal }),
    ]);
    clearTimeout(timer);
    const [goldJson, silverJson] = await Promise.all([goldRes.json(), silverRes.json()]);
    const goldOz = parseFloat(goldJson.data.amount);
    const silverOz = parseFloat(silverJson.data.amount);
    return {
      goldPerGram: goldOz / TROY_OZ_TO_GRAMS,
      silverPerGram: silverOz / TROY_OZ_TO_GRAMS,
      fetchedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isLive: true,
    };
  } catch {
    clearTimeout(timer);
    return FALLBACK_PRICES;
  }
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
  const [currency] = useState("USD");
  const [prices, setPrices] = useState<MetalPrices>(FALLBACK_PRICES);
  const [loadingPrices, setLoadingPrices] = useState(true);

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  useEffect(() => {
    setLoadingPrices(true);
    fetchMetalPrices().then(p => {
      setPrices(p);
      setLoadingPrices(false);
    });
  }, []);

  const goldValue = parseFloat(gold || "0") * prices.goldPerGram;
  const silverValue = parseFloat(silver || "0") * prices.silverPerGram;
  const totalAssets =
    parseFloat(cash || "0") +
    goldValue +
    silverValue +
    parseFloat(investments || "0") +
    parseFloat(businessAssets || "0") +
    parseFloat(receivables || "0");
  const totalDebts = parseFloat(debts || "0");
  const netWorth = totalAssets - totalDebts;

  const goldNisab = GOLD_NISAB_GRAMS * prices.goldPerGram;
  const silverNisab = SILVER_NISAB_GRAMS * prices.silverPerGram;
  const nisabThreshold = Math.min(goldNisab, silverNisab);
  const meetsNisab = netWorth >= nisabThreshold;
  const zakatDue = meetsNisab ? netWorth * ZAKAT_RATE : 0;

  const s = styles(colors, bottomPad);

  const inputRows = [
    { label: "Cash & Bank Savings", value: cash, onChange: setCash, unit: currency },
    {
      label: "Gold Value",
      value: gold,
      onChange: setGold,
      unit: "grams",
      hint: `≈ ${currency} ${prices.goldPerGram.toFixed(2)}/g`,
    },
    {
      label: "Silver Value",
      value: silver,
      onChange: setSilver,
      unit: "grams",
      hint: `≈ ${currency} ${prices.silverPerGram.toFixed(2)}/g`,
    },
    { label: "Investments & Stocks", value: investments, onChange: setInvestments, unit: currency },
    { label: "Business Assets", value: businessAssets, onChange: setBusinessAssets, unit: currency },
    { label: "Money Owed to You", value: receivables, onChange: setReceivables, unit: currency },
    { label: "Debts Owed by You", value: debts, onChange: setDebts, unit: currency },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Info banner */}
      <View style={s.infoBox}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={s.infoText}>
          Zakat is 2.5% of your total net wealth held for one lunar year above the Nisab threshold.
        </Text>
      </View>

      {/* Live Nisab banner */}
      <View style={[s.nisabBanner, { backgroundColor: colors.goldLight, borderColor: colors.accent + "40" }]}>
        <View style={s.nisabBannerLeft}>
          <View style={s.nisabBannerRow}>
            <Text style={[s.nisabBannerTitle, { color: colors.foreground }]}>Current Nisab Threshold</Text>
            {loadingPrices ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 6 }} />
            ) : (
              <View style={[s.liveBadge, { backgroundColor: prices.isLive ? "#22C55E20" : colors.muted }]}>
                <View style={[s.liveDot, { backgroundColor: prices.isLive ? "#22C55E" : colors.mutedForeground }]} />
                <Text style={[s.liveTxt, { color: prices.isLive ? "#22C55E" : colors.mutedForeground }]}>
                  {prices.isLive ? `Live · ${prices.fetchedAt}` : "Estimated"}
                </Text>
              </View>
            )}
          </View>
          <View style={s.nisabValues}>
            <View style={s.nisabValueCol}>
              <Text style={[s.nisabValueLabel, { color: colors.mutedForeground }]}>Silver (595g)</Text>
              <Text style={[s.nisabValueAmt, { color: colors.primary }]}>
                {currency} {silverNisab.toLocaleString("en", { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={[s.nisabDivider, { backgroundColor: colors.border }]} />
            <View style={s.nisabValueCol}>
              <Text style={[s.nisabValueLabel, { color: colors.mutedForeground }]}>Gold (85g)</Text>
              <Text style={[s.nisabValueAmt, { color: colors.primary }]}>
                {currency} {goldNisab.toLocaleString("en", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
          <Text style={[s.nisabNote, { color: colors.mutedForeground }]}>
            Using silver standard (lower threshold) · {currency} {nisabThreshold.toLocaleString("en", { maximumFractionDigits: 0 })}
          </Text>
          <View style={s.metalPricesRow}>
            <Text style={[s.metalPrice, { color: colors.mutedForeground }]}>
              Gold: {currency} {prices.goldPerGram.toFixed(2)}/g
            </Text>
            <Text style={[s.metalPrice, { color: colors.mutedForeground }]}>  ·  </Text>
            <Text style={[s.metalPrice, { color: colors.mutedForeground }]}>
              Silver: {currency} {prices.silverPerGram.toFixed(2)}/g
            </Text>
          </View>
        </View>
      </View>

      {/* Asset inputs */}
      <Text style={s.sectionTitle}>Your Assets</Text>
      <View style={s.inputCard}>
        {inputRows.map((item, idx) => (
          <View key={item.label}>
            <View style={s.inputRow}>
              <View style={s.inputLabelWrap}>
                <Text style={s.inputLabel}>{item.label}</Text>
                {"hint" in item && item.hint ? (
                  <Text style={[s.inputHint, { color: colors.mutedForeground }]}>{item.hint}</Text>
                ) : null}
              </View>
              <View style={s.inputWrapper}>
                <Text style={s.inputUnit}>{item.unit}</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground }]}
                  value={item.value}
                  onChangeText={item.onChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            {idx < inputRows.length - 1 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.summaryTitle, { color: colors.foreground }]}>Calculation Summary</Text>
        <View style={s.summaryRow}>
          <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Total Assets</Text>
          <Text style={[s.summaryValue, { color: colors.foreground }]}>{currency} {totalAssets.toFixed(2)}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Total Debts</Text>
          <Text style={[s.summaryValue, { color: "#EF4444" }]}>- {currency} {totalDebts.toFixed(2)}</Text>
        </View>
        <View style={[s.summaryRow, s.summaryNet, { borderTopColor: colors.border }]}>
          <Text style={[s.summaryNetLabel, { color: colors.foreground }]}>Net Zakatable Wealth</Text>
          <Text style={[s.summaryNetValue, { color: colors.primary }]}>{currency} {netWorth.toFixed(2)}</Text>
        </View>
        <View style={s.nisabStatusRow}>
          <View style={[s.nisabStatusBadge, { backgroundColor: meetsNisab ? "#22C55E20" : "#EF444420" }]}>
            <Feather
              name={meetsNisab ? "check-circle" : "alert-circle"}
              size={14}
              color={meetsNisab ? "#22C55E" : "#EF4444"}
            />
            <Text style={[s.nisabStatusText, { color: meetsNisab ? "#22C55E" : "#EF4444" }]}>
              {meetsNisab ? "Above Nisab — Zakat is due" : "Below Nisab — Zakat not yet due"}
            </Text>
          </View>
        </View>
      </View>

      {/* Zakat Due */}
      <View style={[s.zakatCard, !meetsNisab && s.zakatCardDisabled, { backgroundColor: meetsNisab ? colors.primary : colors.muted }]}>
        <Text style={[s.zakatLabel, { color: meetsNisab ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>Zakat Due</Text>
        <Text style={[s.zakatAmount, { color: meetsNisab ? "#fff" : colors.foreground }]}>
          {currency} {zakatDue.toFixed(2)}
        </Text>
        <Text style={[s.zakatRate, { color: meetsNisab ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
          @ 2.5% of net zakatable wealth
        </Text>
      </View>

      {/* Zakat Al-Fitr */}
      <View style={[s.fitrCard, { backgroundColor: colors.goldLight, borderLeftColor: colors.accent }]}>
        <Text style={[s.fitrTitle, { color: colors.accent }]}>Zakat Al-Fitr</Text>
        <Text style={[s.fitrDesc, { color: colors.foreground }]}>
          Obligatory at end of Ramadan for every Muslim. Pay before Eid prayer. Approximately {currency} 7–15 per person.
        </Text>
      </View>

      {/* Trusted Charities */}
      <Text style={s.sectionTitle}>Trusted Charities</Text>
      {[
        { name: "Islamic Relief", category: "International Aid", website: "islamic-relief.org" },
        { name: "Human Appeal", category: "Global Humanitarian", website: "humanappeal.org.uk" },
        { name: "Muslim Aid", category: "Development & Relief", website: "muslimaid.org" },
        { name: "LaunchGood", category: "Islamic Crowdfunding", website: "launchgood.com" },
      ].map(charity => (
        <View key={charity.name} style={[s.charityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.charityIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="heart" size={18} color={colors.primary} />
          </View>
          <View style={s.charityInfo}>
            <Text style={[s.charityName, { color: colors.foreground }]}>{charity.name}</Text>
            <Text style={[s.charityCategory, { color: colors.mutedForeground }]}>{charity.website}</Text>
          </View>
          <Text style={[s.charityBadge, { color: colors.mutedForeground }]}>{charity.category}</Text>
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
      marginBottom: 12,
    },
    infoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 20 },

    nisabBanner: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    nisabBannerLeft: { gap: 6 },
    nisabBannerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    nisabBannerTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveTxt: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
    nisabValues: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 4 },
    nisabValueCol: { flex: 1 },
    nisabValueLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
    nisabValueAmt: { fontFamily: "Inter_700Bold", fontSize: 17 },
    nisabDivider: { width: 1, height: 32 },
    nisabNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
    metalPricesRow: { flexDirection: "row", marginTop: 4 },
    metalPrice: { fontFamily: "Inter_400Regular", fontSize: 11 },

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
      paddingVertical: 11,
      gap: 8,
    },
    inputLabelWrap: { flex: 1, minWidth: 0 },
    inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.foreground },
    inputHint: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 1 },
    inputWrapper: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
    inputUnit: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground },
    input: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      textAlign: "right",
      width: 80,
      padding: 4,
    },
    divider: { height: 1, marginLeft: 16 },

    summaryCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      marginBottom: 16,
    },
    summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 12 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
    summaryValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
    summaryNet: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
    summaryNetLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
    summaryNetValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
    nisabStatusRow: { marginTop: 10 },
    nisabStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 8,
      padding: 10,
    },
    nisabStatusText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

    zakatCard: {
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
    },
    zakatCardDisabled: { shadowOpacity: 0 },
    zakatLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 8 },
    zakatAmount: { fontFamily: "Inter_700Bold", fontSize: 40 },
    zakatRate: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },

    fitrCard: {
      borderRadius: 14,
      padding: 16,
      borderLeftWidth: 4,
      marginBottom: 20,
    },
    fitrTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 },
    fitrDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },

    charityCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      gap: 12,
    },
    charityIcon: {
      width: 40, height: 40, borderRadius: 12,
      justifyContent: "center", alignItems: "center",
    },
    charityInfo: { flex: 1 },
    charityName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
    charityCategory: { fontFamily: "Inter_400Regular", fontSize: 12 },
    charityBadge: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", maxWidth: 80 },
  });
