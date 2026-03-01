 import React,{useEffect,useState,useContext} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AuthorContext } from '../AuthorContext';
const API_BASE_URL = "http://192.168.0.136:3000";


export default function FullStory({ navigation ,route}) {
  const {StoryID}=route.params;
  const [story,setstory]=useState({})
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  useEffect(()=>{
    const getFinalstory=async()=>{
      try{
        const response=await fetch(`${API_BASE_URL}/getstoryuser?StoryID=${StoryID}`);
        const data=await response.json()
        if(!response.ok)(
         console.log('An error occured')
        )
        setstory(data[0]);


      } catch(e){
        throw new Error('An error occured',e)
      }
    }
    getFinalstory()
  },[])
//   
  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#a855f7"]}
        style={styles.header}
      >
        <Text style={styles.headerText}>Campus Pulse ⚡</Text>
      </LinearGradient>

      {/* Story Body */}
      <ScrollView contentContainerStyle={styles.main}>
        <View style={styles.storyContainer}>
        <ImageBackground
  source={
    story?.image
      ? { uri: `${API_BASE_URL}${story.image}` } // notice: no slash before uploads
      : null // fallback image
  }
  style={styles.storyImage}
  imageStyle={{ borderRadius: 20 }}
>
  <View style={styles.overlay} />
</ImageBackground>


          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.storyMeta}>by {story.author}</Text>

          <Text style={styles.storyText}>{story.post}</Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.btn}
          >
            <Feather name="arrow-left" size={16} color="#fff" />
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 Campus Pulse. All Rights Reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#1b1b2f",
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  main: {
    padding: 20,
    alignItems: "center",
  },
  storyContainer: {
    backgroundColor: "#24243d",
    borderRadius: 25,
    padding: 20,
    width: "100%",
    elevation: 8,
  },
  storyImage: {
    width: "100%",
    height: 250,
    marginBottom: 20,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#c084fc",
    marginBottom: 6,
  },
  storyMeta: {
    fontSize: 13,
    color: "#a5b4fc",
    marginBottom: 15,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#e5e7eb",
    marginBottom: 25,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: "#151527",
    padding: 15,
    alignItems: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  reactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "600",
  },
  
});
