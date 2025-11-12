// NewPostScreen.jsx
import React, { useRef ,useContext, useEffect, useState} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ImageBackground,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext"
import * as ImagePicker from 'expo-image-picker';
import { io } from "socket.io-client";
const API_BASE_URL = "http://192.168.0.136:3000";
const { width } = Dimensions.get("window");

export default function NewPostScreen({navigation,route}) {
  const {room}=route.params;
  const {user}=useContext(AuthorContext)
  const searchid=user?.id;
useEffect(()=>{
  const postsocket=io(API_BASE_URL,{
    query:{userId:searchid},
transports:['websocket']
  });
  setSocket(postsocket);
  postsocket.on('connect',()=>{
    console.log('User Connected');
  })
  postsocket.emit('Joinroom',searchid)
  return()=>postsocket.disconnect();
},[])
  
    const [userProfile,setUserProfile]=useState(null)
   
    const [posttext,Setposttext]=useState('');
    const [socket,setSocket]=useState(null)
    const [display,setdisplay]=useState(false)
    const [image,setimage]=useState(null)

const {roomid}=route.params;

    useEffect(()=>{
        const fetchsendPost=async()=>{
            try{
                const res=await fetch(`${API_BASE_URL}/users/${searchid}`);
                if(!res.ok){
                    console.log('Something went wrong ');
                    return;
                }
                const data=await res.json();
                setUserProfile(data)
            }catch(err){
                console.log('Something went wrong');
                return;
            }
        }
        fetchsendPost();
        },[])
        useEffect(()=>{
          if(!socket) return;
          const handleResend = (url)=> setimage(url);
          socket.on('Resend', handleResend);
        
          return ()=>socket.off('Resend', handleResend);
        },[socket])
        
        const postNewtext=async()=>{
            try{
const response=await fetch(`${API_BASE_URL}/postnewtextval`,{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({searchid,posttext,roomid,image})

})
if(!response.ok){
    console.log('Something went wrong ');
    return;
}
            }catch(err){
                console.log('Something went wrong ');
            }
        };

        const handleimage=async()=>{
          const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();
          if(status !=='granted'){
            Alert.alert('Access Required to access photo');
            return;
          }
          let result=await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing:false,
            quality:1
          });
          if(result.canceled || !result.assets || result.assets.length===0) return;
          const asset=result.assets[0];
          const imageUri=asset.uri;
          const filename = asset.fileName || imageUri.split("/").pop() || "photo.jpg";
        const fileType = asset.type || "image/jpeg";

        try {
          const formData = new FormData();
          formData.append("image", {
            uri: imageUri,
            name: filename,   // ✅ dynamic name
            type: fileType,   // ✅ dynamic MIME type
          });
      
          const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
            method: "POST",
            body: formData,
            // headers: {
            //   "Content-Type": "multipart/form-data",
            // },
          });
      
          const uploadResult = await uploadResponse.json();
          if (!uploadResult.imageUrl) throw new Error("Upload failed");
      
          const uploadedImageUrl = uploadResult.imageUrl;
          if(!socket) return;
          socket.emit('SendImage',{
          image:uploadedImageUrl,
          userI:searchid
          })
       
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Upload failed", "Please try again.");
        }finally{
          setdisplay(true)
        }
        }



  const pulse = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // subtle pulsing background animation
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]),
  ).start();

  const onPressIn = () => {
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  // interpolate the pulse for scale and shadow
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <LinearGradient
        colors={["#0f1a2c", "#0a1320", "#050912"]}
        style={styles.bg}
      >
        {/* Soft neon glows (animated) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowCircle,
            {
              backgroundColor: "#00d9ff",
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }, { translateX: -width * 0.1 }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowCircleRight,
            {
              backgroundColor: "#8a2be2",
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />

        {/* Composer Card */}
        <BlurView intensity={80} tint="dark" style={styles.composerWrap}>
        {userProfile && (
  <View style={styles.header}>
    <Image
      source={{ uri: `${API_BASE_URL}/uploads/${userProfile.image}` }}
      style={styles.avatar}
    />
    <View style={styles.user}>
      <Text style={styles.username}>{userProfile.name}</Text>
      <Text style={styles.handle}>{userProfile.email}</Text>
    </View>
  </View>
)}


          <TextInput
          value={posttext}
          onChangeText={Setposttext}
            placeholder="What's inspiring you today? ✨ #DesignersHub"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            numberOfLines={6}
          />
          {display && (
<ImageBackground
source={{uri:image ? image: null}}
style={styles.storyImage}
imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
>
  <TouchableOpacity onPress={()=>setdisplay(false)}>
  <Text style={styles.cancelstyle}>Cancel</Text>
  </TouchableOpacity>
</ImageBackground>
          )}
          <View style={styles.toolbar}>
            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={handleimage}>
                <Text style={styles.iconEmoji}>🖼️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                <Text style={styles.iconEmoji}>📎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                <Text style={styles.iconEmoji}>📍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                <Text style={styles.iconEmoji}>🎨</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.postBtnWrapper}
                onPress={postNewtext}
              >
                <LinearGradient
                  colors={["#00d9ff", "#8a2be2"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.postBtn}
                >
                  <Text style={styles.postBtnText}>Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </BlurView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  cancelstyle:{
    position:'absolute',
    top:10,
    right:5,
    backgroundColor:'red',
    fontSize:24
  },
  safe: { flex: 1 },
  bg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircle: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -80,
    left: -80,
    opacity: 0.12,
    zIndex: 0,
  },
  glowCircleRight: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    bottom: -100,
    right: -60,
    opacity: 0.12,
    zIndex: 0,
  },

  composerWrap: {
    width: "92%",
    maxWidth: 720,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    zIndex: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#00d9ff",
  },
  user: {
    justifyContent: "center",
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  handle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },

  textarea: {
    minHeight: 120,
    maxHeight: 280,
    color: "#eaf6ff",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 8,
  },

  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  iconEmoji: {
    fontSize: 20,
    opacity: 0.95,
  },

  postBtnWrapper: {
    borderRadius: 18,
    overflow: "hidden",
  },
  postBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    elevation: 3,
    shadowColor: "#00d9ff",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  postBtnText: {
    color: "#031426",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
});
