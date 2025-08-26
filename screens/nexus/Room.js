import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { io } from 'socket.io-client';
import { AuthorContext } from "../AuthorContext";

const API_BASE_URL = 'http://172.20.10.4:3000';

// A fixed list of random emojis for anonymous users
const randomEmojis = ["👻", "🦊", "🐼", "🐙", "🐸", "🦉", "🐺", "🐢"];

export default function Room({ navigation, route }) {
  // Extract parameters from the navigation route.
  const { roomName, duration, roomCode } = route.params;
  
 
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;

  // State variables
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(parseInt(duration) * 60 || 900); // Convert hours to seconds, default to 15 mins
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [emojiMap, setEmojiMap] = useState(new Map());

  // --- Main useEffect for Socket.IO and Timer ---
  useEffect(() => {
    // 1. Initialize the socket connection.
    const anonSocket = io(API_BASE_URL, {
      query: { userId: myUserId },
      transports: ['websocket']
    });
    setSocket(anonSocket);

    // 2. Set up event listeners.
    anonSocket.on('connect', () => {
      console.log("Socket connected, joining room...");
      // Emit the event to join the specific room using the room code.
      anonSocket.emit('joinRoom', roomCode);
    });

    // Handle incoming messages.
    anonSocket.on('newMessage', (message) => {
      setMessages(prevMessages => {
        // Assign a random emoji to the user if they don't have one yet.
        // This ensures the same user always gets the same emoji for this session.
        if (!emojiMap.has(message.senderId)) {
          const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
          setEmojiMap(prevMap => new Map(prevMap).set(message.senderId, randomEmoji));
        }
        return [...prevMessages, message];
      });
    });

    // Update the online user count.
    anonSocket.on('userJoined', (userId) => {
      setOnlineUsers(prevUsers => new Set(prevUsers).add(userId));
    });

    anonSocket.on('userLeft', (userId) => {
      setOnlineUsers(prevUsers => {
        const newUsers = new Set(prevUsers);
        newUsers.delete(userId);
        return newUsers;
      });
    });

    // 3. Set up the countdown timer.
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert("Room Expired", "The anonymous chat session has ended.", [
            { text: "OK", onPress: () => navigation.goBack() }
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 4. Cleanup function to prevent memory leaks.
    return () => {
      clearInterval(timer);
      anonSocket.disconnect();
    };
  }, [roomCode, myUserId, navigation]); // Dependencies: reconnect if roomCode or user changes.

  // Helper function to format the timer.
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Function to handle sending a message.
  const handleSend = () => {
    if (input.trim() === "") return;
    if (socket) {
      // Emit the message to the backend. The backend will broadcast it.
      socket.emit('sendMessage', {
        roomCode: roomCode,
        text: input,
        senderId: myUserId, // Pass a user ID for identification
      });
      setInput("");
    }
  };

  // Handle navigating back.
  const handleLeaveRoom = () => {
    navigation.goBack();
  };

  // Function to render each message in the FlatList.
  const renderMessage = ({ item }) => {
    const senderEmoji = emojiMap.get(item.senderId) || "👤"; // Default emoji for safety
    const isMe = item.senderId === myUserId;
    
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        <Text style={styles.avatar}>{senderEmoji}</Text>
        <LinearGradient
          colors={["rgba(99,102,241,0.15)", "rgba(147,51,234,0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubble}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <LinearGradient
              colors={["#9333ea", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View>
                <Text style={styles.roomTitle}><Feather name="message-circle" size={20} color="#fff" /> Room: {roomName}</Text>
                <View style={styles.subHeader}>
                  <Text style={styles.subText}><Feather name="clock" size={20} color="#fff" /> {formatTime(timeLeft)}</Text>
                  <Text style={styles.subText}> <Feather name="users" size={20} color="#fff" /> {onlineUsers.size} online</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveRoom}>
                <Feather name="log-out" size={22} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Chat Messages */}
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatRoom}
            />

            {/* Input */}
            <View style={styles.chatInput}>
              <TextInput
                style={styles.input}
                placeholder="Whisper something..."
                placeholderTextColor="#aaa"
                value={input}
                onChangeText={setInput}
              />
              <TouchableOpacity activeOpacity={0.8} onPress={handleSend}>
                <LinearGradient
                  colors={["#9333ea", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtn}
                >
                  <Text style={styles.sendText}>➤</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f17",
  },
  header: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
  },
  roomTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    letterSpacing: 1,
  },
  subHeader: {
    flexDirection: "row",
    marginTop: 4,
  },
  subText: {
    color: "#fff",
    fontSize: 13,
    marginRight: 12,
  },
  leaveBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 50,
  },
  chatRoom: {
    flexGrow: 1,
    padding: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.3)",
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  chatInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(25,25,40,0.95)",
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    marginRight: 10,
  },
  sendBtn: {
    padding: 14,
    borderRadius: 50,
    elevation: 6,
    shadowColor: "#9333ea",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
