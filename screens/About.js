import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Animated,
  SafeAreaView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import io from "socket.io-client";
import { useFocusEffect } from "@react-navigation/native";
import BottomNavigator from "./BottomNavigator";

const API_BASE_URL = "http://172.20.10.4:3000";

export default function About({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const heroOpacity = useRef(new Animated.Value(0)).current;

  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`${API_BASE_URL}/About`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setIsLoadingUser(false);
    }
  }, []); 

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread/count`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotificationCount(data.unreadCount || 0); // 
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchNotificationCount();
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, [fetchUserData, fetchNotificationCount])
  );

  useEffect(() => {
    let socket;
    if (user && user.id) {
      socket = io(API_BASE_URL, { withCredentials: true });
      socket.on("connect", () => {
        socket.emit("registerUser", user.id);
      });
      socket.on("newNotification", () => {
        setNotificationCount((prev) => prev + 1);
      });
      socket.on("notificationRead", () => {
        setNotificationCount((prev) => Math.max(0, prev - 1));
      });
    }
    return () => socket && socket.disconnect();
  }, [user]);

  const Card = ({ item }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
      <Pressable
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start()
        }
        onPress={item.onPress}
      >
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
        >
          <Image source={item.image} style={styles.cardImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.gradientOverlay}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  if (isLoadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading your vibe...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Buddy</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.profileImageContainer}
        >
          {user?.image ? (
            <Image
              source={{ uri: `${API_BASE_URL}/uploads/${user.image}` }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[styles.profileImage, styles.profileImagePlaceholder]}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("NotificationsScreen")}
        >
          <Feather name="bell" size={24} color="white" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? "99+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, { opacity: heroOpacity }]}>
        <LinearGradient
          colors={["#1F2937", "#111827"]}
          style={styles.heroBackground}
        >
          <Text style={styles.welcomeTitle}>
            Hey {user?.name || "Buddy"} 👋
          </Text>
          <Text style={styles.welcomeDesc}>
            Ready to learn, connect, and battle? Your campus journey starts
            here. 🚀
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Cards */}
      <ScrollView contentContainerStyle={styles.cardContainer}>
        {[
          {
            image:
              Platform.OS === "ios"
                ? require("../assets/image312.jpeg")
                : require("../assets/image1.jpeg"),
            label: "🎮 Battle Arena",
            subtitle: "Challenge your friends. Prove your skills.",
            onPress: () => navigation.navigate("BattleArena"),
          },
          {
            image:
              Platform.OS === "ios"
                ? require("../assets/image311.jpeg")
                : require("../assets/image4.jpeg"),
            label: "📚 CrashCourse",
            subtitle: "Quick, fun lessons. Learn smarter.",
            onPress: () => navigation.navigate("CrashCourse"),
          },
          {
            image:
              Platform.OS === "ios"
                ? require("../assets/image310.jpeg")
                : require("../assets/image0.jpeg"),
            label: "🌐 Nexus",
            subtitle: "Meet new people. Build your tribe.",
            onPress: () => navigation.navigate("Match"),
          },
        ].map((item, index) => (
          <Card item={item} key={index} />
        ))}
      </ScrollView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#9CA3AF",
  },
  headerContent: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#111827",
    borderBottomWidth: 0.5,
    borderBottomColor: "#374151",
    position: "relative",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#fff",
  },
  profileImagePlaceholder: {
    backgroundColor: "#4B5563",
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  notificationButton: {
    padding: 5,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  heroSection: {
    paddingHorizontal: 20,
    marginVertical: 15,
    alignItems: "center",
  },
  heroBackground: {
    width: "100%",
    paddingVertical: 35,
    borderRadius: 16,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    color: "#fff",
  },
  welcomeDesc: {
    fontSize: 15,
    textAlign: "center",
    color: "#9CA3AF",
    paddingHorizontal: 10,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 80,
  },
  card: {
    width: 300,
    height: 220,
    margin: 10,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: "#1F2937",
  },
  cardImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#d1d5db",
  },
  dark: {
    text: { color: "#E5E7EB" },
  },
});
