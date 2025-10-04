import React, { useState ,useEffect,useContext} from "react";
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TextInput, TouchableOpacity, FlatList 
} from "react-native";
import { io } from 'socket.io-client';
const API_BASE_URL = 'http://172.20.10.4:3000';
import { AuthorContext } from '../AuthorContext';
import { Feather } from '@expo/vector-icons';


export default function ChatScreen({route}) {
const {user}=useContext(AuthorContext)
const myUserid=user?.id;
   const { meetupId }=route.params;
  const [message, setMessage] = useState("");
  const [socket,Setsocket]=useState(null)
  const [meetupname,setmeetupname]=useState(null)
  const [location,setlocation]=useState(null)
  const [Year,Setyear]=useState(null)
  const [onMonth,Setonmonth]=useState(null)
  const [ondays,Setondays]=useState(null)
  const [onhours,Setonhours]=useState(null)
  const [onminutos,Setonminutos]=useState(null)

 
// helper: returns { days, hours, minutes, seconds }
function getTimeLeftFromComponents(year, month, day, hour = 0, minute = 0) {
  // require minimal values
  if (!year || !month || !day) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  // Construct local Date from components (month-1 because JS months are 0-indexed)
  const eventDate = new Date(year, month - 1, day, hour, minute, 0);
  const diffMs = eventDate.getTime() - Date.now();

  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  let totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  totalSeconds -= days * 24 * 3600;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  return { days, hours, minutes, seconds };
}


  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [messages, setMessages] = useState([
    { id: "1", type: "event", text: "✨ Meetup created by Ofrima" },
    { id: "2", type: "them", user: "Jay", text: "Hey team, meet at Arena around 7:30?", time: "7:10 PM" },
    { id: "3", type: "me", text: "Perfect, I’ll bring my notes 📖", time: "7:12 PM" },
    { id: "4", type: "them", user: "Sara", text: "I can bring snacks 🍪", time: "7:15 PM" },
    { id: "5", type: "event", text: "📍 Location set: Arena, Uniport" },
    { id: "6", type: "them", user: "Ofrima", text: "Don’t forget your laptops 💻", time: "7:20 PM" },
    { id: "7", type: "me", text: "Got it 👍", time: "7:21 PM" },
  ]);
  useEffect(() => {
  async function fetchDetails() {
    try {
      const res = await fetch(`${API_BASE_URL}/meetupchat?meetupId=${meetupId}`);
      const data = await res.json();
      if (res.ok && data) {
        setmeetupname(data.title);
        setlocation(data.location);
        Setyear(data.year);
        Setonmonth(data.month);
        Setondays(data.day);
        Setonhours(data.hour);
        Setonminutos(data.minute);

        // compute initial time left immediately
        const initial = getTimeLeftFromComponents(
          data.year,
          data.month,
          data.day,
          data.hour,
          data.minute
        );
        setTime(initial);
      }
    } catch (err) {
      console.log("Error fetching meetup:", err);
    }
  }
  fetchDetails();
}, [meetupId]);
  
  useEffect(() => {
  // only start interval when we have the event components
  if (!Year || !onMonth || !ondays) return;

  // tick by recomputing from absolute event time every second
  const timer = setInterval(() => {
    setTime(getTimeLeftFromComponents(Year, onMonth, ondays, onhours, onminutos));
  }, 1000);

  // set immediate value too (no waiting for the first tick)
  setTime(getTimeLeftFromComponents(Year, onMonth, ondays, onhours, onminutos));

  return () => clearInterval(timer);
}, [Year, onMonth, ondays, onhours, onminutos]);



  const sendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), type: "me", text: message, time: "Now" }]);
      setMessage("");
    }
  };
 
// const [totaldayspan, settotaldayspan] = useState(initial.days);
// const [totalhours, settotalhours] = useState(initial.hours);
// const [totalminutes, settotalminutes] = useState(initial.minutes);


useEffect(() => {
  const timer = setInterval(() => {
    setTime(prev => {
      const { days, hours, minutes, seconds } = prev;

      if (seconds > 0) {
        return { ...prev, seconds: seconds - 1 };
      } else if (minutes > 0) {
        return { ...prev, minutes: minutes - 1, seconds: 59 };
      } else if (hours > 0) {
        return { ...prev, hours: hours - 1, minutes: 59, seconds: 59 };
      } else if (days > 0) {
        return { ...prev, days: days - 1, hours: 23, minutes: 59, seconds: 59 };
      } else {
        clearInterval(timer); // stop when all reach 0
        return prev;
      }
    });
  }, 1000);

  // cleanup when component unmounts
  return () => clearInterval(timer);
}, []);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}><Feather name="users" size={25} color="green" /></Text></View>
          <View style={styles.headerTextContainer}>
  <Text style={styles.headerTitle}>{meetupname}</Text>

  <View style={styles.countdownBadge}>
    <Feather name="clock" size={16} color="#021123" style={{ marginRight: 6 }} />
    <Text style={styles.countdownText}>
  {time.days}d : {time.hours}h : {time.minutes}m
</Text>

  </View>

  
</View>



        </View>
        <View style={styles.headerRight}>
          <View style={styles.iconBtn}><Text><Feather name="phone-call" size={20} color="black" /></Text></View>
          <View style={styles.iconBtn}><Text><Feather name="video" size={20} color="black"/></Text></View>
          <View style={styles.iconBtn}><Text><Feather name="map-pin" size={20} color="black" /></Text></View>
          <View style={styles.iconBtn}><Text><Feather name="more-vertical" size={20} color="black" /></Text></View>
        </View>
      </View>

      {/* Participants */}
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participants}>
        {participants.map(p => (
          <View key={p.id} style={styles.participant}>
            <Image source={{ uri: p.img }} style={styles.participantImg} />
            <Text style={styles.participantName}>{p.name}</Text>
          </View>
        ))}
      </ScrollView> */}

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
  headerTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b6b',   // highlight color
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4, // for Android shadow
  },
  
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#021123', // dark text on bright bg
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  
  
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
