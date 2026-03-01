import React, { useEffect ,useContext,useRef} from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity,SafeAreaView ,ScrollView} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthorContext } from "../AuthorContext";
const API_BASE_URL = "http://192.168.0.136:3000";

export default function CompetitionHome({route,navigation}) {
  const { user } = useContext(AuthorContext);
  const usersid = user?.id;
  const postedRef = useRef(false);
  const goanimation=new Animated.Value(0.8)
 useEffect(()=>{
  Animated.spring(goanimation,{
    friction: 3,
    tension: 180,
    toValue:1,
    useNativeDriver:true
  }).start()
 },[])
 const { score = 0, incorrect = [] } = route?.params || {};

 
  const ThankYou = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Nice Work 🎉</Text>
      <Text style={styles.desc}>
        You wrapped up the test — clean and smooth.
      </Text>
    </View>
  );

  const ScoreV = ({ score }) => {
    const feedback = (val) => {
      if (val <= 50) return "Review and try again";
      if (val < 80) return "Keep pushing — you're leveling up";
      return "Excellent performance";
    };
   
    



    useEffect(() => {
      if (!usersid || !score) return;
    
      const postscore = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/postcompetitionscore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usersid, score }),
          });
    
          if (!res.ok) {
            console.log('Something went wrong in competition');
          }
        } catch (err) {
          console.log(err);
        }
      };
    
      postscore();
    }, [usersid, score]);
    

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Your Results</Text>
        <Text style={[styles.score,score<=50 && styles.low,score>50 &&score >80 && styles.medium , score>=80 && styles.high]}>{score}%</Text>
        <Text style={styles.desc}>{feedback(score)}</Text>
      </View>
    );
  };

  const IncorrectSection = ({ mistakes }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Review Mistakes</Text>

      {mistakes.map((mis) => (
        <View style={styles.mistakeBox} key={mis.id}>
          <Text style={styles.question}>Q: {mis.question}</Text>
          <Text style={styles.correct}>Correct: {mis.answer}</Text>
          <Text style={styles.your}>Your Answer: {mis.youranswer}</Text>
          
        </View>
      ))}
      <Animated.View style={{ transform: [{ scale: goanimation }] }}>
  <TouchableOpacity
    style={[styles.button, styles.buttonSecondary]}
    onPress={() => navigation.navigate("About")}
  >
    <Text style={styles.buttonText}>Go Home</Text>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={{ transform: [{ scale: goanimation }] }}>
  <TouchableOpacity
    style={styles.button}
    onPress={() => navigation.navigate("QuickPlayScreen")}
  >
    <Text style={styles.buttonText}>Play Again</Text>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={{ transform: [{ scale: goanimation }] }}>
  <TouchableOpacity
    style={styles.button}
    onPress={() => navigation.navigate("DuelScreen")}
  >
    <Text style={styles.buttonText}>View Leaderboard</Text>
  </TouchableOpacity>
</Animated.View>
    </View>
  );

  const segments = [
    { id: 1, Component: ThankYou },
    { id: 2, Component: ScoreV, props: { score } },
    { id: 3, Component: IncorrectSection, props: { mistakes: incorrect } }
  ];

  const animations = segments.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(20),
    scale: new Animated.Value(0.9),
  }));

  const durations = [250, 350, 450];

  useEffect(() => {
    const animatedSequence = segments.map((_, i) =>
      Animated.parallel([
        Animated.timing(animations[i].opacity, {
          toValue: 1,
          duration: durations[i],
          useNativeDriver: true,
        }),
        Animated.timing(animations[i].translateY, {
          toValue: 0,
          duration: durations[i],
          useNativeDriver: true,
        }),
        Animated.spring(animations[i].scale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence(animatedSequence).start();
  }, []);

  return (
    <SafeAreaView style={styles.first}>
    <LinearGradient
      colors={["#1f1f2e", "#2a2a3c"]}
      style={styles.container}
    >
   <ScrollView
    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    showsVerticalScrollIndicator={false}
  >
        {segments.map((seg, i) => {
          const Item = seg.Component;
          return (
            <Animated.View
              key={seg.id}
              style={{
                opacity: animations[i].opacity,
                transform: [
                  { translateY: animations[i].translateY },
                  { scale: animations[i].scale },
                ],
                marginBottom: 25,
              }}
            >
              <Item {...(seg.props || {})} />
            </Animated.View>
          );
        })}
   </ScrollView>
    </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  first:{
    flex:1,
    backgroundColor:'#2a2a3c'
  },
  container: {
    flex: 1
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 22,
    color: "#f5f5f7",
    fontWeight: "600",
    marginBottom: 6,
  },
  desc: {
    fontSize: 15,
    color: "#b1b1c5",
  },
  score: {
    fontSize: 42,
    // color: "#9b6bff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  high:{
    color: "#9b6bff",
  },
  low:{
    color: "red",
  },
  medium:{
    color: "#2e2a1f",
  },
  mistakeBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14
  },
  question: {
    color: "#f5f5f7",
    fontWeight: "600",
    marginBottom: 4
  },
  correct: {
    color: "#7cf1b6",
    marginBottom: 2
  },
  your: {
    color: "#ff8a8a"
  },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  
  buttonText: {
    color: "#f5f5f7",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  
  buttonSecondary: {
    backgroundColor: "rgba(155,107,255,0.25)", // light purple glow
    borderColor: "#9b6bff",
  },
  
});
