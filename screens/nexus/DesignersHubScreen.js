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
  Keyboard ,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext";
import { Ionicons } from "@expo/vector-icons";
import socket from '../Socket'

const API_BASE_URL = "http://192.168.0.136:3000";
import { io } from "socket.io-client";

import { Video } from "expo-av";

// Separate Component for Post Items
const PostChild = ({ item ,user,navigation}) => {
  const searchid = user?.id;
  const roomdetais=item.id
  const videoref=useRef(null)
const [likebyme,Setlikebyme]=useState(false)
const [likeCount,SetlikeCount]=useState(0)
const [isMutating,SetisMutating]=useState(false)
const [postcomment,SetPostcomment]=useState([])
const [commentmodal,Setcommentmodal]=useState(false)
const scaleAnim=useRef(new Animated.Value(1)).current;

useEffect(()=>{
  if(!searchid && !roomdetais) return
  const fetchlikestate=async()=>{
   
    try{
      const res=await fetch(`${API_BASE_URL}/fetchlikestate?user=${searchid}&room=${roomdetais}`)
      if(!res.ok){
        console.log('something went wrong');
        return;
      }
      const data=await res.json()
    Setlikebyme(data.length>0)
    }catch(err){
      console.log(err);
    }
      }
      fetchlikestate()
},[searchid,roomdetais])
 useEffect(()=>{
  const fetchlikes=async()=>{
    if(!searchid && !roomdetais) return
    try{
      const res=await fetch(`${API_BASE_URL}/fetchlikes?room=${roomdetais}`)
      if(!res.ok){
        console.log('something went wrong');
        return;
      }
      const data=await res.json()
    SetlikeCount(data.roomlikenum)
    }catch(err){
      console.log(err);
    }
  }
  fetchlikes()
 },[searchid,roomdetais])
  
    const postroomlikes=async()=>{
      if(isMutating) return;
      Animated.sequence([
        Animated.timing(scaleAnim,{
          toValue:1.3,
          duration:150,
          useNativeDriver:true
        }),
Animated.timing(scaleAnim,{
  toValue:1,
  duration:150,
  useNativeDriver:true
})
      ]).start()
      const wasliked=likebyme;
      const willbeliked=!wasliked
      Setlikebyme(willbeliked)
      SetlikeCount(prev=>willbeliked?prev+1:Math.max(0,prev-1))
      SetisMutating(true)
      try{
        const sendstate=willbeliked?`addroomlikes`:`removeroomlikes`
        const res=await fetch(`${API_BASE_URL}/${sendstate}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({searchid,roomdetais})
        })
        if(!res.ok){
          console.log('Something is wrongb');
          return;
        }
      }catch(err){
console.log(err);
Setlikebyme(wasliked)
SetlikeCount(prev=>wasliked?prev+1:Math.max(0,prev-1))
      }finally{
        SetisMutating(false)
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
  const safeParse = (data) => {
    if (!data) return [];
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn("Failed to parse JSON:", data);
        return [];
      }
    }
    // Already an array
    if (Array.isArray(data)) return data;
  
    // Fallback for anything else
    return [];
  };
  
  const postImages = safeParse(item.postimage);
  const postVideos = safeParse(item.postvideo);
  
  
  
  
  
  
  
  
  
  return (
    <BlurView intensity={50} tint="dark" style={styles.post}>
      <View style={styles.userRow}>
        <Image source={{ uri: `${API_BASE_URL}/uploads/${item.image}` || 'https://via.placeholder.com/100' }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>{item.fullname}</Text>
          <Text style={styles.full} numberOfLines={1}>@{item.usersname}</Text>
            
          </View>
         
          <Text style={styles.time}>{getTimestamp(item.posted_at)}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{item.post ?item.post :''}</Text>
      {(postImages.length>0 || postVideos.length>0) &&(<View style={styles.mediacontainer}>
        {[...postImages,...postVideos].map((uri,index)=>{
const TotalItems=postImages.length + postVideos.length;
    const fullUri=`${API_BASE_URL}${uri}`;
    const isVideo=postVideos.some(vid=>vid===uri)
    let itemWidth = '100%'
    let itemHeight = 600
    
    if (TotalItems === 2) {
      itemWidth = '49.5%'
      itemHeight = 400
    }
    
    if (TotalItems === 3) {
      if (index === 2) {
        itemWidth = '100%'
        itemHeight = 320
      } else {
        itemWidth = '49.5%'
        itemHeight = 260
      }
    }
    
    if (TotalItems >= 4) {
      itemWidth = '49.5%'
      itemHeight = 260
    }
    
    return(
      <TouchableOpacity
      key={index}
      activeOpacity={0.8}
      style={[styles.mediaitem,{width:itemWidth,height:itemHeight}]}
      onPress={()=>{videoref.current?.pauseAsync()
        navigation.navigate('ViewImage',{imagevalue:fullUri,mediatype:isVideo?'video ':'image'})}
        }
      >
        {isVideo ?
        <Video
        source={{ uri: fullUri }}
        ref={videoref}
        style={styles.mediacontent}
        resizeMode="cover"
        useNativeControls
        shouldPlay={false}   // 🚫 no autoplay
        isLooping={false}    // 🚫 no loop
        isMuted={true}       // optional: keeps feed quiet
      />
      
       :(
          <Image
          source={{uri:fullUri}}
          resizeMode="cover"
          style={styles.mediacontent}
          />
        )}
        {TotalItems>4 && index===3 && (
          <View style={{...StyleSheet.absoluteFillObject,
          backgroundColor:'rgba(0,0,0,0.55)',justifyContent:'center',alignItems:'center'}}>
            <Text style={{color:'#fff',fontSize:28,fontWeight:'800'}}>{TotalItems-4}</Text>
          </View>
        )}
      </TouchableOpacity>
    )    
 })}
      </View>)}

     
      <View style={styles.reactions}>
      
        <TouchableOpacity onPress={postroomlikes}>
            <Animated.View style={{transform:[{scale:scaleAnim}]}}>
            <FontAwesome
        name={likebyme ? "heart" : "heart-o"}
        size={30}
        color={likebyme ? "#ff2ed8" : "#fff"}
      />
        </Animated.View> 
          <Text style={styles.reactText}> {likeCount}</Text>
        
          </TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText}>
    <FontAwesome name="comment-o" size={30} color="#fff" /> {item.reactions?.comment || 0}</Text></TouchableOpacity>
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
  const [roomimage,Setroomimage]=useState(null) 
  const [biomodal,Setbiomodal]=useState(false)
  const [biotext,Setbiotext]=useState("")
const [biostore,setbiostore]=useState(null)
const isAdmin=searchid===roomcreator
 
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    if (!searchid || !roomid) return;
  
    // join room
    socket.emit("joingrouproom", roomid);
  
    const onlineHandler = (count) => {
      setOnlineCount(count);
    };
  
    socket.on("online-count", onlineHandler);
  
    return () => {
      socket.emit("leavegrouproom", roomid); // important
      socket.off("online-count", onlineHandler);
    };
  }, [searchid, roomid]);
  
  
  useEffect(() => {
    if (!socket.current) return;
  
    socket.current.on("gottenbio", (data) => {
      setbiostore(data);
    });
  
    return () => { 
      socket.current.off("gottenbio");
    };
  }, [roomid]);
  // useEffect(()=>{
  //   if(!roomcreator || !isAdmin) return ;
  //   const fetchAdmin=async()=>{
  //     try{
  //       const res=await fetch(`${API_BASE_URL}/updateadminlogic`,{
  //         method:'POST',
  //         headers:{'Content-Type':'application/json'},
  //         body:JSON.stringify({searchid,roomid})
  //       })
  //       if(!res.ok){
  //         console.log('something went wrong trying to update ');
  //       }
  //     }catch(err){
  //       throw new Error(err)
  //     }
  //   }
  //  fetchAdmin()
  // },[searchid,roomid])
 
  useFocusEffect(
  useCallback(() => {
    const getRoomposts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getroom?roomid=${roomid}`);
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
  Setroomimage(data.room_image)
  setbiostore(data.roombio)
  
  }catch(err){
    throw new Error("An error occured",err)
  }
  
}
fetchroompicture()
},[roomid])
  useEffect(()=>{
    if(!socket && roomimage==!null) return;
    socket.on('getimage',(value)=>{
Setroomimage(value)
    })
    return()=>socket.off('getimage')
  })
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
  const openclosemodal=()=>{
    setOpenModal(false)
    Setbiomodal(true)
  }
  const handlebio = () => {
    if (!biotext.trim()) return;
    socket.emit('updatebio', biotext);
    Setbiomodal(false); // close modal after sending
  }
  const Leaveroom=async()=>{

  }
  return (
    <LinearGradient colors={["#0b0f14", "#111827"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
       
        <ImageBackground
  style={styles.header}
  source={
    roomimage
      ? { uri: `${API_BASE_URL}${roomimage}` }
      : {uri:`https://previews.123rf.com/images/krulua/krulua1705/krulua170500084/78397913-social-media-vector-background-network-concept.jpg`}
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
 
</ImageBackground>
       
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
        {/* List of Posts */}
        <FlatList
          data={postsarray}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostChild item={item} navigation={navigation} user={user} socket={socket}/>}
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
      <TouchableOpacity style={styles.modalItem} onPress={Leaveroom}>
        <Text style={styles.modaltext}> Leave Room</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.modalItem,!isAdmin &&{opacity:0.5}]} onPress={handleimage} disabled={!isAdmin}>
        <Text style={styles.modaltext}> Change Wallpaper</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.modalItem,!isAdmin &&{opacity:0.5}]}  disabled={!isAdmin}>
        <Text style={styles.modaltext}> Host Livespace</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.modalItem,!isAdmin &&{opacity:0.5}]} onPress={openclosemodal} disabled={!isAdmin}>
        <Text style={styles.modaltext}>Add room Bio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalItem}>
        <Text style={styles.modaltext}> Mute Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalItem} onPress={()=>navigation.navigate('MembersScreen',{roomid:roomid,roomname:roomname,roomcreator:roomcreator})}>
        <Text style={styles.modaltext}>View members </Text>
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
   marginHorizontal:16,
   marginTop:-32,
    padding: 20,
    borderRadius: 22,
    // Glassmorphism effect
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12, // Android shadow
    // Floating vibebb
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
    borderBottomColor:'#fff',
    borderBottomWidth:2
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  userInfo: {
    marginLeft: 10,
  },
  nameRow:{
    flexDirection:'row',
    alignItems:'center',
    gap:6
  },

  username: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 22,
    
  },
full:{
  color: 'rgba(255,255,255,0.45)',
  fontSize: 15,
  fontWeight:'500',
 
},
  time: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight:'400',
    marginTop: 2,
  },

  postText: {
    color: '#e5e7eb',
    fontSize: 16,
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
    flexWrap:'wrap',
    justifyContent:'space-between',
    paddingHorizontal:5,
    marginTop:8
  },
  mediaitem:{
    marginBottom:4,
    borderRadius:12,
    overflow:'hidden',
    backgroundColor:'#333'
  },
  mediacontent:{
width:'100%',
height:'100%',
borderRadius:12
  },
  center:{
    marginLeft:'33.5%'
  },
  
  roomBio: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    color: "rgba(203,213,225,0.95)",
  }
  
});


