import React, {useState,useEffect} from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function Matched({navigation,route}) {
  const { UserImage,UserName } = route.params || {};
  return (
    <View style={styles.container}>
      <View style={styles.matchBox}>
        {/* Profile Picture */}
        <Image
          source={{ uri: {UserImage} }}
          style={styles.avatar}
        />

        {/* Match Info */}
        <Text style={styles.title}>You matched with {UserName}</Text>
        <Text style={styles.subtitle}>
          You both love coding, late-night study vibes & basketball. 🎉
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Start Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  matchBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#00ffcc",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8, // Android shadow
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00ffcc",
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00ffcc",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },

  btnPrimary: {
    backgroundColor: "#00ffcc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  btnPrimaryText: {
    color: "#121212",
    fontWeight: "700",
  },

  btnSecondary: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#555",
  },
  btnSecondaryText: {
    color: "#f5f5f5",
    fontWeight: "700",
  },
});




