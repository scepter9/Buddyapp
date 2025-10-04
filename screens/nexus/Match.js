import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ImageBackground
} from "react-native";
import { Video } from "expo-av";
import { Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// 🎭 Mock Data
const demoBuddies = [
  {
    id: "1",
    name: "Alex Johnson",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    score: 92,
    similarities: "You both love 🎧 music and iced coffee ☕",
  },
  {
    id: "2",
    name: "Sophia Williams",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // HD
    
    score: 88,
    similarities: "You both enjoy 📸 photography & late-night studying 🌙",
  },
  {
    id: "3",
    name: "David Chen",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    score: 95,
    similarities: "You both vibe with 🎮 gaming & football ⚽",
  },
];

export default function MatchDemo() {
  const [buddies] = useState(demoBuddies);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Your University Buddy 🎉</Text>

      <FlatList
        data={buddies}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 🎥 Video */}
            <Video
              source={{ uri: item.video }}
              style={styles.video}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />

            {/* ℹ️ Overlay Info */}
            <View style={styles.infoPanel}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.matchScore}>{item.score}% Match</Text>
              <Text style={styles.similarities}>{item.similarities}</Text>
            </View>
          </View>
        )}
      />

      {/* Floating Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.passBtn}>
          <Feather name="x" size={28} color="#ff4c4c" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeBtn}>
          <Feather name="heart" size={28} color="#00ffcc" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00ffcc",
    marginTop: 50,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width,
    height: height * 0.75,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  video: {
    position: "absolute",
    top: 0,
    width,
    height: height * 0.75,
    borderRadius: 20,
  },
  infoPanel: {
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 100,
    width: width * 0.85,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00ffcc",
  },
  name: { fontSize: 24, fontWeight: "700", color: "#fff" },
  matchScore: { fontSize: 18, color: "#00ffcc", marginTop: 5 },
  similarities: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "70%",
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  passBtn: {
    backgroundColor: "#1c1c1c",
    padding: 18,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ff4c4c",
    shadowColor: "#ff4c4c",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  likeBtn: {
    backgroundColor: "#1c1c1c",
    padding: 18,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#00ffcc",
    shadowColor: "#00ffcc",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
