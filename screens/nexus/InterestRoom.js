import React, { useEffect, useState, useContext,createContext, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  Image
} from 'react-native';
import BottomNavigator from '../BottomNavigator';
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { AuthorContext } from '../AuthorContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = "http://192.168.0.136:3000";
import { Feather } from '@expo/vector-icons';
import { FontAwesome } from "@expo/vector-icons";


function ActiveRooms({ item, navigation,variant ,isjoined}) {
  const { user } = useContext(AuthorContext);

  const sender = user?.id;

  
 
  const [openmodal, setopenmodal] = useState(false);
  const [joined,setjoined]=useState(false)
  const [title, setTitle] = useState('');
  const [checkvalue, setcheckvalue] = useState(false);
const [roomusers,setRoomusers]=useState([])
  
  useEffect(()=>{
    const thefetched=async()=>{
        try{
      const res=await fetch(`${API_BASE_URL}/imagefromusers?roomidforimage=${item.id}`)
      if(!res.ok){
        console.log('something is wrong');
      }
      const data=await res.json()
      setRoomusers(data)
    }catch(err){
      throw new Error(err)
    }
  }
  thefetched()
  },[item.id])
  const checkPassword = async () => {
    if (title.trim().length === 0) {
      Alert.alert('Please input a value');
      return;
    }
  
    try {
      const res = await fetch(`${API_BASE_URL}/join-private-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: item.id,
          userId: sender,
          passcode: title,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        // wrong passcode or server error
        setcheckvalue(true);
        setTitle('');
        return;
      }
  
      // ✅ success
      setcheckvalue(false);
      setopenmodal(false);
      setjoined(true);
      navigation.navigate('DesignersHubScreen',{ roomid:item.id ,roomname:item.roomname,roomcreator:item.creatorid});
  
    } catch (err) {
      console.log('Failed to join private room', err);
    }
  };
  
  
  

  const handlemodes = async () => {
    const roomid = item.id;
  
    try {
      const res = await fetch(
        `${API_BASE_URL}/checkroommembers?userid=${sender}&room_id=${roomid}`
      );
  
      if (!res.ok) return console.log('Check failed');
  
      const data = await res.json();
  
      // Already joined
      if (data) {
        navigation.navigate('DesignersHubScreen', {
          roomid,
          roomname: item.roomname,
          roomcreator: item.creatorid,
        });
        return;
      }
  
      // Public room → join directly
      if (item.selectmode === 'public') {
        const res2 = await fetch(`${API_BASE_URL}/postroommembers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomid,
            userid: sender,
          }),
        });
  
        if (!res2.ok) {
          console.log('Failed to join room');
          return;
        }
  
        navigation.navigate('DesignersHubScreen', {
          roomid,
          roomname: item.roomname,
          roomcreator: item.creatorid,
        });
        return;
      }
  
      // Private room → show modal
      if (item.selectmode === 'private') {
        setopenmodal(true);
      }
    } catch (err) {
      console.log('Something went wrong:', err);
    }
  };
  
  return (
    <View
    style={[
      styles.spaceCard,
      variant === 'search' && styles.searchCard,
      variant === 'joined' && styles.joinedCard,
    ]}
  >
  
      {/* Styled Modal */}
      <Modal
        visible={openmodal}
        transparent
        animationType="fade"
        onRequestClose={() => setopenmodal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔐 Enter Room Passcode</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter passcode"
              placeholderTextColor="#999"
              secureTextEntry
            />
            {checkvalue && (
              <Text style={styles.errorText}>Incorrect passcode. Try again.</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#00d9ff' }]}
                onPress={checkPassword}
              >
                <Text style={styles.modalBtnText}>Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setopenmodal(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#ccc' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Room Card */}
      <View style={styles.spaceTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
  {item.icon ? (
    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
  ) : (
    <FontAwesome name="comments" size={20} color="#fff" />
  )}
</View>

          <View>
            <Text style={styles.roomName}># {item.roomname}</Text>
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
  {roomusers.map((uri, index) => (
    <View
      key={index}
      style={[
        styles.image,
        { marginLeft: index === 0 ? 0 : -12 }
      ]}
    >
      <Image
        source={{ uri: `${API_BASE_URL}/uploads/${uri.image}` }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  ))}
</View>


            <Text style={styles.roomMeta}>{item.members_count || 'No'} members</Text>
          </View>
        </View>
        <Text style={styles.mutedSmall}>{item.selecttype}</Text>
      </View>

      <Text style={styles.roomDesc}>{item.roomdescription}</Text>

      <TouchableOpacity
        onPress={handlemodes}
        style={[styles.joinBtn, isjoined && styles.joinedBtn]}
      >
        <Text style={[styles.joinText, isjoined && styles.joinedText]}>
          {isjoined ? 'View' : 'Join'}
        </Text>
      </TouchableOpacity>
   
    </View>
  );
}

function HappeningNow({item}){
return(
  <View style={styles.liveCard}>
              <Text style={styles.meta}>🎯 {item.tag}</Text>
              <Text style={styles.liveDesc}>{item.desc}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            </View>
)
}
const InterestRoom = ({navigation}) => {
  
  const { user } = useContext(AuthorContext);
  const sender = user?.id;
  const [activeroom,Setactiveroom]=useState([])
  const [IsHappeningNow,SetHappeningNow]=useState([])
  const [yourroom,setyourroom]=useState([])
  const [searchQuery,setSearchQuery]=useState('')
   const [search,setSearch]=useState([])
  const [loading,setloading]=useState(false)

  useEffect(()=>{
    if(searchQuery.trim().length===0){
      setSearch([])
      
      return;
    }
    const searchInterestroom=setTimeout(async()=>{
      setloading(true)
      try{
        const res=await fetch(`${API_BASE_URL}/searchinterestroom?search=${searchQuery}`);
        if(!res.ok){
          console.log('something went wrong');
          return;
        }
        const val=await res.json();
setSearch(val)
      }catch(err){
        console.log('something went wrong');
      }
      setloading(false)
    },300)
    return()=>clearTimeout(searchInterestroom);
  },[searchQuery])

// useEffect(()=>{
//   const FetchHappeningnow=async()=>{
//     try{
//       const res=await fetch(`${API_BASE_URL}/fetchhappening`)
//       if(!res.ok){
//         console.log('Something went wrong');
//         return;
//       }
//   const answer=await res.json()
//   SetHappeningNow(answer)
//     }catch(err){
//       console.log('An error occured');
//     }
//   }
//   FetchHappeningnow()
// },[])
useFocusEffect(
  useCallback(()=>{

    const FetchActiveRooms=async()=>{
      try{
        const response=await fetch(`${API_BASE_URL}/getactiverooms`);
        if(!response.ok){
          console.log('An error occured');
          return;
        }
const data=await response.json();
Setactiveroom(data)
      }catch(err){
        console.log('An error occured');
      }
      
    }
    FetchActiveRooms()
  },[])
)
useFocusEffect(
  useCallback(()=>{
    const fetchjoinedrooms=async()=>{
      try{
        const response=await fetch(`${API_BASE_URL}/getjoinroom?yourid=${sender}`)
        if(!response.ok){
          console.log('something happened that caused the issue');
        }
        const data=await response.json();
        setyourroom(data)
      }catch(err){
      console.log('An error occured');
      }
    }
    fetchjoinedrooms()
  },[])
)
  return (
    <SafeAreaView style={styles.safeview}>
    <ScrollView style={styles.container}
    contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* TOPBAR */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>MC</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Mission Control</Text>
            <Text style={styles.brandSubtitle}>
              Interest Rooms • Collaboration Hub
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("CreateRoomScreen")}>
          <Text style={styles.icon}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 20 }}>🚀</Text>
          </View>
          <View>
            <Text style={styles.heroLabel}>YOUR COLLABORATION HUB</Text>
            <Text style={styles.heroTitle}>Explore Your Interests</Text>
            <Text style={styles.heroSubtitle}>
              Find your tribe, build the future.
            </Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
            style={styles.input}
            placeholder="Find rooms..."
            placeholderTextColor="rgba(234,246,255,0.6)"
          />
          <Text style={styles.kbd}>⌘K</Text>
        </View>
        {loading && (
          <Text>loading rooms....</Text>
         
        )}
         <FlatList
         scrollEnabled={false}
         data={search}
         keyExtractor={(item)=>`search-${item.id}`}
         renderItem={({item})=>(
         <ActiveRooms item={item} navigation={navigation} variant="search"/>
         )}
          contentContainerStyle={{gap:16}}
         
         />
      </View>

      {/* LIVE ACTIVITY */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <Text>🔥</Text>
            <Text style={styles.sectionTitleText}>Happening Now</Text>
          </View>
          <Text style={styles.muted}>Live • real-time</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.live}
        >
          <FlatList
           scrollEnabled={false}
          data={IsHappeningNow}
          keyExtractor={(item)=>item.id?.toString()}
          renderItem={({item})=>(
            <HappeningNow item={item}/>
          )}
          />
          
        </ScrollView>
        
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}> Joined Rooms</Text>
          <Text style={styles.muted}>Quick access</Text>
        </View>
<FlatList
 scrollEnabled={false}
data={yourroom}
keyExtractor={(item)=>`joined-${item.id}`}
renderItem={({item})=>(
  <ActiveRooms item={item} navigation={navigation} variant="joined" isjoined={true}/>
)}
ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
/>
       
      </View>




      {/* YOUR SPACES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}> Active Communities</Text>
          <Text style={styles.muted}>Quick access</Text>
        </View>
<FlatList
 scrollEnabled={false}
data={activeroom}
keyExtractor={(item)=>`active-${item.id}`}
renderItem={({item})=>(
  <ActiveRooms item={item} navigation={navigation}  variant="active" isjoined={yourroom.some((r)=>r.id===item.id)}/>
)}
ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
/>
       
      </View>

      {/* PITCH BUTTON SECTION */}
      {/* <View style={styles.pitchSection}>
        <Text style={styles.pitchCatch}>
          💡 Got an idea worth sharing? Turn your thoughts into action with a pitch.
        </Text>
        <TouchableOpacity style={styles.pitchBtn} onPress={()=>navigation.navigate('PitchDeck')}>
          <Text style={styles.pitchBtnText}>View Pitches</Text>
        </TouchableOpacity>
      </View> */}
    

    </ScrollView>
    <BottomNavigator navigation={navigation}/>
    </SafeAreaView>
  );
};

export default InterestRoom;

const styles = StyleSheet.create({
 
  safeview:{
    flex:1,
    backgroundColor: '#0f1a2c',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f1a2c',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#0f1a2c',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#00d9ff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#031426',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: 13,
  },

  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00d9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontWeight: '800', color: '#031426' },
  brandTitle: { color: '#eaf6ff', fontWeight: '700', fontSize: 14 },
  brandSubtitle: { color: 'rgba(234,246,255,0.6)', fontSize: 11 },
  icon: { fontSize: 18, color: 'rgba(234,246,255,0.6)' },

  hero: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00d9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { color: '#00d9ff', fontWeight: '700', fontSize: 13 },
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 22 },
  heroSubtitle: { color: 'rgba(234,246,255,0.6)', fontSize: 13 },

  spaceCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  spaceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d9ff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  roomName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  roomMeta: {
    color: 'rgba(234,246,255,0.65)',
    fontSize: 13,
    marginTop: 2,
  },
  roomDesc: {
    color: 'rgba(234,246,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  
  joinBtn: {
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignSelf: 'flex-start',
    backgroundColor:'white',
    // backgroundColor: 'linear-gradient(90deg, #00d9ff, #0077ff)',
    shadowColor: '#00d9ff',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  joinText: {
    color: '#031426',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  joinedBtn: {
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.4)',
    shadowColor: '#00d9ff',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  joinedText: {
    color: '#00d9ff',
    fontWeight: '700',
  },
  searchCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.5)',
    backgroundColor: 'rgba(0,217,255,0.07)',
    shadowColor: '#00d9ff',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 7,
  },
  joinedCard: {
    backgroundColor: 'rgba(0,255,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,128,0.4)',
    shadowColor: '#00ff80',
    shadowOpacity: 0.35,
    shadowRadius: 9,
    elevation: 6,
  },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 15,
  },
  kbd: {
    fontSize: 11,
    color: 'rgba(234,246,255,0.6)',
  },

  section: { marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  muted: { color: 'rgba(234,246,255,0.6)', fontSize: 13 },
  mutedSmall: { color: 'rgba(234,246,255,0.6)', fontSize: 12 },

  live: { marginTop: 10 },
  liveCard: {
    minWidth: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
  },
  meta: { color: 'rgba(234,246,255,0.6)', fontSize: 12, marginBottom: 6 },
  liveDesc: { color: '#fff', fontWeight: '700', fontSize: 15 },
  badge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,217,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: { color: '#eaf6ff', fontWeight: '700', fontSize: 13 },

  spaces: { marginTop: 14, gap: 12 },


  pitchSection: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  pitchCatch: {
    color: 'rgba(234,246,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  pitchBtn: {
    backgroundColor: '#00d9ff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  pitchBtnText: {
    color: '#031426',
    fontWeight: '800',
    fontSize: 15,
  },
  image:{
    width:40,
    height:
    40,
    borderRadius:20,
    borderColor:'transparent',
    overflow:'hidden',
    alignItems:'center',
    justifyContent:'center',
    position:'relative'

  }
});
