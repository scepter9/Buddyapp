import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext";
import { Ionicons } from "@expo/vector-icons";
const API_BASE_URL = "http://192.168.0.136:3000";

// Separate Component for Post Items
const PostChild = ({ item }) => {
  const getTimestamp = (time) => {
    if (!time) return "Just now";
    const olddate = new Date(time);
    const now = new Date();
    const seconds = Math.floor((now - olddate) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <BlurView intensity={50} tint="dark" style={styles.post}>
      <View style={styles.userRow}>
        <Image source={{ uri: item.img || 'https://via.placeholder.com/100' }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.time}>{getTimestamp(item.time)}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{item.text}</Text>
      <View style={styles.reactions}>
        <TouchableOpacity><Text style={styles.reactText}>❤️ {item.reactions?.heart || 0}</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText}>💬 {item.reactions?.comment || 0}</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText}>🔁 {item.reactions?.share || 0}</Text></TouchableOpacity>
      </View>
    </BlurView>
  );
};

export default function DesignersHubScreen({ navigation, route }) {
  const [postsarray, setPostarray] = useState([]);
  const [openModal,setOpenModal]=useState(false)
  const { roomid } = route.params;
  const { user } = useContext(AuthorContext);
  const searchid = user?.id;

  // Track online users (Note: This local set won't persist across users without a Socket/Backend)
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!searchid) return;
    setOnlineCount((prev) => prev + 1);
    return () => setOnlineCount((prev) => Math.max(prev - 1, 0));
  }, [searchid]);
  

  useEffect(() => {
    const getRoomposts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getrooom?roomid=${roomid}`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setPostarray(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    getRoomposts();
  }, [roomid]);

  return (
    <LinearGradient colors={["#0f1a2c", "#1a2c4c"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
       
        <ImageBackground
  style={styles.header}
  source={{ uri:`http://picsum.photos/400/400` }}
  imageStyle={styles.headerImage}
>
  {/* 1. Dark Overlay layer */}
  <View style={styles.overlay} />

  {/* 2. Top Navigation Row (Icons) */}
  <View style={styles.topIconsRow}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={28} color="#fff" />
    </TouchableOpacity>
    
    <TouchableOpacity onPress={() => setOpenModal(true)}>
      <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
    </TouchableOpacity>
  </View>

  {/* 3. Bottom Info Box */}
  <View style={styles.infoBox}>
    <Text style={styles.title}>#{roomname}</Text>
    <Text style={styles.onlineText}>• {onlineCount} Online</Text>
  </View>
</ImageBackground>
       

        {/* List of Posts */}
        <FlatList
          data={postsarray}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostChild item={item} />}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={<Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>No posts yet.</Text>}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.actionpostBtn} 
          onPress={() => navigation.navigate('NewPostScreen', { room: roomid })}
        >
          <Text style={styles.actionText}>➕ New Post</Text>
        </TouchableOpacity>

        <Modal
  animationType="fade" 
  transparent={true}
  visible={openModal}
  onRequestClose={() => setOpenModal(false)}
>
  {/* The TouchableOpacity acts as the backdrop to close the modal */}
  <TouchableOpacity 
    style={styles.modalOverlay} 
    activeOpacity={1} 
    onPress={() => setOpenModal(false)}
  ><TouchableWithoutFeedback>
    <BlurView intensity={30} tint="dark" style={styles.moda}>
      <TouchableOpacity style={styles.modalItem} onPress={handleLeaveRoom}>
        <Text style={styles.modaltext}>🚪 Leave Room</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalItem} onPress={handleimage}>
        <Text style={styles.modaltext}>🖼️ Change Wallpaper</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalItem}>
        <Text style={styles.modaltext}>🔔 Mute Notifications</Text>
      </TouchableOpacity>

      {/* Example of a "Danger" action style */}
      <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0 }]}>
        <Text style={[styles.modaltext, { color: '#ff4d4d' }]}>🚫 Block Room</Text>
      </TouchableOpacity>
    </BlurView>
    </TouchableWithoutFeedback>

  </TouchableOpacity>
</Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: {
    width: '100%',
    height: 220, // Give it a fixed height or it will collapse
    paddingTop: 50,
    paddingHorizontal: 16,
    justifyContent: 'space-between', // Pushes icons to top and infoBox to bottom
    overflow: 'hidden',
  },
  headerImage: { 
    resizeMode: 'cover' 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)' // Subtle tint so text is readable
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dim the background
  },
  topIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10, // Ensures icons are clickable above the overlay
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)', // Note: backdropFilter is web-only, use BlurView for iOS/Android
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moda: {
    position: 'absolute',
    top: 60, // Adjust this so it appears right under your header icon
    right: 16, // Changed to 'right' because settings icons are usually on the right
    width: 180,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 45, 75, 0.9)', // Match your theme
    paddingVertical: 8,
    overflow: 'hidden', // Ensures BlurView doesn't spill over corners
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modaltext: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
 
  title:{
    fontSize:20,
    fontWeight:'bold',
    color:'#fff'
  },
  onlineText:{
    fontSize:14,
    color:'#aaffaa'
  },
  members: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionpostBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    position:'absolute',
    bottom:20,
    right:10
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  liveBtn: {
    backgroundColor: "#8a2be2",
  },
  liveText: {
    color: "#031426",
    fontWeight: "700",
    fontSize: 13,
  },
  liveSpace: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  liveTitle: { color: "#031426", fontWeight: "700", fontSize: 15 },
  liveSub: { color: "#022333", fontSize: 13, marginTop: 2 },
  post: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { marginLeft: 10 },
  username: { color: "#fff", fontWeight: "700" },
  time: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  postText: { color: "#eaf6ff", fontSize: 14, lineHeight: 20, marginBottom: 10 },
  reactions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reactText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
  },
  postBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  postBtnText: {
    color: "#031426",
    fontWeight: "700",
  },
});
