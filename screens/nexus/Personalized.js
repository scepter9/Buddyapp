import React, { useState,useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { AuthorContext } from '../AuthorContext'
import { Feather } from "@expo/vector-icons";


const questions = [
  {
    id: 1,
    question: "What’s your ideal weekend?",
    options: [
      "🎮 Gaming with friends",
      "🎉 Party / hanging out",
      "📚 Studying or reading",
      "🏞️ Outdoor sports / nature",
      "😌 Relaxing solo (Netflix, sleep)",
    ],
  },
  {
    id: 2,
    question: "When do you usually feel most productive?",
    options: [
      "🌅 Early morning",
      "🌞 Afternoon",
      "🌙 Night owl",
      "🔄 Random bursts, no routine",
    ],
  },
  {
    id: 3,
    question: "How do you recharge best?",
    options: [
      "Group hangouts",
      "Quiet solo time",
      "Gym / physical activity",
      "Creative outlet (art, music, coding)",
    ],
  },
  {
    id: 4,
    question: "What’s your study vibe?",
    options: [
      "📚 Absolute silence (library)",
      "☕ Café / background noise",
      "👥 Group study room",
      "🛏️ Study-from-bed vibes",
    ],
  },
  {
    id: 5,
    question: "Social comfort zone:",
    options: [
      "I thrive in big groups",
      "I prefer small groups / 1-on-1",
      "I mostly keep to myself",
      "Depends on my mood",
    ],
  },
  {
    id: 6,
    question: "What motivates you most?",
    options: [
      "Academic success",
      "Building career skills",
      "Meeting new people & networking",
      "Fun / hobbies / experiences",
    ],
  },
  {
    id: 7,
    question: "How do you usually make friends?",
    options: [
      "Clubs & activities",
      "Through classes / study groups",
      "Online / gaming / Discord",
      "Random encounters (cafeteria, dorms, etc.)",
    ],
  },
  {
    id: 8,
    question: "Which club would you most likely join?",
    options: [
      "🎭 Arts, dance, or music",
      "🏀 Sports / fitness",
      "💻 Tech / coding / gaming",
      "🌍 Social good / volunteering",
      "🧠 Debate / academic",
    ],
  },
  {
    id: 9,
    question: "Conflict style — how do you handle disagreements?",
    options: [
      "Talk it out directly",
      "Avoid until it cools down",
      "Joke it off / lighten mood",
      "Debate until one side wins",
    ],
  },
  {
    id: 10,
    question: "Your ideal buddy would be:",
    options: [
      "Study partner (accountability)",
      "Gym / activity buddy",
      "Shared hobby buddy",
      "Chill emotional support friend",
    ],
  },
  {
    id: 11,
    question: "I enjoy being the center of attention.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 12,
    question: "I prefer working in a team rather than alone.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 13,
    question: "I often make decisions based on my feelings instead of logic.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 14,
    question: "I like planning things in advance rather than being spontaneous.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 15,
    question: "I get stressed easily under pressure.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 16,
    question: "I enjoy trying out new and risky activities.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 17,
    question: "I like keeping my surroundings organized and clean.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 18,
    question: "I often need alone time to recharge.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 19,
    question: "I enjoy creative tasks more than logical problem-solving.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
  {
    id: 20,
    question: "I get bored quickly if I do the same thing repeatedly.",
    options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
  },
];

const API_BASE_URL = "http://192.168.0.136:3000";

export default function Personalized({navigation}) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleSelect = (option) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: option,
    });
  };

  const handleNext = () => {
    // Check if an answer has been selected for the current question
    if (answers[questions[currentQuestionIndex].id] === undefined) {
      Alert.alert("Please select an answer", "You must choose an option before moving to the next question.");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Logic for when the quiz is finished
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // This is the new function to send the data
  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-answers`, { // ⚠️ **Update this endpoint**
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You might need an Authorization header here if your API requires a token
        },
        body: JSON.stringify({
          userId: myUserId, // ⚠️ **Replace with the actual user ID**
          answers: answers,
        }),
      });

      if (response.ok) {
        // Success! Handle the response from the server
        console.log("Answers submitted successfully!");
        Alert.alert("Success!", "Your personality profile has been saved. We'll find your perfect match!");
      navigation.navigate('Match')
        // Navigate to the next screen, e.g., a "Matches Found" screen
      } else {
        // Server responded with an error
        const errorData = await response.json();
        console.error("Failed to submit answers:", response.status, errorData);
        Alert.alert("Error", "Failed to save your answers. Please try again later.");
      }
    } catch (error) {
      // Network or other unexpected errors
      console.error("Network error:", error);
      Alert.alert("Error", "A network error occurred. Please check your connection.");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleLeaveRoom = () => {
    if (navigation) {
      navigation.goBack();
    } else {
      alert("You left the room 🚪");
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Topbar and Intro Card remain the same */}
        <View style={styles.topbar}>
          <View style={styles.dotNotch}>
            <Text style={styles.dotText}>NX</Text>
          </View>
          <Text style={styles.topbarTitle}>Personality Test</Text>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleLeaveRoom}>
            <Text style={{ fontSize: 18 }}><Feather name="log-out" size={22} color=" red" /></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.avatars}>
            <View style={styles.avatar} />
            <View style={styles.avatar} />
            <View style={styles.avatar} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Find your vibe tribe!</Text>
            <Text style={styles.sub}>Snap quiz! Just {questions.length} quick clicks</Text>
          </View>
        </View>

        {/* Question Section */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionHeading}>Question {currentQuestion.id}</Text>
          <Text style={styles.badge}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </View>

        <View style={styles.option}>
          <View>
            <Text style={styles.title}>{currentQuestion.question}</Text>
            <Text style={styles.sub}>
              Choose the option that best matches you:
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {currentQuestion.options.map((option, i) => {
            const isSelected = answers[currentQuestion.id] === option;
            const letter = String.fromCharCode(65 + i); // Generates A, B, C...
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.item,
                  isSelected && { borderColor: "#4e8cff" },
                ]}
                onPress={() => handleSelect(option)}
              >
                <View style={styles.icon}>
                  <Text style={{ fontWeight: "600" }}>{letter}</Text>
                </View>
                <Text style={styles.itemTitle}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview Section */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionHeading}>Preview result</Text>
          <Text style={styles.badge}>Estimates</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.secondary]}
            onPress={handleBack}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.btnTextSecondary}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { flex: 1 }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>
              {currentQuestionIndex === questions.length - 1
                ? "Finish Test"
                : "Next question"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 18,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dotNotch: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: "#6ae0ff",
    justifyContent: "center",
    alignItems: "center",
  },
  dotText: { fontWeight: "700", color: "#000" },
  topbarTitle: { fontSize: 20, fontWeight: "600", marginLeft: 12, flex: 1 },
  ghostBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatars: { flexDirection: "row", marginRight: 12 },
  avatar: {
    height: 38,
    width: 38,
    borderRadius: 14,
    backgroundColor: "#e3e8ff",
    marginRight: 6,
  },
  h3: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 12, color: "#6b7081" },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  sectionHeading: { fontSize: 16, fontWeight: "600" },
  badge: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: "#eef2ff",
    color: "#4b5bd7",
    fontWeight: "600",
  },
  option: {
    backgroundColor: "#fbfbfe",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  title: { fontWeight: "600", marginBottom: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  icon: {
    height: 34,
    width: 34,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitle: { fontWeight: "600", flex: 1 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    backgroundColor: "#0f1222",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  secondary: { backgroundColor: "#edf0fa" },
  btnTextSecondary: { color: "#333", fontWeight: "600" },
});