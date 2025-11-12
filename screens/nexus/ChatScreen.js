import React, { useState ,useEffect,useContext} from "react";
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TextInput, TouchableOpacity, FlatList,KeyboardAvoidingView ,TouchableWithoutFeedback,Platform,Keyboard, Alert
} from "react-native";
import { io } from 'socket.io-client';
const API_BASE_URL = "http://192.168.0.136:3000";
import { AuthorContext } from '../AuthorContext';
import { Feather } from '@expo/vector-icons';


export default function ChatScreen({route}) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  
const myUsername=user?.fullname;
   const { meetupId }=route.params;
  const [message, setMessage] = useState([]);
  const [inputVal,setinputVal]=useState("")
  const [socket,Setsocket]=useState(null)
  const [meetupname,setmeetupname]=useState(null)
  const [sender,setsender]=useState(null)
  const [location,setlocation]=useState(null)
  const [Year,Setyear]=useState(null)
  const [onMonth,Setonmonth]=useState(null)
  const [ondays,Setondays]=useState(null)
  const [onhours,Setonhours]=useState(null)
  const [onminutos,Setonminutos]=useState(null)
  const [datava,setdatava]=useState(null)

 
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


useEffect(() => {
  // create socket connection once
  const MeetupSocket = io(API_BASE_URL, {
    query: { userId: myUserId },
    transports: ['websocket'],
  });

  // store the socket instance
  Setsocket(MeetupSocket);

  // when connected, join the meetup room
  MeetupSocket.on('connect', () => {
    MeetupSocket.emit('JoinMeet', meetupId);
    console.log('Connected and joined room:', meetupId);
  });

  // listen for new messages
  MeetupSocket.on('NewMessage', (data) => {
    setMessage((prev) => [...prev, data]);
  });

  // cleanup when component unmounts
  return () => {
    console.log('Disconnecting socket...');
    MeetupSocket.disconnect(); // disconnect properly
  };
}, [meetupId, myUserId]); // 👈 runs once per meetup (safe dependencies)



const sendMessage = () => { 
  if (inputVal.trim() === "") return;

  const messagedata = {
    senderId: myUserId,
    sendername: myUsername,
    type: 'text',
    text: inputVal,
    roomPass: meetupId,
    timeStamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // 🧠 Check values before sending
  

  if (!myUserId) {
    console.warn("⚠️ senderId (myUserId) is NULL or undefined!");
  }

  if (socket) {
    socket.emit('Getmessage', messagedata);
  }

  setinputVal('');
};

 


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
 
useEffect(() => {
  const fetchOldMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groupmessages?roomvaue=${meetupId}`);
      if (!response.ok) {
        Alert.alert('An error occurred while fetching messages');
        return;
      }

      const data = await response.json(); // should be an array of messages
      setdatava(data); // store raw data if needed

      // ✅ Convert data to the message structure used in your app
      const formattedMessages = data.map(msg => ({
        id: msg.ID,
        senderId: msg.senderid,
        sendername: msg.sendername,
        type: msg.typeofmessage,
        text: msg.textmessage,
        roomPass: msg.roompass,
        timeStamp: msg.timevalue,
      }));

      // ✅ Append all messages at once
      setMessage(previous => [...previous, ...formattedMessages]);
    } catch (err) {
      console.log('❌ An error occurred while fetching old messages:', err);
    }
  };

  fetchOldMessages();
}, [myUserId]);


const renderMessage=({item})=>{
  const ismine = item.senderId === myUserId;
  

  return(
    <View style={styles.messages}>
     <View style={[styles.msg, ismine ? styles.msgMe : styles.msgThem]}>

      <Text style={styles.msgUser}>{item.sendername} 📍</Text>
      <Text style={styles.msgText}>{item.text}</Text>
      <Text style={styles.msgMeta}>{item.timeStamp}</Text>
      </View>
    </View>
  )
}



return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={90} // adjust depending on your header height
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                <Feather name="users" size={25} color="green" />
              </Text>
            </View>
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
            <View style={styles.iconBtn}><Feather name="phone-call" size={20} color="white" /></View>
            <View style={styles.iconBtn}><Feather name="video" size={20} color="white" /></View>
            <View style={styles.iconBtn}><Feather name="map-pin" size={20} color="white" /></View>
            <View style={styles.iconBtn}><Feather name="more-vertical" size={20} color="white" /></View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={message}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}

          renderItem={renderMessage}
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Send a message, drop location, or ping 🎤"
            placeholderTextColor="#999"
            value={inputVal}
            onChangeText={setinputVal}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f141b", // deeper dark base
  },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1b2a38", // calm dark navy tone
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#62e0d9",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { fontSize: 20, fontWeight: "700", color: "#021123" },

  headerTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#9aa0ab",
  },

  headerRight: {
    flexDirection: "row",
    gap: 10,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===== COUNTDOWN BADGE =====
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ff6363",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },

  countdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // ===== PARTICIPANTS =====
  participants: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  participant: {
    alignItems: "center",
    marginRight: 12,
  },

  participantImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#62e0d9",
    marginBottom: 4,
  },

  participantName: { fontSize: 11, color: "#9aa0ab" },

  // ===== MESSAGES =====
  messages: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  msg: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },

  // Received message (others)
  msgThem: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },

  // Sent message (me)
  msgMe: {
    backgroundColor: "#2a9df4",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },

  msgUser: {
    fontWeight: "600",
    fontSize: 12,
    color: "#62e0d9",
    marginBottom: 4,
  },

  msgText: {
    fontSize: 14,
    color: "#fff",
  },

  msgMeta: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
    color: "#dcdcdc",
    textAlign: "right",
  },

  msgEvent: {
    alignSelf: "center",
    backgroundColor: "#62e0d9",
    color: "#021123",
    fontWeight: "600",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  // ===== INPUT BAR =====
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#1b2a38",
  },

  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 14,
  },

  sendBtn: {
    backgroundColor: "#62e0d9",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    marginLeft: 10,
    shadowColor: "#62e0d9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6, // Android glow
  },
  sendText: {
    color: "#021123",
    fontWeight: "700",
    fontSize: 15,
  },
  

  sendText: {
    color: "#021123",
    fontWeight: "600",
    fontSize: 14,
  },
});


