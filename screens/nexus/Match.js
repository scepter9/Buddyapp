import React, { useState ,useEffect,useContext} from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
const API_BASE_URL = "http://192.168.0.136:3000";
import { AuthorContext } from '../AuthorContext'

const { width, height } = Dimensions.get("window");

// 🖼️ Mock Data (Images instead of Videos)


export default function MatchDemo() {

  const { user } = useContext(AuthorContext);
    const myUserId = user?.id;
  const [buddies,setbuddies ] = useState([]);

  useEffect(() => {
    if (!myUserId) return; // Wait until user exists
  
    const FetchBuddies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matches?userId=${myUserId}`);
        if (!res.ok) {
          Alert.alert('Something went wrong');
          return;
        }
        const data = await res.json();
        setbuddies(data);
      } catch (err) {
        console.log('An error occurred:', err);
      }
    };
  
    FetchBuddies();
  }, [myUserId]); // depend on userId
  
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Your University Buddy 🎉</Text>

      <FlatList
        data={buddies}
        keyExtractor={(item) => item?.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 🖼️ Image */}
            <ImageBackground
               source={{ uri: `${API_BASE_URL}/uploads/${item.image}` }}
              style={styles.image}
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.infoPanel}>
                <Text style={styles.name}>{item.FULLNAME}</Text>
                <Text style={styles.matchScore}>{item.percent_match}% Match</Text>
                {/* <Text style={styles.similarities}>{item.similarities}</Text> */}
              </View>
            </ImageBackground>
          </View>
        )}
      />

      {/* ❤️ Floating Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.passBtn}>
          <Feather name="x" size={28} color="#ff4c4c" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeBtn}>
          <Feather name="heart" size={28} color="#00ffcc" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00ffcc",
    marginTop: 50,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width,
    height: height * 0.75,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width,
    height: height * 0.75,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  infoPanel: {
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 80,
    width: width * 0.85,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00ffcc",
  },
  name: { fontSize: 24, fontWeight: "700", color: "#fff" },
  matchScore: { fontSize: 18, color: "#00ffcc", marginTop: 5 },
  similarities: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "70%",
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  passBtn: {
    backgroundColor: "#1c1c1c",
    padding: 18,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ff4c4c",
    shadowColor: "#ff4c4c",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  likeBtn: {
    backgroundColor: "#1c1c1c",
    padding: 18,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#00ffcc",
    shadowColor: "#00ffcc",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
