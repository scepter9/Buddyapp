import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView
  
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { global } from "./styles";
import BottomNavigator from "../BottomNavigator";
import { BlurView } from 'expo-blur'
import { FontAwesome } from '@expo/vector-icons';

export default function QuickPlayScreen({navigation}) {
  const TriviaSelect = [
    {
      id: "numofquestions",
      header: "Choose your number of questions",
      items: [
        { id: 10, value: 10 },
        { id: 20, value: 20 },
        { id: 30, value: 30 },
        { id: 40, value: 40 },
        { id: 50, value: 50 },
      ],
    },

    {
      id: "difficulty",
      header: "Choose your difficuty level",
      items: [
        { id: "easy", value: "Easy" },
        { id: "medium", value: "Medium" },
        { id: "hard", value: "Hard" },
      ],
    },

    {
      id: "category",
      header: "Choose your Question Category",
      items: [
        { id: "film_and_tv", value: "Film & TV 🎥"  },
        { id: "music", value: "Music 🎶" },
        { id: "arts_and_literature", value: "Arts & Literature 🎨" },
        { id: "science", value: "Science 🔬" },
        { id: "geography", value: "Geography 🌍" },
        { id: "history", value: "History 🏛️" },
        { id: "sport_and_leisure", value: "Sports ⚽" },
        { id: "society_and_culture", value: "Society & Culture 🧑‍🤝‍🧑" },
        { id: "food_and_drink", value: "Food & Drink 🍽️" },
        { id: "general_knowledge", value: "General Knowledge 💡" },
      ],
    },
  ];

  const [Modaldata, setModaldata] = useState([]);
  const [currentIndex, setCurrentindex] = useState(0);
  const [currentAnswerIndex, setcurrentAnswerIndex] = useState(0);
  const [answerscore, setanswerscore] = useState(0);
  const currentPage = TriviaSelect[currentIndex];
  const currentQuestion = Modaldata?.[currentAnswerIndex] ?? null;
  const [resultModal,setResultModal]=useState(false)

  const [countdown, setCountdown] = useState(20);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  const [openModal, setopenModal] = useState(false);
  const [Quizmode, setQuizmode] = useState({
    numofquestions: 10,
    difficulty: "",
    category: "",
  });

const [correction,setcorrection]=useState([])
  // shuffle answers for the current question — memoized so it only changes when the question changes
  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion) return [];
    const answers = [
      ...(currentQuestion.incorrectAnswers ?? []),
      currentQuestion.correctAnswer,
    ];
    // simple shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
  }, [currentQuestion]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // whenever the current question index changes, reset timer
  useEffect(() => {
    if (!openModal) return;
    resetAndStartTimer();
    // reset shuffled answers handled by useMemo automatically
  }, [currentAnswerIndex, openModal]);

  // whenever modal opens (new quiz), start timer
  useEffect(() => {
    if (openModal) {
      resetAndStartTimer();
    } else {
      // if modal closed, clear timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [openModal]);
  useEffect(()=>{
    if(!Quizmode.category) return;
    FetchtriviaApi();
  },[Quizmode])

  const handleNext = (itemId) => {
    // update quiz mode (num/difficulty/category)
    setQuizmode((prev) => ({ ...prev, [currentPage.id]: itemId }));

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex < TriviaSelect.length - 1) {
        setCurrentindex((num) => num + 1);
      } 
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const FetchtriviaApi = async () => {
    // build URL for TriviaAPI v2
    const url = `https://the-trivia-api.com/v2/questions?limit=${Quizmode.numofquestions}&categories=${Quizmode.category}&difficulties=${Quizmode.difficulty}`;

    try {
      const res = await fetch(url);
      console.log("Selected CATEGORY:", Quizmode.category);
console.log("Fetching URL:", url);


      const data = await res.json();
      // data from v2 is usually an array of question objects
      if (Array.isArray(data)) {
        setModaldata(data);
        setcurrentAnswerIndex(0);
        setanswerscore(0);
        setopenModal(true);
      } else {
        // safe fallback
        console.warn("Unexpected trivia response", data);
        setModaldata([]);
        setopenModal(false);
      }
    } catch (err) {
      console.log(`Something went wrong in Quiz ${err}`);
    }
  };

  const handleAnswer = (pickedAnswer, questionText, correctAnswer) => {
    if (!currentQuestion) return;
  
    const isCorrect = pickedAnswer === currentQuestion.correctAnswer;
  
    if (isCorrect) {
      setanswerscore((prev) => prev + 1);
    }
  
    if (!isCorrect) {
      const newCollection = {
        id: Date.now(),
        question: questionText,
        answer: correctAnswer,
        youranswer: pickedAnswer,
      };
      setcorrection((prev) => [...prev, newCollection]);
    }
  
    // move to next question or submit
    if (currentAnswerIndex < Modaldata.length - 1) {
      setcurrentAnswerIndex((n) => n + 1);
    } else {
      SubmitTest();
    }
  };
  

  const resetAndStartTimer = () => {
    // reset countdown to 10 for each question
    setCountdown(20);

    // clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // start new interval
    intervalRef.current = setInterval(() => {
      setCountdown((count) => {
        if (count <= 1) {
          // time up
          if (Modaldata.length > 0 && currentAnswerIndex < Modaldata.length - 1) {
            setcurrentAnswerIndex((n) => n + 1);
          } else {
            SubmitTest();
          }
          // cleanup
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return count - 1;
      });
    }, 1000);
  };

  const SubmitTest = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  
    setopenModal(false);
  
    const totalQuestions = Modaldata.length;
    const percentageScore = Math.round((answerscore / totalQuestions) * 100);
  
    navigation.navigate('CompetitionHome', {
      score: percentageScore,
      incorrect: correction,
    });
  };
  

  return (
    <SafeAreaView style={styles.safe}>
    <LinearGradient
    colors={["#6dd5ed", "#2193b0", "#fcd3a0"]} // sky blue → deep blue → soft orange
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={global.bg}
>

      <Animated.View style={{flex:1,opacity:fadeAnim}}>
      <Text style={global.header}>{currentPage.header}</Text>

      <FlatList
        data={currentPage.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          
          <TouchableOpacity style={styles.mainparent} onPress={() => handleNext(item.id)} >
            <Text style={styles.buttonText}>{item.value}</Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
</Animated.View>
      <Modal visible={openModal} animationType="slide" transparent>
      <BlurView intensity={80} tint="light" style={styles.modalWrapper}>
        
         <LinearGradient
         colors={["#6dd5ed", "#2193b0", "#fcd3a0"]} // sky blue → deep blue → soft orange
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
       
       
       
            style={styles.modalCard}
          >
            <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setopenModal(false)}
      >
        <FontAwesome name="close" size={24} color="#222" />
      </TouchableOpacity>
            <Text style={styles.quizTitle}>🎯 Quick Play</Text>
            <Text style={styles.timerText}>⏳ {countdown}s</Text>

            {currentQuestion ? (
              <>
                <Text style={styles.questionText}>
                  {currentQuestion?.question?.text ?? "Question text missing"}
                </Text>

                {shuffledAnswers.map((ans, i) => (
                  <TouchableOpacity
                    key={`ans-${i}`}
                    style={styles.answerButton}
                    onPress={() => handleAnswer(ans,currentQuestion.question.text,currentQuestion.correctAnswer)}
                  >
                    <Text style={styles.answerText}>{ans}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <Text style={{ textAlign: "center", padding: 16 }}>
                Loading question...
              </Text>
            )}
          </LinearGradient>
          </BlurView>

      </Modal>

      <Modal visible={resultModal} animationType="slide" transparent onRequestClose={()=>setResultModal(false)}>

      </Modal>
    </LinearGradient>
  

    <BottomNavigator navigation={navigation}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#2193b0" , // soft light background
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  
  mainparent: {
    width: "100%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: "#ffffff", // clean card
    borderWidth: 1,
    borderColor: "#e0e4e8",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    fontFamily: "System",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    padding: 0,
  },
  
  
  modalCard: {
    width: "90%",
    height: "85%",       // << BIG DIFFERENCE
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e4e8",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  
  quizTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#222",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 14,
    color: "#555",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 28,
    color: "#111",
  },
  answerButton: {
    width: "100%",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#e0e4e8", // soft neutral
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d5db",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  answerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4f8",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d0d5db",
  },
  categoryText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 12,
    marginLeft: 6,
  },
  confettiWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
});
