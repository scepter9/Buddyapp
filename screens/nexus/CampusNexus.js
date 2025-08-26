import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import BottomNavigator from "../BottomNavigator";

export default function CampusNexus({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Campus Pulse */}
        <View style={styles.pulseTile}>
          <Text style={styles.pulseTitle}>Campus Pulse</Text>
          <Text style={styles.pulseDesc}>🔥 Trending: Hackathon starts Friday!</Text>
        </View>

        {/* Campus Hangouts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Campus Hangouts</Text>
          <View style={styles.hangoutGrid}>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => navigation.navigate("CreateMeetup")}
            >
              <View style={[styles.hangCard, styles.meetup]}>
                <Text style={styles.hangTitle}>🎉 Create Meetup</Text>
                <Text style={styles.hangDesc}>Start your own event</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => navigation.navigate("JoinMeetup")}
            >
              <View style={[styles.hangCard, styles.join]}>
                <Text style={styles.hangTitle}>🌍 Discover Groups</Text>
                <Text style={styles.hangDesc}>Find & join events</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => navigation.navigate("Daily")}
            >
              <View style={[styles.hangCard, styles.oneonone]}>
                <Text style={styles.hangTitle}>⚡ Daily Challenge</Text>
                <Text style={styles.hangDesc}>Fun tasks to win points</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => navigation.navigate("CampusTrivia")}
            >
              <View style={[styles.hangCard, styles.trivia]}>
                <Text style={styles.hangTitle}>🤔 Campus Trivia</Text>
                <Text style={styles.hangDesc}>Test your campus knowledge</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buddy Match */}
        <View style={styles.buddyMatch}>
          <View style={styles.buddyAvatar}></View>
          <Text style={styles.buddyTitle}>Find Your Campus Buddy</Text>
          <Text style={styles.buddyDesc}>
            Take the quick test and see your top matches!
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate("Personalized")}
          >
            <Text style={styles.ctaText}>Start Personality Test</Text>
          </TouchableOpacity>
        </View>

        {/* Interest Rooms */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Interest Rooms</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roomScroll}
          >
            <View style={[styles.roomCard, styles.sports]}>
              <Text style={styles.roomHeader}>● 42 online</Text>
              <Text style={styles.roomTitle}>🏀 Sports Hub</Text>
              <Text style={styles.roomDesc}>
                Talk games, matches, and tournaments
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("InterestRoom")}>
              <View style={[styles.roomCard, styles.coding]}>
                <Text style={styles.roomHeader}>● 18 online</Text>
                <Text style={styles.roomTitle}>💻 Code Cave</Text>
                <Text style={styles.roomDesc}>
                  Projects, collabs & hackathons
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.roomCard, styles.art]}>
              <Text style={styles.roomHeader}>● 12 online</Text>
              <Text style={styles.roomTitle}>🎨 Art Vibes</Text>
              <Text style={styles.roomDesc}>Share, create, inspire</Text>
            </View>
          </ScrollView>
        </View>

        {/* Campus Spotlight */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Campus Spotlight</Text>
          <View style={styles.spotlightCard}>
            <Text style={styles.spotlightHeader}>🌟 Personality of the Day</Text>
            <Text style={styles.highlightName}>Emily R.</Text>
            <Text style={styles.highlightDesc}>
              Known for making everyone smile 😊
            </Text>
          </View>
          <View style={styles.spotlightCard}>
            <Text style={styles.spotlightHeader}>🔥 Most Active</Text>
            <Text style={styles.highlightName}>Marcus J.</Text>
            <Text style={styles.highlightDesc}>
              Joined 15 discussions today
            </Text>
          </View>

          <Text style={styles.rankTitle}>🏆 Top 3 Campus Stars</Text>
          <View style={[styles.leaderCard, styles.top1]}>
            <Text style={styles.rank}>#1</Text>
            <Text style={styles.name}>Alex M.</Text>
            <Text style={styles.points}>1,250 pts</Text>
          </View>
          <View style={[styles.leaderCard, styles.top2]}>
            <Text style={styles.rank}>#2</Text>
            <Text style={styles.name}>Sarah K.</Text>
            <Text style={styles.points}>1,100 pts</Text>
          </View>
          <View style={[styles.leaderCard, styles.top3]}>
            <Text style={styles.rank}>#3</Text>
            <Text style={styles.name}>James T.</Text>
            <Text style={styles.points}>950 pts</Text>
          </View>

          <TouchableOpacity style={styles.seeAll}>
            <Text style={{ fontWeight: "600", color: "#0f172a" }}>
              See Full Rankings
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 Anonymous Zone (Redesigned for Gen Z) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Anonymous Zone 🚀</Text>

          {/* Active Rooms Preview */}
          <Text style={styles.subHeader}>Live Rooms</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Room")}>
            <View style={styles.liveCard}>
              <Text style={styles.liveTopic}>💬 Finals Stress Talk</Text>
              <Text style={styles.liveMeta}>32 students inside</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Room")}>
            <View style={styles.liveCard}>
              <Text style={styles.liveTopic}>👀 Secret Campus Gossip</Text>
              <Text style={styles.liveMeta}>18 students online</Text>
            </View>
          </TouchableOpacity>

          {/* Question of the Day */}
          <Text style={styles.subHeader}>Question of the Day</Text>
          <TouchableOpacity onPress={() => navigation.navigate("MainRoom")}>
            <View style={[styles.anonCard, styles.questions]}>
              <Text style={styles.hangTitle}>“What’s the funniest thing you saw this week?”</Text>
              <Text style={styles.hangDesc}>Tap to see answers →</Text>
            </View>
          </TouchableOpacity>

          {/* Create Room CTA */}
          <TouchableOpacity onPress={() => navigation.navigate("MainRoom")}>
            <View style={[styles.anonCard, styles.create]}>
              <Text style={styles.hangTitle}>➕ Create a Room</Text>
              <Text style={styles.hangDesc}>Start a new anonymous chat</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNavigator navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  /* Pulse */
  pulseTile: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
  },
  pulseTitle: { fontSize: 22, fontWeight: "700", color: "#f9fafb", marginBottom: 6 },
  pulseDesc: { color: "#d1d5db" },

  /* Section Card */
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#0f172a" },
  subHeader: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 6 },

  /* Hangouts */
  hangoutGrid: { flexDirection: "column" },
  hangCard: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    justifyContent: "center",
  },
  hangTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hangDesc: { color: "#d1d5db" },
  meetup: { backgroundColor: "#2563eb" },
  join: { backgroundColor: "#db2777" },
  oneonone: { backgroundColor: "#16a34a" },
  trivia: { backgroundColor: "#9333ea" },

  /* Buddy */
  buddyMatch: {
    backgroundColor: "#3796a6",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginTop: 14,
  },
  buddyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 10,
  },
  buddyTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  buddyDesc: { color: "#fff", marginVertical: 6 },
  ctaBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  ctaText: { fontWeight: "600", color: "#374151" },

  /* Rooms */
  roomScroll: { marginTop: 10 },
  roomCard: {
    width: 180,
    borderRadius: 16,
    padding: 16,
    marginRight: 14,
    minHeight: 140,
  },
  roomHeader: { color: "#f9fafb", marginBottom: 4 },
  roomTitle: { fontWeight: "700", fontSize: 16, color: "#f9fafb" },
  roomDesc: { color: "#e5e7eb" },
  sports: { backgroundColor: "#2563eb" },
  coding: { backgroundColor: "#db2777" },
  art: { backgroundColor: "#16a34a" },

  /* Spotlight */
  spotlightCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  spotlightHeader: { fontWeight: "700", fontSize: 16 },
  highlightName: { fontWeight: "600", fontSize: 15, marginTop: 4 },
  highlightDesc: { color: "#374151" },
  rankTitle: { marginTop: 10, fontWeight: "700" },
  leaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    marginTop: 6,
  },
  top1: { borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
  top2: { borderLeftWidth: 4, borderLeftColor: "#9ca3af" },
  top3: { borderLeftWidth: 4, borderLeftColor: "#a16207" },
  rank: { fontWeight: "700" },
  seeAll: {
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 10,
  },

  /* Anonymous Zone */
  liveCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  liveTopic: { color: "#f9fafb", fontWeight: "700", fontSize: 15 },
  liveMeta: { color: "#94a3b8", marginTop: 4 },

  anonCard: {
    width: "100%",
    minHeight: 100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  create: { backgroundColor: "#2563eb" },
  questions: { backgroundColor: "#9333ea" },
});
