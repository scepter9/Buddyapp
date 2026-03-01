import React, { useEffect, useState ,useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthorContext } from '../AuthorContext';
import { FontAwesome } from "@expo/vector-icons";
import { io } from 'socket.io-client';
import { PreventRemoveContext } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = "http://192.168.0.136:3000";

function Renderquestions({item,navigation,socket,setAnswers}){
    const [votes, setVotes] = useState(0);
   
    const likeKey=`like${item.ID}`
  const dislikeKey=`dislike${item.ID}`
    const [upvoted, setUpvoted] = useState(false);
    const [downvoted, setDownvoted] = useState(false);

    
    
      
      

      useEffect(()=>{
        const getVote=async()=>{
            const getvoteval = await AsyncStorage.getItem(likeKey);
if (getvoteval) setVotes(JSON.parse(getvoteval));

        }
        getVote()
      },[])

const saved=async(savedvalue)=>{
await AsyncStorage.setItem(likeKey,JSON.stringify(savedvalue))
}
const handleUpvote = () => {
    setVotes(prev => {
      let newVal = prev;
      if (upvoted) {
        newVal = Math.max(prev - 1, 0);
        setUpvoted(false);
      } else {
        newVal = prev +1;
        setUpvoted(true);
        setDownvoted(false);
      }
      saved(newVal);
      return newVal;
    });
  };
  

  const handleDownvote = () => {
    setVotes(prev => {
      let newVal = prev;
      if (downvoted) {
        newVal = prev + 1;
        setDownvoted(false);
      } else {
        newVal = Math.max(prev - 1, 0);
        setDownvoted(true);
        setUpvoted(false);
      }
      saved(newVal);
      return newVal;
    });
  };
  


      return(
        <View style={styles.answer}>
        <Text style={styles.answerAuthor}>{item.author}:</Text>
        <Text style={styles.answerText}>{item.answer}</Text>
        <View style={styles.votes}>
                <TouchableOpacity
                  style={[styles.voteBtn, upvoted && styles.voteBtnActive]}
                  onPress={handleUpvote}
                >
                  <Text style={styles.voteBtnText}>👍 Upvote</Text>
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={[styles.voteBtn, downvoted && styles.voteBtnActive]}
                  onPress={handleDownvote}
                >
                  <Text style={styles.voteBtnText}>👎 Downvote</Text>
                </TouchableOpacity>
  
                <Text style={styles.voteCount}>
                  <Text style={{ fontWeight: "700" }}>{votes}</Text> votes
                </Text>
              </View>
      </View>
      );
}

export default function QuestionDetails({ navigation }) {
    const [userAnswer, setUserAnswer] = useState("");
    const [socket,Setsocket]=useState(null);
    const [answers, setAnswers] = useState([
    ]);
    const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const myUserName = user?.fullname;

  useEffect(() => {
    const questionsocket = io(API_BASE_URL, {
      query: { userId: myUserId },
      transports: ['websocket'],
    });
  
    Setsocket(questionsocket);
  
    questionsocket.on('connect', () => {
      console.log(' Connected to server');
    });
  
    return () => {
      questionsocket.disconnect();
    };
  }, []);
  

  

  useEffect(() => {
    if (!socket) return; // 🧱 Prevent running if socket is still null
  
    const listener = (data) => {
      console.log('✅ Received answer:', data);
      // If backend sends an array like [ {...} ], spread it
const formatted = Array.isArray(data) ? data : [data];
setAnswers((prev) => [...prev, ...formatted]);

    };
  
    socket.on('Questionget', listener);
  
    return () => socket.off('Questionget', listener);
  }, [socket]);
  



useEffect(() => {
    if (!socket) return;
  
    const listener = (data) => {
      console.log('Received answer:', data);
    };
  
    socket.on('SendAnswers', listener);
  
    // ✅ Cleanup when component unmounts
    return () => socket.off('SendAnswers', listener);
  }, [socket])
  const handleSubmit=()=>{
    if(userAnswer.trim()===''){
        Alert.alert("Empty Answer", "Please type an answer before submitting.");

        return;
    }
if(socket){
    socket.emit('SendAnswers',{
        username:myUserName,
        answer:userAnswer,
    });
    Alert.alert('Your answer has been posted')
    setUserAnswer( "")
    
}

  }

   
 

 
  



  
//   const renderAnswer = ({ item }) => (
//     <View style={styles.answer}>
//       <Text style={styles.answerAuthor}>{item.author}:</Text>
//       <Text style={styles.answerText}>{item.text}</Text>
//       <View style={styles.votes}>
//               <TouchableOpacity
//                 style={[styles.voteBtn, upvoted && styles.voteBtnActive]}
//                 onPress={handleUpvote}
//               >
//                 <Text style={styles.voteBtnText}>👍 Upvote</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.voteBtn, downvoted && styles.voteBtnActive]}
//                 onPress={handleDownvote}
//               >
//                 <Text style={styles.voteBtnText}>👎 Downvote</Text>
//               </TouchableOpacity>

//               <Text style={styles.voteCount}>
//                 <Text style={{ fontWeight: "700" }}>{votes}</Text> votes
//               </Text>
//             </View>
//     </View>
//   );

  return (
    <LinearGradient
      colors={["#eef2ff", "#fdf4ff"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.backText}><FontAwesome name="arrow-left" size={30} color="#000" />
 </Text>
          </TouchableOpacity>

          {/* 🆕 Ask a Question Section */}
          

          {/* Existing Question */}
          <View style={styles.questionBox}>
            <Text style={styles.title}>
              How can I improve my productivity while studying?
            </Text>
            {/* <Text style={styles.meta}>Asked by Sarah · 2h ago · 120 views</Text> */}
            {/* <Text style={styles.bodyText}>
              I often get distracted easily and lose focus. What strategies work
              best for you?
            </Text> */}

            
          </View>

          {/* Answer Section */}
          <View style={styles.answerBox}>
            <Text style={styles.answerHeading}>Write Your Answer</Text>
            <TextInput
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer here..."
              multiline
              style={styles.textarea}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>

          {/* Answers List */}
          <View style={styles.answers}>
            <FlatList
              data={answers}
              keyExtractor={(item, index) => item.ID?.toString() || index.toString()}

              renderItem={({ item }) => (
                <Renderquestions item={item} socket={socket} setAnswers={setAnswers}/>
              )}
              ListHeaderComponent={
                <Text style={styles.answersHeader}>Answers</Text>
              }
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  container: {
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 80,
    width: "100%",
  },
  backLink: {
    alignSelf: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backText: { color: "#374151", fontSize: 14 },

  /** 🆕 ASK SECTION **/
  askBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 25,
  },
  askHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 12,
  },
  askInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 90,
    marginBottom: 12,
  },
  askBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  askBtnText: { color: "#fff", fontWeight: "600" },

  /** EXISTING QUESTION **/
  questionBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, color: "#1e3a8a" },
  meta: { fontSize: 13, color: "#666", marginBottom: 12 },
  bodyText: { fontSize: 15, color: "#111" },

  votes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 16,
  },
  voteBtn: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  voteBtnActive: { backgroundColor: "#6366f1" },
  voteBtnText: { fontSize: 15, color: "#111" },
  voteCount: { marginLeft: 12, fontSize: 15, color: "#111" },

  /** ANSWER SECTION **/
  answerBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  answerHeading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1e40af",
  },
  textarea: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  submitBtnText: { color: "#fff", fontSize: 14 },

  answers: { marginTop: 10 },
  answersHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#111",
  },
  answer: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  answerAuthor: { fontWeight: "700", marginBottom: 6, color: "#1e3a8a" },
  answerText: { color: "#333", fontSize: 15 },
});
