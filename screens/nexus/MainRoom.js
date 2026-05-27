import React, { useState, useRef, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import BottomNavigator from "../BottomNavigator";
// BUG FIX: correct destructuring
import { AuthorContext } from "../AuthorContext";
import socket from "../Socket";
import { colors, radius, spacing } from "../Theme";

const API_BASE_URL = "http://192.168.0.136:3000";

const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 7 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

function TimeSpinner({ label, value, setValue, max }) {
  const inc = () => setValue((v) => Math.min(v + 1, max));
  const dec = () => setValue((v) => Math.max(v - 1, 0));
  return (
    <View style={ts.wrapper}>
      <Text style={ts.label}>{label}</Text>
      <TouchableOpacity style={ts.btn} onPress={inc}>
        <Feather name="chevron-up" size={18} color="#c084fc" />
      </TouchableOpacity>
      <View style={ts.valueBox}>
        <Text style={ts.value}>{String(value).padStart(2, "0")}</Text>
      </View>
      <TouchableOpacity style={ts.btn} onPress={dec}>
        <Feather name="chevron-down" size={18} color="#c084fc" />
      </TouchableOpacity>
    </View>
  );
}

const ts = StyleSheet.create({
  wrapper: { alignItems: "center", flex: 1 },
  label: { color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontWeight: "600" },
  btn: { padding: 8 },
  valueBox: {
    backgroundColor: "rgba(147,51,234,0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.35)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: "center",
  },
  value: { color: "#f0ecff", fontSize: 28, fontWeight: "700", fontVariant: ["tabular-nums"] },
});

export default function MainRoom({ navigation }) {
  const [roomName, setRoomName] = useState("");
  const [tags, setTags] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [starthours, setStartHours] = useState(0);
  const [startminutes, setStartMinutes] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const { user } = useContext(AuthorContext);
  const usersid = user?.id;

  const [activeTab, setActiveTab] = useState("create");
  const tabAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab) => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === "create" ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "52%"],
  });

  // Notify user — subscribe them to this room for cron notifications
  const subscribeToRoom = (code) => {
    if (!usersid || !code) return;
    socket.emit('Addasmember', { usersid, generatedCode: code });
  };

  const createAnonroom = async () => {
    if (!roomName.trim()) {
      Alert.alert("Missing info", "Please enter a room name.");
      return;
    }
    if (hours === 0 && minutes === 0) {
      Alert.alert("Missing info", "Please set a duration greater than 0.");
      return;
    }
 
    // BUG FIX: generate code before using it
    const roomRandomCode = generateRandomCode();

    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/newAnonroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roomName: roomName.trim(),
          tags: tags.trim(),
          selectedHour: String(hours),
          selectedMinute: String(minutes),
          starthours,
          startminutes,
          roomRandomCode,
        }),
      });

      if (response.ok) {
        setGeneratedCode(roomRandomCode);
        setOpenModal(true);
      } else {
        Alert.alert("Error", "Failed to create room. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setCreating(false);
    }
  };

  const getAnon = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Missing info", "Please enter a room code.");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`${API_BASE_URL}/getanonroom/${joinCode.trim().toUpperCase()}`);
      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Not found", "No room with that code exists.");
        return;
      }

      const now = new Date();
      const starting = new Date(data.starttime);
      const ending = new Date(data.stoptime);

      if (now >= starting && now < ending) {
        // Room is active — enter directly
        navigation.navigate("Room", { roomCode: data.roomRandomCode });
      } else if (now < starting) {
       
        Alert.alert(
          '😴 Room Not Started Yet',
          'This room hasn\'t started. We\'ll remind you 30 minutes before. Want to be notified?',
          [
            { text: 'Cancel', style: 'cancel' },
           
            { text: 'Notify me', onPress: () => subscribeToRoom(data.roomRandomCode) },
          ]
        );
      } else {
        // Room has ended
        Alert.alert("Room ended", "This room has already expired.");
      }
    } catch {
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setJoining(false);
    }
  };

  const handleEnterRoom = () => {
    const now = new Date();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + (starthours || 0));
    startTime.setMinutes(startTime.getMinutes() + (startminutes || 0));

    setOpenModal(false);

    if (now >= startTime) {
      // Start time is now or past — enter room
      navigation.navigate("Room", { roomCode: generatedCode });
    } else {
      // Room starts in the future — subscribe for notification
      Alert.alert(
        '😴 Room Not Started Yet',
        'Your room hasn\'t started. We\'ll remind you 30 minutes before. Want to be notified?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Notify me', onPress: () => subscribeToRoom(generatedCode) },
        ]
      );
    }
  };

  // Whether "starts immediately" (starthours and startminutes both 0)
  const startsNow = starthours === 0 && startminutes === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      {/* Room created modal */}
      <Modal
        visible={openModal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <LinearGradient
              colors={["rgba(147,51,234,0.3)", "rgba(99,102,241,0.1)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.modalIconRing}>
              <Text style={{ fontSize: 30 }}>🎉</Text>
            </View>
            <Text style={styles.modalTitle}>Room Created!</Text>
            <Text style={styles.modalSub}>Share this code with your friends</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{generatedCode}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setOpenModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEnterRoom} activeOpacity={0.85} style={{ flex: 1 }}>
                <LinearGradient
                  colors={["#9333ea", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalPrimaryBtn}
                >
                  <Text style={styles.modalPrimaryText}>
                    {startsNow ? "Enter Room" : "Got it"}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            <View style={styles.header}>
              <View style={styles.headerIconRow}>
                <LinearGradient colors={["#9333ea", "#6366f1"]} style={styles.headerIcon}>
                  <Feather name="shield-off" size={18} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={styles.headerTitle}>Anonymous Rooms</Text>
                  <Text style={styles.headerSub}>No identity. Just conversation.</Text>
                </View>
              </View>
            </View>

            <View style={styles.tabContainer}>
              <View style={styles.tabBar}>
                <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
                <TouchableOpacity style={styles.tab} onPress={() => switchTab("create")}>
                  <Feather name="plus-circle" size={14} color={activeTab === "create" ? "#f0ecff" : "rgba(255,255,255,0.35)"} />
                  <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab} onPress={() => switchTab("join")}>
                  <Feather name="log-in" size={14} color={activeTab === "join" ? "#f0ecff" : "rgba(255,255,255,0.35)"} />
                  <Text style={[styles.tabText, activeTab === "join" && styles.tabTextActive]}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === "create" ? (
                <View style={styles.card}>
                  <Text style={styles.fieldLabel}>ROOM NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="hash" size={16} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Give your room a name..."
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={roomName}
                      onChangeText={setRoomName}
                      maxLength={40}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>TAGS</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="tag" size={16} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="music · study · chill · gaming"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={tags}
                      onChangeText={setTags}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>DURATION</Text>
                  <View style={styles.durationCard}>
                    <TimeSpinner label="HRS" value={hours} setValue={setHours} max={23} />
                    <View style={styles.durationSep}>
                      <Text style={styles.durationColon}>:</Text>
                    </View>
                    <TimeSpinner label="MIN" value={minutes} setValue={setMinutes} max={59} />
                  </View>
                  {hours === 0 && minutes === 0 && (
                    <Text style={styles.durationWarning}>Set a duration above 0</Text>
                  )}

                  {/* BUG FIX: "Starts in" — 0h 0m means starts now, no warning needed */}
                  <Text style={styles.fieldLabel}>
                    STARTS IN{" "}
                    {startsNow && <Text style={styles.startsNowBadge}>· Now</Text>}
                  </Text>
                  <View style={styles.durationCard}>
                    <TimeSpinner label="HRS" value={starthours} setValue={setStartHours} max={23} />
                    <View style={styles.durationSep}>
                      <Text style={styles.durationColon}>:</Text>
                    </View>
                    <TimeSpinner label="MIN" value={startminutes} setValue={setStartMinutes} max={59} />
                  </View>
                  {startsNow && (
                    <Text style={styles.startsNowText}>Room opens immediately when created</Text>
                  )}

                  <TouchableOpacity
                    onPress={createAnonroom}
                    activeOpacity={0.85}
                    disabled={creating}
                    style={{ marginTop: 8 }}
                  >
                    <LinearGradient
                      colors={["#9333ea", "#ec4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      {creating ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Feather name="zap" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Create Room</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.fieldLabel}>ROOM CODE</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="key" size={16} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.codeInput]}
                      placeholder="Enter 7-character code"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={joinCode}
                      onChangeText={(t) => setJoinCode(t.toUpperCase())}
                      maxLength={7}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={styles.joinHint}>
                    Ask the room creator to share their code with you.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={getAnon}
                    disabled={joining}
                    style={{ marginTop: 4 }}
                  >
                    <LinearGradient
                      colors={["#6366f1", "#9333ea"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      {joining ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Feather name="arrow-right-circle" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Join Room</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.infoStrip}>
                <Feather name="eye-off" size={13} color="#a78bfa" />
                <Text style={styles.infoText}>
                  All rooms are anonymous. No usernames, no history.
                </Text>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080812" },
  blob1: { position: "absolute", top: -100, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(147,51,234,0.1)" },
  blob2: { position: "absolute", bottom: 100, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(99,102,241,0.07)" },
  header: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  headerIconRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#f0ecff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 },
  tabContainer: { paddingHorizontal: 22, marginBottom: 16 },
  tabBar: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4, position: "relative", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", height: 46 },
  tabIndicator: { position: "absolute", top: 4, bottom: 4, width: "46%", backgroundColor: "rgba(147,51,234,0.5)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(147,51,234,0.4)" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 1 },
  tabText: { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#f0ecff" },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  fieldLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  startsNowBadge: { color: "#34d399", letterSpacing: 0 },
  startsNowText: { color: "#34d399", fontSize: 12, marginBottom: 8, marginTop: 2 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 18, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#f0ecff", fontSize: 15, paddingVertical: 13 },
  codeInput: { letterSpacing: 4, fontWeight: "700", fontSize: 16 },
  durationCard: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(147,51,234,0.2)", paddingVertical: 16, paddingHorizontal: 12, marginBottom: 8, alignItems: "center" },
  durationSep: { alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  durationColon: { color: "rgba(255,255,255,0.3)", fontSize: 28, fontWeight: "700" },
  durationWarning: { color: "#f87171", fontSize: 12, marginBottom: 14, marginTop: 2 },
  button: { borderRadius: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  joinHint: { color: "rgba(255,255,255,0.3)", fontSize: 13, lineHeight: 18, marginBottom: 14, marginTop: -6 },
  infoStrip: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingHorizontal: 4 },
  infoText: { color: "rgba(255,255,255,0.3)", fontSize: 12, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  modalBox: { width: "100%", borderRadius: 28, padding: 30, alignItems: "center", backgroundColor: "#16102a", borderWidth: 1, borderColor: "rgba(147,51,234,0.3)", overflow: "hidden" },
  modalIconRing: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(147,51,234,0.2)", borderWidth: 1.5, borderColor: "rgba(147,51,234,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  modalTitle: { color: "#f0ecff", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  modalSub: { color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 22, textAlign: "center" },
  codeBox: { backgroundColor: "rgba(147,51,234,0.15)", borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(147,51,234,0.4)", paddingHorizontal: 28, paddingVertical: 14, marginBottom: 24 },
  codeText: { color: "#e879f9", fontSize: 26, fontWeight: "800", letterSpacing: 6 },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalSecondaryBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  modalSecondaryText: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 15 },
  modalPrimaryBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});