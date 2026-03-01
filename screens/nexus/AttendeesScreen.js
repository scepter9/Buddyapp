import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import BottomNavigator from "../BottomNavigator";
const API_BASE_URL = "http://192.168.0.136:3000";

export default function MeetupMembers({ route, navigation }) {
  const { meetupVal, Myownid } = route.params;
  const [members, setMembers] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState(null);

  const statusColors = {
    host: "#4a90e2",
    going: "#34c759",
  };

  useEffect(() => {
    const Fetchusers = async () => {
      setMessage(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/meetupsmembers?meetupid=${meetupVal}`
        );
        const data = await response.json();
        
        // This is the key to debugging! Check this log in your terminal.
        console.log("API Response Data:", data);

        if (!response.ok) {
          setMessage("Something went wrong");
          return;
        }

        if (data.results && data.results.length > 0) {
          // The host data is the first (and only) object in the results array
          const hostData = data.results[0];
          
          if (hostData) {
            setMembers({
              meetupid: hostData.meetupid,
              meetupname: hostData.meetupname,
              meetupimage: hostData.meetupimage,
              attendees: hostData.attendees || [], // Access the nested attendees array
            });
          }
        }

        if (Myownid === meetupVal) {
          setAdmin(true);
        }
      } catch (err) {
        console.error("An error occurred:", err);
        setMessage("An error occurred");
      }
    };
    Fetchusers();
  }, [meetupVal, Myownid]);

  if (!members) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#555" }}>
          No members found...
        </Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={{ flex: 1, backgroundColor: "#f8faff" }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          {/* Host Card */}
          {members.meetupname && members.meetupimage && (
            <View style={[styles.card, styles.hostCard]}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColors.host }]}
              />
              <Image
                source={{ uri: `${API_BASE_URL}/uploads/${members.meetupimage}` }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{members.meetupname}</Text>
              <Text
                style={[styles.roleBadge, { backgroundColor: statusColors.host }]}
              >
                Host
              </Text>
            </View>
          )}

          {/* Attendees */}
          <View style={styles.grid}>
            {members.attendees?.map((att) => (
              <View key={att.senduserid} style={styles.card}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColors.going },
                  ]}
                />
                <Image
                  source={{
                    uri: `${API_BASE_URL}/uploads/${att.senduserimage}`,
                  }}
                  style={styles.avatar}
                />
                <Text style={styles.name}>{att.sendusername}</Text>
                <Text
                  style={[
                    styles.roleBadge,
                    { backgroundColor: statusColors.going },
                  ]}
                >
                  Going
                </Text>
              </View>
            ))}
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
    backgroundColor: "#f8faff",
  },
  goBackButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
  },
  goBackText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  container: {
    padding: 20,
    paddingBottom: 100, // ✅ space for bottom navigator
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    marginBottom: 20,
  },
  hostCard: {
    width: "100%",
    marginBottom: 30,
    paddingVertical: 24,
    backgroundColor: "rgba(74,144,226,0.1)", // soft highlight for host
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#eee",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#111",
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    top: 10,
    right: 10,
  },
  messageContainer: {
    backgroundColor: "#ffcccc",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  messageText: {
    color: "#cc0000",
    fontWeight: "500",
  },
});
