import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { global } from "./styles";

export default function GroupBattleScreen() {
  return (
    <LinearGradient
      colors={["#ffdffc", "#d7f3ff", "#ffe7ef"]}
      style={global.bg}
    >
      <Text style={global.header}>👥 Group Battle</Text>

      <TouchableOpacity
        style={[global.button, { backgroundColor: "#A77BFF" }]}
      >
        <Text style={global.buttonText}>Create Battle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[global.button, { backgroundColor: "#FF8ACB" }]}
      >
        <Text style={global.buttonText}>Join Battle</Text>
      </TouchableOpacity>

      <View style={[global.glass, { marginTop: 20 }]}>
        <Text style={{ fontSize: 20, marginBottom: 10 }}>Scoreboard</Text>

        {[
          "🌸 You — 10 pts",
          "🔥 Zoe — 8 pts",
          "💧 Ken — 7 pts",
          "⚡ Mimi — 6 pts",
        ].map((item, i) => (
          <Text key={i} style={{ marginVertical: 4 }}>
            {item}
          </Text>
        ))}
      </View>

      <View style={[global.glass, { marginTop: 25 }]}>
        <Text style={{ fontSize: 16, opacity: 0.7 }}>⏳ 09s</Text>

        <Text
          style={{
            fontSize: 20,
            marginTop: 10,
            marginBottom: 15,
            fontWeight: "600",
          }}
        >
          Which animal is the fastest on land?
        </Text>

        {["Cheetah", "Lion", "Tiger", "Jaguar"].map((q, i) => (
          <TouchableOpacity
            key={i}
            style={[
              global.button,
              { backgroundColor: "rgba(255,255,255,0.3)" },
            ]}
          >
            <Text>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}
