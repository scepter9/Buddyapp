import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity ,StyleSheet,SafeAreaView, FlatList,LayoutAnimation,
 Platform,UIManager} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthorContext } from "../AuthorContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = "http://192.168.0.136:3000";
if(Platform.OS==='android'){
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function Leader({ item, index }) {
  const { user } = useContext(AuthorContext);
  const usersid = user?.id;
  const isme = item.user_id === usersid;


  // Special top 3 backgrounds
  const top3Styles = index === 0
    ? styles.gold
    : index === 1
    ? styles.silver
    : index === 2
    ? styles.bronze
    : null;

  return (
    <View style={[
      styles.card,
      isme && styles.you,
      // index === 0 && styles.gold,
      // index === 1 && styles.silver,
      // index === 2 && styles.bronze,
    ]}>
    
      {/* Rank badge */}
      <View style={[
        styles.rankBadge,
        index < 3 && styles.rankBadgeTop
      ]}>
        <Text style={styles.rankText}>
          {index < 3 ? ["🥇","🥈","🥉"][index] : item.rank}
        </Text>
      </View>
    
      {/* Avatar */}
      <Image
        source={{ uri: `${API_BASE_URL}/uploads/${item.image}` }}
        style={[
          styles.avatar,
          index < 3 && styles.avatarTop
        ]}
      />
    
      {/* User info */}
      <View style={styles.info}>
        <Text style={styles.username}>{item.usersname}</Text>
        <Text style={styles.subText}>Weekly XP</Text>
      </View>
    
      {/* Score */}
      <View style={styles.scoreWrap}>
        <Text style={styles.score}>{item.score}</Text>
        <Text style={styles.xp}>XP</Text>
      </View>
    </View>
    
  );
}

export default function DuelScreen({navigation}) {
  const {user}=useContext(AuthorContext)
  const usersid=user?.id;
  const [leaders,Setleaders]=useState([])
  
  const flatlistref=useRef(null)
  // const [isJoined,setisJoined]=useState(null)
  useEffect(() => {
    if (!usersid) return;
  
    const fetchAndAnimate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/fetchleader`);
        if (!res.ok) return console.log("Failed to fetch leaders");
  
        const freshData = await res.json();
        const finalList = [...freshData];
  
        // Find final index (based on score)
        const finalIndex = finalList.findIndex(
          u => u.user_id === usersid
        );
  
        if (finalIndex === -1) {
          Setleaders(finalList);
          return;
        }
  
        // Load PREVIOUS leaderboard state
        const prevListStr = await AsyncStorage.getItem(
          `leaderboard-cache`
        );
  
        let animatedList = prevListStr
          ? JSON.parse(prevListStr)
          : [...finalList];
  
        // Render old state first
        Setleaders(animatedList);
  
        // Let UI breathe
        await new Promise(r => setTimeout(r, 300));
  
        const prevIndex = animatedList.findIndex(
          u => u.user_id === usersid
        );
  
        // If user was not in previous list
        if (prevIndex === -1 || prevIndex === finalIndex) {
          Setleaders(finalList);
          await AsyncStorage.setItem(
            `leaderboard-cache`,
            JSON.stringify(finalList)
          );
          return;
        }
  
        // Scroll near previous position
        flatlistref.current?.scrollToIndex({
          index: Math.min(prevIndex, finalIndex),
          animated: true,
          viewPosition: 0.4,
        });
  
        // Step-by-step movement
        let currentPos = prevIndex;
        const direction = finalIndex < prevIndex ? -1 : 1;
  
        while (currentPos !== finalIndex) {
          const nextPos = currentPos + direction;
  
          [animatedList[currentPos], animatedList[nextPos]] = [
            animatedList[nextPos],
            animatedList[currentPos],
          ];
  
          LayoutAnimation.configureNext(
            LayoutAnimation.Presets.easeInEaseOut
          );
  
          Setleaders([...animatedList]);
  
          await new Promise(r => setTimeout(r, 420));
          currentPos = nextPos;
        }
  
        // Final sync
        Setleaders(finalList);
  
        // Save FINAL UI state
        await AsyncStorage.setItem(
          `leaderboard-cache`,
          JSON.stringify(finalList)
        );
  
      } catch (err) {
        console.error("Leaderboard animation error:", err);
      }
    };
  
    fetchAndAnimate();
  }, [usersid]);
  
  
  
  
  
  return (
    <SafeAreaView style={styles.main} >
<View>
  <Text style={styles.headerText}>Good job! Earn more points to keep moving up the table</Text>
  <FlatList
  ref={flatlistref}
  data={leaders}
keyExtractor={(item)=>item.id.toString()}
  renderItem={({item,index})=>(<Leader item={item} index={index} fullarray={leaders}/>)}
  contentContainerStyle={{
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  }}
  getItemLayout={(data,index)=>({
    length:70,
    offset:70*index,
    index,
  })}
 
  />
  <TouchableOpacity style={styles.continueBtn} onPress={()=>navigation.goBack()}>
  <Text style={styles.continueText}>Continue</Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
  );
}
const DUO_GREEN = "#00CC00";
const DUO_BLUE = "#1CB0F6";
const DUO_PURPLE = "#6A4BFF";

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    padding: 16,
  },

  headerText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 16,
  },

  /* ===== CARD ===== */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  /* ===== CURRENT USER ===== */
  you: {
    backgroundColor: "#E9FFE9",
    borderWidth: 2,
    borderColor: DUO_GREEN,
  },

  /* ===== RANK BADGE ===== */
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  rankBadgeTop: {
    backgroundColor: DUO_GREEN,
  },

  rankText: {
    fontWeight: "900",
    fontSize: 16,
    color: "#111",
  },

  /* ===== AVATAR ===== */
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  avatarTop: {
    borderWidth: 3,
    borderColor: DUO_GREEN,
  },

  /* ===== USER INFO ===== */
  info: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  subText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  /* ===== SCORE ===== */
  scoreWrap: {
    alignItems: "flex-end",
  },

  score: {
    fontSize: 18,
    fontWeight: "900",
    color: DUO_PURPLE,
  },

  xp: {
    fontSize: 12,
    color: "#999",
  },

  /* ===== TOP 3 CARDS ===== */
  gold: {
    backgroundColor: "#FFF7CC",
  },
  silver: {
    backgroundColor: "#F1F3F6",
  },
  bronze: {
    backgroundColor: "#FFE8D9",
  },

  /* ===== BUTTON ===== */
  continueBtn: {
    marginTop: 24,
    backgroundColor: "#9b6bff",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#9b6bff",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    
  },

  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
