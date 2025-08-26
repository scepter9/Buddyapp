// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
// import BottomNavigator from '../BottomNavigator';

// const CampusTrivia = ({navigation}) => {
//   const questions = [
//     {
//       question: "What year was our university established?",
//       options: ["1960", "1975", "1985", "1990"],
//       answer: "1975",
//     },
//     {
//       question: "Who is the current Vice Chancellor?",
//       options: ["Prof. John Doe", "Prof. Jane Smith", "Dr. Alex Brown", "Prof. Mike Lee"],
//       answer: "Prof. Jane Smith",
//     },
//     {
//       question: "What is the university’s motto?",
//       options: ["Knowledge for Service", "Learning for Growth", "Wisdom and Integrity", "Excellence Always"],
//       answer: "Knowledge for Service",
//     },
//   ];

//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [score, setScore] = useState(0);
//   const [selectedOption, setSelectedOption] = useState(null);

//   const handleOptionPress = (option) => {
//     setSelectedOption(option);
//     if (option === questions[currentQuestion].answer) {
//       setScore(score + 1);
//     }

//     setTimeout(() => {
//       setSelectedOption(null);
//       if (currentQuestion + 1 < questions.length) {
//         setCurrentQuestion(currentQuestion + 1);
//       }
//     }, 800);
//   };

//   return (
//    < View>
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>🎓 Campus Trivia</Text>

//       <View style={styles.questionBox}>
//         <Text style={styles.question}>{questions[currentQuestion].question}</Text>

//         {questions[currentQuestion].options.map((option, index) => (
//           <TouchableOpacity
//             key={index}
//             style={[
//               styles.option,
//               selectedOption === option && option === questions[currentQuestion].answer
//                 ? styles.correct
//                 : selectedOption === option
//                 ? styles.wrong
//                 : null,
//             ]}
//             onPress={() => handleOptionPress(option)}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.optionText}>{option}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <Text style={styles.score}>⭐ Score: {score}</Text>

//       <View style={styles.leaderboard}>
//   <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
//   <View style={styles.leaderboardList}>
//     <View style={styles.leaderboardItem}>
//       <Text style={styles.leaderboardRank}>1</Text>
//       <Text style={styles.leaderboardName}>Alice</Text>
//       <Text style={styles.leaderboardScore}>10</Text>
//     </View>
//     <View style={styles.leaderboardItem}>
//       <Text style={styles.leaderboardRank}>2</Text>
//       <Text style={styles.leaderboardName}>Bob</Text>
//       <Text style={styles.leaderboardScore}>8</Text>
//     </View>
//     <View style={styles.leaderboardItem}>
//       <Text style={styles.leaderboardRank}>3</Text>
//       <Text style={styles.leaderboardName}>You</Text>
//       <Text style={styles.leaderboardScore}>{score}</Text>
//     </View>
//   </View>
// </View>

//     </ScrollView>
//     <BottomNavigator navigation={navigation} />
//     </View>
//   );
// };
 
// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     padding: 20,
//     backgroundColor: "#f9fafc",
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     marginBottom: 25,
//     color: "#1e3a8a",
//     textAlign: "center",
//     letterSpacing: 1,
//   },
//   questionBox: {
//     width: "100%",
//     padding: 22,
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   question: {
//     fontSize: 20,
//     marginBottom: 18,
//     fontWeight: "600",
//     color: "#111827",
//   },
//   option: {
//     padding: 14,
//     marginVertical: 8,
//     borderRadius: 10,
//     backgroundColor: "#f3f4f6",
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//     transition: "all 0.2s",
//   },
//   optionText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#374151",
//   },
//   correct: {
//     backgroundColor: "#d1fae5",
//     borderColor: "#10b981",
//   },
//   wrong: {
//     backgroundColor: "#fee2e2",
//     borderColor: "#ef4444",
//   },
//   score: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginTop: 15,
//     color: "#2563eb",
//   },
//   leaderboard: {
//     marginTop: 30,
//     padding: 20,
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     width: "100%",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   leaderboardTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginBottom: 15,
//     color: "#1f2937",
//     textAlign: "center",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//     paddingBottom: 10,
//   },
//   leaderboardList: {
//     marginTop: 10,
//   },
//   leaderboardItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
 
//   leaderboardRank: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#2563eb",
//     width: 30,
//     textAlign: "center",
//   },
//   leaderboardName: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#374151",
//     flex: 1,
//     marginLeft: 10,
//   },
//   leaderboardScore: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#111827",
//   },
  
// });

// export default CampusTrivia;
