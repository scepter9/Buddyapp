import React, { useState, useEffect, useContext, useRef } from "react";
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
  Animated,
  StatusBar,
  Alert,         // BUG FIX: was missing from imports
  ActivityIndicator,
  Pressable,
  Modal
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AuthorContext } from "../AuthorContext";
import socket from "../Socket";
import { colors } from "../Theme";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

const randomEmojis = [
  "👻", "🦊", "🐼", "🐙", "🐸", "🦉", "🐺", "🐢",
  "🦋", "🐬", "🦄", "🐝", "🦁", "🐧", "🦀", "🐳",
];

const emojiColors = [
  ["#c084fc", "#818cf8"],
  ["#f472b6", "#fb923c"],
  ["#34d399", "#22d3ee"],
  ["#fbbf24", "#f87171"],
];
const formatNumber = (val) => {
  if (!val) return "0";
  if (val < 1000) return val.toString();
  if (val < 1_000_000) return (val / 1000).toFixed(1) + "k";
  return (val / 1_000_000).toFixed(1) + "m";
};

const MessageBubble = ({ item, myUserId, socket, emojiOptions, emojiMap, emojiColorMap, onPickerChange, room }) => {
  const senderEmoji = emojiMap.get(item.senderId) || "👤";
  const senderColors = emojiColorMap.get(item.senderId) || ["#c084fc", "#818cf8"];
  const isMe = item.senderId === myUserId;

  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState({});
  const [activeEmoji, setActiveEmoji] = useState(null); // tracks YOUR current reaction

  useEffect(() => {
      const handler = ({ messageId, emojiId, type, fromSelf }) => {
          if (item.id !== messageId) return;
          if (fromSelf) return; // ← skip: optimistic update already handled it
          const emoji = emojiOptions[emojiId];
          if (!emoji) return;
          setReactions(prev => {
              const current = prev[emoji] || { count: 0, reacted: false };
              if (type === 'remove') {
                  return { ...prev, [emoji]: { ...current, count: Math.max(0, current.count - 1) }};
              }
              return { ...prev, [emoji]: { ...current, count: current.count + 1 }};
          });
      };
      socket.on('Receiveemoji', handler);
      return () => socket.off('Receiveemoji', handler);
  }, [item.id]);

  const showSlide = () => {
      onPickerChange(true);
      setShowPicker(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 20, tension: 40 }).start();
      Animated.timing(opacityAnim, { toValue: 1, useNativeDriver: true, duration: 500 }).start();
  };

  const hideSlide = () => {
      onPickerChange(false);
      Animated.spring(slideAnim, { toValue: 120, useNativeDriver: true }).start();
      Animated.timing(opacityAnim, { toValue: 0, useNativeDriver: true, duration: 200 }).start(() => setShowPicker(false));
  };

  const onSelect = (index) => {
      const emoji = emojiOptions[index];
      const isSameEmoji = activeEmoji === emoji;

      setReactions(prev => {
          const updated = { ...prev };

          // If there's a previous active reaction that's different, remove it
          if (activeEmoji && !isSameEmoji) {
              const prevData = updated[activeEmoji] || { count: 0, reacted: false };
              updated[activeEmoji] = { count: Math.max(0, prevData.count - 1), reacted: false };
              // tell backend to remove old reaction too
              socket.emit('sendEmoji', {
                  emojiId: emojiOptions.indexOf(activeEmoji),
                  messageId: item.id,
                  roomCode: room,
                  type: 'remove',
                  fromSelf: true,
              });
          }

          // Toggle the tapped emoji
          const current = updated[emoji] || { count: 0, reacted: false };
          if (isSameEmoji) {
              // unreact
              updated[emoji] = { count: Math.max(0, current.count - 1), reacted: false };
          } else {
              // react
              updated[emoji] = { count: current.count + 1, reacted: true };
          }

          return updated;
      });

      const newActive = isSameEmoji ? null : emoji;
      setActiveEmoji(newActive);

      socket.emit('sendEmoji', {
          emojiId: index,
          messageId: item.id,
          roomCode: room,
          type: isSameEmoji ? 'remove' : 'add',
          fromSelf: true,
      });

      hideSlide();
  };

  return (
      <TouchableOpacity onPress={showSlide} activeOpacity={1}>
          <Animated.View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
              {!isMe && (
                  <LinearGradient colors={senderColors} style={styles.avatarRing}>
                      <View style={styles.avatarInner}>
                          <Text style={styles.avatarEmoji}>{senderEmoji}</Text>
                      </View>
                  </LinearGradient>
              )}

              <View style={[styles.bubbleWrapper, isMe && styles.myBubbleWrapper]}>
                  {isMe ? (
                      <LinearGradient
                          colors={["#9333ea", "#6366f1"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={[styles.bubble, styles.myBubble]}
                      >
                          <Text style={styles.messageText}>{item.text}</Text>
                      </LinearGradient>
                  ) : (
                      <View style={[styles.bubble, styles.otherBubble]}>
                          <Text style={styles.messageText}>{item.text}</Text>
                      </View>
                  )}

                  {Object.keys(reactions).length > 0 && (
                      <View style={styles.reactionsRow}>
                          {Object.entries(reactions)
                              .filter(([_, data]) => data.count > 0)
                              .map(([emoji, data]) => (
                                  <View key={emoji} style={[
                                      styles.reactionBadge,
                                      data.reacted && styles.reactionBadgeActive
                                  ]}>
                                      <Text style={styles.reactionText}>{emoji} {formatNumber(data.count)}</Text>
                                  </View>
                              ))}
                      </View>
                  )}
              </View>

              {isMe && (
                  <LinearGradient colors={["#9333ea", "#ec4899"]} style={styles.avatarRing}>
                      <View style={styles.avatarInner}>
                          <Text style={styles.avatarEmoji}>🎭</Text>
                      </View>
                  </LinearGradient>
              )}
          </Animated.View>

          <Modal transparent visible={showPicker} animationType="none" onRequestClose={hideSlide}>
              <TouchableOpacity style={{ flex: 1 }} onPress={hideSlide} activeOpacity={0.8}>
                  <Animated.View style={[
                      styles.emojiPicker,
                      isMe ? styles.emojiPickerRight : styles.emojiPickerLeft,
                      { transform: [{ translateY: slideAnim }], opacity: opacityAnim }
                  ]}>
                      {emojiOptions.map((emo, index) => (
                          <Pressable
                              key={index}
                              onPress={() => onSelect(index)}
                              style={[
                                  styles.emojiOptionWrapper,
                                  activeEmoji === emo && styles.emojiOptionActive  // ← picker highlight
                              ]}
                          >
                              <Text style={styles.emojiOption}>{emo}</Text>
                          </Pressable>
                      ))}
                  </Animated.View>
              </TouchableOpacity>
          </Modal>
      </TouchableOpacity>
  );
};
export default function Room({ navigation, route }) {
  const { roomCode } = route.params;
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [emojiMap, setEmojiMap] = useState(new Map());
  const [emojiColorMap, setEmojiColorMap] = useState(new Map());
  const [inputFocused, setInputFocused] = useState(false);

  const flatListRef = useRef(null);
  const inputAnim = useRef(new Animated.Value(0)).current;
  const headerPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomCode?.trim()) {
        Alert.alert("Error", "Something went wrong.");
        navigation.goBack();
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/getanonroom/${roomCode.trim().toUpperCase()}`);
        const data = await res.json();

        if (!res.ok) {
          Alert.alert("Not found", "No room with that code exists.");
          navigation.goBack();
          return;
        }

        setRoomName(data.roomName);

    
        const remaining = Math.floor(
          (new Date(data.stoptime).getTime() - Date.now()) / 1000
        );

        if (remaining <= 0) {
          Alert.alert("Room ended", "This room has already expired.");
          navigation.goBack();
          return;
        }

        setTimeLeft(remaining);
      } catch {
        Alert.alert("Error", "Failed to connect to the server.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, []); // BUG FIX: empty deps — run once on mount only

  // Socket setup
  useEffect(() => {
    if (!roomCode) return;
    socket.emit("joinRoom", roomCode);

    const handleNewMessage = (message) => {
      setEmojiMap((prev) => {
        if (!prev.has(message.senderId)) {
          const emoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
          return new Map(prev).set(message.senderId, emoji);
        }
        return prev;
      });
      setEmojiColorMap((prev) => {
        if (!prev.has(message.senderId)) {
          const cols = emojiColors[Math.floor(Math.random() * emojiColors.length)];
          return new Map(prev).set(message.senderId, cols);
        }
        return prev;
      });
      setMessages((prev) => [...prev, message]);
    };

    const handleUserJoined = (userId) => setOnlineUsers((prev) => new Set(prev).add(userId));
    const handleUserLeft = (userId) => setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });

    socket.on("newMessages", handleNewMessage);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);

    return () => {
      socket.off("newMessages", handleNewMessage);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
    };
  }, [roomCode]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      
      if (!loading) {
        deleteRoom();
        navigation.navigate("MainRoom");
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Pulse when low time
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 60) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(headerPulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(headerPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [timeLeft <= 60]);

  // Input focus animation
  useEffect(() => {
    Animated.timing(inputAnim, {
      toValue: inputFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [inputFocused]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isLowTime = timeLeft <= 60;

  const handleSend = () => {
    if (!input.trim()) return;
    socket.emit("sendMessages", {
      roomCode,
      text: input.trim(),
      senderId: myUserId,
    });
    setInput("");
  };

  const deleteRoom = async () => {
 
    if (!roomCode || !roomName) return;
    try {
      await fetch(`${API_BASE_URL}/deleteanonroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, roomName }),
      });
    } catch (err) {
      console.warn("Error deleting room:", err);
    }
  };

  const inputBorderColor = inputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "rgba(147,51,234,0.7)"],
  });



// Then renderMessage becomes simply:
const renderMessage = ({ item }) => (
  <MessageBubble
      item={item}
      myUserId={myUserId}
      socket={socket}
      emojiOptions={["👍", "❤️", "😭", "😢", "🔥","💀","😑","🤬","🎉","💦","🍆","🥱","💅","🙏","🤯"]}
      emojiMap={emojiMap}
      emojiColorMap={emojiColorMap}
      onPickerChange={setPickerOpen}
      room={roomCode}
  />
);
 






  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent.purple} />
          <Text style={styles.loadingText}>Joining room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      
<TouchableWithoutFeedback onPress={pickerOpen ? undefined : Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={["rgba(147,51,234,0.25)", "rgba(99,102,241,0.15)"]}
                style={styles.headerGradient}
              />
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.roomBadge}>
                    <Feather name="hash" size={12} color="#c084fc" />
                    <Text style={styles.roomBadgeText}>ANON</Text>
                  </View>
                  <Text style={styles.roomTitle} numberOfLines={1}>{roomName}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Feather name="users" size={11} color="#a78bfa" />
                      <Text style={styles.metaText}>{onlineUsers.size} online</Text>
                    </View>
                    <View style={[styles.metaPill, isLowTime && styles.metaPillDanger]}>
                      <Animated.View style={{ transform: [{ scale: isLowTime ? headerPulse : 1 }] }}>
                        <Feather name="clock" size={11} color={isLowTime ? "#f87171" : "#a78bfa"} />
                      </Animated.View>
                      <Text style={[styles.metaText, isLowTime && styles.metaTextDanger]}>
                        {formatTime(timeLeft)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.leaveBtn} onPress={() => navigation.goBack()}>
                  <Feather name="log-out" size={18} color="#e879f9" />
                </TouchableOpacity>
              </View>
              <LinearGradient
                colors={["transparent", "#9333ea", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerDivider}
              />
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item._id ?? item.id ?? String(index)}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatRoom}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🔮</Text>
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptyHint}>Be the first to whisper something...</Text>
                </View>
              }
            />

            {/* Input bar */}
            <View style={styles.inputBar}>
              <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Whisper something..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={input}
                  onChangeText={setInput}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit
                />
              </Animated.View>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSend} disabled={!input.trim()}>
                <LinearGradient
                  colors={input.trim() ? ["#9333ea", "#ec4899"] : ["rgba(147,51,234,0.3)", "rgba(236,72,153,0.3)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtn}
                >
                  <Feather name="send" size={18} color="#fff" />
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
  container: { flex: 1, backgroundColor: "#080812" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  blobTop: { position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(147,51,234,0.12)" },
  blobBottom: { position: "absolute", bottom: 60, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(99,102,241,0.09)" },
  header: { overflow: "hidden" },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerLeft: { flex: 1, marginRight: 12 },
  roomBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  roomBadgeText: { color: "#c084fc", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  roomTitle: { color: "#f5f3ff", fontWeight: "700", fontSize: 22, letterSpacing: 0.3, marginBottom: 8 },
  metaRow: { flexDirection: "row", gap: 8 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(167,139,250,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "rgba(167,139,250,0.2)" },
  metaPillDanger: { backgroundColor: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.3)" },
  metaText: { color: "#a78bfa", fontSize: 12, fontWeight: "600" },
  metaTextDanger: { color: "#f87171" },
  leaveBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(232,121,249,0.1)", borderWidth: 1, borderColor: "rgba(232,121,249,0.25)", alignItems: "center", justifyContent: "center" },
  headerDivider: { height: 1, width: "100%" },
  chatRoom: { flexGrow: 1, padding: 16, paddingBottom: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#a78bfa", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptyHint: { color: "rgba(255,255,255,0.3)", fontSize: 14 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14, gap: 8 },
  myMessageRow: { justifyContent: "flex-end", flexDirection: "row-reverse" },
  otherMessageRow: { justifyContent: "flex-start" },
  avatarRing: { width: 36, height: 36, borderRadius: 18, padding: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarInner: { width: "100%", height: "100%", borderRadius: 16, backgroundColor: "#0f0f1e", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 17 },
  bubbleWrapper: { maxWidth: "72%" },
  myBubbleWrapper: { alignItems: "flex-end" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble: { borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(147,51,234,0.25)", borderBottomLeftRadius: 4 },
  messageText: { color: "#f0ecff", fontSize: 15, lineHeight: 21 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "rgba(147,51,234,0.15)", backgroundColor: "rgba(12,10,24,0.97)" },
  inputWrapper: { flex: 1, borderRadius: 20, borderWidth: 1.5, backgroundColor: "rgba(255,255,255,0.05)", minHeight: 44, justifyContent: "center" },
  input: { color: "#fff", fontSize: 15, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, lineHeight: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    maxWidth: '100%',    // stays within bubbleWrapper's 72% constraint
},
reactionBadge: {
  backgroundColor: '#1e1b2e',
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderWidth: 0.5,
  borderColor: '#9333ea',
},
reactionText: {
    fontSize: 12,
    color: '#e2e8f0',
},

emojiPicker: {
  flexDirection: 'row',
  flexWrap: 'wrap',          // ← wraps to new line
  backgroundColor: '#1e1b2e',
  borderRadius: 24,
  paddingHorizontal: 16,
  paddingVertical: 10,
  gap: 8,
  position: 'absolute',
  bottom: 120,
  borderWidth: 0.5,
  borderColor: '#9333ea',
  maxWidth: 220,             // ← forces wrap at ~3 per row
},
emojiPickerLeft: {
  left: 48,
},
emojiPickerRight: {
  right: 48,
},
emojiOption: {
    fontSize: 22,
},
reactionBadgeActive: {
  backgroundColor: 'rgba(147,51,234,0.25)',
  borderColor: '#9333ea',
  borderWidth: 1,
},
emojiOptionWrapper: {
  borderRadius: 20,
  padding: 4,
},
emojiOptionActive: {
  backgroundColor: 'rgba(147, 51, 234, 0.35)',
  borderRadius: 20,
},
});


