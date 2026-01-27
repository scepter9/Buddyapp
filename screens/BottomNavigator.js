import React, { useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UnreadMessagesContext } from "./UnreadMessagesContext";

function BottomNavigator({ navigation }) {
  const { unreadCount } = useContext(UnreadMessagesContext);

  // Animated pulse for badge
  const pulseAnim = useRef(new Animated.Value(1)).current;
 
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const formatNumber = (val) => {
    if (!val) return "0";
    if (val < 1000) return val.toString();
    if (val < 1000000) return (val / 1000).toFixed(1) + "k";
    return (val / 1000000).toFixed(1) + "m";
  };
  return (
  //   <LinearGradient
  //   colors={["#2E1065", "#4338CA", "#1E293B"]}
  //   start={{ x: 0, y: 0 }}
  //   end={{ x: 1, y: 1 }}
  //   style={styles.bottomNav}
  // >
//   <LinearGradient
//   colors={["#1E293B", "#334155", "#475569"]}
//   start={{ x: 0, y: 0 }}
//   end={{ x: 1, y: 1 }}
//   style={styles.bottomNav}
// >
<LinearGradient
  colors={["#0F172A", "#1E293B", "#64748B"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.bottomNav}
>


  
      {/* Home */}
      <TouchableOpacity
        onPress={() => navigation.navigate("About")}
        style={styles.navButton}
      >
        <Feather name="home" size={26} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Compass */}
      <TouchableOpacity
        onPress={() => navigation.navigate("CampusNexus")}
        style={styles.navButton}
      >
        <Feather name="compass" size={26} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity style={styles.navButton}>
        <Feather name="settings" size={26} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Messages */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Messages")}
        style={styles.navButton}
      >
        <View style={{ position: "relative" }}>
          <Feather name="mail" size={26} color="#9CA3AF" />
          {unreadCount > 0 && (
            <Animated.View
              style={[
                styles.badgeContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.badgeText}>{formatNumber(unreadCount)}</Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  navButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#DC2626", // deeper red (not neon)
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default BottomNavigator;
