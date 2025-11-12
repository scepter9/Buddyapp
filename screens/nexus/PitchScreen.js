import React, { useEffect, useState ,useContext} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";
import { AuthorContext } from '../AuthorContext';
import { FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = "http://192.168.0.136:3000";

function CommentSection({item}){
return(
<View  style={styles.comment}>
              <Text style={styles.name}>{item.users_name}</Text>
              <Text style={styles.commentText}>{item.comment_text}</Text>
            </View>
)
}

export default function PitchScreen({route}) {
  const {user}=useContext(AuthorContext);
  const usersname=user?.fullname;
  const users=user?.id;
  const {pitchid}=route.params;
  const [pitchdatava,setpitchdatava]=useState({});
  const [socket,setSocket]=useState(null)
  const [commentcount,setcommentcount]=useState(0)

  useEffect(()=>{
const commentSocket=io(API_BASE_URL,{
query:{userId:users},
transports:['websocket']
});
setSocket(commentSocket)
commentSocket.on('connect',()=>{
  console.log('User Connected');
})
return()=>{
  commentSocket.disconnect()
}
  },[])
  useEffect(()=>{
    if(socket){
      socket.emit('joinPitch', pitchid);
    }
  },[socket]);
  
  useEffect(()=>{
    const Fetchmaindetails=async()=>{
      try{
        const res=await fetch(`${API_BASE_URL}/fetchuserpitch?pitch=${pitchid}`);
        if(!res.ok){
          console.log('Something went wrong');
        }
        const data=await res.json();
        setpitchdatava(data[0])
      }catch(err){
        console.log(err);
      }

    }
    Fetchmaindetails()
  },[])
  useEffect(()=>{
    const fetchComments=async()=>{
      try{
        const response=await fetch(`${API_BASE_URL}/fetchpitchcomment?pitch=${pitchid}`);
if(!response.ok){
  console.log('Something went wrong');
}
const data =await response.json();
setComments(data)
const number=await AsyncStorage.getItem('setcommentcount');
const numbercount=JSON.parse(number)
setcommentcount(numbercount)
      }catch(err){
console.log(err);
      }
    }
    fetchComments()
  },[])
  useEffect(()=>{
    if(!socket) return;
    socket.on('comment',(data)=>{
      const formattedcomment = {
        id: data.id,
        users_name: data.user,
        comment_text: data.commenttext,
        pitchid: data.pitchid,
      };
      setComments(prev => [...prev, formattedcomment]);
      setcommentcount(count => {
        const newCount = count + 1;
        AsyncStorage.setItem('setcommentcount', JSON.stringify(newCount));
        return newCount;
      });
    });
    return()=>socket.off('comment');
  },[socket]);
  
  const [comments, setComments] = useState([
  ]);
  const [input, setInput] = useState("");

  const handlePost = () => {
   if(input.trim().length===0){
    Alert.alert('Comment cannot be empty');
    return;
   }
if(socket){
  socket.emit('SendComment',{
    
username:usersname,
comment:input,
pitchuser:pitchid
  });
}
setInput('')
setcommentcount(count => {
  const newCount = count + 1;
  AsyncStorage.setItem('setcommentcount', JSON.stringify(newCount));
  return newCount;
});

  };

  return (
    <LinearGradient colors={["#0f1a2c", "#1a2c4c"]} style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>🚀 Campus Food App</Text>
        <Text style={styles.menu}>⋮</Text> */}
      </View>

      <View style={styles.pitchCard}>
        <Text style={styles.pitchTitle}>{pitchdatava.pitch_title}</Text>
        <Text style={styles.pitchText}>
         {pitchdatava.pitch_description}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>⬆ 123 upvotes</Text>
          <Text style={styles.stat}>💬 18 comments</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.commentHeader}>Comments</Text>
        <View style={styles.comments}>
<FlatList
data={comments}
keyExtractor={(item)=>item?.id?.toString()}

renderItem={({item})=>(<CommentSection item={item}/>)}
/>
</View>
        {/* <View style={styles.comments}>
          {comments.map((c, i) => (
            <View key={i} style={styles.comment}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
        </View> */}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment or suggestion..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity onPress={handlePost} style={styles.button}>
          <LinearGradient
            colors={["#00d9ff", "#8a2be2"]}
            style={styles.buttonInner}
          >
            <Text style={styles.buttonText}>Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#eaf6ff",
    fontSize: 20,
    fontWeight: "700",
  },
  menu: {
    color: "#00d9ff",
    fontSize: 22,
  },
  pitchCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    marginBottom: 20,
  },
  pitchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  pitchText: {
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 10,
  },
  stat: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontSize: 13,
    color: "#fff",
  },
  commentHeader: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
  },
  comments: {
    gap: 14,
    marginBottom: 20,
  },
  comment: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 10,
  },
  name: {
    fontWeight: "700",
    fontSize: 13,
    color: "#fff",
  },
  commentText: {
    fontSize: 14,
    color: "#eaf6ff",
    marginTop: 4,
  },
  inputArea: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    padding: 10,
  },
  button: {
    borderRadius: 10,
    overflow: "hidden",
  },
  buttonInner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: "700",
    color: "#031426",
  },
});
