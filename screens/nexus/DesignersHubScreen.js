import React, { useEffect, useState, useContext, useMemo ,useRef, useCallback, Activity} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Share,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  PanResponder
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from "expo-blur";
import { AuthorContext } from "../AuthorContext";
import { Ionicons } from "@expo/vector-icons";
import socket from '../Socket'
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = "http://192.168.0.136:3000";
import { io } from "socket.io-client";

import { Video } from "expo-av";
function TheComments({ item ,onSelect,onSelectidforindex,onremove,thepostid,Roomid,isAdminstate}) {
  const {user}=useContext(AuthorContext)
  const userisId=user?.id
  const commentid=item.id;
  const [likebyme,Setlikebyme]=useState(Boolean(item.likestate))
const [likeCount,SetlikeCount]=useState(item.likecount ?? 0)
const [isMutating,SetisMutating]=useState(false)
const scaleAnim=useRef(new Animated.Value(1)).current;
const translateX=useRef(new Animated.Value(0)).current;

 const canDeleteRef=useRef(null)
 useEffect(()=>{
  canDeleteRef.current=Number(item.sender_id)===Number(userisId) || isAdminstate
 },[item.sender_id,userisId,isAdminstate])
const eraseComment=async()=>{
  try{
    const res=await fetch(`${API_BASE_URL}/removeroomcomment`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({commentid,thepostid,Roomid})
    })
    if(!res.ok){
      console.log('An error occured deleting roomcomment');
      return;
    }
    onremove(commentid)
  }catch(err){
    console.log('An error occured deleting roomcomment',err);
      return;
  }
}
  // useEffect(() => {
  //   if(!Showpost) return;
  //   SetlikeCount();        
  //   Setlikebyme();    
  // }, [item.likecount, item.likestate]);
    
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
          const sendstate=willbeliked?`addcommentroomlikes`:`removecommentroomlikes`
          const res=await fetch(`${API_BASE_URL}/${sendstate}`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({userisId,commentid})
          })
          if(!res.ok){
            console.log('Something is wrong');
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
  const timestamp = (time) => {
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
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
  };

const panResponse=useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder:(_,gesture)=>{
if(!canDeleteRef.current) return false
return gesture.dx>5
    },
    onPanResponderMove:(_,gesture)=>{
      if(gesture.dx>0 && gesture.dx<=100){
        translateX.setValue(gesture.dx)
      }
    },
    onPanResponderRelease:(_,gesture)=>{
      if(gesture.dx >60){
        Animated.timing(translateX,{
          toValue:100,
          duration:200,
          useNativeDriver:true
        }).start(()=>eraseComment())
      }else{
        Animated.spring(translateX,{
          toValue:0,
          useNativeDriver:true
        }).start()
      }
    }

  })
).current;
  return (
<View style={styles.cmRootShell}>
  <View style={styles.Deletecontain}>
    <FontAwesome name="trash" color="#fff"/>
  </View>
<Animated.View {...panResponse.panHandlers}style={[styles.cmRootShellswipe,{transform:[{translateX}]
  }]}>
<View style={styles.cmPrimaryLane}>
  <Image source={{uri:`${API_BASE_URL}/uploads/${item.image}`} } style={styles.cmAvatarOrb}/>

  <View style={styles.cmContentColumn}>

    <View style={styles.cmTopRow}>
      <View style={styles.cmTextColumn}>
        <Text style={styles.cmHandleText}>{item.usersfull}</Text>
        {item.replyid && (
  <TouchableOpacity
    onPress={() => onSelectidforindex(item.replyid)}
    style={styles.replyPreviewBubble}
    activeOpacity={0.8}
  >
    <Text style={styles.replyLabel}>
      Replied to
    </Text>

    <View style={styles.replyUserRow}>
      <Image
        source={{ uri: `${API_BASE_URL}/uploads/${item.replyUserImage}` }}
        style={styles.replyPreviewAvatar}
      />
      <Text style={styles.replyPreviewName}>
        {item.replyUserName}:   <Text numberOfLines={1} ellipsizeMode="tail" style={styles.replyPreviewNamee}>
        {item.replytext}
      </Text>
      </Text>
    </View>
  </TouchableOpacity>
)}
        <Text style={styles.cmMessageBody}>{item.commenttext}</Text>
      </View>
      <View style={{flexDirection:'row', alignItems:'center' }}>
        <TouchableOpacity style={{padding:8}} onPress={()=>onSelect(item.id,item.usersfull,item.senderid,item.commenttext)} >
          <Ionicons
          name="arrow-redo-outline"// for the reply
          color='#fff'
          size={20}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cmPulseButton} onPress={postroomlikes}>
  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
    <FontAwesome
      name={likebyme ? "heart" : "heart-o"}
      size={20}
      color={likebyme ? "#ff2ed8" : "#fff"}
    />
  </Animated.View>

  <Text style={styles.cmPulseCount}>{likeCount}</Text>
</TouchableOpacity>
      
      </View>
    </View>

<Text style={styles.cmTimestamp}>{timestamp(item.posted_at)} </Text>
  </View>
</View>
</Animated.View>
  </View>
  );
}
const MemoizeThecomments=React.memo(TheComments)
// Separate Component for Post Items
const PostChild = ({ item ,user,navigation,Roomid,Adminstate,onDelete}) => {
  const searchid = user?.id;
  const roomdetais=item.id
  const videoref=useRef(null)
const [likebyme,Setlikebyme]=useState(false)
const [likeCount,SetlikeCount]=useState(0)
const [isMutating,SetisMutating]=useState(false)
const [postcomment,SetPostcomment]=useState([])
const [commentmodal,Setcommentmodal]=useState(false)
const [commentText,setcommentText]=useState("")
const scaleAnim=useRef(new Animated.Value(1)).current;
const FlatListRef=useRef(null)
const isUser=item.sender_id===searchid;
const [selectedValue,setselectedValues]=useState(null);
const postcommentRef=useRef(postcomment)
const scrollOffset = useRef(0);
const [hasmore,Sethasmore]=useState(true)
const [Loadingmore,setLoadingmore]=useState(false)
const init=useRef(true)
const [Showpost,setShowpost]=useState(false)
const showkey=`${searchid}-showkey`;
const [showswipehint,Setshowswipehint]=useState(false)
useEffect(()=>{
  const showstate=AsyncStorage.getItem(showkey)
  if(!showstate){
    Setshowswipehint(true)
    AsyncStorage.setItem(showkey,`thekey-${searchid}`)
  }else{
    return;
  }
},[])
useEffect(()=>{
  postcommentRef.current=postcomment;
},[postcomment])
const setUser=useCallback((id,name,userid,thetext)=>{
  setselectedValues({
    commentupdateid:id,
    usersname:name,
    replyuserId:userid,
    replyusertext:thetext
  })
},[]);
const setuserindex = useCallback((theid)=>{
  if(!theid) return;

  const theIndex = postcomment.findIndex(user=>user.id===theid)

  if(theIndex !== -1){
    FlatListRef.current?.scrollToIndex({
      index: theIndex,
      animated: true,
      viewPosition: 0.3
    })
  }
},[postcomment])
const setBacktouser=()=>{
FlatListRef.current?.scrollToOffset({
  offset:currentOffset,
  animated:true
})
}
useEffect(()=>{
  if(!searchid || !roomdetais) return;
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
    if(!searchid || !roomdetais) return
    try{
      const res=await fetch(`${API_BASE_URL}/fetchlikes?room=${roomdetais}`)
      if(!res.ok){
        console.log('something went wrong');
        return;
      }
      const data=await res.json()
    SetlikeCount(data.count)
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
          console.log('Something is wrong');
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
    const formatNumber = (val) => {
      if (!val) return "0";
      if (val < 1000) return val.toString();
      if (val < 1000000) return (val / 1000).toFixed(1) + "k";
      return (val / 1000000).toFixed(1) + "m";
    };
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
  const renderComment=useCallback(({item})=>(
    <MemoizeThecomments
    item={item}
    userisId={searchid} onSelect={setUser} onSelectidforindex={setuserindex} thepostid={roomdetais} 
    Roomid={Roomid} onremove={(id)=>SetPostcomment(prev=>prev.filter(a=>a.id!==id)) }
    isAdminstate={Adminstate}/>
  ),[setUser,setuserindex,searchid])
  
  const postImages = safeParse(item.postimage);
  const postVideos = safeParse(item.postvideo);
  
  useEffect(()=>{
    if(!socket) return;
  
    const handler = (data) => {
      if(data.postid === roomdetais ){
        SetPostcomment(prev => [...prev, data.newComment])
      }
    }
  
    socket.on('ReleaseComment', handler);
  
    return () => {
      socket.off('ReleaseComment', handler);
    }
  },[roomdetais])
  
  
  useEffect(()=>{
    
    const fetchPostComment=async()=>{
      if(Showpost) return;
      setShowpost(true)
      try{
        const res=await fetch(`${API_BASE_URL}/fetchpostcomment?postid=${roomdetais}&roomid=${Roomid}&userIs=${searchid}`);
        if(!res.ok){
          console.log('Something went wrong fetching comment for a room');
          return;
        }
        const data=await res.json()
        SetPostcomment(data)
        
       
        setShowpost(false)
      }catch(err){
        console.log(err);
        return;
      }
    }
    fetchPostComment()
  },[roomdetais,Roomid])
  const Loadingoldercomment=async()=>{
    try{
    if(Loadingmore || !hasmore) return;
 setLoadingmore(true)
  const lastposted=postcomment[postcomment.length-1].posted_at
const res=await fetch(`${API_BASE_URL}/getcommentolder?lasttime=${lastposted}&postid=${roomdetais}&roomid=${Roomid}&userIs=${searchid}`)
if(!res.ok){
  console.log(`Something went wrong `);
  return;
}
const data=await res.json();
if(data.length===0){ 
  Sethasmore(false)
}
  else{
SetPostcomment(prev=>[...prev,...data])
}
}finally{
setLoadingmore(false)
}
}
  const handleComment=()=>{
    Keyboard.dismiss()
    if(!socket || commentText.trim()==='') return;
    const commentval={
      postid:roomdetais,
      roomid:Roomid,
      usersId:searchid,
      comment:commentText,
      replycommentid: selectedValue?.commentupdateid ?? null,
      replyusersid: selectedValue?.replyuserId ?? null,
      replyuserstext: selectedValue?.replyusertext ?? null,
    }
    socket.emit('RoomComment',commentval)
    setcommentText('')
  }
  
  const DeletePost=async()=>{
    try{
      const res=await fetch(`${API_BASE_URL}/deleteroompostlogic`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roomdetais,searchid})
      })
      if(!res.ok){
        console.log(`Something went wrong deleting room posts`);
        return;
      }
      onDelete(roomdetais)
    }catch(err){
      console.log(`Something went wrong deleting room posts`);
    }
  }
  const shareLogic=async()=>{
    await Share.share({
      message:'Check this Post '
    })
  }
  
  useEffect(() => {
    if(init.current){
      init.current=false;
      return;
    }
    FlatListRef.current?.scrollToEnd({ animated: true });
  }, [postcomment.length]);
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
        {(isUser || Adminstate) && (
  <TouchableOpacity
    style={{
      paddingHorizontal: 12,
      paddingVertical: 8,
     
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 80,
      marginLeft:30
     
    }}
    onPress={DeletePost}
  >
    <Ionicons name="trash-outline" size={20} color="#dc2626"/>
  </TouchableOpacity>
)}
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
      
      <TouchableOpacity style={{flexDirection:'row', alignItems:'center', gap:4}} onPress={postroomlikes}>
  <Animated.View style={{transform:[{scale:scaleAnim}]}}>
  <Ionicons
      name={likebyme ? "arrow-up-circle" : "arrow-up-circle-outline"}
      size={35}
      color={likebyme ? "#FF9500" : "#aaa"}
    />
  </Animated.View>
  <Text style={styles.reactText}>{formatNumber(likeCount)}</Text>
</TouchableOpacity>
        <TouchableOpacity><Text style={styles.reactText} onPress={()=>Setcommentmodal(true)}>
   <Ionicons name="chatbubbles"size={32} color='#aaa' /> {formatNumber(postcomment.length)}</Text></TouchableOpacity>


 
         <TouchableOpacity onPress={shareLogic}><Text style={styles.reactText}><Ionicons name="repeat-outline" size={32} color='#aaa'/>
         {item.reactions?.share || 0}</Text></TouchableOpacity>

         <Modal
visible={commentmodal}
animationType="slide"
onRequestClose={() => Setcommentmodal(false)}
transparent
>
<KeyboardAvoidingView
style={{ flex: 1 }}
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
>
<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>

{/* Dismiss backdrop */}
<Pressable
style={{ flex: 1 }}
onPress={() => Setcommentmodal(false)}
/>

{/* Modal Content */}
<View style={styles.commentModalll}>

{/* Header */}
<View style={styles.grabber} />
<View style={styles.modalContentheader}>
<Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
{postcomment.length} Comments
</Text>
<Pressable onPress={() => Setcommentmodal(false)} style={{ position: 'absolute', right: 10 }}>
<Ionicons name="close" size={22} color="#fff" />
</Pressable>
</View>
{showswipehint && (
  <View style={styles.showswipebanner}>
    <Ionicons name="arrow-forward" size={14} color="#fff"/>
    <Text style={styles.showswipetext}> Swipe right to delete {Adminstate?`a`:`your`} comment</Text>
  </View>
)}
{/* Comments List */}
<FlatList
ref={FlatListRef}
data={postcomment}
keyExtractor={(item) => `active-${item.id}`}
renderItem={renderComment}

showsVerticalScrollIndicator={false}
onEndReached={Loadingoldercomment}
onEndReachedThreshold={0.5}
initialNumToRender={10}
maxToRenderPerBatch={10}
windowSize={5}
removeClippedSubviews={true}
contentContainerStyle={{ paddingBottom: 10 }}
ListFooterComponent={Loadingmore?<ActivityIndicator/>:null}
style={{ flex: 1 }}
/>

{/* Reply tag + Input */}
<View style={{
paddingHorizontal: 12,
paddingTop: 8,
paddingBottom: Platform.OS === 'ios' ? 24 : 16, // ← safe bottom padding
borderTopWidth: StyleSheet.hairlineWidth,
borderTopColor: 'rgba(255,255,255,0.08)',
gap: 6,
}}>
{selectedValue && (
<View style={styles.replyTag}>
<View style={styles.replyTagContent}>
<Ionicons name="arrow-undo-outline" size={14} color="#6D5BFF" />
<Text style={styles.replyText}>
Replying to <Text style={{ fontWeight: '600' }}>{selectedValue.usersname}</Text>
</Text>
</View>
<TouchableOpacity onPress={() => setselectedValues(null)}>
<Ionicons name="close" size={18} color="#999" />
</TouchableOpacity>
</View>
)}

<View style={styles.inputBar}>
<TextInput
value={commentText}
onChangeText={setcommentText}
multiline
placeholder="Type a comment..."
style={styles.inputText}
placeholderTextColor="#666"
blurOnSubmit={false}
returnKeyType="send"
onSubmitEditing={handleComment}
/>
<Pressable
onPress={handleComment}
style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.4 }]}
disabled={!commentText.trim()}
>
<Ionicons name="send" size={18} color="#fff" />
</Pressable>
</View>
</View>

</View>
</View>
</KeyboardAvoidingView>
</Modal>

      </View>
    </BlurView>
  );
};

export default function DesignersHubScreen({ navigation, route }) {
  const [postsarray, setPostarray] = useState([]);
  const [currentpostarray,setcurrentpostarray]=useState([])
  const [openModal,setOpenModal]=useState(false)
  const { roomid ,roomname,roomcreator} = route.params;
  const { user } = useContext(AuthorContext);
  const searchid = user?.id;
  const [roomimage,Setroomimage]=useState(null) 
  const [biomodal,Setbiomodal]=useState(false)
  const [biotext,Setbiotext]=useState("")
const [biostore,setbiostore]=useState(null)
const isAdmin=searchid===roomcreator
const bannerAnim=useRef(new Animated.Value(0)).current;
const [showbanner,setshowbanner]=useState(false)
const FlatListRef=useRef(null)

const [hasmore,Sethasmore]=useState(true)
const [Loadingmore,setLoadingmore]=useState(false)
 
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    if (!searchid || !roomid) return;
  
    const sentdata={
      receiveroomid:roomid,
      usersValue:searchid
    }
    // join room
    socket.emit("joingrouproom", sentdata);
  
    const onlineHandler = (count) => {
      setOnlineCount(count);
    };
  
    socket.on("online-count", onlineHandler);
  
    return () => {
      socket.emit("leavegrouproom", roomid); // important
      socket.off("online-count", onlineHandler);
    };
  }, [searchid, roomid]);
  const formatNumber = (val) => {
    if (!val) return "0";
    if (val < 1000) return val.toString();
    if (val < 1000000) return (val / 1000).toFixed(1) + "k";
    return (val / 1000000).toFixed(1) + "m";
  };
  
  useEffect(() => {
    if (!socket) return;
  
    socket.on("gottenbio", (data) => {
      setbiostore(data);
    });
  
    return () => { 
      socket.off("gottenbio");
    };
  }, [roomid]);
  
 
  useEffect(()=>{
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
  },[roomid])
  const Loadingolderposts=async()=>{
    try{
    if(Loadingmore || !hasmore) return;
 setLoadingmore(true)
  const lastposted=postsarray[postsarray.length-1].posted_at
const res=await fetch(`${API_BASE_URL}/getroomolder?lasttime=${lastposted}&roomid=${roomid}`)
if(!res.ok){
  console.log(`Something went wrong `);
  return;
}
const data=await res.json();
if(data.length===0){ 
  Sethasmore(false)
}
  else{
setPostarray(prev=>[...prev,...data])
}
setLoadingmore(false)
    }finally{
      setLoadingmore(false)
    }
}
useEffect(()=>{
  const interval=setInterval(async()=>{
try{
const thelastpostTime=postsarray[postsarray.length-1].posted_at;
const res=await fetch(`${API_BASE_URL}/getroomlater?checktime=${thelastpostTime}&roomid=${roomid}`)
if(!res.ok){
  console.log(`Failed to fetch current posts`);
  return;
}
const data=await res.json()
if(data.length>0){
Showbanner(data)
}
}catch(err){
  console.log(`Failed to fetch current posts`,err);
  return;
}
  },30000)
  return()=>clearInterval(interval)
},[roomid])
  
const Showbanner=(fetchedposts)=>{
setcurrentpostarray(fetchedposts)
setshowbanner(true)
Animated.spring(bannerAnim,{
  toValue:1,
  useNativeDriver:true,
  friction:10,
  tension:80,
}).start();
};
const mergeBanner=()=>{
  Animated.spring(bannerAnim,{
    toValue:0,
    useNativeDriver:true,
    duration:200
  }).start(()=>{
    setPostarray(prev=>[...currentpostarray,...prev])
    setcurrentpostarray([])
    setshowbanner(false)
    FlatListRef.current?.scrollToOffset({offset:0,animated:true})
  })
}
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
  },[roomimage])
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
      if (!socket) return;
socket.emit("sendimage", theimage);


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
  const ConfirmLeave=()=>{
    Alert.alert(
      isAdmin?'Delete Room':'LeaveRoom',
      'Are you sure you want to complete this Action? it cant be undone. ',
      [
        {
          text:'Cancel',
          style:'cancel',
onPress:()=>console.log(`User Cancelled`)
        },
        {
          text:isAdmin?'Delete':'Leave',
          style:'destructive',
onPress:()=>Leavelogic()
        }
      ],
      {cancelable:true}
    )
  }
  const Leavelogic=async()=>{
    if(!searchid ||!roomid) return;
    const sendRoute=isAdmin?'Deleteroom':'leaveroom';
try{
  const res=await fetch(`${API_BASE_URL}/${sendRoute}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({roomid,searchid})
  })
  if(!res.ok){
    console.log('Soemthing went wrong posting leaveroom in room logic');
    return;
  }
}catch(err){
  console.log(err);
  return;
}finally{
  navigation.navigate('InterestRoom')
}
  }
  const GotoMembers=()=>{
    setOpenModal(false)
    navigation.navigate('MembersScreen',{roomid:roomid,roomname:roomname,roomcreator:roomcreator})
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
  {showbanner && (
    <Animated.View style={[styles.newPostsbanner,{opacity:bannerAnim,
    transform:[{translateY:bannerAnim.interpolate({
      inputRange:[0,1],
      outputRange:[-20,0]
    })}]}]}>
<TouchableOpacity style={newPostspill} onPress={mergeBanner} activeOpacity={0.5}>
  <Ionicons name="time-outline" size={14} color="#fff"/>
  <Text style={styles.newPoststext}>
{formatNumber(currentpostarray.length)} new {currentpostarray.length===1?`post`:`posts`}
  </Text>
  <Ionicons name="chevron-down" size={14} color='#fff'/>
</TouchableOpacity>
    </Animated.View>
  )}
        {/* List of Posts */}
        <FlatList
        ref={FlatListRef}
          data={postsarray}
          onEndReached={Loadingolderposts}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostChild item={item} navigation={navigation} user={user} socket={socket} Roomid={roomid} Adminstate={isAdmin} 
          onDelete={(id)=>setPostarray(prev=>prev.filter(p=>p.id!==id))}/>}
          contentContainerStyle={styles.scrollContent}
          ListFooterComponent={ Loadingmore? <ActivityIndicator/> :null}
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
      <TouchableOpacity style={styles.modalItem} onPress={ConfirmLeave}>
        <Text style={styles.modaltext}> {isAdmin?'Delete Room':'Leave Room'}</Text>
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


      <TouchableOpacity style={styles.modalItem} onPress={GotoMembers}>
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
  commentModalll: {
    height: '80%', // instead of maxHeight
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'hidden', // let content scroll
},
grabber: {
  width: 40,
  height: 5,
  borderRadius: 2,
  backgroundColor: '#333',
  alignSelf: 'center',
  marginBottom: 8,
},
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  /* ========== HEADER (DISCORD / X STYLE) ========== */
  header: {
    width: '100%',
    height: 240,
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
    borderBottomColor:'rgba(255,255,255,0.08)',
     borderBottomWidth:StyleSheet.hairlineWidth
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
    fontSize: 12,
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
  },
  inputBar:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#1c1c1e',
    paddingHorizontal:10,
    paddingVertical:8,
    borderRadius:20
  },
  
  inputText:{
    flex:1,
    color:'#fff',
    fontSize:15,
    paddingVertical:6
  },
  sendBtn:{
    marginLeft:8,
    backgroundColor:'#0A84FF',
    padding:8,
    borderRadius:16,
    justifyContent:'center',
    alignItems:'center'
  },
  modalContentheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },

  cmRootShell: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor:'rgba(255,255,255,0.08)',
    borderBottomWidth:StyleSheet.hairlineWidth,
    position:'relative'
  },
  cmRootShellswipe: {
    width:'100%',
    backgroundColor:'#111',
    borderRadius:12,
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowRadius:4,
    elevation:3
  },
  Deletecontain:{
    position:'absolute',
    right:16,
    top:10,
    bottom:10,
    width:80,
    backgroundColor:'#ff3b30',
    borderRadius:12,
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row'
  },

  cmPrimaryLane: {
    flexDirection: "row",
    
  },

  cmAvatarOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor:'#fff'
  },
cmContentColumn:{
  flex:1,
},
cmTopRow:{
  flexDirection:'row',
  alignItems:'flex-start'
},
  
cmTextColumn:{
  flex:1
},
  
  cmHandleText: {
    color: '#8e8e93',
    fontWeight: '400',
    fontSize: 15,
   
  },
  
  cmMessageBody: {
    color: '#e5e5ea',
    fontSize: 14,
    lineHeight: 20,
    marginTop:2
  },

  cmTimestamp: {
    color: '#8e8e93',
    fontSize: 11,
    marginTop:4
  },
  
  cmPulseButton: {
    marginTop:4,
    marginLeft:10,
    alignItems:'center',
    flexDirection:'row'
  },
  
  cmPulseCount: {
    color: '#8e8e93',
    fontSize: 12,
    marginLeft:4
  },

  replyTag:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    backgroundColor:'rgba(255,255,255,0.06)',
    paddingHorizontal:10,
    paddingVertical:6,
    borderRadius:12,
    marginBottom:6
  },
  
  replyTagContent:{
    flexDirection:'row',
    alignItems:'center'
  },
  
  replyText:{
    color:'#ccc',
    fontSize:13,
    marginLeft:6
  },
  replyPreviewBubble: {
    backgroundColor: '#4FC3F7',
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
    padding: 8,
    borderRadius: 8,
    alignSelf:'flex-start',
    marginBottom:6
  },

replyLabel:{
  fontSize:11,
  color:'#aaa',
  marginBottom:2
},

replyUserRow:{
  flexDirection:'row',
  alignItems:'center'
},



replyPreviewNamee:{
  color:'#aaa',
  fontSize:11,
  fontStyle:'italic',
  fontWeight:'400',
  opacity:0.8,
  marginTop:2

},
replyPreviewBubble:{
  alignSelf:'flex-start',
  backgroundColor:'rgba(255,255,255,0.06)',
  padding:8,
  borderRadius:14,
  marginBottom:6
},



replyUserRow:{
  flexDirection:'row',
  alignItems:'center'
},

replyPreviewAvatar:{
  width:18,
  height:18,
  borderRadius:9,
  marginRight:6
},

replyPreviewName:{
  color:'#fff',
  fontSize:13,
  fontWeight:'600'
},
floatingBackBtn: {
  position: 'absolute',
  bottom: 80,
  right: 20,
  width: 48,
  height: 48,
  borderRadius: 24,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#6D5BFF',
  zIndex: 9999,
  elevation: 30
},
newPostsbanner:{
  alignItems:'center',
  marginTop:8,
  marginBottom:4,
  zIndex:10
},
newPostspill:{
  flexDirection:'row',
  alignItems:'center',
  gap:6,
  paddingHorizontal:18,
  paddingVertical:10,
  borderRadius:999,
  borderWidth:0.5,
  backgroundColor:'rgba(255,255,255,0.12)',
  borderColor:'rgba(255,255,255,0.2)'
},
newPoststext:{
  color:'#fff',
  fontSize:13,
  fontWeight:'600',
  letterSpacing:0.2
},
showswipebanner:{
  flexDirection:'row',
  alignItems:'center',
  gap:6,
  backgroundColor:'rgba(255,59,48,0.85)',
  alignSelf:'center',
  paddingHorizontal:14,
  paddingVertical:8,
  borderRadius:999,
  marginBottom:10,
  alignSelf:'center'

},
showswipetext:{
  color:'#fff',
  fontSize:14,
  fontWeight:'600'
}
});


