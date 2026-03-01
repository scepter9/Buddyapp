import { StyleSheet } from "react-native";

export const global = StyleSheet.create({
  bg: {
    flex: 1,
    padding: 20,
  },
  glass: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(20px)",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    padding: 16,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
