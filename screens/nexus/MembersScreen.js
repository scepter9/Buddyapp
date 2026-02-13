import React, { useContext, useEffect, useState ,useRef} from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable

} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const API_BASE_URL = "http://192.168.0.136:3000";
import { AuthorContext } from "../AuthorContext";
import { io } from "socket.io-client";
import socket from "../Socket";


function ViewMembers({item,navigation,roomcreator,roomid}){
  const [followstate,Setfollowstate]=useState(false)
 
    const {user}=useContext(AuthorContext)
    const usersid=user?.id;
    const theowner=Number(item.userid)===Number(roomcreator)
    const isSelf=Number(usersid)===Number(item.userid)
    const amCreator=Number(usersid)===Number(roomcreator)
    const [openmodal, setopenmodal] = useState(false)
    const isAdmin = Number(item.isAdmin) === 1;
    const [modalIsAdmin, setModalIsAdmin] = useState(false);

  

 useEffect(()=>{
  const Fetchfollowing=async()=>{
    try{
      const res=await fetch(`${API_BASE_URL}/isFollowingformembers?senderid=${usersid}`)
      if(!res.ok){
        console.log('Soemthing went wrong while fetching memebers');
        return;
      }
      const data=await res.json()
      const mappedUsers = data.map(r => Number(r.receiver_id))
      const mappedusersSet = new Set(mappedUsers)
      
      const isFollowinga = mappedusersSet.has(Number(item.userid))
      Setfollowstate(isFollowinga)
      
    }catch(err){
console.log(err);
    }
  }
  Fetchfollowing()
 },[usersid, item.userid])



    const followToggle=async()=>{
      const receiver_id=item.userid;
      const endpoint=followstate?'unfollow':'follow';
try{
  const res=await fetch(`${API_BASE_URL}/${endpoint}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({receiver_id})
  })
  if(!res.ok){
    console.log('Something went wrong trying to post followers in members screen');
    return;
  }else{
  Setfollowstate(prev => !prev)
  }
}catch(err){
  console.log(err);
}
    }
    
    const handleadminadd = () => {
      if (!socket) return;
    
      const payload = { userid: item.userid, roomid ,senderid:usersid};
    
      if (!socket.connected) {
        console.log('Socket not connected. Waiting...');
        socket.once('connect', () => {
          console.log('Socket now connected! Emitting MakeAdmin.');
          socket.emit('MakeAdmin', payload);
        });
      } else {
        socket.emit('MakeAdmin', payload);
      }
    
      setopenmodal(false);
    };
    
    
    
    const handleadminremove = () => {
      if (!socket) return;
    
      const payload = { userid: item.userid, roomid ,senderid:usersid};
    
      if (!socket.connected) {
        console.log('Socket not connected. Waiting...');
        socket.once('connect', () => {
          console.log('Socket now connected! Emitting RemoveAdmin.');
          socket.emit('RemoveAdmin', payload);
        });
      } else {
        socket.emit('RemoveAdmin', payload);
      }
    
      setopenmodal(false);
    };
    
    const handleremove=()=>{
      if(!socket) return;
      socket.emit('RemoveMember',{
        userid: item.userid,
        roomid,senderid:usersid
      })
      setopenmodal(false)
    }
return(
    <View style={styles.rowContainer}>
        <TouchableOpacity onPress={()=>navigation.navigate('Profile', { userId:item.userid })} style={styles.avatar}>
            <Image source={{uri:`${API_BASE_URL}/uploads/${item.image}`}} style={StyleSheet.absoluteFill} resizeMode="cover"/>
        </TouchableOpacity>
        <View style={styles.textContainer}>
            <View style={styles.nameRow}>
                <Text style={styles.displayName}>{item.fullname}</Text>
                <View
  style={[
    styles.badge,
    theowner?{backgroundColor:'#ffd700'}:
    item.isAdmin === 1
      ? { backgroundColor: '#00CCFF' }
      : { backgroundColor: '#fff' },
      
  ]}
>
  <Text style={styles.badgeText}>
    {theowner?'Creator':item.isAdmin === 1 ? 'Admin' : 'Member'}
  </Text>
</View>

            </View>
            <Text style={styles.username}>{item.usersname}</Text>
        </View>
        {!isSelf && (
          <Pressable
          style={[
            styles.followButtom,
            followstate && { opacity: 0.5 }
          ]}
          
          onPress={followToggle}
        >
        
                    <Text style={[styles.followButtonText,followstate && {opacity:0.5}]} >{followstate?'unfollow':'follow'}</Text>
                </Pressable>
        )}
        
        { amCreator&&!isSelf &&(
          <View>
          <TouchableOpacity
  onPress={() => {
    setopenmodal(true);
  }
  }
>

             <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
             </TouchableOpacity>
             
            
</View>
        )}
       
       <Modal transparent animationType="fade" visible={openmodal}>
  <View style={styles.backdrop}>

    {/* CLICK-TO-CLOSE AREA (The Backdrop) */}
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => setopenmodal(false)}
    />

    {/* ACTUAL MODAL CONTENT - Change this View to a Pressable */}
    <Pressable style={styles.highlight}> 
   

    {!isAdmin ? (
  <TouchableOpacity style={styles.actionRow} onPress={handleadminadd} activeOpacity={0.8}>
    <Ionicons name="star-outline" size={22} color="#ffc" />
    <Text style={styles.actionText}>Make Admin</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity style={styles.actionRow} onPress={handleadminremove} activeOpacity={0.8}>
    <Ionicons name="star-outline" size={22} color="#ffcc" />
    <Text style={styles.actionText}>Remove Admin</Text>
  </TouchableOpacity>
)}

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.actionRow}
        onPress={handleremove}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={22} color="#ff453a" />
        <Text style={styles.actionText}>Remove User</Text>
      </TouchableOpacity>

    </Pressable>
  </View>
</Modal>


       
       
       
    </View>
) 
}


function Loader({ loading, text }) {
  if (!loading) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.acontainer}>
        <ActivityIndicator size="large" color="#fff" />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
}

export default function MembersScreen({route,navigation}) {
const [members,setMembers]=useState([])
const [fetchedMembers,setfetchedMembers]=useState([])
const [isLoading,setLoading]=useState(false)
const {roomid,roomname,roomcreator}=route?.params
const [searchQuery,setSearchquery]=useState('')



const [memberscount,setmemberscount]=useState(0)

const {user}=useContext(AuthorContext)
const usersid=user?.id;
useEffect(() => {
  if (!roomid) return;

  socket.emit('JoinViewMembers', roomid);

  return () => {
    socket.emit('LeaveViewMembers', roomid);
  };
}, [roomid]);


useEffect(() => {
  const fetchRoomMembers = async () => {
    if (!roomid ) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/fetchroommen?roomid=${roomid}`);
      if (!res.ok) {
        console.log("Something went wrong in fetching room members");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMembers(data);
      setfetchedMembers(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  fetchRoomMembers();
}, [roomid]);
useEffect(()=>{
  if(!roomid )return;
  const Getmemeberscount=async()=>{
    try{
      const res=await fetch(`${API_BASE_URL}/memberscount?roomid=${roomid}`)
      if(!res.ok){
        console.log(`An error whlle fetching Memberscount in members screen`);
      }
const data=await res.json()
setmemberscount(data.members)
    }catch(err){
      console.log(err);
    }
  }
  Getmemeberscount()
},[roomid])




useEffect(()=>{
  if (!searchQuery.trim()) {
    setfetchedMembers(members);
    return;
  }
  
  const fetchuser=setTimeout(async() => {
    try{
      const res=await fetch(`${API_BASE_URL}/searchmember?search=${searchQuery}&roomid=${roomid}`)
      if(!res.ok){
        console.log(`something went wrong while fetching members`);
        return
      }
      const data=await res.json()
      setfetchedMembers(data)
    }catch(err){
      console.log(err);
    }

    
  }, 300);
  return()=>clearTimeout(fetchuser)
  
},[searchQuery])

useEffect(() => {
  const handler = data => {
    setMembers(data);
    setfetchedMembers(data);
    setmemberscount(data.length);
  };

  socket.on('UpdateAfterAdmin', handler);
  socket.on('UpdateAfterDelete', handler);

  return () => {
    socket.off('UpdateAfterAdmin', handler);
    socket.off('UpdateAfterDelete', handler);
  };
}, []);




const ListEmpty = ({ isLoading, searchQuery }) => {
  if (isLoading) return null;

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? "Username not found" : "No members yet"}
      </Text>
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={()=>navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{memberscount} Members</Text>
          <Text style={styles.headerSubtitle}>{roomname?roomname:''}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
        value={searchQuery}  
        onChangeText={setSearchquery}
          placeholder="Search by username "
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>
      <FlatList
      data={fetchedMembers}
      keyExtractor={(item) => `${item.userid}-${item.id}`}

      renderItem={({item})=>(<ViewMembers item={item} navigation={navigation}  roomcreator={roomcreator}  users={memberscount} roomid={roomid}/>)}
      ItemSeparatorComponent={()=><View style={styles.seperator}></View>}
      ListEmptyComponent={
        <ListEmpty isLoading={isLoading} searchQuery={searchQuery} />
      }
      />
       <Loader loading={isLoading} text="Loading members..." />
       
       
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    /* ===== Root ===== */
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
  
    /* ===== Header ===== */
    header: {
      flexDirection: "row",
      paddingHorizontal: 5,
      paddingVertical: 10,
      alignItems: "center",
    },
  
    backButton: {
      marginLeft: 30,
      padding: 6, // improves touch target
    },
  
    headerCenter: {
      flex: 1,
      alignItems: "center",
      marginRight: 40, // balances arrow space visually
    },
  
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 5,
    },
  
    headerSubtitle: {
      fontSize: 14,
      color: "#888",
    },
  
    /* ===== Search ===== */
    searchWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1C1C1E",
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 14,
      height: 44,
      borderRadius: 22,
    },
  
    searchInput: {
      flex: 1,
      marginLeft: 10,
      color: "#fff",
      fontSize: 15,
    },
    rowContainer:{
flexDirection:'row',
alignItems:'center',
paddingHorizontal:16,
paddingVertical:12,
backgroundColor:'#000'
    },
    avatar:{
        width:48,
        height:48,
        borderRadius:24,
        overflow:'hidden',
        alignItems:'center',
        marginRight:12,
        backgroundColor:'#333'
    },
    textContainer:{
      flex:1,
      justifyContent:'center'
    },
    nameRow:{
      flexDirection:'row',
      alignItems:'center',
      gap:6
    },
    displayName:{
      fontSize:16,
      fontWeight:'600',
      color:'#fff'
    },
    badge:{
      paddingHorizontal:8,
      paddingVertical:4,
      borderRadius:12,
      overflow:'hidden'
    },
    badgeText:{
      fontSize:12,
      fontWeight:'700',
      color:'#000'
    },
    username:{
      fontSize:14,
      color:'#aaa',
      marginTop:2
    },
    followButtom:{
      paddingHorizontal:16,
      paddingVertical:8,
      borderRadius:20,
      borderWidth:1,
      borderColor:'#555',
      backgroundColor:'transparent'
    },
    followButtonText:{
      fontSize:14,
      fontWeight:'600',
      color:'#fff'
    },
    seperator:{
      marginBottom:10
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    acontainer: {
      padding: 20,
      backgroundColor: "#1C1C1E",
      borderRadius: 12,
      alignItems: "center",
    },
    text: {
      marginTop: 10,
      color: "#fff",
      fontSize: 14,
    },
    highlight:{
     width:'82%',
     backgroundColor:'#1e1e1e',
     borderRadius:20,
     paddingVertical:8,
     paddingHorizontal:4,
     elevation:10,
     shadowColor:'#000',
     shadowOffset:{width:0,height:6},
     shadowOpacity:0.4,
     shadowRadius:12
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    
    actionText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: '500',
      marginLeft: 16,
    },
    
    divider: {
      height: 1,
      backgroundColor: '#333',
      marginHorizontal: 16,
    },
    
  });
  



