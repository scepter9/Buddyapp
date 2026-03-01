import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const number=(count)=>{
  if(count>1000){
      return count;
  }else if(count>1000000){
      return (count/1000).toFixed(1)+'k'
  }else if(count>1000000000){
      return (count/1000000).toFixed(1)+'m'
  }
}
export default function BattleArenaScreen() {
    
  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <LinearGradient
            colors={["#ff6b6b", "#8a2be2"]}
            style={styles.logoBox}
          >
            <Text style={styles.logoText}>BA</Text>
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Battle Arena — Showcase</Text>
            <Text style={styles.headerSubtitle}>
              Campus talent hub • Upload short videos • Weekly top creators
            </Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["Showcase", "Challenges", "Tournaments", "1v1", "Profile", "Join"].map(
            (item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.navBtn,
                  index >= 3 && styles.ctaBtn,
                ]}
              >
                <Text
                  style={[
                    styles.navBtnText,
                    index >= 3 && styles.ctaBtnText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* HERO */}
      <LinearGradient colors={["#fff", "#fffefc"]} style={styles.hero}>
        <Text style={styles.eyebrow}>🎬 Campus Showcase — Videos only</Text>
        <Text style={styles.heroTitle}>Show your skill. Win the crowd.</Text>
        <Text style={styles.heroSub}>
          Short video showcases judged by engagement. Categories keep it fair —
          upload, tag, and let the campus vote. Weekly winners per category.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.mainBtn}>
            <Text style={styles.mainBtnText}>Upload Showcase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.altBtn}>
            <Text style={styles.altBtnText}>Explore Categories</Text>
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Weekly Reset: Sun 11PM</Text>
          </View>
        </View>
      </LinearGradient>

      {/* CATEGORIES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose a Category</Text>
          <Text style={styles.sectionLink}>View all →</Text>
        </View>
        <View style={styles.categories}>
          {[
            { emoji: "🎨", title: "Art & Design", desc: "Illustration • UI • Motion • Fashion" },
            { emoji: "💻", title: "Tech & Innovation", desc: "Demos • Mini Projects • Robotics" },
            { emoji: "🎭", title: "Entertainment", desc: "Music • Dance • Comedy • Drama" },
            { emoji: "⚽", title: "Lifestyle & Sports", desc: "Tricks • Fitness • Fashion • Cooking" },
            { emoji: "🧩", title: "Open Talent", desc: "Anything goes — surprise us!" },
          ].map((cat, i) => (
            <TouchableOpacity key={i} style={styles.categoryCard}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catTitle}>{cat.title}</Text>
              <Text style={styles.catDesc}>{cat.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TRENDING FEED */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Videos</Text>
          <Text style={styles.sectionLink}>See trending →</Text>
        </View>

        <View style={styles.feed}>
          {[
            {
              title: "Hope — UI Redesign Reel",
              desc: "30s breakdown of a campus app concept — motion + color study.",
              bg: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60",
              name: "Hope Mark",
              info: "Computer Eng • 2h ago",
              reacts: "❤️ 1.2k • 💬 120",
            },
            {
              title: "Ada — Mini API Demo",
              desc: "60s demo: from Postman to preview — serverless backend in 90s.",
              bg: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=60",
              name: "Ada C.",
              info: "Software • 4h ago",
              reacts: "🔥 980 • 💬 86",
            },
            {
              title: "Chika — Campus Freestyle",
              desc: "Short rap about exams — raw and unfiltered.",
              bg: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=60",
              name: "Chika O.",
              info: "Arts • 1d ago",
              reacts: "✨ 710 • 💬 45",
            },
          ].map((post, i) => (
            <View key={i} style={styles.card}>
              <ImageBackground
                source={{ uri: post.bg }}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 10 }}
              />
              <Text style={styles.cardTitle}>{post.title}</Text>
              <Text style={styles.cardDesc}>{post.desc}</Text>
              <View style={styles.meta}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaName}>{post.name}</Text>
                    <Text style={styles.metaInfo}>{post.info}</Text>
                  </View>
                </View>
                <Text style={styles.metaReact}>{post.reacts}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fffdfa", flex: 1, padding: 20 },
  header: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: 20,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoBox: { width: 56, height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  logoText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#6b6b76", fontSize: 12 },
  navBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  navBtnText: { fontSize: 13, fontWeight: "600" },
  ctaBtn: {
    backgroundColor: "#ffd166",
    borderRadius: 10,
    marginHorizontal: 4,
  },
  ctaBtnText: { color: "#06121a" },
  hero: { borderRadius: 16, padding: 20, marginBottom: 24 },
  eyebrow: { color: "#6b6b76", fontSize: 12, fontWeight: "600" },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
    color: "#8a2be2",
  },
  heroSub: { color: "#6b6b76", fontSize: 14, marginTop: 8 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  mainBtn: { padding: 10, borderRadius: 12, backgroundColor: "#8a2be2" },
  mainBtnText: { color: "#fff", fontWeight: "700" },
  altBtn: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#ddd" },
  altBtnText: { fontWeight: "700" },
  badge: {
    backgroundColor: "#6be4ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontWeight: "700", fontSize: 12, color: "#06121a" },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionLink: { fontSize: 13, color: "#6b6b76" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  catEmoji: { fontSize: 26 },
  catTitle: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  catDesc: { fontSize: 12, color: "#6b6b76", textAlign: "center" },
  feed: { gap: 16, marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImage: { height: 170, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: "#6b6b76", marginVertical: 6 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: "#6be4ff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontWeight: "800", color: "#041017" },
  metaName: { fontWeight: "700" },
  metaInfo: { fontSize: 12, color: "#6b6b76" },
  metaReact: { fontSize: 13, color: "#6b6b76" },
});
