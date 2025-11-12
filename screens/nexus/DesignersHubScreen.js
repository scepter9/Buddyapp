import React,{useEffect,useState,useContext} from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext";
import {SendUser} from "./CreateRoomScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { random } from "lodash";

const generateroomid=()=>{
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  const value=''
  for(let i=0; i<7, i++;){
    value+=alphabet.charAt(Math.floor(Math.random()*alphabet.length));
   
  }
 return value;
}
const generatecommentid=()=>{
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  const resut=''
  for(let i=0; i<7, i++;){
resut+=alphabet.charAt(Math.floor(Math.random()*alphabet.length))
  }
  return resut;
}
const randomcomment=generatecommentid();
const randomroom=generateroomid()



export default function DesignersHubScreen({navigation,route}) {
 const {roomname}=useContext(SendUser);
  const userSet=new Set();
  useEffect(()=>{
  if(userSet.has(searchid)) return;
  userSet.add(searchid);
    
    return()=>{
userSet.delete(searchid)
    }
  },[searchid]);

  const {roomid}=route.params;
  const {user}=useContext(AuthorContext)
  const searchid=user?.id;
  const posts = [
    {
      id: 1,
      user: "@janedoe",
      time: "1h ago",
      img: "https://i.pravatar.cc/100?img=12",
      text: "“Just finished the prototype for our study app — can’t wait to share it here!”",
      reactions: { heart: 23, comment: 5, share: 3 },
    },
    {
      id: 2,
      user: "@scepter9",
      time: "3h ago",
      img: "https://i.pravatar.cc/100?img=7",
      text: "Anyone free to collab on a small AI-powered note-taking app? Need UI + branding ideas 🔥",
      reactions: { heart: 45, comment: 9, share: 7 },
    },
  ];

  return (
    <LinearGradient
      colors={["#0f1a2c", "#1a2c4c"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <BlurView intensity={50} tint="dark" style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>#{roo}</Text>
            <Text style={styles.members}>• {userSet.size} Online</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.liveBtn]}>
              <Text style={styles.liveText}>🎙️ Go Live</Text>
            </TouchableOpacity>
          
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Live Space */}
          {/* <LinearGradient
            colors={["#00d9ff", "#8a2be2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveSpace}
          >
            <Text style={styles.liveTitle}>🎧 Live Space: “UI Trends 2025”</Text>
            <Text style={styles.liveSub}>
              Hosted by <Text style={{ fontWeight: "700" }}>Hope Mark</Text> • 12 Listening
            </Text>
          </LinearGradient> */}

          {/* Posts */}
          {posts.map((p) => (
            <BlurView key={p.id} intensity={50} tint="dark" style={styles.post}>
              <View style={styles.userRow}>
                <Image source={{ uri: p.img }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{p.user}</Text>
                  <Text style={styles.time}>{p.time}</Text>
                </View>
              </View>
              <Text style={styles.postText}>{p.text}</Text>
              <View style={styles.reactions}>
                <TouchableOpacity>
                  <Text style={styles.reactText}>❤️ {p.reactions.heart}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.reactText}>💬 {p.reactions.comment}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.reactText}>🔁 {p.reactions.share}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ))} 
        </ScrollView>
        <TouchableOpacity style={styles.actionpostBtn} onPress={()=>navigation.navigate('CreateRoomScreen',{room:roomid})}>
              <Text style={styles.actionText}>➕ New Post</Text>
            </TouchableOpacity>
        
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerLeft: { flexDirection: "column" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  members: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionpostBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    position:'absolute',
    bottom:20,
    right:10
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  liveBtn: {
    backgroundColor: "#8a2be2",
  },
  liveText: {
    color: "#031426",
    fontWeight: "700",
    fontSize: 13,
  },
  liveSpace: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  liveTitle: { color: "#031426", fontWeight: "700", fontSize: 15 },
  liveSub: { color: "#022333", fontSize: 13, marginTop: 2 },
  post: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { marginLeft: 10 },
  username: { color: "#fff", fontWeight: "700" },
  time: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  postText: { color: "#eaf6ff", fontSize: 14, lineHeight: 20, marginBottom: 10 },
  reactions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reactText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
  },
  postBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  postBtnText: {
    color: "#031426",
    fontWeight: "700",
  },
});
