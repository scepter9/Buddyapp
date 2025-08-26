import React, { useState, useEffect ,  useContext} from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from "react-native";
import { AuthorContext } from '../AuthorContext';

 
import { Feather } from "@expo/vector-icons";

// ⚠️ Replace with your actual API URL
const API_BASE_URL = 'http://172.20.10.4:3000';

export default function Match({ navigation }) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  // Pass the user ID to this screen via navigation params

  
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/matches/${myUserId}`);
        const data = await response.json();
        setBuddies(data);
      } catch (error) {
        console.error("Error fetching matches:", error);
        Alert.alert("Error", "Could not fetch matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (myUserId) {
      fetchMatches();
    }
  }, [myUserId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Finding your vibe tribe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#00ffcc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your University Buddy</Text>
      </View>

      {/* Buddy List */}
      <ScrollView contentContainerStyle={styles.list}>
        {buddies.length > 0 ? (
          buddies.map((buddy) => (
            <View key={buddy.id} style={styles.card}>
              <View style={styles.info}>
              <Image source={{ uri: `${API_BASE_URL}/uploads/${buddy.image}` }} style={styles.avatar} />

                <View>
                  <Text style={styles.name}>{buddy.name}</Text>
                  <Text style={styles.details}>
                    Similarity Score: {buddy.score} • {buddy.desc || 'No description provided.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.matchBtn} onPress={()=>navigation.navigate('Matched',{ UserName:buddy.name, UserImage:`${API_BASE_URL}/uploads/${ buddy.image}`})}>
                <Text style={styles.matchBtnText}>Match</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noMatchesText}>No matches found yet. Try again later!</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noMatchesText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16
  },
  header: {
    backgroundColor: "#1f1f1f",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00ffcc",
  },
  list: {
    padding: 16,
    maxWidth: 900,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#1c1c1c",
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#00ffcc",
  },
  name: { fontSize: 18, fontWeight: "600", color: "#fff" },
  details: { color: "#aaa", fontSize: 14, marginTop: 4, flexWrap: "wrap" },
  matchBtn: {
    backgroundColor: "#00ffcc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginLeft: 12,
  },
  matchBtnText: { color: "#121212", fontWeight: "700", fontSize: 14 },
});