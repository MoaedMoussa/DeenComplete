import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Platform, TouchableOpacity, Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getQiblaDirection, getDistanceToMakkah } from "@/data/prayers";

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { location, requestLocation, locationLoading } = useApp();
  const [compassHeading, setCompassHeading] = useState(0);
  const [sensorStatus, setSensorStatus] = useState<"loading" | "active" | "unavailable">("loading");
  const [accuracy, setAccuracy] = useState<"low" | "medium" | "high">("low");

  const lat = location?.lat ?? 21.4225;
  const lng = location?.lng ?? 39.8262;
  const qiblaAngle = getQiblaDirection(lat, lng);
  const distance = getDistanceToMakkah(lat, lng);

  const headingAnim = useRef(new Animated.Value(0)).current;
  const prevHeading = useRef(0);

  function smoothHeading(newHeading: number) {
    let diff = newHeading - prevHeading.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const target = prevHeading.current + diff;
    prevHeading.current = target;
    setCompassHeading(newHeading);
    Animated.timing(headingAnim, {
      toValue: target,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    async function startCompass() {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
          const handler = (e: DeviceOrientationEvent) => {
            const heading = (e as any).webkitCompassHeading ?? (360 - (e.alpha ?? 0));
            smoothHeading((heading + 360) % 360);
            setSensorStatus("active");
          };
          window.addEventListener("deviceorientationabsolute", handler as any, true);
          window.addEventListener("deviceorientation", handler as any, true);
          setSensorStatus("unavailable");
          cleanup = () => {
            window.removeEventListener("deviceorientationabsolute", handler as any);
            window.removeEventListener("deviceorientation", handler as any);
          };
        } else {
          setSensorStatus("unavailable");
        }
        return;
      }

      try {
        const { Magnetometer } = await import("expo-sensors") as any;
        const available = await Magnetometer.isAvailableAsync();
        if (!available) { setSensorStatus("unavailable"); return; }
        Magnetometer.setUpdateInterval(100);
        const sub = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
          const { x, y } = data;
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          const heading = ((360 - angle) + 360) % 360;
          smoothHeading(heading);
          setSensorStatus("active");
          const mag = Math.sqrt(x * x + y * y);
          setAccuracy(mag > 30 ? "high" : mag > 15 ? "medium" : "low");
        });
        cleanup = () => sub.remove();
      } catch {
        setSensorStatus("unavailable");
      }
    }

    startCompass();
    return () => { cleanup?.(); };
  }, []);

  const relativeQibla = (qiblaAngle - compassHeading + 360) % 360;

  const compassRotation = headingAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ["360deg", "0deg", "-360deg"],
    extrapolate: "extend",
  });

  const needleRotation = `${relativeQibla}deg`;

  const accuracyColor = accuracy === "high" ? "#22C55E" : accuracy === "medium" ? "#F59E0B" : "#EF4444";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: "Qibla Compass",
        headerStyle: { backgroundColor: "#1A5C3A" },
        headerTitleStyle: { fontFamily: "Inter_700Bold", color: "#fff" },
        headerTintColor: "#fff",
      }} />

      {/* Location info */}
      <View style={[s.locBar, { backgroundColor: "#1A5C3A" }]}>
        <Feather name="map-pin" size={13} color="#C8973A" />
        <Text style={s.locCity}>{location?.city ?? "Unknown Location"}</Text>
        <Text style={s.locDist}>
          {Math.round(distance).toLocaleString()} km to Kaaba
        </Text>
        <TouchableOpacity onPress={requestLocation} style={s.refreshBtn}>
          <Feather name="crosshair" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {/* Compass rose */}
        <View style={s.compassOuter}>
          {/* Rotating compass rose */}
          <Animated.View style={[s.compassRose, { transform: [{ rotate: compassRotation }] }]}>
            {/* Cardinal directions */}
            {[
              { dir: "N", angle: 0, isNorth: true },
              { dir: "NE", angle: 45, isNorth: false },
              { dir: "E", angle: 90, isNorth: false },
              { dir: "SE", angle: 135, isNorth: false },
              { dir: "S", angle: 180, isNorth: false },
              { dir: "SW", angle: 225, isNorth: false },
              { dir: "W", angle: 270, isNorth: false },
              { dir: "NW", angle: 315, isNorth: false },
            ].map(({ dir, angle, isNorth }) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const r = 120;
              return (
                <View
                  key={dir}
                  style={[s.cardinalWrap, {
                    transform: [{ translateX: Math.cos(rad) * r }, { translateY: Math.sin(rad) * r }],
                  }]}
                >
                  <Text style={[
                    s.cardinalTxt,
                    { color: isNorth ? "#EF4444" : dir.length === 1 ? colors.foreground : colors.mutedForeground },
                    isNorth && s.northTxt,
                  ]}>
                    {dir}
                  </Text>
                </View>
              );
            })}

            {/* Degree tick marks */}
            {Array.from({ length: 36 }, (_, i) => {
              const angle = i * 10;
              const rad = (angle - 90) * (Math.PI / 180);
              const isMajor = angle % 90 === 0;
              const inner = isMajor ? 100 : 105;
              const outer = 112;
              const cx = Math.cos(rad);
              const cy = Math.sin(rad);
              return (
                <View
                  key={`tick-${i}`}
                  style={{
                    position: "absolute",
                    width: 2,
                    height: outer - inner,
                    backgroundColor: isMajor ? "#C8973A" : colors.border,
                    top: "50%",
                    left: "50%",
                    transform: [
                      { translateX: cx * inner - 1 },
                      { translateY: cy * inner },
                      { rotate: `${angle}deg` },
                    ],
                  }}
                />
              );
            })}
          </Animated.View>

          {/* Static Qibla needle — always points toward Kaaba */}
          <View style={s.needleLayer} pointerEvents="none">
            <View style={[s.needleContainer, { transform: [{ rotate: needleRotation }] }]}>
              <Text style={s.kaabaEmoji}>🕋</Text>
              <View style={[s.needleShaft, { backgroundColor: "#C8973A" }]} />
              <View style={[s.needleTail, { backgroundColor: "#C8973A40" }]} />
            </View>
          </View>

          {/* Center hub */}
          <View style={[s.hub, { backgroundColor: "#1A5C3A" }]}>
            <Text style={s.hubDeg}>{Math.round(relativeQibla)}°</Text>
            <Text style={s.hubLabel}>Qibla</Text>
          </View>
        </View>

        {/* Status badge */}
        {sensorStatus === "active" && (
          <View style={[s.statusBadge, { backgroundColor: accuracyColor + "18" }]}>
            <View style={[s.statusDot, { backgroundColor: accuracyColor }]} />
            <Text style={[s.statusTxt, { color: accuracyColor }]}>
              Compass {accuracy === "low" ? "accuracy low — move in figure‑8 to calibrate" : `accuracy: ${accuracy}`}
            </Text>
          </View>
        )}
        {sensorStatus === "unavailable" && (
          <View style={[s.statusBadge, { backgroundColor: "#C8973A18" }]}>
            <Feather name="info" size={14} color="#C8973A" />
            <Text style={[s.statusTxt, { color: "#C8973A" }]}>
              {Platform.OS === "web"
                ? "Compass requires a real mobile device. Qibla direction is calculated from your GPS coordinates."
                : "Compass sensor unavailable. Direction calculated from GPS coordinates."}
            </Text>
          </View>
        )}

        {/* Info cards */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "navigation", label: "Qibla Direction", value: `${Math.round(qiblaAngle)}° from North` },
            { icon: "map-pin", label: "Your Location", value: location?.city ?? "Unknown" },
            { icon: "globe", label: "Distance to Kaaba", value: `${Math.round(distance).toLocaleString()} km` },
            { icon: "crosshair", label: "Coordinates", value: `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E` },
          ].map((row, i, arr) => (
            <View key={row.icon}>
              <View style={s.infoRow}>
                <Feather name={row.icon as any} size={15} color="#1A5C3A" />
                <Text style={[s.infoLabel, { color: colors.foreground }]}>{row.label}</Text>
                <Text style={[s.infoVal, { color: "#1A5C3A" }]}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={[s.infoDivider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        <Text style={[s.tip, { color: colors.mutedForeground }]}>
          Keep your phone flat and horizontal. Move in a figure-8 to calibrate the compass.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  locBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  locCity: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff", flex: 1 },
  locDist: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  refreshBtn: { padding: 4 },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16, alignItems: "center" },
  compassOuter: {
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  compassRose: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: "#C8973A40",
    backgroundColor: "rgba(255,253,245,0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  cardinalWrap: { position: "absolute", justifyContent: "center", alignItems: "center" },
  cardinalTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  northTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#EF4444" },
  needleLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  needleContainer: {
    alignItems: "center",
    height: 180,
    width: 30,
    justifyContent: "center",
  },
  kaabaEmoji: { fontSize: 20, marginBottom: 4 },
  needleShaft: { width: 4, height: 70, borderRadius: 2 },
  needleTail: { width: 4, height: 35, borderRadius: 2 },
  hub: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1A5C3A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  hubDeg: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  hubLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.75)" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    width: "100%",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusTxt: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  infoCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  infoVal: { fontFamily: "Inter_700Bold", fontSize: 13 },
  infoDivider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  tip: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
