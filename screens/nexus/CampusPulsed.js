import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  FlatList,
  ScrollView,
  Animated,
  ActivityIndicator,
  StatusBar,
  Alert,
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import BottomNavigator from "../BottomNavigator";
import { AuthorContext } from "../AuthorContext";
import { colors, radius, spacing } from "../Theme";
import Slideupbar from "../Slideupbar";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

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
function MyStoryCard({ item, onDelete, onPress }) {
  const imageSource = item.image
    ? { uri: item.image}
    : FALLBACK_IMAGE;

  const confirmDelete = () => {
    Alert.alert(
      "Delete story",
      "This will permanently remove your story. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(item.ID) },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(item.ID)} activeOpacity={0.88}>
      <View style={ms.card}>
        <ImageBackground source={imageSource} style={ms.image} imageStyle={ms.imageStyle}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Delete button */}
          <TouchableOpacity style={ms.deleteBtn} onPress={confirmDelete}>
            <Feather name="trash-2" size={12} color="#fff" />
          </TouchableOpacity>
          <Text style={ms.title} numberOfLines={2}>{item.title}</Text>
        </ImageBackground>
        {/* Like count */}
        <View style={ms.footer}>
          <Ionicons name="heart" size={11} color="#f43f5e" />
          <Text style={ms.likeText}>{item.pulselikecount ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ms = StyleSheet.create({
  card: {
    width: 110,
    marginRight: 10,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  image: { width: "100%", height: 130, justifyContent: "flex-end" },
  imageStyle: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  deleteBtn: {
    position: "absolute", top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  title: {
    fontSize: 10, fontWeight: "700", color: "#fff",
    paddingHorizontal: 6, paddingBottom: 6, lineHeight: 13,
  },
  footer: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  likeText: { fontSize: 11, color: colors.text.muted, fontWeight: "600" },
});

// ─────────────────────────────────────────
// Story card in feed
// ─────────────────────────────────────────
const StoryCard = React.memo(function StoryCard({ item, myUserId, navigation, onReport }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [liked, setLiked] = useState(Boolean(item?.pulselikestate));
  const [likeCount, setLikeCount] = useState(item.pulselikecount ?? 0);
  const [isPosting, setIsPosting] = useState(false);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();

  const handleLike = async () => {
    if (isPosting) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.4, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();

    setIsPosting(true);
    const endpoint = nextLiked ? "increasecampuslikes" : "decreasecampuslikes";
    try {
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campusid: item.ID, myUserId }),
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

  const imageSource = item.image
    ? { uri: item.image }
    : FALLBACK_IMAGE;

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => navigation.navigate("FullStory", { StoryID: item.ID })}
      activeOpacity={1}
    >
      <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Cover */}
        <ImageBackground source={imageSource} style={s.cover} imageStyle={s.coverImg}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.82)"]}
            style={s.coverOverlay}
          />
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>STORY</Text>
          </View>

          {/* Report icon — top right of cover image */}
          <TouchableOpacity
            style={s.reportIconBtn}
            onPress={() => onReport(item)}
            activeOpacity={0.85}
          >
            <Feather name="flag" size={13} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <Text style={s.coverTitle} numberOfLines={2}>{item.title}</Text>
        </ImageBackground>

        {/* Body */}
        <View style={s.body}>
          <View style={s.authorRow}>
            <View style={s.authorAvatar}>
              <Text style={s.authorAvatarText}>
                {item.author?.[0]?.toUpperCase() ?? "A"}
              </Text>
            </View>
            <View>
              <Text style={s.authorName}>{item.author}</Text>
              <Text style={s.authorTime}>{formatTimestamp(item.posted_at) ?? "Recently"}</Text>
            </View>
          </View>

          <Text style={s.excerpt} numberOfLines={4}>{item.post}</Text>

          <View style={s.cardFooter}>
            <TouchableOpacity
              onPress={handleLike}
              disabled={isPosting}
              style={s.likeBtn}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? "#f43f5e" : "rgba(255,255,255,0.35)"}
                />
              </Animated.View>
              <Text style={[s.likeCount, liked && s.likeCountActive]}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.readMoreBtn}
              onPress={() => navigation.navigate("FullStory", { StoryID: item.ID })}
              activeOpacity={0.85}
            >
              <Text style={s.readMoreText}>Read more</Text>
              <Feather name="arrow-right" size={13} color="#c084fc" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────
export default function CampusPulse({ navigation }) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
const myuserUni=user?.uni

  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Report sheet state
  const [reportTarget, setReportTarget] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const momentumStarted = useRef(false);

  // ── Fetch feed ──
  useFocusEffect(
    useCallback(() => {
      const fetchStories = async () => {
        setInitialLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/pulsedata?userid=${myUserId}&useruni=${myuserUni}`);
          if (!res.ok) throw new Error("Failed to fetch stories");
          const data = await res.json();
          setStories(data);
          setHasMore(data.length > 0);
        } catch (err) {
          console.warn("CampusPulse fetch error:", err.message);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchStories();
    }, [myUserId])
  );

  // ── Fetch my stories ──
  useFocusEffect(
    useCallback(() => {
      const fetchMyStories = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/mystories?user=${myUserId}`, {
            credentials: "include",
          });
          if (!res.ok) return;
          const data = await res.json();
          setMyStories(data);
        } catch (err) {
          console.warn("My stories fetch error:", err.message);
        }
      };
      fetchMyStories();
    }, [myUserId])
  );

  // ── Delete my story ──
  const handleDeleteStory = async (storyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/deletestory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storyId }),
      });
      if (!res.ok) {
        Alert.alert("Error", "Could not delete story.");
        return;
      }
      // Remove from both lists
      setMyStories(prev => prev.filter(s => s.ID !== storyId));
      setStories(prev => prev.filter(s => s.ID !== storyId));
    } catch {
      Alert.alert("Error", "Could not delete story.");
    }
  };

  // ── Report story ──
  const handleReport = useCallback((item) => {
    setReportTarget(item);
    setShowReport(true);
  }, []);

  // ── Load older ──
  const loadOlderStories = async () => {
    if (loadingOlder || !hasMore || stories.length === 0) return;
    setLoadingOlder(true);
    try {
      const lastTime = stories[stories.length - 1].posted_at;
      const res = await fetch(
        `${API_BASE_URL}/olderstories?userid=${myUserId}&lasttime=${lastTime}&useruni=${myuserUni}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setStories(prev => {
          const existing = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(d => !existing.has(d.id))];
        });
      }
    } catch (err) {
      console.warn("Load older error:", err.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  const ListHeader = useCallback(() => (
    <>
      {/* ── Your Stories strip ── */}
      {myStories.length > 0 && (
        <View style={s.myStoriesSection}>
          <View style={s.myStoriesHeader}>
            <View style={s.sectionDot} />
            <Text style={s.myStoriesLabel}>YOUR STORIES</Text>
            <Text style={s.myStoriesCount}>{myStories.length}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.myStoriesScroll}
          >
            {myStories.map(item => (
              <MyStoryCard
                key={item.ID}
                item={item}
                onDelete={handleDeleteStory}
                onPress={(id) => navigation.navigate("FullStory", { StoryID: id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Write CTA */}
      <TouchableOpacity
        style={s.writeCard}
        onPress={() => navigation.navigate("RequestToWrite")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["rgba(147,51,234,0.2)", "rgba(99,102,241,0.12)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.writeIconWrap}>
          <Feather name="edit-3" size={20} color="#c084fc" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.writeTitle}>Share your story</Text>
          <Text style={s.writeDesc}>Request to write and inspire others.</Text>
        </View>
        <Feather name="chevron-right" size={18} color="rgba(192,132,252,0.5)" />
      </TouchableOpacity>
    </>
  ), [myStories, navigation]);

  const ListFooter = useCallback(() => (
    <View style={s.footer}>
      {loadingOlder && <ActivityIndicator color={colors.accent.purple} />}
      {!hasMore && stories.length > 0 && (
        <Text style={s.footerText}>You're all caught up ✨</Text>
      )}
    </View>
  ), [loadingOlder, hasMore, stories.length]);

  const ListEmpty = useCallback(() => {
    if (initialLoading) return null;
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyEmoji}>📰</Text>
        <Text style={s.emptyTitle}>No stories yet</Text>
        <Text style={s.emptyDesc}>Be the first to share your campus experience.</Text>
      </View>
    );
  }, [initialLoading]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />
      <View style={s.blobBL} pointerEvents="none" />

      {/* Report sheet */}
      {showReport && reportTarget && (
        <Slideupbar
          senderId={myUserId}
          reporthead="Story"
          reportedname={reportTarget.title}
          stuffimage={reportTarget.image}
          onClose={() => {
            setShowReport(false);
            setReportTarget(null);
          }}
        />
      )}

      {/* Header */}
      <View style={s.header}>
        <View>
          <View style={s.headerBadge}>
            <View style={s.headerBadgeDot} />
            <Text style={s.headerBadgeText}>LIVE</Text>
          </View>
          <Text style={s.headerTitle}>Campus Pulse</Text>
          <Text style={s.headerSub}>Your stories. Your voice.</Text>
        </View>
        <TouchableOpacity
          style={s.writeBtn}
          onPress={() => navigation.navigate("RequestToWrite")}
        >
          <Feather name="edit-3" size={17} color="#c084fc" />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["transparent", "#9333ea", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      {/* Feed */}
      {initialLoading ? (
        <View style={s.initialLoader}>
          <ActivityIndicator size="large" color={colors.accent.purple} />
          <Text style={s.initialLoaderText}>Loading stories...</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={item => item.ID?.toString()}
          renderItem={({ item }) => (
            <StoryCard
              item={item}
              myUserId={myUserId}
              navigation={navigation}
              onReport={handleReport}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={s.feedContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (momentumStarted.current) {
              loadOlderStories();
              momentumStarted.current = false;
            }
          }}
          onMomentumScrollBegin={() => { momentumStarted.current = true; }}
          onEndReachedThreshold={0.5}
        />
      )}

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  blobTR: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(147,51,234,0.08)", top: -80, right: -80 },
  blobBL: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(99,102,241,0.06)", bottom: 100, left: -80 },

  // ── Header ──
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 14 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  headerBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#f87171" },
  headerBadgeText: { fontSize: 9, fontWeight: "800", color: "#f87171", letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.text.primary, letterSpacing: 0.3 },
  headerSub: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  headerDivider: { height: 1, marginBottom: 8 },
  writeBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: "rgba(147,51,234,0.25)", alignItems: "center", justifyContent: "center" },

  feedContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  // ── My stories strip ──
  myStoriesSection: {
    marginBottom: 16,
  },
  myStoriesHeader: {
    flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10,
  },
  sectionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent.purple },
  myStoriesLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.8, color: colors.text.secondary, flex: 1 },
  myStoriesCount: {
    fontSize: 10, fontWeight: "700", color: colors.accent.lavender,
    backgroundColor: "rgba(147,51,234,0.12)",
    borderWidth: 1, borderColor: "rgba(147,51,234,0.2)",
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  myStoriesScroll: { paddingRight: 4 },

  // ── Write CTA ──
  writeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: "rgba(147,51,234,0.2)", marginBottom: 20, overflow: "hidden" },
  writeIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(147,51,234,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  writeTitle: { fontSize: 13, fontWeight: "700", color: colors.text.primary },
  writeDesc: { fontSize: 11, color: colors.text.muted, marginTop: 2 },

  // ── Story card ──
  card: { backgroundColor: colors.bg.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, overflow: "hidden", marginBottom: 16 },
  cover: { height: 190, justifyContent: "flex-end" },
  coverImg: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  liveBadge: { position: "absolute", top: 14, left: 14, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#f87171" },
  liveText: { fontSize: 8, fontWeight: "800", color: "#f87171", letterSpacing: 1.5 },

  // Report button — top right corner of cover
  reportIconBtn: {
    position: "absolute", top: 14, right: 14,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  coverTitle: { fontSize: 17, fontWeight: "800", color: "#fff", paddingHorizontal: 16, paddingBottom: 14, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  body: { padding: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  authorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(147,51,234,0.3)", alignItems: "center", justifyContent: "center" },
  authorAvatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  authorName: { fontSize: 13, fontWeight: "700", color: colors.text.primary },
  authorTime: { fontSize: 10, color: colors.text.muted, marginTop: 1 },
  excerpt: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 20, marginBottom: 14 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: 12 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  likeCount: { fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: "600" },
  likeCountActive: { color: "#f43f5e" },
  readMoreBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(147,51,234,0.12)", borderWidth: 1, borderColor: "rgba(147,51,234,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  readMoreText: { fontSize: 12, fontWeight: "700", color: "#c084fc" },

  // ── States ──
  initialLoader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  initialLoaderText: { color: colors.text.muted, fontSize: 14 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text.primary },
  emptyDesc: { fontSize: 13, color: colors.text.muted, textAlign: "center" },
  footer: { paddingVertical: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: colors.text.muted },
});