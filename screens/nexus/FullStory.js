import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { AuthorContext } from "../AuthorContext";
import { colors, radius, spacing } from "../Theme";

const API_BASE_URL = "http://192.168.0.136:3000";

// BUG FIX: clean fallback — no watermark stock photo site
const FALLBACK_IMAGE = {
  uri: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
};
const formatTimestamp = (time) => {
  if (!time) return "Just now";
  const seconds = Math.floor((Date.now() - new Date(time)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};
export default function FullStory({ navigation, route }) {
  const { StoryID } = route.params;
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;

  // BUG FIX: null initial state so we can show a proper loading screen
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Like state — initialised after story loads
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/getstoryuser?StoryID=${StoryID}`);

        // BUG FIX: check ok BEFORE calling .json()
        if (!res.ok) {
          setError(true);
          return;
        }

        const data = await res.json();
        const fetched = data[0];
        setStory(fetched);
        setLiked(Boolean(fetched?.pulselikestate));
        setLikeCount(fetched?.pulselikecount ?? 0);
      } catch (e) {
        // BUG FIX: don't re-throw inside useEffect — it becomes an unhandled rejection
        console.warn("FullStory fetch error:", e.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [StoryID]);

  const handleLike = async () => {
    if (isPosting) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    setIsPosting(true);
    const endpoint = nextLiked ? "increasecampuslikes" : "decreasecampuslikes";
    try {
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campusid: StoryID, myUserId }),
      });
      if (!res.ok) {
        setLiked(!nextLiked);
        setLikeCount(prev => nextLiked ? Math.max(0, prev - 1) : prev + 1);
      }
    } catch {
      setLiked(!nextLiked);
      setLikeCount(prev => nextLiked ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setIsPosting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.accent.purple} />
          <Text style={s.loadingText}>Loading story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !story) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.centered}>
          <Text style={s.errorEmoji}>😕</Text>
          <Text style={s.errorTitle}>Story not found</Text>
          <Text style={s.errorDesc}>This story may have been removed.</Text>
          <TouchableOpacity style={s.backBtnFull} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={15} color="#fff" />
            <Text style={s.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imageSource = story.image
    ? { uri: `${API_BASE_URL}${story.image}` }
    : FALLBACK_IMAGE;

  const initials = story.author?.[0]?.toUpperCase() ?? "A";

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      {/* Ambient blobs */}
      <View style={s.blobTR} pointerEvents="none" />

      {/* ── Top nav bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.topBarTitle} numberOfLines={1}>Campus Pulse</Text>
        <View style={{ width: 38 }} />
      </View>

      <LinearGradient
        colors={["transparent", "#9333ea", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero image ── */}
        <ImageBackground
          source={imageSource}
          style={s.hero}
          imageStyle={s.heroImg}
        >
          <LinearGradient
            colors={["transparent", "rgba(8,8,18,0.95)"]}
            style={s.heroOverlay}
          />
          <View style={s.heroBadge}>
            <View style={s.heroBadgeDot} />
            <Text style={s.heroBadgeText}>STORY</Text>
          </View>
          <Text style={s.heroTitle}>{story.title}</Text>
        </ImageBackground>

        {/* ── Author row ── */}
        <View style={s.authorRow}>
          <View style={s.authorAvatar}>
            <Text style={s.authorAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.authorName}>{story.author}</Text>
            <Text style={s.authorTime}>{formatTimestamp(story.posted_at)?? "Recently"}</Text>
          </View>
          {/* Like button */}
          {/* <TouchableOpacity
            style={s.likeBtn}
            onPress={handleLike}
            disabled={isPosting}
            activeOpacity={0.8}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#f43f5e" : "rgba(255,255,255,0.35)"}
            />
            <Text style={[s.likeCount, liked && s.likeCountActive]}>
              {likeCount}
            </Text>
          </TouchableOpacity> */}
        </View>

        <View style={s.divider} />

        {/* ── Story body ── */}
        <Text style={s.bodyText}>{story.post}</Text>

        {/* ── End card ── */}
        <View style={s.endCard}>
          <Text style={s.endEmoji}>✨</Text>
          <Text style={s.endText}>End of story</Text>
          <TouchableOpacity
            style={s.backBtnFull}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Feather name="arrow-left" size={15} color="#fff" />
            <Text style={s.backBtnText}>Back to Pulse</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  centered: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 10,
    paddingHorizontal: spacing.lg,
  },
  loadingText: { fontSize: 14, color: colors.text.muted },
  errorEmoji: { fontSize: 44, marginBottom: 4 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: colors.text.primary },
  errorDesc: { fontSize: 13, color: colors.text.muted },

  blobTR: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(147,51,234,0.07)", top: -60, right: -60,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: "center", justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 15, fontWeight: "700", color: colors.text.primary,
  },
  headerDivider: { height: 1, marginBottom: 0 },

  scroll: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    height: 260, justifyContent: "flex-end",
    marginHorizontal: spacing.lg, borderRadius: radius.xl,
    overflow: "hidden", marginBottom: 16, marginTop: 12,
  },
  heroImg: { borderRadius: radius.xl },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    position: "absolute", top: 14, left: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#f87171" },
  heroBadgeText: { fontSize: 8, fontWeight: "800", color: "#f87171", letterSpacing: 1.5 },
  heroTitle: {
    fontSize: 20, fontWeight: "800", color: "#fff",
    paddingHorizontal: 16, paddingBottom: 16,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Author ──
  authorRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: spacing.lg, marginBottom: 14,
  },
  authorAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(147,51,234,0.3)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  authorAvatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  authorName: { fontSize: 14, fontWeight: "700", color: colors.text.primary },
  authorTime: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  likeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  likeCount: { fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: "600" },
  likeCountActive: { color: "#f43f5e" },

  divider: {
    height: 1, backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg, marginBottom: 20,
  },

  // ── Body ──
  bodyText: {
    fontSize: 15, lineHeight: 26,
    color: "rgba(255,255,255,0.7)",
    paddingHorizontal: spacing.lg, 
    marginBottom: 32,
  },

  // ── End card ──
  endCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 20,
    alignItems: "center", gap: 8,
  },
  endEmoji: { fontSize: 28, marginBottom: 4 },
  endText: { fontSize: 13, color: colors.text.muted, marginBottom: 8 },
  backBtnFull: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: colors.accent.purple,
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: radius.full, marginTop: 4,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});