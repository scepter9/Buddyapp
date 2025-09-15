import React, { useState ,useEffect,useContext} from "react";
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TextInput, TouchableOpacity, FlatList 
} from "react-native";
import { io } from 'socket.io-client';
const API_BASE_URL = 'http://172.20.10.4:3000';
import { AuthorContext } from './AuthorContext';

export default function ChatScreen() {
const {user}=useContext(AuthorContext)
const myUserid=user?.id;
  
  const [message, setMessage] = useState("");
  const [socket,Setsocket]=useState(null)
  const [messages, setMessages] = useState([
    { id: "1", type: "event", text: "✨ Meetup created by Ofrima" },
    { id: "2", type: "them", user: "Jay", text: "Hey team, meet at Arena around 7:30?", time: "7:10 PM" },
    { id: "3", type: "me", text: "Perfect, I’ll bring my notes 📖", time: "7:12 PM" },
    { id: "4", type: "them", user: "Sara", text: "I can bring snacks 🍪", time: "7:15 PM" },
    { id: "5", type: "event", text: "📍 Location set: Arena, Uniport" },
    { id: "6", type: "them", user: "Ofrima", text: "Don’t forget your laptops 💻", time: "7:20 PM" },
    { id: "7", type: "me", text: "Got it 👍", time: "7:21 PM" },
  ]);

  // const participants = [
  //   { id: "1", name: "Jay", img: "https://i.pravatar.cc/42?img=1" },
  //   { id: "2", name: "Sara", img: "https://i.pravatar.cc/42?img=2" },
  //   { id: "3", name: "Ofrima", img: "https://i.pravatar.cc/42?img=3" },
  //   { id: "4", name: "You", img: "https://i.pravatar.cc/42?img=4" },
  // ];

  const sendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), type: "me", text: message, time: "Now" }]);
      setMessage("");
    }
  };
useEffect(()=>{
  const groupsocket=io(API_BASE_URL,{
    query:{userId:myUserid},
    transports:['websockets']
  })
})
Setsocket(groupsocket)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>🎤</Text></View>
          <View>
            <Text style={styles.headerTitle}>Pitch Night Meetup</Text>
            <Text style={styles.headerSubtitle}>Student Hub · Tonight</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.iconBtn}><Text>🎧</Text></View>
          <View style={styles.iconBtn}><Text>📍</Text></View>
          <View style={styles.iconBtn}><Text>⋮</Text></View>
        </View>
      </View>

      {/* Participants */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participants}>
        {participants.map(p => (
          <View key={p.id} style={styles.participant}>
            <Image source={{ uri: p.img }} style={styles.participantImg} />
            <Text style={styles.participantName}>{p.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView style={styles.messages}>
        {messages.map(m => {
          if (m.type === "event") {
            return <Text key={m.id} style={styles.msgEvent}>{m.text}</Text>;
          }
          return (
            <View key={m.id} style={[styles.msg, m.type === "me" ? styles.msgMe : styles.msgThem]}>
              {m.type === "them" && <Text style={styles.msgUser}>{m.user} 📍</Text>}
              <Text style={styles.msgText}>{m.text}</Text>
              {m.time && <Text style={styles.msgMeta}>{m.time}</Text>}
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Send a message, drop location, or ping 🎤"
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1c1f26" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#62e0d9",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#021123" },
  headerSubtitle: { fontSize: 12, color: "#021123cc" },
  headerRight: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },

  // Participants
  participants: { backgroundColor: "rgba(255,255,255,0.04)", paddingVertical: 12, paddingHorizontal: 16 },
  participant: { alignItems: "center", marginRight: 12 },
  participantImg: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "#62e0d9", marginBottom: 4 },
  participantName: { fontSize: 11, color: "#9aa0ab" },

  // Messages
  messages: { flex: 1, padding: 20 },
  msg: { maxWidth: "75%", padding: 12, borderRadius: 16, marginBottom: 14 },
  msgThem: { backgroundColor: "rgba(255,255,255,0.05)", alignSelf: "flex-start" },
  msgMe: { backgroundColor: "rgba(106,180,255,0.15)", alignSelf: "flex-end", borderWidth: 1, borderColor: "rgba(106,180,255,0.1)" },
  msgEvent: { alignSelf: "center", backgroundColor: "#7be7d9", color: "#021123", fontWeight: "600", borderRadius: 30, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 14 },
  msgUser: { fontWeight: "600", fontSize: 12, color: "#62e0d9", marginBottom: 4 },
  msgText: { fontSize: 14, color: "#fff" },
  msgMeta: { fontSize: 11, opacity: 0.6, marginTop: 4, color: "#fff" },

  // Input
  inputBar: { flexDirection: "row", padding: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(0,0,0,0.4)" },
  input: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14 },
  sendBtn: { backgroundColor: "#62e0d9", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center", marginLeft: 10 },
  sendText: { color: "#021123", fontWeight: "600" },
});
