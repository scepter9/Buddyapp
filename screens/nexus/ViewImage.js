import React,{useEffect} from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons"; 
import { Video } from "expo-av";
import { Audio } from 'expo-av';


export default function ViewImage({ route, navigation }) {
  const { imagevalue ,mediatype} = route.params; 
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true, // 🔑 THIS is the magic
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);
  

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
      {mediatype==='image'?(
        <Image
        source={{ uri: imagevalue }}
        style={styles.image}
        resizeMode="contain"
      />
      ):(
        <Video
        source={{ uri: imagevalue }}
        style={styles.image}
        resizeMode="contain"
        useNativeControls
        shouldPlay={false}   // 👈 key fix
        isLooping={false}    // 👈 no repeat
        isMuted={false}
        volume={1.0}
      />
      
      
      )}
     
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
