import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Platform, TouchableOpacity, Easing, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getQiblaDirection, getDistanceToMakkah, fetchQiblaFromAladhan } from "@/data/prayers";

const RAD = Math.PI / 180;

function tiltCompensatedHeading(
  mx: number, my: number, mz: number,
  ax: number, ay: number, az: number,
): number {
  const norm = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
  const nx = ax / norm;
  const ny = ay / norm;
  const nz = az / norm;

  const pitch = Math.asin(Math.max(-1, Math.min(1, -nx)));
  const roll = Math.atan2(ny, nz < 0 ? -Math.abs(nz) : nz);

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);

  const Bx = mx * cosPitch + mz * sinPitch;
  const By = mx * sinRoll * sinPitch + my * cosRoll - mz * sinRoll * cosPitch;

  const heading = (Math.atan2(-By, Bx) / RAD + 360) % 360;
  return heading;
}

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { location, requestLocation } = useApp();
  const [compassHeading, setCompassHeading] = useState(0);
  const [sensorStatus, setSensorStatus] = useState<"loading" | "active" | "unavailable">("loading");
  const [accuracy, setAccuracy] = useState<"low" | "medium" | "high">("low");
  const [apiQibla, setApiQibla] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const lat = location?.lat ?? 21.4225;
  const lng = location?.lng ?? 39.8262;
  const localQibla = getQiblaDirection(lat, lng);
  const qiblaAngle = apiQibla ?? localQibla;
  const distance = getDistanceToMakkah(lat, lng);

  const headingAnim = useRef(new Animated.Value(0)).current;
  const prevHeading = useRef(0);
  const magRef = useRef({ x: 0, y: 0, z: 0 });
  const accRef = useRef({ x: 0, y: 0.81, z: 0.59 }); // default: phone tilted ~54°

  useEffect(() => {
    if (!location) return;
    setApiLoading(true);
    fetchQiblaFromAladhan(lat, lng)
      .then(dir => { setApiQibla(dir); setApiLoading(false); })
      .catch(() => { setApiLoading(false); });
  }, [lat, lng]);

  function applyHeading(newHeading: number) {
    let diff = newHeading - prevHeading.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const target = prevHeading.current + diff;
    prevHeading.current = target;
    setCompassHeading(newHeading);
    Animated.timing(headingAnim, {
      toValue: target,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }

  useEffect(() => {
    let magSub: any = null;
    let accSub: any = null;

    function computeHeading() {
      const { x: mx, y: my, z: mz } = magRef.current;
      const { x: ax, y: ay, z: az } = accRef.current;
      const h = tiltCompensatedHeading(mx, my, mz, ax, ay, az);
      applyHeading(h);
      setSensorStatus("active");
      const magStrength = Math.sqrt(mx * mx + my * my + mz * mz);
      setAccuracy(magStrength > 40 ? "high" : magStrength > 20 ? "medium" : "low");
    }

    async function startNative() {
      try {
        const sensors = await import("expo-sensors") as any;
        const { Magnetometer, Accelerometer } = sensors;

        const [magOk, accOk] = await Promise.all([
          Magnetometer.isAvailableAsync(),
          Accelerometer.isAvailableAsync(),
        ]);

        if (!magOk) {
          setSensorStatus("unavailable");
          return;
        }

        Magnetometer.setUpdateInterval(80);
        magSub = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
          magRef.current = data;
          computeHeading();
        });

        if (accOk) {
          Accelerometer.setUpdateInterval(80);
          accSub = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
            accRef.current = data;
          });
        }
      } catch {
        setSensorStatus("unavailable");
      }
    }

    function startWeb() {
      if (typeof window === "undefined") {
        setSensorStatus("unavailable");
        return () => {};
      }

      let activated = false;

      const handleOrientation = (e: DeviceOrientationEvent) => {
        const webkitHeading = (e as any).webkitCompassHeading;
        if (typeof webkitHeading === "number" && !isNaN(webkitHeading)) {
          applyHeading(webkitHeading);
          setSensorStatus("active");
          activated = true;
        } else if (typeof e.alpha === "number" && !isNaN(e.alpha)) {
          applyHeading((360 - e.alpha) % 360);
          setSensorStatus("active");
          activated = true;
        }
      };

      window.addEventListener("deviceorientationabsolute", handleOrientation as any, true);
      window.addEventListener("deviceorientation", handleOrientation as any, true);

      // If no events fire within 2 seconds, mark unavailable
      const timer = setTimeout(() => {
        if (!activated) setSensorStatus("unavailable");
      }, 2000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("deviceorientationabsolute", handleOrientation as any);
        window.removeEventListener("deviceorientation", handleOrientation as any);
      };
    }

    let webCleanup: (() => void) | undefined;
    if (Platform.OS === "web") {
      webCleanup = startWeb();
    } else {
      startNative();
    }

    return () => {
      magSub?.remove();
      accSub?.remove();
      webCleanup?.();
    };
  }, []);

  const relativeQibla = (qiblaAngle - compassHeading + 360) % 360;

  const compassRotationNeg = headingAnim.interpolate({
    inputRange: [-3600, 0, 3600],
    outputRange: ["3600deg", "0deg", "-3600deg"],
    extrapolate: "extend",
  });

  const accuracyColor = accuracy === "high" ? "#22C55E" : accuracy === "medium" ? "#F59E0B" : "#EF4444";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: "Qibla Compass",
        headerStyle: { backgroundColor: "#1A5C3A" },
        headerTitleStyle: { fontFamily: "Inter_700Bold", color: "#fff" },
        headerTintColor: "#fff",
      }} />

      <View style={[s.locBar, { backgroundColor: "#1A5C3A" }]}>
        <Feather name="map-pin" size={13} color="#C8973A" />
        <Text style={s.locCity}>{location?.city ?? "Unknown Location"}</Text>
        {apiLoading ? (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        ) : (
          <Text style={s.locDist}>
            {Math.round(distance).toLocaleString()} km to Kaaba
          </Text>
        )}
        <TouchableOpacity onPress={requestLocation} style={s.refreshBtn}>
          <Feather name="crosshair" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.compassOuter}>
          {/* Rotating compass rose — counter-rotates as device turns */}
          <Animated.View style={[s.compassRose, { transform: [{ rotate: compassRotationNeg }] }]}>
            {[
              { dir: "N", angle: 0, isNorth: true },
              { dir: "NE", angle: 45 },
              { dir: "E", angle: 90 },
              { dir: "SE", angle: 135 },
              { dir: "S", angle: 180 },
              { dir: "SW", angle: 225 },
              { dir: "W", angle: 270 },
              { dir: "NW", angle: 315 },
            ].map(({ dir, angle, isNorth }) => {
              const rad = (angle - 90) * RAD;
              const r = 118;
              return (
                <View key={dir} style={[s.cardinalWrap, {
                  transform: [{ translateX: Math.cos(rad) * r }, { translateY: Math.sin(rad) * r }],
                }]}>
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

            {Array.from({ length: 72 }, (_, i) => {
              const angle = i * 5;
              const rad = (angle - 90) * RAD;
              const isMajor = angle % 90 === 0;
              const isMinor = angle % 45 === 0;
              const inner = isMajor ? 96 : isMinor ? 100 : 104;
              const outer = 110;
              const cx = Math.cos(rad);
              const cy = Math.sin(rad);
              return (
                <View key={`tick-${i}`} style={{
                  position: "absolute",
                  width: isMajor ? 3 : 1.5,
                  height: outer - inner,
                  backgroundColor: isMajor ? "#C8973A" : isMinor ? colors.foreground : colors.border,
                  top: "50%",
                  left: "50%",
                  transform: [
                    { translateX: cx * inner - (isMajor ? 1.5 : 0.75) },
                    { translateY: cy * inner },
                    { rotate: `${angle}deg` },
                  ],
                }} />
              );
            })}
          </Animated.View>

          {/* Qibla needle — always points to Kaaba */}
          <View style={s.needleLayer} pointerEvents="none">
            <View style={[s.needleContainer, { transform: [{ rotate: `${relativeQibla}deg` }] }]}>
              <MaterialCommunityIcons name="mosque" size={24} color="#C8973A" />
              <View style={[s.needleUp, { backgroundColor: "#C8973A" }]} />
              <View style={[s.needleDown, { backgroundColor: "#C8973A40" }]} />
            </View>
          </View>

          {/* Centre hub */}
          <View style={[s.hub, { backgroundColor: "#1A5C3A" }]}>
            <Text style={s.hubDeg}>{Math.round(relativeQibla)}°</Text>
            <Text style={s.hubLabel}>Qibla</Text>
          </View>
        </View>

        {/* API source badge */}
        <View style={[s.sourceBadge, { backgroundColor: apiQibla != null ? "#1A5C3A18" : colors.card }]}>
          <Feather
            name={apiQibla != null ? "check-circle" : "wifi-off"}
            size={13}
            color={apiQibla != null ? "#1A5C3A" : colors.mutedForeground}
          />
          <Text style={[s.sourceTxt, { color: apiQibla != null ? "#1A5C3A" : colors.mutedForeground }]}>
            {apiQibla != null
              ? `Verified via Aladhan API · ${qiblaAngle.toFixed(2)}° from North`
              : `Local calculation · ${localQibla.toFixed(2)}° from North`}
          </Text>
        </View>

        {/* Sensor status */}
        {sensorStatus === "active" && (
          <View style={[s.statusBadge, { backgroundColor: accuracyColor + "18" }]}>
            <View style={[s.statusDot, { backgroundColor: accuracyColor }]} />
            <Text style={[s.statusTxt, { color: accuracyColor }]}>
              {accuracy === "low"
                ? "Compass accuracy low — move phone in a figure-8 to calibrate"
                : `Compass ${accuracy} accuracy · heading ${Math.round(compassHeading)}°`}
            </Text>
          </View>
        )}
        {sensorStatus === "unavailable" && (
          <View style={[s.statusBadge, { backgroundColor: "#C8973A18" }]}>
            <Feather name="info" size={14} color="#C8973A" />
            <Text style={[s.statusTxt, { color: "#C8973A" }]}>
              {Platform.OS === "web"
                ? "Live compass requires a physical device. The Qibla angle shown is accurate for your location."
                : "Compass sensor unavailable. Direction calculated from GPS coordinates."}
            </Text>
          </View>
        )}
        {sensorStatus === "loading" && (
          <View style={[s.statusBadge, { backgroundColor: colors.muted }]}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
            <Text style={[s.statusTxt, { color: colors.mutedForeground }]}>Starting compass…</Text>
          </View>
        )}

        {/* Info rows */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "navigation", label: "Qibla Direction", value: `${qiblaAngle.toFixed(1)}° from North` },
            { icon: "map-pin", label: "Your Location", value: location?.city ?? "Unknown" },
            { icon: "globe", label: "Distance to Kaaba", value: `${Math.round(distance).toLocaleString()} km` },
            { icon: "crosshair", label: "Coordinates", value: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°` },
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
          Hold phone flat. Move in a figure-8 to calibrate the compass.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  locBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, gap: 6,
  },
  locCity: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff", flex: 1 },
  locDist: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)" },
  refreshBtn: { padding: 4 },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16, alignItems: "center" },
  compassOuter: {
    width: 290, height: 290,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  compassRose: {
    position: "absolute", width: 264, height: 264,
    borderRadius: 132, borderWidth: 2, borderColor: "#C8973A40",
    backgroundColor: "rgba(255,253,245,0.96)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 6,
  },
  cardinalWrap: { position: "absolute", justifyContent: "center", alignItems: "center" },
  cardinalTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  northTxt: { fontFamily: "Inter_700Bold", fontSize: 15 },
  needleLayer: {
    position: "absolute", width: "100%", height: "100%",
    justifyContent: "center", alignItems: "center",
  },
  needleContainer: {
    alignItems: "center", height: 190, width: 32,
    justifyContent: "center",
  },
  kaabaEmoji: { fontSize: 20, marginBottom: 2 },
  needleUp: { width: 4, height: 72, borderRadius: 2 },
  needleDown: { width: 4, height: 36, borderRadius: 2 },
  hub: {
    position: "absolute", width: 60, height: 60, borderRadius: 30,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#1A5C3A", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 8,
  },
  hubDeg: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  hubLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.75)" },
  sourceBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    marginBottom: 8, width: "100%",
  },
  sourceTxt: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 10, width: "100%",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusTxt: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  infoCard: {
    width: "100%", borderRadius: 16, borderWidth: 1,
    overflow: "hidden", marginBottom: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  infoVal: { fontFamily: "Inter_700Bold", fontSize: 13 },
  infoDivider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  tip: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
