import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import BottomNavigator from "./BottomNavigator";
import socket from "./Socket";
import { colors, radius, spacing } from "./Theme";

const API_BASE_URL = "http://192.168.0.136:3000";

function FeatureCard({ onPress, gradColors, borderColor, icon, eyebrow, title, description, stat, statIcon }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.featureCard, { borderColor }]}
        >
          <View style={s.ring1} />
          <View style={s.ring2} />

          <View style={s.eyebrowRow}>
            <View style={[s.eyebrowDot, { backgroundColor: borderColor }]} />
            <Text style={s.eyebrow}>{eyebrow}</Text>
          </View>

          <View style={s.cardBody}>
            <View style={s.cardIconWrap}>
              <Feather name={icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{title}</Text>
              <Text style={s.cardDesc}>{description}</Text>
            </View>
          </View>

          <View style={s.cardFooter}>
            <View style={s.statPill}>
              <Feather name={statIcon} size={11} color="rgba(255,255,255,0.5)" />
              <Text style={s.statText}>{stat}</Text>
            </View>
            <View style={s.cardArrow}>
              <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function About({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/About`, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotificationCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchNotificationCount();

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      if (user?.id) socket.emit("registerUser", user.id);

      const onNewNotif = () => setNotificationCount((p) => p + 1);
      const onNotifRead = () => setNotificationCount((p) => Math.max(0, p - 1));

      socket.on("newNotification", onNewNotif);
      socket.on("notificationRead", onNotifRead);

      return () => {
        socket.off("newNotification", onNewNotif);
        socket.off("notificationRead", onNotifRead);
      };
    }, [fetchUserData, fetchNotificationCount, user?.id])
  );

  if (isLoading) {
    return (
      <View style={s.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.accent.purple} />
        <Text style={s.loadingText}>Loading your vibe...</Text>
      </View>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      <View style={s.blobTR} pointerEvents="none" />
      <View style={s.blobBL} pointerEvents="none" />

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={s.avatarWrap} activeOpacity={0.85}>
          {user?.image ? (
            <Image source={{ uri: `${API_BASE_URL}${user.image}` }} style={s.avatar} />
          ) : (
            <LinearGradient colors={["#9333ea", "#6366f1"]} style={s.avatar}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={s.onlineDot} />
        </TouchableOpacity>

        <View style={s.topMid}>
          <Text style={s.topGreeting}>{greeting}</Text>
          <Text style={s.topName}>{firstName} 👋</Text>
        </View>

        <TouchableOpacity
          style={s.bellBtn}
          onPress={() => navigation.navigate("NotificationsScreen")}
          activeOpacity={0.85}
        >
          <Feather name="bell" size={19} color={colors.accent.lavender} />
          {notificationCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Cards ── */}
      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.tagline}>What do you want to do today?</Text>

        <FeatureCard
          onPress={() => navigation.navigate("CampusPulse")}
          gradColors={["#1a0533", "#3b0764", "#1e1040"]}
          borderColor="rgba(147,51,234,0.4)"
          icon="radio"
          eyebrow="CAMPUS PULSE"
          title="Real stories, right now"
          description="Anonymous confessions, hot takes, and campus moments — unfiltered."
          stat="Updated daily"
          statIcon="clock"
        />

        <FeatureCard
          onPress={() => navigation.navigate("InterestRoom")}
          gradColors={["#0c1a3a", "#0e3a6e", "#0c2340"]}
          borderColor="rgba(0,217,255,0.3)"
          icon="hash"
          eyebrow="INTEREST ROOMS"
          title="Find your people"
          description="Live group spaces built around what you love — join or create your own."
          stat="24+ rooms live"
          statIcon="users"
        />

        <FeatureCard
          onPress={() => navigation.navigate("MainRoom")}
          gradColors={["#1a1040", "#2d1069", "#1a0a40"]}
          borderColor="rgba(99,102,241,0.4)"
          icon="shield-off"
          eyebrow="ANONYMOUS ZONE"
          title="No name. No trace."
          description="Create or join timed anonymous chat rooms. They vanish when time runs out."
          stat="Rooms auto-delete"
          statIcon="trash-2"
        />

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  loading: {
    flex: 1, backgroundColor: colors.bg.screen,
    alignItems: "center", justifyContent: "center",
  },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.text.muted },

  blobTR: {
    position: "absolute", width: 280, height: 280, borderRadius: 140,
    backgroundColor: "rgba(147,51,234,0.09)", top: -100, right: -80,
  },
  blobBL: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(99,102,241,0.06)", bottom: 80, left: -80,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: 14, gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontWeight: "700", fontSize: 15 },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#34d399", borderWidth: 2, borderColor: colors.bg.screen,
  },
  topMid: { flex: 1 },
  topGreeting: { fontSize: 11, color: colors.text.muted, fontWeight: "500" },
  topName: { fontSize: 19, fontWeight: "800", color: colors.text.primary, letterSpacing: 0.2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bg.card, borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -1, right: -1,
    backgroundColor: "#ef4444", borderRadius: 8,
    minWidth: 17, height: 17, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.bg.screen,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: 8 },
  tagline: {
    fontSize: 13, color: colors.text.muted, fontWeight: "500",
    marginBottom: 20, letterSpacing: 0.2,
  },

  // ── Feature card ──
  featureCard: {
    borderRadius: radius.xl, borderWidth: 1,
    padding: 22, marginBottom: 16, overflow: "hidden", position: "relative",
  },
  ring1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", right: -70, top: -70,
  },
  ring2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.04)", right: -20, top: -20,
  },
  eyebrowRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16,
  },
  eyebrowDot: { width: 5, height: 5, borderRadius: 3 },
  eyebrow: {
    fontSize: 9, fontWeight: "800", letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
  },
  cardBody: {
    flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20,
  },
  cardIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitle: {
    fontSize: 18, fontWeight: "800", color: "#f0ecff",
    letterSpacing: 0.2, marginBottom: 6, marginTop: 2,
  },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18 },
  cardFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingTop: 14,
  },
  statPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "600" },
  cardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
});
