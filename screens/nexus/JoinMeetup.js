// Add useEffect to the import statement
import React,{useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet , FlatList,SafeAreaView} from 'react-native';
import { Feather } from "@expo/vector-icons";

// Define the API_BASE_URL constant
const API_BASE_URL = 'http://172.20.10.4:3000'; // **Replace with your actual API URL**

export default function JoinMeetup({ navigation }) {
  const [meetups,setMeetups]=useState([]); // Initialize state with an empty array for FlatList

  useEffect(() => {
    const getMeetups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Createmeet`);
        const data = await response.json();
        setMeetups(data);
      } catch (err) {
        console.error("Error fetching meetups", err);
      }
    };
    getMeetups();
  }, []);
 
  // Move the return statement INSIDE the component function
  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoText}>NX</Text></View>
          <Text style={styles.brandText}>NEXUS • Discover</Text>
        </View>
      </View>

      {/* Tabs */}
{/*       <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Group Hangouts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>1-on-1 Meetups</Text>
        </TouchableOpacity>
      </View> */}

      {/* FlatList for meetups */}
      <FlatList
        data={meetups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMeetup}
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>Filters — Time • Vibe • Location</Text>
            <View style={styles.filters}>
              <View style={styles.chip}><Text>⏰ <Text style={styles.muted}>Time:</Text> Tonight</Text></View>
              <View style={styles.chip}><Text>🎧 <Text style={styles.muted}>Vibe:</Text> Chill</Text></View>
              <View style={styles.chip}><Text>📍 <Text style={styles.muted}>Location:</Text> Arena, Uniport</Text></View>
              <View style={styles.chip}><Text>👥 <Text style={styles.muted}>Size:</Text> 3–6</Text></View>
            </View>
          </>
        }
        ListFooterComponent={
          <Text style={styles.footer}>© NEXUS — Discover & meet great people near you.</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
</SafeAreaView>
  );
}

const renderMeetup = ({ item }) => (
  <View style={styles.card}>
    <ImageBackground
      style={styles.banner}
      source={{ uri: 'https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?q=80&w=1400&auto=format&fit=crop' }}
    />
    <View style={styles.cardContent}>
      <View style={styles.titleRow}>
        <Text style={styles.cardTitle}>☕ {item.title}</Text>
        <Text style={[styles.badge, styles.badgeGood]}>Open Spots</Text>
      </View>
      <Text style={styles.meta}>
        {item.date} • {item.time} • {item.location} • Vibe: {item.vibe}
      </Text>
      <View style={styles.badges}>
        <Text style={styles.badge}>{item.size} going</Text>
        <Text style={styles.badge}>{item.vibe}</Text>
        <Text style={[styles.badge, styles.badgeWarn]}>New host</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.primaryBtn]}>
          <Text style={styles.btnPrimaryText}>Join Group Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.ghostBtn]}>
          <Text style={styles.btnText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);
    

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f9fafc",
      },
  container: { flex: 1, backgroundColor: '#0f1020' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(10,12,30,0.45)' },
  backButton: { marginRight: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#6ae0ff', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontWeight: '800', color: '#0a0f1a' },
  brandText: { fontWeight: '700', color: '#eaf2ff' },

  // Tabs are now below header
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: 6, marginHorizontal: 14, marginTop: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  activeTab: { backgroundColor: '#6ae0ff' },
  tabText: { color: '#a9b6d3' },
  activeTabText: { color: '#0b1020', fontWeight: '600' },

  content: { padding: 16 },
  kicker: { fontSize: 12, color: '#a9b6d3', marginBottom: 10 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: 10, marginRight: 8 },
  muted: { color: '#a9b6d3' },

  grid: { gap: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  banner: { height: 140 },
  cardContent: { padding: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  meta: { fontSize: 13, color: '#a9b6d3', marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  badge: { fontSize: 12, padding: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', marginRight: 6 },
  badgeGood: { backgroundColor: 'rgba(73,230,138,0.13)', color: '#caffdf' },
  badgeWarn: { backgroundColor: 'rgba(255,209,102,0.12)', color: '#fff1cc' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#6ae0ff' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnPrimaryText: { color: '#0b1020', fontWeight: '700' },
  ghostBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },

  footer: { textAlign: 'center', color: '#a9b6d3', fontSize: 13, marginTop: 40 },
});