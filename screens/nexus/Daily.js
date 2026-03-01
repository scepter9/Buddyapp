import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView, // Import SafeAreaView
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigator from '../BottomNavigator';
import GoalCard from './GoalCard';

const Daily = ({ navigation }) => {
  const [totalXP, setTotalXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load progress and manage the streak on app start
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const storedXP = await AsyncStorage.getItem('totalXP');
        const storedStreak = await AsyncStorage.getItem('currentStreak');
        const lastCompletionDate = await AsyncStorage.getItem('lastCompletionDate');
        const today = new Date().toDateString();

        if (storedXP) {
          setTotalXP(parseInt(storedXP, 10));
        }

        if (lastCompletionDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toDateString();

          if (lastCompletionDate === today) {
            if (storedStreak) setCurrentStreak(parseInt(storedStreak, 10));
          } else if (lastCompletionDate === yesterdayString) {
            if (storedStreak) setCurrentStreak(parseInt(storedStreak, 10));
          } else {
            setCurrentStreak(0);
            await AsyncStorage.setItem('currentStreak', '0');
          }
        }
      } catch (e) {
        console.error('Failed to load progress', e);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  // This function is called by the GoalCard when a goal is completed
  const handleGoalComplete = async (xpValue) => {
    const today = new Date().toDateString();
    const lastCompletionDate = await AsyncStorage.getItem('lastCompletionDate');

    // Update total XP first
    setTotalXP(prevXP => {
      const newXP = prevXP + xpValue;
      AsyncStorage.setItem('totalXP', newXP.toString());
      return newXP;
    });

    // Check if the streak has been updated today to prevent multiple increases
    if (lastCompletionDate !== today) {
      setCurrentStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        AsyncStorage.setItem('currentStreak', newStreak.toString());
        return newStreak;
      });
      await AsyncStorage.setItem('lastCompletionDate', today);
    }
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b60ff" />
      </View>
    );
  }

  return (
    // Wrap everything in a SafeAreaView
    <SafeAreaView style={styles.wrapper}>
      {/* ScrollView for the content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.topbar}>
          <View style={styles.dotNotch}>
            <Text style={{ fontWeight: "700", color: "#0f1222" }}>NX</Text>
          </View>
          <Text style={styles.topbarTitle}>Daily Challenge</Text>
        </View>

        <View style={styles.sectionTitle}>
          <Text style={styles.sectionText}>Today’s streak</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.streak}>
            {[...Array(7)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentStreak ? styles.dotActive : null
                ]}
              />
            ))}
          </View>
          <View style={styles.meta}>
            <Text style={styles.pill}>{totalXP} xp</Text>
            <Text style={styles.muted}>{currentStreak}-day streak</Text>
          </View>
        </View>

        <View style={styles.sectionTitle}>
          <Text style={styles.sectionText}>Daily goals</Text>
          <Text style={styles.badge}>Popular</Text>
        </View>

        <View style={styles.row}>
          <GoalCard
            id="talk-to-person"
            title="Talk to 1 new person 👋"
            sub="Introduce yourself to someone in your faculty. Ask one question."
            mutedText="{count} students doing this"
            tagStyle={{ backgroundColor: "#f2f5ff", color: "#3b60ff" }}
            onComplete={() => handleGoalComplete(50)}
          />
          <GoalCard
            id="study-sprint"
            title="Study sprint (20m) 📚"
            sub="Pick a topic. Set a timer. No phone."
            mutedText="{count} joined"
            tagStyle={styles.greenTag}
            onComplete={() => handleGoalComplete(50)}
          />
          <GoalCard
            id="gym-hydration"
            title="Gym & hydration 💪"
            sub="15 pushups + 2L water before 8pm."
            mutedText="{count} in progress"
            tagStyle={styles.redTag}
            onComplete={() => handleGoalComplete(50)}
          />
          <GoalCard
            id="digital-detox"
            title="Digital detox 🌿"
            sub="Stay off social media for 2 hours."
            mutedText="{count} accepted"
            tagStyle={styles.yellowTag}
            onComplete={() => handleGoalComplete(50)}
          />
        </View>
      </ScrollView>
      {/* BottomNavigator is now correctly positioned below the ScrollView */}
      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  container: {
    // The container style no longer needs flex: 1
    // It is just a style object now
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  scrollContainer: {
    padding: 18,
    // Add extra padding at the bottom to ensure the last GoalCard is visible above the navigator
    paddingBottom: 150,
  },
  // ... rest of the styles are unchanged
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  dotNotch: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: "#6ae0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  topbarTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 10,
    color: "#0f1222",
  },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f1222",
  },
  badge: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    color: "#4b5bd7",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffffee",
    borderRadius: 22,
    padding: 18,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tag: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  greenTag: { backgroundColor: "#e8fbf3", color: "#1f9e6d" },
  yellowTag: { backgroundColor: "#fff4e5", color: "#b46a00" },
  redTag: { backgroundColor: "#ffe9ea", color: "#b31d2f" },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 6,
    color: "#0f1222",
  },
  sub: {
    fontSize: 13,
    color: "#6b7081",
    lineHeight: 18,
  },
  row: {
    flexDirection: "column",
    gap: 12,
  },
  streak: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dot: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: "#e9ecf7",
  },
  dotActive: {
    backgroundColor: "#4e8cff",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  pill: {
    backgroundColor: "#f3f5ff",
    color: "#3c57de",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "600",
    fontSize: 12,
  },
  muted: {
    fontSize: 12,
    color: "#6b7081",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b60ff",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  cancelBtn: {
    backgroundColor: "#3b60ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default Daily;