import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const API_BASE_URL = "http://172.20.10.4:3000";

export default function CreateMeetup({ navigation }) {
  const [title, setTitle] = useState("");
  const [vibe, setVibe] = useState("Chill");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [latestMeetup, setLatestMeetup] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [selectedSecond, setSelectedSecond] = useState(null);
  const [message, setMessage] = useState(null);
  const [meetupcodeval,setMeetcodeval]=useState('')


  const generateCode=()=>{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let resultval=''
    for(i=0;i<=6; i++){
      resultval+=characters.charAt(Math.floor(Math.random()*characters.length()))
    }
    return resultval;
  }
  const meetupcodesetup=()=>{
    const roomvalue=generateCode()
    setMeetcodeval(roomvalue)
  }
  // Lists for the date pickers
  const months = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString());

  // Lists for the time pickers
  const hours = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
  const minutes = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
   const seconds = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
  

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return [];
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  };

  const days = getDaysInMonth(selectedMonth, selectedYear);

  useEffect(() => {
    // This effect ensures the 'date' state is always up-to-date for the API call
    if (selectedYear && selectedMonth && selectedDay) {
      const formattedDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      setDate(formattedDate);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    // This effect formats the time string for the API call
    if (selectedHour !== null && selectedMinute !== null && selectedSecond !== null) {
      const formattedTime = `${selectedHour}:${selectedMinute}:${selectedSecond}`;
      setTime(formattedTime);
    }
  }, [selectedHour, selectedMinute, selectedSecond]);


  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setSelectedDay(null);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedDay(null);
  };

  const handleCreate = async () => {
    setMessage(null); // Clear any previous messages
    if (!title || !selectedYear || !selectedMonth || !selectedDay|| !selectedHour || !selectedMinute || !location || !vibe || !size || !description) {
      setMessage("Please fill out all fields.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/Createmeet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          date,
          time,
          vibe,
          location,
          size,
          description,
          selectedYear,
          selectedMonth,
          selectedDay,
          selectedHour,
          selectedMinute,
meetupcodeval,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Group Created 🎉");
        setPreviewEnabled(true);
      } else {
        setMessage("Something went wrong 😢");
      }
    } catch (err) {
      console.error("An error occurred", err);
      setMessage("An error occurred. Please check your connection.");
    }
  };

  const handlePreview = async () => {
    setShowPreview(false); // Hide existing preview while fetching new one
    try {
      const response = await fetch(`${API_BASE_URL}/Createmeet`);
      const data = await response.json();
      setLatestMeetup(data[0] || null);
      setShowPreview(true);
    } catch (err) {
      console.error("Error fetching meetups", err);
      setMessage("Failed to fetch preview.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80} // tweak depending on header height
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text style={styles.logoText}>NX</Text>
            </View>
            <Text style={styles.brand}>Create Meetup</Text>
          </View>

          {/* Form */}
          <View style={styles.panel}>
            <Text style={styles.h2}>Host a Hangout ✨</Text>
            <Text style={styles.kicker}>Location • Time • Vibe</Text>

            {/* Title + Vibe */}
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  placeholder="e.g., Evening Coffee & Code ☕"
                  placeholderTextColor="#777"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Vibe</Text>
                <TextInput
                  placeholder="Chill / Energetic"
                  placeholderTextColor="#777"
                  value={vibe}
                  onChangeText={setVibe}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Date */}
            <View style={styles.field}>
                <Text style={styles.label}>Choose a date</Text>
                <View style={styles.pickerRow}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={handleYearChange}
                    style={styles.picker}
                  >
                    <Picker.Item label="Year" value={null} />
                    {years.map((year) => (
                      <Picker.Item key={year} label={year} value={year} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={handleMonthChange}
                    style={styles.picker}
                  >
                    <Picker.Item label="Month" value={null} />
                    {months.map((month) => (
                      <Picker.Item key={month.value} label={month.label} value={month.value} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={selectedDay}
                    onValueChange={(itemValue) => setSelectedDay(itemValue)}
                    style={styles.picker}
                    enabled={!!selectedMonth && !!selectedYear}
                  >
                    <Picker.Item label="Day" value={null} />
                    {days.map((day) => (
                      <Picker.Item key={day} label={day} value={day} />
                    ))}
                  </Picker>
                </View>
              </View>

            {/* Time */}
            <View style={styles.field}>
                <Text style={styles.label}>Choose a time</Text>
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
                  <Picker
                    selectedValue={selectedSecond}
                    onValueChange={(itemValue) => setSelectedSecond(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Sec" value={null} />
                    {seconds.map((second) => (
                      <Picker.Item key={second} label={second} value={second} />
                    ))}
                  </Picker>
                </View>
              </View>

            {/* Location + Size */}
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  placeholder="Type a place…"
                  placeholderTextColor="#777"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Group Size</Text>
                <TextInput
                  placeholder="3–6 / 6–10"
                  placeholderTextColor="#777"
                  value={size}
                  onChangeText={setSize}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Tell people what to expect…"
                placeholderTextColor="#777"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { height: 100 }]}
                multiline
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
                <Text style={styles.btnTextPrimary}>Create Group 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnGhost,
                  !previewEnabled && { opacity: 0.5 },
                ]}
                onPress={()=>{handlePreview(); 
                  meetupcodesetup();
                }}
                disabled={!previewEnabled}
              >
                <Text style={styles.btnTextGhost}>Preview 👀</Text>
              </TouchableOpacity>
            </View>

            {/* Message Display */}
            {message && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}
          </View>

          {/* Live Preview */}
          {showPreview && latestMeetup && (
            <View style={styles.panel}>
              <Text style={styles.h2}>Live Preview 🔮</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>☕ {latestMeetup.title}</Text>
                <Text style={styles.small}>
                  {latestMeetup.date} • {latestMeetup.time} •{" "}
                  {latestMeetup.location} • Vibe: {latestMeetup.vibe}
                </Text>
                <Text style={styles.description}>{latestMeetup.description}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnPrimary}>
                    <Text style={styles.btnTextPrimary}>Publish ✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnGhost}>
                    <Text style={styles.btnTextGhost}>Preview as Guest</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0f1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    marginHorizontal: 12,
  },
  backButton: {
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 8,
    borderRadius: 30,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#6ae0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: { fontWeight: "800", color: "#0a0f1a" },
  brand: { fontWeight: "800", fontSize: 18, color: "#fff" },

  panel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    margin: 14,
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  h2: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#fff" },
  kicker: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1, marginBottom: 14 },
  label: { fontSize: 13, color: "#bbb", marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btnPrimary: {
    backgroundColor: "#6ae0ff",
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  btnTextPrimary: { color: "#0a0f1a", fontWeight: "700" },
  btnTextGhost: { color: "#eee", fontWeight: "700" },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  small: { fontSize: 13, color: "#aaa", marginTop: 4 },
  description: { marginVertical: 10, color: "#ddd", fontSize: 14 },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  picker: {
    flex: 1,
    color: "#fff",
  },
  messageContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 0, 0.1)",
    borderRadius: 8,
  },
  messageText: {
    color: "#fff",
    textAlign: "center",
  },
});
