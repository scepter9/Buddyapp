import React, { useContext, useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { AuthorContext } from "../AuthorContext";
const API_BASE_URL = "http://192.168.0.136:3000";
const { width } = Dimensions.get("window");

const videos = [
  {
    id: "1",
    user: "@james_tech",
    caption: "AI project that predicts students' grades using ML 📊",
    likes: 238,
    comments: 44,
    shares: 12,
    time: "2h ago",
    userImg: "https://randomuser.me/api/portraits/men/32.jpg",
    video:
      "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: "2",
    user: "@ella_codes",
    caption: "Building a wearable device that tracks stress levels 🧠✨",
    likes: 402,
    comments: 95,
    shares: 25,
    time: "4h ago",
    userImg: "https://randomuser.me/api/portraits/women/68.jpg",
    video:
      "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];
const number=(count)=>{
  if(count>1000){
      return count;
  }else if(count>1000000){
      return (count/1000).toFixed(1)+'k'
  }else if(count>1000000000){
      return (count/1000000).toFixed(1)+'m'
  }
}
const timestamp=(time)=>{
  const olddate=new Date(time);
  const currentDate=new Date();
  const seconds=Math.floor((currentDate-olddate)/ 1000);
  console.log(seconds);
  if(seconds<60){
    return `${seconds}s ago`
  }
  const minutes=Math.floor(seconds/60);
  if(minutes<60){
    return `${minutes}m ago`
  }
  const hours=Math.floor(minutes/60);
  if(hours<24){
    return `${hours}h ago`
  }
  const days=Math.floor(hours/24);
  if(days<30){
    return `${days}d ago`
  }
  const months=Math.floor(days/30);
  if(months<12){
    return `${months}mo ago`
  }
  const year=Math.floor(months/12);
  return `${year}y ago`
}
const CampusShowcase = () => {
const {user}=useContext(AuthorContext)
const userId=user.id;
const [Video,Setvideo]=useState([])
    
    useEffect(()=>{
      const getVideos=async()=>{
try{
  const res=await fetch(`${API_BASE_URL}/gettingvideos/${userId}`);
if(!res.ok){
  console.log('Something went wrong');
}
const data=await res.json();
Setvideo(data);
}catch(err){
  console.log('Something went wrong');
}
      }
      getVideos();
    },[])
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Tech & Innovation 💻</Text>
        <TouchableOpacity activeOpacity={0.8}>
          {/* <LinearGradient
            colors={["#2d3edc", "#6a5af9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadBtn}
          >
            <Text style={styles.uploadText}>Upload Showcaslle</Text>
          </LinearGradient> */}
        </TouchableOpacity>
      </View>

      {/* BANNER */}
      <LinearGradient
        colors={["#eaf1ff", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>Explore Creative Minds in Your Interest </Text>
        <Text style={styles.bannerDesc}>
          See how your peers are innovating with apps, designs,Entertainment and engineering
          marvels. Like, comment, and get inspired!
        </Text>
      </LinearGradient>

      {/* FEED */}
      <FlatList
        data={Video}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => `active-${item?.id}`}
        contentContainerStyle={styles.feed}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Video
              source={{ uri: uri? `${API_BASE_URL}${item.video}` :null} }
              useNativeControls
              resizeMode="cover"
              style={styles.video}
              isMuted
            />
            <View style={styles.cardContent}>
              <View style={styles.userInfo}>
                <Image source={{  uri: uri ? `${API_BASE_URL}/uploads/${item.image}`:null }} style={styles.userImg} />
                <Text style={styles.username}>{item.username}</Text>
              </View>
              <Text style={styles.caption}>{item.caption}</Text>
              <View style={styles.engagement}>
                <View style={styles.icons}>
                  <Text style={styles.iconText}>💖{()=>number(item.likes)}</Text>
                  <Text style={styles.iconText}>💬 {()=>number(item.comments)}</Text>
                  <Text style={styles.iconText}>🔁{()=>number(item.shares)}</Text>
                </View>
                
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default CampusShowcase;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: "5%",
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#e7e7e7",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2d3edc",
  },
  uploadBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  banner: {
    paddingVertical: 40,
    paddingHorizontal: "5%",
    alignItems: "center",
    textAlign: "center",
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2d3edc",
    textAlign: "center",
  },
  bannerDesc: {
    color: "#555",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  feed: {
    padding: "5%",
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
  video: {
    width: "100%",
    height: 380,
    backgroundColor: "#000",
  },
  cardContent: {
    padding: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userImg: {
    width: 35,
    height: 35,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#2d3edc",
    marginRight: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  caption: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  engagement: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icons: {
    flexDirection: "row",
  },
  iconText: {
    marginRight: 12,
    color: "#666",
    fontSize: 14,
  },
  time: {
    color: "#666",
    fontSize: 13,
  },
});
