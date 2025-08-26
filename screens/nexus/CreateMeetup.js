import React, { useState } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
const API_BASE_URL = 'http://172.20.10.4:3000';


export default function CreateMeetup({ navigation }) {
  const [title, setTitle] = useState("");
  const [vibe, setVibe] = useState("Chill");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState(0);
  const [description, setDescription] = useState("");
  const [previewEnabled, setPreviewEnabled] = useState(false); // controls Preview button enabled state
  const [showPreview, setShowPreview] = useState(false); // controls conditional rendering
  const [latestMeetup, setLatestMeetup] = useState(null); // fetched data from server

  const handleCreate= async()=>{
    try{
      const response =await fetch(`${API_BASE_URL}/Createmeet`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({title,date,time,vibe,location,size,description}),
      })
      const data=await response.json();
      console.log(data);
      if (response.ok) {
        alert("Group Created");
        setPreviewEnabled(true); // allow preview after success
      }else{
        alert('Something went wrong')
      }
    }catch(err){
console.error('An error occured')
    }
  } 
  const handlePreview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Createmeet`);
      const data = await response.json();

      // Assume the latest meetup is the first in the list
      setLatestMeetup(data[0] || null);
      setShowPreview(true);
    } catch (err) {
      console.error("Error fetching meetups", err);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with back button + logo + title */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logo}><Text style={styles.logoText}>NX</Text></View>
          <Text style={styles.brand}>Create Meetup</Text>
        </View>

        {/* Segment control now BELOW header */}
        {/* <View style={styles.segment}>
          <TouchableOpacity style={[styles.segmentBtn, styles.active]}>
            <Text style={styles.segmentTextActive}>Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.segmentBtn}>
            <Text style={styles.segmentText}>1-on-1</Text>
          </TouchableOpacity>
        </View> */}

        {/* Form */}
        <View style={styles.panel}>
          <Text style={styles.h2}>Host a Hangout</Text>
          <Text style={styles.kicker}>Set Location / Time / Vibe</Text>

          {/* Title + Vibe */}
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                placeholder="e.g., Evening Coffee & Code ☕"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Vibe</Text>
              <TextInput
                placeholder="Chill / Energetic"
                placeholderTextColor="#888"
                value={vibe}
                onChangeText={setVibe}
                style={styles.input}
              />
            </View>
          </View>

          {/* Date + Time */}
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
                value={date}
                onChangeText={setDate}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Time</Text>
              <TextInput
                placeholder="HH:MM"
                placeholderTextColor="#888"
                value={time}
                onChangeText={setTime}
                style={styles.input}
              />
            </View>
          </View>

          {/* Location + Size */}
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                placeholder="Type a place…"
                placeholderTextColor="#888"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Group Size</Text>
              <TextInput
                placeholder="3–6 / 6–10"
                placeholderTextColor="#888"
                value={size}
                onChangeText={setSize}
                style={styles.input}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Tell people what to expect…"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 100 }]}
              multiline
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
              <Text style={styles.btnTextPrimary}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btnGhost,
                !previewEnabled && { opacity: 0.5 }, // dim when disabled
              ]}
              onPress={handlePreview}
              disabled={!previewEnabled} // disable until create success
            >
              <Text style={styles.btnTextGhost}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Preview */}
        {showPreview && latestMeetup && (
        <View style={styles.panel}>
          <Text style={styles.h2}>Live Preview</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>☕ {latestMeetup.title}</Text>
            <Text style={styles.small}>
                {latestMeetup.date} • {latestMeetup.time} • {latestMeetup.location} • Vibe:{" "}
                {latestMeetup.vibe}
              </Text>
            <Text style={{ marginVertical: 10, color: "#ddd" }}>
            {latestMeetup.description}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnTextPrimary}>Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <Text style={styles.btnTextGhost}>Preview as Guest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" }, // dark background
  header: { flexDirection: "row", alignItems: "center", padding: 16, marginTop: 20 },
  backButton: {
    marginRight: 12,
    backgroundColor: "#222",
    padding: 8,
    borderRadius: 30,
  },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#6ae0ff', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontWeight: '800', color: '#0a0f1a' },
  brand: { fontWeight: "800", fontSize: 16, color: "#f5f5f5", marginLeft: 10 },

  // Segment now standalone under header
  segment: { flexDirection: "row", backgroundColor: "#222", borderRadius: 30, marginHorizontal: 16, marginBottom: 16 },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 30 },
  segmentText: { color: "#aaa", fontWeight: "700" },
  active: { backgroundColor: "#3a87ff" },
  segmentTextActive: { color: "white", fontWeight: "700" },

  panel: { backgroundColor: "#1c1c1c", margin: 12, padding: 16, borderRadius: 16 },
  h2: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#fff" },
  kicker: { fontSize: 12, color: "#888", marginBottom: 12, textTransform: "uppercase" },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1, marginBottom: 12 },
  label: { fontSize: 13, color: "#aaa" },
  input: { backgroundColor: "#2a2a2a", color: "#fff", borderRadius: 12, padding: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 14 },
  btnPrimary: { backgroundColor: "#3a87ff", padding: 12, borderRadius: 12, flex: 1, alignItems: "center" },
  btnGhost: { backgroundColor: "#2a2a2a", padding: 12, borderRadius: 12, flex: 1, alignItems: "center" },
  btnTextPrimary: { color: "white", fontWeight: "700" },
  btnTextGhost: { color: "#ddd", fontWeight: "700" },
  card: { backgroundColor: "#222", padding: 16, borderRadius: 16, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  small: { fontSize: 12, color: "#aaa", marginTop: 4 },
});
