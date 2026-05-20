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
import { useNavigationState } from "@react-navigation/native";
import { UnreadMessagesContext } from "./UnreadMessagesContext";


const TABS = [
  { name: "About",    icon: "home",    label: "Home"     },
  { name: "Messages", icon: "mail",    label: "Messages" },
  { name: "Profile",  icon: "user",    label: "Profile"  },
];

function TabButton({ tab, isActive, onPress, badge, pulseAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={styles.tabBtn}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Active pill behind icon */}
        {isActive && <View style={styles.activePill} />}

        <View style={{ position: "relative" }}>
          <Feather
            name={tab.icon}
            size={20}
            color={isActive ? "#c084fc" : "rgba(255,255,255,0.3)"}
          />
          {/* Unread badge */}
          {badge > 0 && (
            <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.badgeText}>
                {badge > 99 ? "99+" : badge < 1000 ? badge : (badge / 1000).toFixed(1) + "k"}
              </Text>
            </Animated.View>
          )}
        </View>

        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNavigator({ navigation }) {
  const { unreadCount } = useContext(UnreadMessagesContext);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get current route name for active state
  const currentRoute = useNavigationState((state) => {
    const route = state?.routes?.[state.index];
    return route?.name;
  });

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [unreadCount]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={currentRoute === tab.name}
            onPress={() => navigation.navigate(tab.name)}
            badge={tab.name === "Messages" ? unreadCount : 0}
            pulseAnim={pulseAnim}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  pill: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    backgroundColor: "#13111f",       // slightly lighter than screen bg
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "ios" ? 0 : 0,
    // Shadow — purple tint to match theme
    shadowColor: "#9333ea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(147,51,234,0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.25)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: "#c084fc",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#13111f",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});