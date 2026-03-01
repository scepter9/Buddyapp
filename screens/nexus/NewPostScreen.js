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
  TouchableWithoutFeedback,
  Alert,
  Keyboard,
  ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext"
import * as ImagePicker from 'expo-image-picker';
import { io } from "socket.io-client";
import { Video } from "expo-av";
const API_BASE_URL = "http://192.168.0.136:3000";
const { width } = Dimensions.get("window");
import { Feather } from "@expo/vector-icons";




export default function NewPostScreen({navigation,route}) {

  const {user}=useContext(AuthorContext)
  const searchid=user?.id;

  const socketref=useRef(null)
    const [userProfile,setUserProfile]=useState(null)
   
    const [posttext,Setposttext]=useState('');

 const maxMedia=5;
 const maxVideo=2;
const [images,Setimages]=useState([])
const [videos,SetVideos]=useState([])
const [displayimage,setdisplayimage]=useState(false)
const [displayvideo,setdisplayvid]=useState(false)
useEffect(()=>{
  const postroominsocket=io(API_BASE_URL,{
    query:{userId:searchid},
    transports:['websocket']
  })
  socketref.current=postroominsocket
  postroominsocket.off()
},[searchid])

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
   
        
        const postNewtext = async () => {
          const roomid = route?.params?.roomid ;
          if (!roomid) {
            console.log('Room ID is missing, cannot post');
            return;
          }
          
          try {
            // block empty post
            if (!posttext && images.length === 0 && videos.length === 0) return;
        
            let sentimage = [];
            let sentvideo = [];
        
            /* ---------- UPLOAD IMAGES ---------- */
            if (images.length > 0) {
              const formData1 = new FormData();
        
              images.forEach((image, index) => {
                formData1.append("images", {
                  uri: image.uri,
                  name: image.name || `image_${index}.jpg`,
                  type: image.type || "image/jpeg",
                });
              });
        
              const Postimage = await fetch(`${API_BASE_URL}/api/uploads/images`, {
                method: "POST",
                body: formData1,
              });
        
              if (!Postimage.ok) throw new Error("Image upload failed");
        
              const Postimagedata = await Postimage.json();
              sentimage = Postimagedata.imageUrls || [];
            }
        
            /* ---------- UPLOAD VIDEOS ---------- */
            if (videos.length > 0) {
              const formData2 = new FormData();
        
              videos.forEach((video, index) => {
                formData2.append("videos", {
                  uri: video.uri,
                  name: video.name || `video_${index}.mp4`,
                  type: video.type || "video/mp4",
                });
              });
        
              const Postvideo = await fetch(`${API_BASE_URL}/api/uploads/videos`, {
                method: "POST",
                body: formData2,
              });
        
              if (!Postvideo.ok) throw new Error("Video upload failed");
        
              const Postvideodata = await Postvideo.json();
              sentvideo = Postvideodata.videoUrls || [];
            }
           
        
            /* ---------- CREATE POST ---------- */
            const res = await fetch(`${API_BASE_URL}/postscreen`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                searchid,
                roomid,
                posttext,
                sentimage,
                sentvideo,
              }),
            });
        
            if (!res.ok) throw new Error("Post creation failed");
        
          } catch (err) {
            console.log("Posting failed:", err.message);
          }finally{
          navigation.goBack()
          }
        };
        
   
    

        const handleimage = async () => {
          try {
            if (images.length >= maxMedia) {
              Alert.alert("You have reached your max media limit");
              return;
            }
        
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Access required to access photos");
              return;
            }
        
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              allowsMultipleSelection: true,
              quality: 1,
            });
        
            if (result.canceled || !result.assets?.length) return;
        
            const remainingSlots = maxMedia - images.length;
        
            const pickedImages = result.assets
              .slice(0, remainingSlots)
              .map((asset) => ({
                uri: asset.uri,
                name: asset.fileName || asset.uri.split("/").pop(),
                type: asset.type || "image/jpeg",
              }));
        
            Setimages((prev) => [...prev, ...pickedImages]);
            

            setdisplayimage(true);
        
          } catch (err) {
            console.log("Image picker error:", err);
          }
        };
        
        const openFile = async () => {
          try {
            if (videos.length >= maxVideo) {
              Alert.alert("You have reached your video limit");
              return;
            }
        
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission required to access videos");
              return;
            }
        
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsEditing: false,
              allowsMultipleSelection: true,
            });
        
            if (result.canceled || !result.assets?.length) return;
        
            const remainingSlots = maxVideo - videos.length;
        
            const pickedVideos = result.assets
              .slice(0, remainingSlots)
              .map((asset) => ({
                uri: asset.uri,
                name: asset.fileName || "video.mp4",
                type: asset.type || "video/mp4",
              }));
        
            SetVideos((prev) => [...prev, ...pickedVideos]);
            setdisplayvid(true);
        
          } catch (err) {
            console.log("Video picker error:", err);
          }
        };
        
         
          

  const pulse = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // subtle pulsing background animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

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

<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 10 }}
>

  {displayimage &&
  images.map((img, index) => (
    <View key={index} style={styles.previewCard}>
      <Image source={{ uri: img.uri }} style={styles.previewImage} />

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() =>
          Setimages(prev => prev.filter((_, i) => i !== index))
        }
      >
        <Text>✕</Text>
      </TouchableOpacity>
    </View>
  ))}
  {displayvideo && 
  videos.map((img, index) => (
    <View key={index} style={styles.previewCard}>
      <Video source={{ uri:img.uri }} style={styles.previewVideo} isLooping={true} useNativeControls={true}/>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() =>
          SetVideos(prev => prev.filter((_, i) => i !== index))
        }
      >
        <Text>✕</Text>
      </TouchableOpacity>
    </View>
  ))
  }
</ScrollView>


          <TextInput
          value={posttext}
          onChangeText={Setposttext}
            placeholder="What's inspiring you today? ✨ "
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            numberOfLines={6}
          />
          
          
          <View style={styles.toolbar}>
            <View style={styles.iconRow}>
              <TouchableOpacity style={[styles.iconBtn,images.length>=maxMedia && {opacity:0.5}]} activeOpacity={0.8} onPress={handleimage} disabled={images.length>=maxMedia}>
                <Text style={styles.iconEmoji}>  <Feather name="image" size={22} color="#fff" /></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn,videos.length>=maxVideo &&{opacity:0.5}]} activeOpacity={0.8} onPress={openFile} disabled={videos.length>=maxVideo}>
                <Text style={styles.iconEmoji}><Feather name="video" size={22} color="#fff" /></Text>
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
                <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.postBtnWrapper}
                onPress={()=>navigation.goBack()}
              >
                <LinearGradient
                  colors={["#1f1f2e", "#2a2a3c"]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.postBtn}
                >
                  <Text style={styles.postBtnTexta}>Cancel</Text>

                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </BlurView>
      </LinearGradient>
      </TouchableWithoutFeedback>
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
  postBtnTexta: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  previewContainer: {
    width: "100%",
    marginTop: 10,
    marginBottom: 6,
  },
  
  previewCard: {
    width: 220, // 🔥 REQUIRED for horizontal scrolling
    height: 240,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(10,18,32,0.9)",
    marginRight: 14,
    position: "relative",
  },
  
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  
  
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:"#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  
  closeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  
});
