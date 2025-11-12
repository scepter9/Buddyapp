import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

import BottomNavigator from "../BottomNavigator";

const API_BASE_URL = "http://192.168.0.136:3000";

const generateRandomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function MainRoom({ navigation }) {
  const [roomName, setRoomName] = useState("");
  const [duration, setDuration] = useState("");
  const [tags, setTags] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const hours=Array.from({length:24},(_,i)=>(i<10 ? `0${i}` :`${i}`));
  const minutes=Array.from({length:60},(_,i)=>(i<10 ?`0${i}` :`${i}`))

  const getAnon = async () => {
    try {
      const responseval = await fetch(`${API_BASE_URL}/getanonroom/${roomCode}`);
      const data = await responseval.json();

      if (responseval.ok) {
        navigation.navigate("Room", {
          Roomname: data.roomName,
          RoomHour: data.hour,
          RoomMinute: data.minute,
          roomCode:data.roomRandomCode,
        });
      } else {
        Alert.alert("Room not found");
      }
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Failed to connect to the server.");
    }
  };

  const createAnonroom = async () => {
    const roomRandomCode = generateRandomCode();
    setRoomCode(roomRandomCode);

    try {
      const response = await fetch(`${API_BASE_URL}/newAnonroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomName, tags, selectedHour,selectedMinute, roomRandomCode }),
      });

      if (response.ok) {
        setOpenModal(true);
      } else {
        console.error("Failed to create room:", response.status, response.statusText);
        Alert.alert("Failed to create room. Please try again.");
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      Alert.alert("Failed to connect to the server.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.headerText}>⚡ Anonymous Rooms</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🚀 Create a Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Room Name"
                  placeholderTextColor="#aaa"
                  value={roomName}
                  onChangeText={setRoomName}
                />
           
           <Text style={styles.cardTitle}>Enter duration</Text>
            <View style={styles.pickerRow}>
            <Picker
                    selectedValue={selectedHour}
                    onValueChange={(itemValue) => setSelectedHour(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Hour" value={null} />
                    {hours.map((hour) => (
                      <Picker.Item key={hour} label={hour} value={hour} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedMinute}
                    onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Min" value={null} />
                    {minutes.map((minute) => (
                      <Picker.Item key={minute} label={minute} value={minute} />
                    ))}
                  </Picker>
            </View>
                <TextInput
                  style={styles.input}
                  placeholder="Tags (music, chat, study...)"
                  placeholderTextColor="#aaa"
                  value={tags}
                  onChangeText={setTags}
                />
                <TouchableOpacity onPress={createAnonroom} activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#9333ea", "#ec4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Create Room</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔑 Join a Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Room Code"
                  placeholderTextColor="#aaa"
                  value={roomCode}
                  onChangeText={setRoomCode}
                />
                <TouchableOpacity activeOpacity={0.8} onPress={getAnon}>
                  <LinearGradient
                    colors={["#9333ea", "#ec4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Join</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Modal
                visible={openModal}
                transparent
                animationType="slide"
                onRequestClose={() => setOpenModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalBox}>
                    <Text style={styles.modalEmoji}>🎉</Text>
                    <Text style={styles.modalTitle}>Room Created!</Text>
                    <Text style={styles.modalText}>
                      Share this code with your friends to join:
                    </Text>
                    <Text style={styles.modalCode}>{roomCode}</Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setOpenModal(false)}
                    >
                      <Text style={styles.modalButtonText}>Got it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <BottomNavigator/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f17",
  },
  field: { flex: 1, marginBottom: 14 },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  picker: {
    flex: 1,
    color: "#fff",
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  scroll: {
    padding: 20,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#9333ea",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    color: "#fff",
    fontSize: 15,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#ec4899",
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#1f1f2e",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    width: "80%",
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    color: "#ccc",
    marginBottom: 16,
  },
  modalCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ec4899",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalButton: {
    backgroundColor: "#9333ea",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
});
