import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Platform, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

function getQiblaDirection(lat: number, lng: number): number {
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const latRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(dLng);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  return bearing;
}

function getDistanceToMakkah(lat: number, lng: number): number {
  const R = 6371;
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLon = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((KAABA_LAT * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { location } = useApp();
  const [heading, setHeading] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const qiblaAngle = location ? getQiblaDirection(location.lat, location.lng) : 0;
  const distance = location ? getDistanceToMakkah(location.lat, location.lng) : 0;
  const needleAngle = qiblaAngle - heading;

  useEffect(() => {
    let sub: any;
    async function startCompass() {
      if (Platform.OS === "web") {
        setHasPermission(false);
        return;
      }
      try {
        const { DeviceMotionEventOrientation } = await import("expo-sensors");
        const mag = await import("expo-sensors");
        setHasPermission(true);
        sub = mag.Magnetometer.addListener(data => {
          let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          setHeading(angle);
        });
        mag.Magnetometer.setUpdateInterval(100);
      } catch {
        setHasPermission(false);
      }
    }
    startCompass();
    return () => { if (sub) sub.remove(); };
  }, []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: needleAngle,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [needleAngle]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  const s = styles(colors, bottomPad);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.subtitle}>{location?.city ?? "Location not set"}</Text>
        <Text style={s.distance}>{Math.round(distance).toLocaleString()} km to Makkah</Text>
      </View>

      <View style={s.compassWrapper}>
        <View style={s.compassOuter}>
          {/* Cardinal directions */}
          {["N", "E", "S", "W"].map((dir, i) => (
            <View key={dir} style={[s.cardinal, { transform: [{ rotate: `${i * 90}deg` }, { translateY: -140 }] }]}>
              <Text style={[s.cardinalText, dir === "N" && s.cardinalN]}>{dir}</Text>
            </View>
          ))}

          <Animated.View style={[s.needleContainer, { transform: [{ rotate }] }]}>
            <View style={s.kaabaIcon}>
              <Text style={s.kaabaEmoji}>🕋</Text>
            </View>
            <View style={s.needle} />
            <View style={s.needleTail} />
          </Animated.View>

          <View style={s.compassCenter}>
            <Text style={s.qiblaAngle}>{Math.round(qiblaAngle)}°</Text>
            <Text style={s.qiblaLabel}>Qibla</Text>
          </View>
        </View>
      </View>

      {hasPermission === false && (
        <View style={s.warningBox}>
          <Feather name="alert-circle" size={16} color={colors.accent} />
          <Text style={s.warningText}>
            {Platform.OS === "web"
              ? "Compass not available on web. Direction shown is calculated from your location."
              : "Compass sensor not available. Tap to try again."}
          </Text>
        </View>
      )}

      <View style={s.infoCard}>
        <View style={s.infoRow}>
          <Feather name="navigation" size={16} color={colors.primary} />
          <Text style={s.infoLabel}>Qibla Direction</Text>
          <Text style={s.infoValue}>{Math.round(qiblaAngle)}° from North</Text>
        </View>
        <View style={s.infoDivider} />
        <View style={s.infoRow}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <Text style={s.infoLabel}>Your Location</Text>
          <Text style={s.infoValue}>{location?.city ?? "Unknown"}</Text>
        </View>
        <View style={s.infoDivider} />
        <View style={s.infoRow}>
          <Feather name="globe" size={16} color={colors.primary} />
          <Text style={s.infoLabel}>Distance</Text>
          <Text style={s.infoValue}>{Math.round(distance).toLocaleString()} km</Text>
        </View>
      </View>

      <Text style={s.tip}>Calibrate by moving your phone in a figure-8 pattern</Text>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>, bottomPad: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: { alignItems: "center", paddingTop: 20, marginBottom: 30 },
    subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground },
    distance: { fontFamily: "Inter_700Bold", fontSize: 18, color: colors.primary, marginTop: 4 },
    compassWrapper: { alignItems: "center", marginBottom: 30 },
    compassOuter: {
      width: 300,
      height: 300,
      borderRadius: 150,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    cardinal: {
      position: "absolute",
      alignItems: "center",
    },
    cardinalText: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: colors.mutedForeground,
    },
    cardinalN: { color: colors.primary, fontSize: 16 },
    needleContainer: { position: "absolute", alignItems: "center", justifyContent: "center" },
    kaabaIcon: {
      position: "absolute",
      top: -110,
      alignItems: "center",
    },
    kaabaEmoji: { fontSize: 24 },
    needle: {
      width: 4,
      height: 100,
      backgroundColor: colors.primary,
      borderRadius: 2,
      marginTop: -100,
    },
    needleTail: {
      width: 4,
      height: 60,
      backgroundColor: colors.accent + "60",
      borderRadius: 2,
    },
    compassCenter: {
      position: "absolute",
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    qiblaAngle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
    qiblaLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.8)" },
    warningBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.goldLight,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      marginBottom: 16,
    },
    warningText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.accent,
      flex: 1,
      lineHeight: 18,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    infoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, flex: 1 },
    infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary },
    infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    tip: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });
