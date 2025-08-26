import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function InterestRoom({ navigation }) {
  const [postText, setPostText] = useState("");

  return (
    <ImageBackground
      // source={{ uri: "https://i.imgur.com/f0vMZJQ.png" }} // gradient bg image
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💻 Code-Cave</Text>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => navigation.navigate("CampusNexus")}
        >
          <Feather name="log-out" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main */}
      <View style={styles.main}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sectionTitle}>MENU</Text>
          {[
            { icon: "home", label: "Home" },
            { icon: "bookmark", label: "Saved" },
            { icon: "users", label: "Members" },
            { icon: "settings", label: "Settings" },
            { icon: "grid", label: "More" },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.sidebarItem}>
              <Feather name={item.icon} size={22} color="#fff" />
              <Text style={styles.sidebarText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feed */}
        <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
          {/* Create Post */}
          <View style={styles.createPost}>
            <TextInput
              style={styles.textInput}
              placeholder="✍️ Share something with Code-Cave..."
              placeholderTextColor="#aaa"
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            <TouchableOpacity style={styles.fab}>
              <Feather name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Example Posts */}
          <View style={styles.post}>
            <Text style={styles.postAuthor}>@devmark 🚀</Text>
            <Text style={styles.postText}>
              Just built a new feature with React + Tailwind 🔥  
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="thumbs-up" size={18} color="#6C63FF" />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="message-circle" size={18} color="#00C9A7" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="share-2" size={18} color="#FF6B6B" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.post}>
            <Text style={styles.postAuthor}>@coderella ✨</Text>
            <Text style={styles.postText}>
              Anyone here using Node.js for backend projects? Let’s connect!
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="thumbs-up" size={18} color="#6C63FF" />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="message-circle" size={18} color="#00C9A7" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Feather name="share-2" size={18} color="#FF6B6B" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1D" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  leaveBtn: {
    backgroundColor: "#FF6B6B",
    padding: 8,
    borderRadius: 50,
  },

  // Main
  main: { flex: 1, flexDirection: "row" },

  // Sidebar
  sidebar: {
    width: 90,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 20,
    color: "#fff",
    opacity: 0.7,
  },
  sidebarItem: {
    marginBottom: 20,
    alignItems: "center",
  },
  sidebarText: { color: "#fff", fontSize: 12, marginTop: 4 },

  // Feed
  feed: {
    flex: 1,
    padding: 16,
  },
  createPost: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    position: "relative",
  },
  textInput: { color: "#fff", fontSize: 14, minHeight: 50 },
  fab: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#6C63FF",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },

  // Posts
  post: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  postAuthor: { fontWeight: "700", marginBottom: 6, color: "#fff" },
  postText: { color: "#f1f1f1", fontSize: 14 },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-around",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
    opacity: 0.9,
  },
});
