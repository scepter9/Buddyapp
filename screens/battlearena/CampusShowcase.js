import React, { useRef, useState, useEffect, useContext ,useCallback} from "react";
import { View, Text, FlatList, Dimensions, TouchableOpacity,ScrollView, Image, StyleSheet, Animated ,Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform} from "react-native";
import { Video } from "expo-av";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {io} from "socket.io-client"
import { AuthorContext } from "../AuthorContext";
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import Slider from "@react-native-community/slider";



const API_BASE_URL = "http://192.168.0.136:3000";
const { height, width } = Dimensions.get("window");



const VideoItem = ({ item, navigation, onLikeUpdate, isActive, socket, userValue }) => {
  const videoRef = useRef(null);
  const animatedSize = useRef(new Animated.Value(1)).current;

  // const [pause, setPaused] = useState(false);
  const hideControlsRef = useRef(null);

  const [liked, setLiked] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  // const [playState,setPlayState]=useState(true);
  const [isPlaying,setIsplaying]=useState(false)
  const [slidershow,Setslidershow]=useState(false)
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const { user } = useContext(AuthorContext);
  const userId = user?.id;
  const userImage = user?.image;
  const username = user?.fullname;
  const watchRef = useRef({
    watchedEnough: false,
    decided: false,   // 🔑 this prevents multiple calls
  });
  
  useEffect(() => {
    watchRef.current = {
      watchedEnough: false,
      decided: false,
    };
  }, [item.id]);
  



  /*
  |--------------------------------------------------------------------------
  | 1. Load Fetch Like State
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!userId || !item.id) return;
  
    const fetchlike = async () => {
      try {
        const params = new URLSearchParams({
          user: userId,
          video: item.id,
        });
  
        const res = await fetch(`${API_BASE_URL}/Firstlikesearch?${params}`);
        const data = await res.json();
  
        setLiked(data.length > 0);
      } catch (err) {
        console.log("Like fetch error", err);
      }
    };
  
    fetchlike();
  }, [userId, item.id]);
  
  

   /*
  |--------------------------------------------------------------------------
  | 1. Load Local Like State
  |--------------------------------------------------------------------------
  */
  /*
  |--------------------------------------------------------------------------
  | 2. Handle Video Play/Pause When Active
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.playAsync();
      setIsplaying(true)
     
    } else {
      videoRef.current.stopAsync(); 
      setIsplaying(false)
      // Setslidershow(false)
      // prevents audio overlap
      if (!watchRef.current.decided) {
        watchRef.current.decided = true;
  
        if (!watchRef.current.watchedEnough) {
          Reduceaffinity({ user: userId, posterid: item.sender_id });
        }
      }
  
    }
  }, [isActive]);
// useEffect(()=>{
//   if(!slidershow) return
  
//     const setTheslide=setTimeout(() => {
//       Setslidershow(false)
//     },4000 );
 
//   return()=>clearTimeout(setTheslide)
// },[slidershow])
  /*
  |--------------------------------------------------------------------------
  | 3. Fetch Comments
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadComments = async () => {
      try {
        const params = new URLSearchParams({
          userId: userId,
          videovalue: item.id, 
        });

        const res = await fetch(`${API_BASE_URL}/fetchingcomment?${params.toString()}`);

        if (!res.ok) {
          console.log("Error fetching comments");
          return;
        }

        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.log("Comment fetch ERROR:", err);
      }
    };

    loadComments();
  }, [ item.id]);

  /*
  |--------------------------------------------------------------------------
  | 4. Join Comment Socket Room
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!socket || !item.id) return;
  
    // Always join room (even if already connected)
    if (socket.connected) {
      socket.emit("JoinComment", item.id);
    }
  
    // If connection happens later
    socket.on("connect", () => {
      socket.emit("JoinComment", item.id);
    });
  
    socket.on("NewComment", (value) => {
      const newMsg = {
        id: value.id,
        videoid: value.videoid,
        userid: value.userid,
        actaul_comment: value.actaul_comment,
        usersname: value.usersname,
        usersimage: value.usersimage,
      };
  
      setComments((prev) => [ ...prev,newMsg]);
      // onLikeUpdate?.(value.videoid, null, "comment");
    });
  
    return () => {
      socket.emit('LeaveComment',item.id);
      socket.off("connect");
      socket.off("NewComment");
    };
  }, [socket, item.id]);
  

  /*
  |--------------------------------------------------------------------------
  | 5. Like Animation
  |--------------------------------------------------------------------------
  */
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(animatedSize, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedSize, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /*
  |--------------------------------------------------------------------------
  | 6. Like Button Toggle
  |--------------------------------------------------------------------------
  */
  const toggleLike = async ({posteruser}) => {
    animateHeart();

    const newState = !liked;
    setLiked(newState);

    try {
      const endpoint = newState ? "postlikesincrease" : "postlikesdecrease";

      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: item.id, userValue, posteruser }),
      });

      if (!res.ok) return;

      const updatedLikes = newState ? item.likes + 1 : item.likes - 1;
      onLikeUpdate(item.id, updatedLikes);

     
    } catch (err) {
      console.log("Like Error:", err);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | 7. Send Comment
  |--------------------------------------------------------------------------
  */
  const sendComment = () => {
    if (!commentText.trim()) return;

    socket.emit("SendVideoComment", {
      videoo: item.id,
      user: userId,
      comment: commentText,
      usersimage: userImage,
      usersname: username,
    });
socket.emit('updateaffinity',{
  user:userId,
  posterid:item.sender_id

});
    setCommentText("");
  };

  /*
  |--------------------------------------------------------------------------
  | 8. Number Formatter
  |--------------------------------------------------------------------------
  */
  const formatNumber = (val) => {
    if (!val) return "0";
    if (val < 1000) return val.toString();
    if (val < 1000000) return (val / 1000).toFixed(1) + "k";
    return (val / 1000000).toFixed(1) + "m";
  };

  const Reduceaffinity=async({user,posterid})=>{
try{
  const res=await fetch(`${API_BASE_URL}/reducescore`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({user,posterid})
  })
  if(!res.ok){
    console.log('Something is wrong');
    return
  }
}catch(err){
  console.log('Something is wrong');
}
  }
  const sendAffinity=async({user,posterid})=>{
    try{
      const res=await fetch(`${API_BASE_URL}/increasescore`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user,posterid})
      })
      if(!res.ok){
        console.log('Something is wrong');
        return
      }
    }catch(err){
      console.log('Something is wrong');
    }
      }
  /*
  |--------------------------------------------------------------------------
  | Render Component
  |--------------------------------------------------------------------------
  */
 const showControlsTemporarily = () => {
  Setslidershow(true);

  if (hideControlsRef.current) {
    clearTimeout(hideControlsRef.current);
  }

  hideControlsRef.current = setTimeout(() => {
    Setslidershow(false);
  }, 5000);
};
const togglePlayPause = async () => {
  if (!videoRef.current) return;

  if (isPlaying) {
    await videoRef.current.pauseAsync();
    setIsplaying(false);
  } else {
    await videoRef.current.playAsync();
    setIsplaying(true);
    showControlsTemporarily();
  }
};


  return (
    <View style={{ height, width, backgroundColor: "#000" }}>
      <View style={{ flex: 1 }}>



      {/* -------- VIDEO -------- */}
      {item?.video && (
     
     
          <Video
            ref={videoRef}
            source={{ uri: `${API_BASE_URL}${item.video}` }}
            style={styles.video}
            resizeMode="contain"
            isLooping
         
            isMuted={false}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) return;
            
              if (!isSliding) {
                setPosition(status.positionMillis);
              }
            
              setDuration(status.durationMillis || 0);
            
              const watchedSeconds = status.positionMillis / 1000;
              const totalSeconds = status.durationMillis / 1000;
            
              if (watchedSeconds >= totalSeconds * 0.9) {
                watchRef.current.watchedEnough = true;
              }
            
              if (status.didJustFinish && !watchRef.current.decided) {
                watchRef.current.decided = true;
                watchRef.current.watchedEnough
                  ? sendAffinity({ user: userId, posterid: item.sender_id })
                  : Reduceaffinity({ user: userId, posterid: item.sender_id });
              }
            }}
          />
        
        
      )}
      <TouchableOpacity
      activeOpacity={1}
      style={StyleSheet.absoluteFill}
      onPress={togglePlayPause}
      
      
      />
{!isPlaying && (
  <TouchableOpacity
    activeOpacity={1}
    style={styles.play}
    onPress={async () => {
      await videoRef.current.playAsync();
      setIsplaying(true);
-     Setslidershow(true)
      showControlsTemporarily();
    }}
  >
    <FontAwesome name="play" size={50} color="#fff" />
  </TouchableOpacity>
)}

</View>
{slidershow && 
<View style={styles.sliderWrapper}>
  <Slider
  style={{ width: "100%", height: 40 }}
  minimumValue={0}
  maximumValue={duration}
  value={position}
  minimumTrackTintColor="#ff2ed8"
  maximumTrackTintColor="rgba(255,255,255,0.3)"
  thumbTintColor="#ff2ed8"

  onSlidingStart={() => setIsSliding(true)}

  onSlidingComplete={async (value) => {
    await videoRef.current.setPositionAsync(value);
    setPosition(value);
    setIsSliding(false);
  }}
/>
</View>
}
      {/* -------- INFO PANEL -------- */}
      <View style={styles.cyberBar}> 

{/* TOP ROW — profile + like + comment */}
<View style={styles.actionCyberRow}>

  {/* PROFILE */}
  <TouchableOpacity
    onPress={() => navigation.navigate("Profile", { userId: item.sender_id })}
    style={styles.cyberProfile}
  >
    <Image
      source={
        item.userimage
          ? { uri: `${API_BASE_URL}/uploads/${item.userimage}` }
          : null
      }
      style={styles.cyberAvatar}
    />
    <Text style={styles.cyberUsername}>@{item.username}</Text>
  </TouchableOpacity>

  {/* LIKE */}
  <TouchableOpacity onPress={() => toggleLike({ posteruser: item.sender_id })} style={styles.cyberAction}>

    <Animated.View style={{ transform: [{ scale: animatedSize }] }}>
      <FontAwesome
        name={liked ? "heart" : "heart-o"}
        size={30}
        color={liked ? "#ff2ed8" : "#fff"}
      />
    </Animated.View>
    <Text style={styles.cyberCount}>{formatNumber(item.likes)}</Text>
  </TouchableOpacity>

  {/* COMMENT */}
  <TouchableOpacity
    onPress={() => setOpenModal(true)}
    style={styles.cyberAction}
  >
    <FontAwesome name="comment-o" size={30} color="#fff" />
    <Text style={styles.cyberCount}>{comments.length}</Text>
  </TouchableOpacity>
</View>

{/* CAPTION BELOW */}
<View style={styles.captionContainer}>
  <ScrollView showsVerticalScrollIndicator={false}>
    <Text style={styles.cyberCaption}>{item.caption}</Text>
  </ScrollView>
</View>

</View>





      {/* -------- COMMENTS MODAL -------- */}
      <Modal visible={openModal} transparent animationType="slide">

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >

  <View style={styles.commentModalOverlay}>

    <View style={styles.commentModalSheet}>

      {/* HEADER */}
      <View style={styles.commentModalHeader}>
        <Text style={styles.commentModalTitle}>
          {comments.length} Comments
        </Text>
        <TouchableOpacity onPress={() => setOpenModal(false)}>
          <FontAwesome name="close" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item }) => (
          <View style={styles.singleCommentRow}>
            <Image
              source={
                item.usersimage
                  ? { uri: `${API_BASE_URL}/uploads/${item.usersimage}` }
                  : null
              }
              style={styles.singleCommentAvatar}
            />

            <View style={styles.singleCommentTextArea}>
              <Text style={styles.singleCommentUser}>{item.usersname}</Text>
              <Text style={styles.singleCommentText}>{item.actaul_comment}</Text>
            </View>
          </View>
        )}
      />

      {/* INPUT */}
      <View style={styles.commentInputWrapper}>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          style={styles.commentInputBox}
          placeholder="Add a comment..."
          placeholderTextColor="rgba(255,255,255,0.4)"
        />

        <TouchableOpacity onPress={sendComment}>
          <FontAwesome name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>

    
  </View>
  </View>
  </KeyboardAvoidingView>
</Modal>

      
    </View>
  );
};


export default function CampusShowcase({navigation,route}) {
  const {user}=useContext(AuthorContext);
  const myuserid=user?.id;
  const [videolikes, Setvideolikes] = useState([]);
const [activeIndex,setActiveIndex]=useState(0)
const [socket,setSocket]=useState(null);
const show = route?.params?.show || null;
const trending=route?.params?.trending

const [searchQuery,setSearchQuery]=useState('')

useEffect(() => {
  const getshowcasebyId = async () => {
    try {
      let response;

      // 🟣 PRIORITY 1: Search Query
      if (searchQuery.trim()) {
        response = await fetch(
          `${API_BASE_URL}/fetchsearchvideo?searchparams=${encodeURIComponent(searchQuery)}`
        );
      }

      // 🔵 PRIORITY 2: Showcase filter
      else if (show !== undefined && show !== null) {
        const details = new URLSearchParams({
          showcase: show,
          userId: myuserid,
        });
        response = await fetch(`${API_BASE_URL}/getshowcase?${details}`);
      }
//priority 3 :Trending
else if(trending!==undefined && trending!=null){
  response=await fetch(`${API_BASE_URL}/gettrendingbyuser`);
}
      // 🟢 PRIORITY 3: Default – fetch all
      else {
        response = await fetch(
          `${API_BASE_URL}/gettingvideo?userId=${myuserid}`
        );
      }

      if (!response.ok) {
        console.log("Something went wrong in fetching showcase");
        return;
      }

      const datavalue = await response.json();
      Setvideolikes(datavalue);
    } catch (err) {
      console.log("Something went wrong in fetching showcase ", err);
    }
  };

  getshowcasebyId();
}, [searchQuery, show]);

useEffect(()=>{
  const campusSocket=io(API_BASE_URL,{
    query:{userId:myuserid},
    transports:["websocket"]
  })
  setSocket(campusSocket)
  campusSocket.on('connect',()=>{
    console.log('User Connected');
  })
  return()=>campusSocket.disconnect()
},[])
 ;

  useEffect(() => {
    const enableAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,   // 🔥 force audio even in silent mode
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
      } catch (err) {
        console.log("AudioMode Error:", err);
      }
    };
  
    enableAudio();
  }, []);
  

  const videoLiking = (videoId, newLikeCount) => {
    Setvideolikes(prev =>
      prev.map(video => {
        if (video.id !== videoId) return video;
  
        // if (type === "comment") {
        //   return {
        //     ...video,
        //     comment_count: video.comment_count + 1
        //   };
        // }
  
        return {
          ...video,
          likes: newLikeCount
        };
      })
    );
  };
  


  const onViewableItemsChange = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;
  

  const viewConfigRef=useRef(({
    viewAreaCoveragePercentThreshold:80
  }))
  return (
<View>
{/* Top overlay container */}
<View style={styles.topOverlay}>
  <TouchableOpacity 
    style={styles.backButton} 
    onPress={() => navigation.goBack()}
  >
    <Text style={styles.backText}>←</Text>
  </TouchableOpacity>

  <View style={styles.searchBar}>
    <FontAwesome name="search" color="rgba(255,255,255,0.7)" size={20} style={{ marginRight: 10 }} />
    <TextInput
      value={searchQuery}
      onChangeText={setSearchQuery}
      style={styles.input}
      placeholder="Search by Username or Caption..."
      placeholderTextColor="rgba(255,255,255,0.6)"
    />
  </View>
</View>


    <FlatList
      data={videolikes}
      renderItem={({ item ,index}) => <VideoItem item={item} userValue={myuserid} navigation={navigation} onLikeUpdate={videoLiking} isActive={index===activeIndex} socket={socket}/>}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      keyExtractor={(item) => `active-${item?.id}`}
      onViewableItemsChanged={onViewableItemsChange}
      viewabilityConfig={viewConfigRef.current}
    
    />
    </View>
  );
}

const styles = StyleSheet.create({
  baba:{
    flex:1,
    backgroundColor:'transparent'
  },
  play: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 999,              // 🔥 force on top
    elevation: 10,            // 🔥 Android
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 50,
    padding: 20,
  },
  
  toprow:{
flexDirection:'row',
alignItems:'center',
justifyContent:'space-between'
  },
  iconRow:{
    flexDirection:'row',
    gap:10
  },
  video: {
    height: height * 0.85, // 85% of screen
    width: width,
    position: "absolute",
  },
  

  header: {
    position: "absolute",
    top: 40,
    left: 90,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.4)", // semi-transparent black
    borderRadius: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
 

  rightPanel: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform:[{translateX:-150}],
    paddingVertical: 10,
    paddingHorizontal:15,
    width:300,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
   
    // gap not needed in row layout
  },
  

  icon: {
    fontSize: 20,
    color: "#fff",
  },

  actionBtn: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 50,
  },
  actiontext:{
    color:'white',
    fontSize:18,
    position:'relative',
    top:10,
    left:10

  },

  bottomInfo: {
    position: "absolute",
    bottom: 60,
    left: 20,
    width: width * 0.75,
    padding:5
  },

  username: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },

  title: {
    color: "#fff",
    marginTop: 5,
    fontWeight: "600",
  },

  caption: {
    color: "#fff",
    marginTop: 5,
    opacity: 0.9,
  },
 
 
  
image:{
  width: 50,
  height: 50,
  borderRadius: 25,
},

 commenthead:{
  flexDirection:'row',
  alignItems:'center',
  padding:10,
  margin:10,
 },
 commentimage:{
  width:40,
  height:40,
  borderRadius:20
 },
 modalOverlay: {
  flex: 1,
  // backgroundColor: "rgba(0,0,0,0.5)",
  backgroundColor:'#2a2a3c',
  justifyContent: "flex-end",
},

modalSheet: {
  height: "70%",
  width: "100%",
  backgroundColor:'#2a2a3c',
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  backdropFilter: "blur(25px)",
  paddingHorizontal: 18,
  paddingTop: 12,
  paddingBottom: 20,
  borderColor: "#2a2a3c",
  borderWidth: 1,
},

modalHandle: {
  width: 55,
  height: 5,
  backgroundColor: "#2a2a3c",
  borderRadius: 10,
  alignSelf: "center",
  marginBottom: 10,
},

modalTitle: {
  flex: 1,
  textAlign: "center",
  color: "white",
  fontSize: 20,
  fontWeight: "700",
},


commentItem: {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 14,
},

commentAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#222",
},

commentTextArea: {
  flex: 1,
},

commentUser: {
  color: "white",
  fontWeight: "700",
  marginBottom: 2,
  fontSize: 14,
},

commentText: {
  color: "rgba(255,255,255,0.8)",
  fontSize: 13,
},

inputWrapper: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: 15,
  paddingVertical: 10,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.35)",
  borderTopColor: "rgba(255,255,255,0.1)",
  borderTopWidth: 1,
},

inputBox: {
  flex: 1,
  height: 44,
  paddingHorizontal: 14,
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.07)",
  color: "white",
  fontSize: 14,
},

sendBtn: {
  padding: 10,
  marginLeft: 10,
},
modalHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
},

closeBtn: {
  padding: 6,
},
topOverlay: {
  position: "absolute",
  top: 40, // spacing from top
  left: 0,
  right: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 15,
  zIndex: 99,
},

backButton: {
  backgroundColor: "rgba(0,0,0,0.3)",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 25,
},

backText: {
  fontSize: 30,
  fontWeight: "700",
  color: "#fff",
},

searchBar: {
  flex: 1,
  marginLeft: 10, // spacing from back button
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 25,
  backgroundColor: "rgba(0,0,0,0.3)",
},
input: {
  flex: 1,
  color: "#fff",
  fontSize: 16,
},

//modal styling
  commentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  commentModalSheet: {
    height: "70%",
    width: "100%",
    backgroundColor: "rgba(20,20,20,0.95)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },

  commentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  commentModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },

  singleCommentRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 0.4,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  singleCommentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 50,
    backgroundColor: "#333",
  },

  singleCommentTextArea: {
    flex: 1,
  },

  singleCommentUser: {
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
    fontSize: 15,
  },

  singleCommentText: {
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
    fontSize: 14,
  },

  commentInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 10,
  },

  commentInputBox: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
//Action section styling 
cyberBar: {
  position: "absolute",
  bottom: 20,
  left: 0,
  right: 0,
  paddingVertical: 14,
  paddingHorizontal: 22,

  backgroundColor: "rgba(10,10,20,0.65)",
  borderRadius: 20,

  // neon outline
  borderWidth: 1.2,
  borderColor: "rgba(0, 255, 190, 0.4)",

  // glow
  shadowColor: "#00f2ff",
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 0 },
},

actionCyberRow: {
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  justifyContent: "space-between",
},

cyberProfile: {
  alignItems: "center",
  justifyContent: "center",
  marginRight: 6,
},

cyberAvatar: {
  width: 50,
  height: 50,
  borderRadius: 50,
  backgroundColor: "#333",
  borderWidth: 2,
  borderColor: "#ff2ed8",
},

cyberUsername: {
  marginTop: 4,
  color: "#fff",
  fontSize: 13,
  fontWeight: "700",
  textShadowColor: "#ff2ed870",
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 6,
},

cyberAction: {
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
},

cyberCount: {
  marginTop: 3,
  color: "#d0faff",
  fontSize: 14,
  fontWeight: "600",
  textShadowColor: "#00eaff70",
  textShadowRadius: 4,
},

cyberCaption: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
  opacity: 0.95,
  letterSpacing: 0.3,
  textShadowColor: "#ff003c80",
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 5,
},

captionContainer: {
  marginTop: 10,
  maxHeight: 80,
  width: "100%",
},
sliderWrapper:{
  position:'absolute',
  bottom:140,
  width:'100%',
  paddingHorizontal:15,
  zIndex:20,
}

});
