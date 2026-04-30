import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Platform, TouchableOpacity, Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getQiblaDirection, getDistanceToMakkah } from "@/data/prayers";

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { location } = useApp();
  const [compassHeading, setCompassHeading] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState<"loading" | "available" | "unavailable">("loading");
  const [accuracy, setAccuracy] = useState<"low" | "medium" | "high">("low");
  const needleAnim = useRef(new Animated.Value(0)).current;
  const prevHeading = useRef(0);

  const isWeb = Platform.OS === "web";

  const lat = location?.lat ?? 21.4225;
  const lng = location?.lng ?? 39.8262;
  const qiblaAngle = getQiblaDirection(lat, lng);
  const distance = getDistanceToMakkah(lat, lng);

  useEffect(() => {
    let subscription: any;

    async function startCompass() {
      if (Platform.OS === "web") {
        if (typeof DeviceOrientationEvent !== "undefined") {
          // Web API
          const handler = (e: DeviceOrientationEvent) => {
            const alpha = (e as any).webkitCompassHeading ?? (e.alpha ?? 0);
            const normalized = ((360 - alpha) + 360) % 360;
            updateHeading(normalized);
            setSensorAvailable("available");
            setAccuracy("high");
          };
          window.addEventListener("deviceorientationabsolute", handler as any, true);
          window.addEventListener("deviceorientation", handler as any, true);
          setSensorAvailable("unavailable");
          return () => {
            window.removeEventListener("deviceorientationabsolute", handler as any);
            window.removeEventListener("deviceorientation", handler as any);
          };
        } else {
          setSensorAvailable("unavailable");
          return;
        }
      }

      try {
        const { Magnetometer } = await import("expo-sensors");
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
          setSensorAvailable("unavailable");
          return;
        }
        Magnetometer.setUpdateInterval(100);
        subscription = Magnetometer.addListener(data => {
          const { x, y } = data;
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          // Convert magnetometer angle to compass heading
          const heading = (360 - angle) % 360;
          updateHeading(heading);
          setSensorAvailable("available");
          const magnitude = Math.sqrt(x * x + y * y);
          setAccuracy(magnitude > 30 ? "high" : magnitude > 15 ? "medium" : "low");
        });
      } catch {
        setSensorAvailable("unavailable");
      }
    }

    startCompass();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  function updateHeading(newHeading: number) {
    setCompassHeading(newHeading);
    // Smooth animation with shortest path
    let diff = newHeading - prevHeading.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const target = prevHeading.current + diff;
    prevHeading.current = target;

    Animated.timing(needleAnim, {
      toValue: target,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  // The qibla needle should point at (qiblaAngle - compassHeading)
  const needleRotation = needleAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
  });

  // For the static needle showing qibla direction relative to north
  const relativeQibla = (qiblaAngle - compassHeading + 360) % 360;
  const accuracyColor = accuracy === "high" ? "#22C55E" : accuracy === "medium" ? "#F59E0B" : "#EF4444";

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={s.locationInfo}>
        <Feather name="map-pin" size={14} color={colors.primary} />
        <Text style={s.locationText}>{location?.city ?? "Makkah"}</Text>
        <Text style={s.distanceText}>  •  {Math.round(distance).toLocaleString()} km to Kaaba</Text>
      </View>

      {/* Compass */}
      <View style={s.compassWrapper}>
        {/* Compass rose (rotates opposite to device heading) */}
        <Animated.View
          style={[
            s.compassRose,
            { transform: [{ rotate: needleRotation.interpolate({ inputRange: [-720, 720], outputRange: ["720deg", "-720deg"] }) }] },
          ]}
        >
          {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir, i) => {
            const angle = i * 45;
            const radius = 138;
            const rad = (angle - 90) * (Math.PI / 180);
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <View key={dir} style={[s.cardinalMark, { transform: [{ translateX: x }, { translateY: y }] }]}>
                <Text style={[s.cardinalText, dir === "N" && s.northText, dir.length === 1 && s.majorCardinal]}>
                  {dir}
                </Text>
              </View>
            );
          })}
          {/* Degree marks */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = i * 5;
            const rad = (angle - 90) * (Math.PI / 180);
            const inner = i % 2 === 0 ? 118 : 122;
            const outer = 128;
            return (
              <View
                key={`tick-${i}`}
                style={{
                  position: "absolute",
                  width: 1,
                  height: outer - inner,
                  backgroundColor: i % 18 === 0 ? colors.primary : colors.border,
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center",
                  transform: [
                    { translateX: Math.cos(rad) * inner },
                    { translateY: Math.sin(rad) * inner },
                    { rotate: `${angle}deg` },
                  ],
                }}
              />
            );
          })}
        </Animated.View>

        {/* Static qibla needle */}
        <View style={s.needleWrapper} pointerEvents="none">
          <View
            style={[
              s.needleContainer,
              { transform: [{ rotate: `${relativeQibla}deg` }] },
            ]}
          >
            <View style={s.needleTop}>
              <Text style={s.kaabaLabel}>🕋</Text>
            </View>
            <View style={s.needleShaft} />
            <View style={s.needleTail} />
          </View>
        </View>

        {/* Center */}
        <View style={s.compassCenter}>
          <Text style={s.compassDegrees}>{Math.round(relativeQibla)}°</Text>
          <Text style={s.compassQibla}>Qibla</Text>
        </View>
      </View>

      {/* Status */}
      {sensorAvailable === "unavailable" && (
        <View style={s.warningBox}>
          <Feather name="alert-circle" size={16} color={colors.accent} />
          <Text style={s.warningText}>
            {isWeb
              ? "Compass works on mobile devices. The direction shown is calculated from your location coordinates."
              : "Compass sensor unavailable. Direction shown is calculated from your GPS coordinates."}
          </Text>
        </View>
      )}
      {sensorAvailable === "available" && (
        <View style={[s.accuracyRow, { backgroundColor: accuracyColor + "18" }]}>
          <View style={[s.accuracyDot, { backgroundColor: accuracyColor }]} />
          <Text style={[s.accuracyText, { color: accuracyColor }]}>
            Compass accuracy: {accuracy} — {accuracy === "low" ? "Move phone in figure-8 to calibrate" : "Good signal"}
          </Text>
        </View>
      )}

      {/* Info Cards */}
      <View style={s.infoCard}>
        <View style={s.infoRow}>
          <Feather name="navigation" size={16} color={colors.primary} />
          <Text style={s.infoLabel}>Qibla Direction</Text>
          <Text style={s.infoValue}>{Math.round(qiblaAngle)}° from True North</Text>
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
          <Text style={s.infoLabel}>Distance to Kaaba</Text>
          <Text style={s.infoValue}>{Math.round(distance).toLocaleString()} km</Text>
        </View>
        <View style={s.infoDivider} />
        <View style={s.infoRow}>
          <Feather name="crosshair" size={16} color={colors.primary} />
          <Text style={s.infoLabel}>Coordinates</Text>
          <Text style={s.infoValue}>{lat.toFixed(4)}°, {lng.toFixed(4)}°</Text>
        </View>
      </View>

      <Text style={s.tip}>Tip: Keep phone flat and horizontal for best results. Move in figure-8 to calibrate.</Text>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    locationInfo: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    locationText: { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.primary, marginLeft: 6 },
    distanceText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground },
    compassWrapper: {
      width: 300,
      height: 300,
      alignSelf: "center",
      marginBottom: 16,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    compassRose: {
      position: "absolute",
      width: 290,
      height: 290,
      borderRadius: 145,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardinalMark: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    cardinalText: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.mutedForeground,
    },
    majorCardinal: { fontFamily: "Inter_700Bold", fontSize: 13 },
    northText: { color: "#EF4444", fontSize: 15, fontFamily: "Inter_700Bold" },
    needleWrapper: {
      position: "absolute",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    needleContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 200,
    },
    needleTop: {
      alignItems: "center",
      marginBottom: 4,
    },
    kaabaLabel: { fontSize: 22 },
    needleShaft: {
      width: 4,
      height: 80,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    needleTail: {
      width: 4,
      height: 40,
      backgroundColor: colors.primary + "40",
      borderRadius: 2,
    },
    compassCenter: {
      position: "absolute",
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    compassDegrees: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
    compassQibla: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.8)" },
    warningBox: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: colors.goldLight,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      alignItems: "flex-start",
    },
    warningText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.accent, flex: 1, lineHeight: 18 },
    accuracyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
    },
    accuracyDot: { width: 8, height: 8, borderRadius: 4 },
    accuracyText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    infoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, flex: 1 },
    infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary },
    infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
    tip: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, textAlign: "center" },
  });
