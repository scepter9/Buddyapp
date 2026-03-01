import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity ,SafeAreaView} from "react-native";
import BottomNavigator from "../BottomNavigator";
import { LinearGradient } from 'expo-linear-gradient';

export default function CampusNexus({ navigation }) {
  return (
    // <SafeAreaView style={styles.wrapper}>
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Campus Pulse */}
        <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => navigation.navigate("CampusPulse")}
            >
        <View style={styles.pulseTile}>
          <Text style={styles.pulseTitle}>Campus Pulse</Text>
          <Text style={styles.pulseDesc}>📢 Real Stories. Real Students. Real Campus Life.”</Text>
        </View>
        </TouchableOpacity>
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
        
          {/* INTEREST ROOMS CARD */}
<TouchableOpacity
  onPress={() => navigation.navigate("InterestRoom")}
  activeOpacity={0.9}
>
  <View style={styles.interestCard}>
    <LinearGradient
      colors={['#10213a', '#0b1629']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.interestBg}
    >
      <View style={styles.interestContent}>
        <View style={styles.iconCircle}>
          <Text style={styles.interestIcon}>🚀</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.interestTitle}>Interest Rooms</Text>
          <Text style={styles.interestDesc}>
            Join live spaces, explore passions, and build with others.
          </Text>
          <View style={styles.interestStats}>
            <Text style={styles.statText}>🔥 230+ Active Rooms</Text>
            <Text style={styles.statText}>👥 1.4k Members</Text>
          </View>
        </View>
      </View>

      <View style={styles.interestFooter}>
        <Text style={styles.joinText}>Enter Mission Control →</Text>
      </View>
    </LinearGradient>
  </View>
</TouchableOpacity>


        {/* Campus Spotlight */}
      {/* 🔥 Daily Streak Tracker */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionTitle}>🔥 Daily Streak</Text>
  <View style={styles.streakContainer}>
    <Text style={styles.streakText}>You are on a 5-day streak! 🔥</Text>
    <TouchableOpacity style={styles.streakBtn}>
      <Text style={styles.streakBtnText}>Keep it going →</Text>
    </TouchableOpacity>
  </View>
</View>

{/* 🎲 Random Spotlight */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionTitle}>🎲 Random Spotlight</Text>
  <TouchableOpacity 
    style={styles.randomCard} 
    onPress={() => console.log("Navigate to random item")}
  >
    <Text style={styles.randomEmoji}>🚀</Text>
    <Text style={styles.randomTitle}>AI Club</Text>
    <Text style={styles.randomDesc}>120 active members</Text>
  </TouchableOpacity>
</View>

        {/* 🔥 Anonymous Zone (Redesigned for Gen Z) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Anonymous Zone 🚀</Text>

         

          {/* Question of the Day */}
          <Text style={styles.subHeader}>Question of the Day</Text>
          <TouchableOpacity onPress={() => navigation.navigate("QuestionDetails")}>
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
    
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0b1120",
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  /* ================= INTEREST CARD ================= */

  interestCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 32,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.04)",
    shadowColor: "#00d9ff",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },

  interestBg: {
    paddingVertical: 22,
    paddingHorizontal: 20,
  },

  interestContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,217,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  interestIcon: {
    fontSize: 30,
  },

  interestTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  interestDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 6,
  },

  interestStats: {
    flexDirection: "row",
    marginTop: 12,
  },

  statText: {
    color: "#00d9ff",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 16,
  },

  interestFooter: {
    marginTop: 18,
    borderTopWidth: 1,
    borderColor: "rgba(0,217,255,0.2)",
    paddingTop: 14,
    alignItems: "center",
  },

  joinText: {
    color: "#00d9ff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  /* ================= CAMPUS PULSE ================= */

  pulseTile: {
    borderRadius: 30,
    padding: 28,
    marginBottom: 22,
    overflow: "hidden",
    shadowColor: "#ff3cac",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },

  pulseTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
    letterSpacing: 0.8,
  },

  pulseDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },

  /* ================= SECTION CARD ================= */

  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 30,
    padding: 22,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  subHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
    color: "#ffffff",
  },

  /* ================= HANGOUTS ================= */

  hangoutGrid: {
    flexDirection: "column",
  },

  hangCard: {
    width: "100%",
    minHeight: 120,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },

  hangTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  hangDesc: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    fontSize: 13,
  },

  meetup: { backgroundColor: "#2563eb" },
  join: { backgroundColor: "#db2777" },
  oneonone: { backgroundColor: "#16a34a" },
  trivia: { backgroundColor: "#9333ea" },

  /* ================= BUDDY MATCH ================= */

  buddyMatch: {
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    marginTop: 24,
    overflow: "hidden",
    shadowColor: "#00c6ff",
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 14,
  },

  buddyAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 14,
  },

  buddyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  buddyDesc: {
    color: "rgba(255,255,255,0.9)",
    marginVertical: 10,
    fontSize: 14,
    textAlign: "center",
  },

  ctaBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 40,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },

  ctaText: {
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
  },

  /* ================= ROOMS ================= */

  roomScroll: {
    marginTop: 14,
  },

  roomCard: {
    width: 200,
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    minHeight: 150,
  },

  roomHeader: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: 6,
  },

  roomTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#ffffff",
  },

  roomDesc: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
  },

  sports: { backgroundColor: "#2563eb" },
  coding: { backgroundColor: "#db2777" },
  art: { backgroundColor: "#16a34a" },

  /* ================= SPOTLIGHT ================= */

  spotlightCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  spotlightHeader: {
    fontWeight: "800",
    fontSize: 16,
    color: "#ffffff",
  },

  highlightName: {
    fontWeight: "700",
    fontSize: 15,
    marginTop: 6,
    color: "#ffffff",
  },

  highlightDesc: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },

  rankTitle: {
    marginTop: 16,
    fontWeight: "800",
    color: "#ffffff",
  },

  leaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  top1: { borderLeftWidth: 4, borderLeftColor: "#facc15" },
  top2: { borderLeftWidth: 4, borderLeftColor: "#cbd5e1" },
  top3: { borderLeftWidth: 4, borderLeftColor: "#d97706" },

  rank: {
    fontWeight: "800",
    color: "#ffffff",
  },

  seeAll: {
    marginTop: 16,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
  },

  /* ================= ANONYMOUS ZONE ================= */

  liveCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  liveTopic: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },

  liveMeta: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
  },

  anonCard: {
    width: "100%",
    minHeight: 110,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },

  create: { backgroundColor: "#2563eb" },
  questions: { backgroundColor: "#9333ea" },
  streakContainer: {
    backgroundColor: "#10213a",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  streakText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00d9ff",
    marginBottom: 10,
  },
  streakBtn: {
    backgroundColor: "#00d9ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  streakBtnText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },
  
  randomCard: {
    backgroundColor: "#0b1629",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
  },
  randomEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  randomTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#eaf6ff",
  },
  randomDesc: {
    color: "rgba(234,246,255,0.7)",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  }
});
