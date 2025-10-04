// import React, { useState, useEffect } from "react";
// import { View, Text, Button } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export default function App() {
//   const [timeLeft, setTimeLeft] = useState("");
  
//   // Example meetup time: 1 minute from now
//   const meetupTime = new Date(Date.now() + 60 * 1000).toISOString();

//   // Save meetup time
//   const saveTime = async () => {
//     try {
//       await AsyncStorage.setItem("meetupTime", meetupTime);
//       alert("Meetup time saved!");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     let interval;

//     const loadCountdown = async () => {
//       try {
//         const savedTime = await AsyncStorage.getItem("meetupTime");
//         if (!savedTime) return;

//         const target = new Date(savedTime);

//         interval = setInterval(() => {
//           const now = new Date();
//           const diff = target - now;

//           if (diff <= 0) {
//             clearInterval(interval);
//             setTimeLeft("Started!");
//             return;
//           }

//           const minutes = Math.floor(diff / (1000 * 60));
//           const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//           setTimeLeft(`${minutes}m ${seconds}s`);
//         }, 1000);
//       } catch (err) {
//         console.log(err);
//       }
//     };

//     loadCountdown();

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 24, marginBottom: 20 }}>{timeLeft || "Loading..."}</Text>
//       <Button title="Save Meetup Time" onPress={saveTime} />
//     </View>
//   );
// }
