import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView, // Use ScrollView for general content
  FlatList,
} from "react-native";
import BottomNavigator from "../BottomNavigator";
import { AuthorContext } from "../AuthorContext";
import { io } from "socket.io-client";
const API_BASE_URL = "http://192.168.0.136:3000";

const CampusTrivia = ({ navigation }) => {
  const { user } = useContext(AuthorContext);
  const myUserName = user?.username;

  const questions = [
    {
      question: "What year was our university established?",
      options: ["1960", "1975", "1985", "1990"],
      answer: "1975",
    },
    {
      question: "Who is the current Vice Chancellor?",
      options: [
        "Prof. John Doe",
        "Prof. Jane Smith",
        "Dr. Alex Brown",
        "Prof. Mike Lee",
      ],
      answer: "Prof. Jane Smith",
    },
    {
      question: "What is the university’s motto?",
      options: [
        "Knowledge for Service",
        "Learning for Growth",
        "Wisdom and Integrity",
        "Excellence Always",
      ],
      answer: "Knowledge for Service",
    },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userLeaderboard, setUserLeaderboard] = useState([]);

  // Corrected and combined useEffect for socket.io
  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket"] });

    socket.on("leaderboardUpdate", (data) => {
      setUserLeaderboard(data);
    });

    return () => socket.disconnect();
  }, []);

  const handleOptionPress = async (option) => {
    setSelectedOption(option);
    const isCorrect = option === questions[currentQuestion].answer;
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
    }

    // Post score to the server
    try {
      const response = await fetch(`${API_BASE_URL}/postscorevalue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ score: newScore, username: myUserName }),
      });
      if (!response.ok) {
        console.log("There was a problem posting the score.");
      }
    } catch (error) {
      console.error("Error posting score:", error);
    }

    // Move to the next question after a delay
    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 800);
  };

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <Text style={styles.leaderboardRank}>{index + 1}</Text>
      <Text style={styles.leaderboardName}>{item.name}</Text>
      <Text style={styles.leaderboardScore}>{item.score}</Text>
    </View>
  );

  // Corrected render structure
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🎓 Campus Trivia</Text>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.question}>
            {questions[currentQuestion].question}
          </Text>
          {questions[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                selectedOption === option &&
                  (option === questions[currentQuestion].answer
                    ? styles.correct
                    : styles.wrong),
              ]}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.score}>⭐ Score: {score}</Text>
        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
          <FlatList
            data={userLeaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false} // Disable FlatList scrolling inside ScrollView
            style={{ width: "100%" }}
          />
        </View>
      </ScrollView>
      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafc",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 120, // make this >= height of BottomNavigator
    alignItems: "center",
  },
  
  header: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 25,
    color: "#1e3a8a",
    textAlign: "center",
    letterSpacing: 1,
  },
  questionBox: {
    width: "100%",
    padding: 22,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  question: {
    fontSize: 20,
    marginBottom: 18,
    fontWeight: "600",
    color: "#111827",
  },
  option: {
    padding: 14,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  correct: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  wrong: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  score: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
    color: "#2563eb",
    textAlign: "center",
  },
  leaderboard: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  leaderboardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1f2937",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  leaderboardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    width: 30,
    textAlign: "center",
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
    marginLeft: 10,
  },
  leaderboardScore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});

export default CampusTrivia;