import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView
} from "react-native";
import { Feather } from "@expo/vector-icons";
import BottomNavigator from '../BottomNavigator';
export default function CampusPulse({navigation}) {
  const stories = [
    {
      id: "1",
      title: "Life in the Engineering Faculty",
      author: "Sarah • 2h ago",
      text: "University life in the engineering faculty is intense but rewarding. Late-night coding, coffee runs, and teamwork taught me more than lectures alone...",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "2",
      title: "My First Year Experience",
      author: "Daniel • 1d ago",
      text: "First year was full of surprises—new friends, new environment, and independence. Joining societies and discovering robotics made it unforgettable...",
      img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  return (
<SafeAreaView style={styles.wrapper}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Campus Pulse ⚡</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.main}>
        {stories.map((story) => (
          <View key={story.id} style={styles.card}>
            <ImageBackground
              source={{ uri: story.img }}
              style={styles.storyImage}
              imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            >
              <View style={styles.overlay} />
              <Text style={styles.storyTitle}>{story.title}</Text>
            </ImageBackground>
            <View style={styles.storyBody}>
              <Text style={styles.storyMeta}>{story.author}</Text>
              <Text style={styles.storyText}>{story.text}</Text>
              <View style={styles.storyFooter}>
                <View style={styles.likeDislike}>
                  <TouchableOpacity>
                    <Text style={styles.reaction}><Feather name="thumbs-up" size={24} color="green" /></Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.reaction}><Feather name="thumbs-down" size={24} color="red" /></Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btn}>
                  <Text style={styles.btnText}>Read More</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Request Section */}
        <View style={styles.requestSection}>
          <Text style={styles.requestTitle}>Want to Share Your Story?</Text>
          <Text style={styles.requestText}>
            Request to write and inspire others with your experiences on Campus
            Pulse.
          </Text>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Request to Write ✍️</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Campus Pulse. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
    <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#24243d",
  },
  container: {
    flex: 1,
    backgroundColor: "#1b1b2f",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingVertical: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  main: {
    padding: 20,
    gap: 25,
  },

  // Story Card
  card: {
    backgroundColor: "#24243d",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
  },
  storyImage: {
    height: 200,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    margin: 15,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  storyBody: {
    padding: 16,
  },
  storyMeta: {
    fontSize: 13,
    color: "#a5b4fc",
    marginBottom: 8,
  },
  storyText: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 15,
    lineHeight: 20,
  },
  storyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likeDislike: {
    flexDirection: "row",
    gap: 16,
  },
  reaction: {
    fontSize: 20,
    color: "#cbd5e1",
  },
  btn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Request Section
  requestSection: {
    backgroundColor: "#232338",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 4,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#fff",
    textAlign: "center",
  },
  requestText: {
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 20,
  },

  // Footer
  footer: {
    marginTop: 20,
    backgroundColor: "#151527",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
