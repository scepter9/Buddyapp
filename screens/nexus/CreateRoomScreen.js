import React, { useState, useContext, createContext, Children } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Picker } from "@react-native-picker/picker";
import { AuthorContext } from "../AuthorContext";
const Senduser=createContext(null);
const API_BASE_URL = "http://192.168.0.136:3000";

export default function CreateRoomScreen({ navigation }) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;

  const [roomname, setroomname] = useState("");
  const [description, setdescription] = useState("");
  const [selectmode, setSelectmode] = useState("public");
  const [selecttype, setSelecttype] = useState("Arts");
  const [opentext, setopentext] = useState(false);
  const [openmodal, setopenmodal] = useState(false);
  const [roompasskey, setroompasskey] = useState("");
  

  const generateroomkeyforprivate = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let results = "";
    for (let i = 0; i < 6; i++) {
      results += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return results;
  };

  const submitRoom = async () => {
    if (!roomname || !description) {
      Alert.alert("Fill in all the spaces");
      return;
    }
  
    const key = selectmode === "private" ? generateroomkeyforprivate() : "";
    setroompasskey(key);
  
    if (selectmode === "private") {
      setopenmodal(true); // show modal only for private rooms
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/createinterestroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomname,
          description,
          selectmode,
          selecttype,
          roompasskey: key,
          myUserId,
        }),
      });
  
      if (!response.ok) {
        console.log("Something went wrong");
      } else {
        console.log("Room created successfully");
      }
    } catch (err) {
      console.log("An error occurred", err);
    }
  
    setdescription("");
    setroomname(""); 
  };
  

  return (
    <LinearGradient colors={["#030b18", "#08142c", "#0f1a40"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1, width: "100%" }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create Your Room 🌌</Text>

          {/* Modal */}
          <Modal
  visible={openmodal}
  transparent
  animationType="slide"
  onRequestClose={() => setopenmodal(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>⚠️ Important Security Notice</Text>

      <Text style={styles.modalText}>
        Your room passkey is:{" "}
        <Text style={styles.modalKey}>{roompasskey || "N/A"}</Text>
      </Text>

      <Text style={styles.warningText}>
        Please copy and store this key safely. It is the **only way** to access
        or manage your private room. If you lose this key, your access to the
        room will be permanently lost, and **it cannot be recovered**.
      </Text>

      <TouchableOpacity
        style={styles.modalBtn}
        onPress={() => setopenmodal(false)}
      >
        <Text style={styles.modalBtnText}>I Understand</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


          {/* Form */}
          <BlurView intensity={80} tint="dark" style={styles.form}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goback}>
              <Text style={styles.gobackText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Room Name</Text>
            <TextInput
              placeholder="e.g. Midnight Coders"
              placeholderTextColor="#8eaecf"
              style={styles.input}
              value={roomname}
              onChangeText={setroomname}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Describe your vibe..."
              placeholderTextColor="#8eaecf"
              style={[styles.input, { height: 100, textAlignVertical: "top" }]}
              multiline
              value={description}
              onChangeText={setdescription}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={selectmode} onValueChange={setSelectmode} style={styles.picker}>
                  <Picker.Item label="Public" value="public" />
                  <Picker.Item label="Private" value="private" />
                </Picker>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={selecttype} onValueChange={setSelecttype} style={styles.picker}>
                  <Picker.Item label="Arts" value="Arts" />
                  <Picker.Item label="Sport" value="Sport" />
                  <Picker.Item label="Coding" value="Coding" />
                  <Picker.Item label="Science" value="Science" />
                  <Picker.Item label="Fun" value="Fun" />
                  <Picker.Item label="Innovation" value="Innovation" />
                  <Picker.Item label="Finance" value="Finance" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submitRoom}>
              <LinearGradient
                colors={["#00d9ff", "#8a2be2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.submitText}>🚀 Launch Room</Text>
              </LinearGradient>
            </TouchableOpacity>

            {opentext && <Text style={styles.successText}>✨ Your room has been created successfully!</Text>
           

            }
          </BlurView>
        </ScrollView>
      </SafeAreaView>
     
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  scrollContent: { alignItems: "center", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#c3e8ff",
    marginBottom: 25,
  },
  form: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.2)",
  },
  goback: { marginBottom: 18, padding: 10, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10 },
  gobackText: { color: "#00d9ff" },
  label: { color: "#8fe3ff", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "rgba(10, 15, 30, 0.6)",
    color: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.25)",
  },
  fieldContainer: { marginBottom: 18 },
  pickerWrapper: {
    backgroundColor: "rgba(15, 20, 40, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.25)",
  },
  picker: { color: "#c7f5ff", fontSize: 15 },
  submitBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  gradientBtn: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successText: { color: "#00d9ff", textAlign: "center", marginTop: 14 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    width: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#d32f2f",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  modalKey: {
    fontWeight: "bold",
    color: "#1e88e5",
    fontSize: 17,
  },
  warningText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ffcc80",
    marginVertical: 15,
  },
  modalBtn: {
    backgroundColor: "#1e88e5",
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },

});
