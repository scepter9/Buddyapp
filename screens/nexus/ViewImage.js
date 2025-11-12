import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons"; // you can install via expo install @expo/vector-icons

export default function ViewImage({ route, navigation }) {
  const { imagevalue } = route.params; // full image URL passed from previous screen

  return (
    <View style={styles.container}>
      {/* Close button (top-left) */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
      <Feather name="x" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Optional menu button (top-right) */}
      <TouchableOpacity style={styles.menuButton}>
      <Feather name="more-vertical" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Fullscreen Image */}
      <Image
        source={{ uri: imagevalue }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 2,
  },
  menuButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 2,
  },
});
