import React, { useEffect, useState, useContext, useMemo ,useRef, useCallback} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  Keyboard 
} from "react-native";


import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.0.136:3000";
import { io } from "socket.io-client";

import { Video } from "expo-av";
// Separate Component for Post Items
const PostChild = ({ item ,user}) => {
  const searchid = user?.id;
  const roomdetais=item.id

    const postroomlikes=async()=>{
      try{
        const res=await fetch(`${API_BASE_URL}/postroomlikes`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({searchid,roomdetais})
        })
      }catch(err){
if(err){
  console.log('Something is wrong');
}
      }
    }
  
  const getTimestamp = (time) => {
    if (!time) return "Just now";
    const olddate = new Date(time);
    const now = new Date();
    const seconds = Math.floor((now - olddate) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const count=item.postimage?.length || 0;
  const countvi=item.postvideo?.length || 0;
  let Itemwidth;
  let Itemwidtha;
  if
  (count===1){
Itemwidth='80%'
  }else if(count===2){
    Itemwidth='48%'
  }else if(count===3){
    Itemwidth='48%'
  }else{
    Itemwidth='31%'
  };
   if
  (countvi===1){
Itemwidtha='80%'
  }else if(countvi===2){
    Itemwidtha='48%'
  }else if(countvi===3){
    Itemwidtha='48%'
  }else{
    Itemwidtha='31%'
  }
    
  
  return (
    <BlurView intensity={50} tint="dark" style={styles.post}>
      <View style={styles.userRow}>
        <Image source={{ uri: `${API_BASE_URL}/${item.image}` || 'https://via.placeholder.com/100' }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.usersname}</Text>
          <Text style={styles.time}>{getTimestamp(item.posted_at)}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{item.post ?item.post :''}</Text>
      {item.postimage.length>0 && 
<View style={styles.mediacontainer} >
 {item.postimage.map((uri,index)=>(
  <View key={index} style={[styles.postitem, {width:Itemwidth},count===3 && index===2 && styles.center]}
  onPress={()=>navigation.navigate('ViewImage',{imagevalue:`${API_BASE_URL}/${uri}`})}
  >
    <Image source={{uri:`${API_BASE_URL}/${uri}`}} resizeMode="cover" style={styles.postitemimage}/>
  </View>
 ))}
 
 
</View>
}

{item.postvideo.length>0 && 
<View style={styles.mediacontainer} >
 {item.postvideo.map((uri,index)=>(
  <View key={index} style={[styles.postitem, {width:Itemwidtha},count===3 && index===2 && styles.center]}
  onPress={()=>navigation.navigate('ViewImage',{imagevalue:`${API_BASE_URL}/${uri}`})}
  >
    <Video source={{uri:`${API_BASE_URL}/${uri}`}} isLooping={true} useNativeControls={true} style={styles.postitemimage}/>
  </View>
 ))}
 
 
</View>
}
     
      <View style={styles.reactions}>
        <TouchableOpacity ><Text style={styles.reactText}>❤️ {item.reactions?.heart || 0}</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText}>💬 {item.reactions?.comment || 0}</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText}>🔁 {item.reactions?.share || 0}</Text></TouchableOpacity>
      </View>
    </BlurView>
  );
};

export default function DesignersHubScreen({ navigation, route }) {
  const [postsarray, setPostarray] = useState([]);
  const [openModal,setOpenModal]=useState(false)
  const { roomid ,roomname,roomcreator} = route.params;
  const { user } = useContext(AuthorContext);
  const searchid = user?.id;
  const socketref=useRef(null)
  const [roomimage,Setroomimage]=useState(null) 
  const [biomodal,Setbiomodal]=useState(false)
  const [biotext,Setbiotext]=useState("")
  const [biostore,setbiostore]=useState(null)

const isAdmin=searchid===roomcreator
  // Track online users (Note: This local set won't persist across users without a Socket/Backend)
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    if (!searchid || !roomid) return;
  
    const postsocket = io(API_BASE_URL, {
      query: { userId: searchid },
      transports: ["websocket"],
    });
  
    socketref.current=postsocket
    postsocket.emit("joingrouproom", roomid);
  
    postsocket.on("getimage", (data) => {
      Setroomimage(data);
    });
  
    postsocket.on("online-count", (Count)=>{
      setOnlineCount(Count)
    });

  
    return () => {
      postsocket.disconnect();
    };
  }, [searchid, roomid]);
  
  useEffect(() => {
    if (!socketref.current) return;
  
    socketref.current.on("gottenbio", (data) => {
      setbiostore(data);
    });
  
    return () => {
      socketref.current.off("gottenbio");
    };
  }, []);
  
 
  useFocusEffect(

  useCallback(() => {
    const getRoomposts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getrooom?roomid=${roomid}`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setPostarray(data);
        
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    getRoomposts();
  }, [roomid]))
useEffect(()=>{
  const fetchroompicture=async()=>{
    try{
      if(!roomid) return;
      const res=await fetch(`${API_BASE_URL}/roomimage?roompassid=${roomid}`)
      if(!res.ok) throw new Error("An error occured")
    
  const data=await res.json()
  Setroomimage(data.roomimage)
  setbiostore(data.roombio)
  
  }catch(err){
    throw new Error("An error occured",err)
  }
  
}
fetchroompicture()
},[roomid])
  
  const handleimage = async () => {
    
     
  
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Access required to access photos");
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
      });
  
      if (result.canceled || !result.assets?.length) return;
      Setroomimage(null)
  
     const asset=result.assets[0]
     try{
      const formData1=new FormData();
      formData1.append("image", {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || "room.jpg",
      });      
    
     
     
      const postimage=await fetch(`${API_BASE_URL}/api/upload`,{
        method:'POST',
        body:formData1
      })
      if(!postimage.ok) {
        console.log('something is wrong ');
        return;
      }
      const data=await postimage.json()
    
      const theimage=data.imageUrl
      if (!socketref.current) return;
socketref.current.emit("sendimage", theimage);


     }
     catch(err){
throw new Error("something is wrong")
     }
  
   
  };
  const handlebio=()=>{
    if(biotext.trim()==="" && !socketref) return
setbiostore("")
socketref.current?.emit('updatebio',biotext)

  }
  return (
    <LinearGradient colors={["#0b0f14", "#111827"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
       
        <ImageBackground
  style={styles.header}
  source={
    roomimage
      ? { uri: `${API_BASE_URL}/${roomimage}` }
      : null
  }
  
  imageStyle={styles.headerImage}
>
  {/* 1. Dark Overlay layer */}
  <View style={styles.overlay} />

  {/* 2. Top Navigation Row (Icons) */}
  <View style={styles.topIconsRow}>
    <TouchableOpacity onPress={() => navigation.navigate('InterestRoom')}>
      <Ionicons name="arrow-back" size={28} color="#fff" />
    </TouchableOpacity>
    
    <TouchableOpacity onPress={() => setOpenModal(true)}>
      <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
    </TouchableOpacity>
  </View>

  {/* 3. Bottom Info Box */}
  <View style={styles.infoBox}>
    <Text style={styles.title}>#{roomname}</Text>
    <View style={styles.onlineTContainer}>
      <View style={styles.onlineDot}></View>
    <Text style={styles.onlineText}> {onlineCount} Online</Text>

    </View>
    {biostore &&
    <Text style={styles.roomBio} numberOfLines={5}>
    {biostore}
  </Text>
  
    }
  </View>
</ImageBackground>
       

        {/* List of Posts */}
        <FlatList
          data={postsarray}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostChild item={item} navigation={navigation} user={user}/>}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={<Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>No posts yet.</Text>}
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.actionpostBtn} 
          onPress={() => navigation.navigate('NewPostScreen', { roomid: roomid })}
        >
          <Text style={styles.actionText}>➕ </Text>
        </TouchableOpacity>

        <Modal
  animationType="fade" 
  transparent={true}
  visible={openModal}
  onRequestClose={() => setOpenModal(false)}
>
  {/* The TouchableOpacity acts as the backdrop to close the modal */}
  <TouchableOpacity 
    style={styles.modalOverlay} 
    activeOpacity={1} 
    onPress={() => setOpenModal(false)}
  ><TouchableWithoutFeedback>
    <BlurView intensity={30} tint="dark" style={styles.moda}>
      <TouchableOpacity style={styles.modalItem} >
        <Text style={styles.modaltext}>🚪 Leave Room</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.modalItem,!isAdmin &&{opacity:0.5}]} onPress={handleimage} disabled={!isAdmin}>
        <Text style={styles.modaltext}>🖼️ Change Wallpaper</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.modalItem,!isAdmin &&{opacity:0.5}]} onPress={()=>Setbiomodal(true)} disabled={!isAdmin}>
        <Text style={styles.modaltext}>Add room Bio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalItem}>
        <Text style={styles.modaltext}>🔔 Mute Notifications</Text>
      </TouchableOpacity>

      {/* Example of a "Danger" action style */}
      <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0 }]}>
        <Text style={[styles.modaltext, { color: '#ff4d4d' }]}>🚫 Report Room</Text>
      </TouchableOpacity>
    </BlurView>
    </TouchableWithoutFeedback>

  </TouchableOpacity>
</Modal>


<Modal visible={biomodal} animationType="fade" transparent>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    {/* Outer wrapper that dismisses keyboard on tap */}
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(11,15,20,0.85)",
        }}
      >
        {/* Modal Content */}
        <View
          style={{
            width: "90%",
            paddingVertical: 12,
            paddingHorizontal: 5,
            borderRadius: 10,
            backgroundColor: "#0E1320",
          }}
        >
          {/* Text Input */}
          <TextInput
            value={biotext}
            onChangeText={Setbiotext}
            placeholder="Add a bio..."
            placeholderTextColor="rgba(229,231,235,0.35)"
            multiline
            textAlignVertical="top"
            style={{
              width: "100%",
              minHeight: 120,
              borderRadius: 10,
              padding: 12,
              backgroundColor: "#020617",
              color: "#E5E7EB",
            }}
          />

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 10,
              paddingVertical: 5,
              marginTop: 10,
            }}
          >
            {/* Cancel */}
            <TouchableOpacity
              onPress={() => Setbiomodal(false)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E5E7EB", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>

            {/* Update Bio */}
            <TouchableOpacity
              onPress={handlebio}
              style={{
                flex: 1,
                marginLeft: 10,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: "#1D9BF0",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Update Bio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>


      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  /* ========== SCREEN ========== */
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  /* ========== HEADER (DISCORD / X STYLE) ========== */
  header: {
    width: '100%',
    height: 260,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },

  headerImage: {
    resizeMode: 'cover',
    transform: [{ scale: 1.08 }],
  },

  /* subtle dark wash, not heavy */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  topIconsRow: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* ========== INFO GLASS CARD ========== */
  infoBox: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    padding: 20,
    borderRadius: 22,
    
    // Glassmorphism effect
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    // iOS only in RN, else use blurView component
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12, // Android shadow
  
    // Floating vibe
    transform: [{ translateY: -4 }],
  },
  
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  
  onlineTContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    marginRight: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  
  onlineText: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  /* ========== POSTS ========== */
  post: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  userInfo: {
    marginLeft: 10,
  },

  username: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  time: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },

  postText: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  reactText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },

  /* ========== FLOATING ACTION BUTTON ========== */
  actionpostBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#1D9BF0',
    elevation: 6,
  },

  actionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  /* ========== MODAL ========== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  moda: {
    position: 'absolute',
    top: 64,
    right: 16,
    width: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 24, 36, 0.96)',
    paddingVertical: 6,
  },

  modalItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  modaltext: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },

  dangerText: {
    color: '#ef4444',
  },
  mediacontainer:{
    flexDirection:'row',
    flexWrap:wrap,
    justifyContent:'flex-start',
    paddingHorizontal:5
  },
  postitem:{
    aspectRatio:1,
    marginBottom:4,
    borderRadius:8,
    overflow:'hidden'
  },
  postitemimage:{
   width:'100%',
   height:'100%'
  },
  center:{
    marginLeft:'26%'
  },
  roomBio: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    color: "rgba(203,213,225,0.95)",
  }
  
});


