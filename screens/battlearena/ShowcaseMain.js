// App.js
import React, { useState ,useContext, useEffect} from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Image
  
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import BottomNavigator from "../BottomNavigator"
import { Picker } from "@react-native-picker/picker";
import { AuthorContext } from "../AuthorContext";
import { Video } from "expo-av";
const { width } = Dimensions.get("window");
import { FontAwesome } from '@expo/vector-icons';
const API_BASE_URL = "http://192.168.0.136:3000";

const CATEGORIES = [
  { id: "art", emoji: "🎨", title: "Art & Design", subtitle: "Illustration • UI • Motion • Fashion" },
  { id: "tech", emoji: "💻", title: "Tech & Innovation", subtitle: "Demos • Mini Projects • Robotics" },
  { id: "ent", emoji: "🎭", title: "Entertainment", subtitle: "Music • Dance • Comedy • Drama" },
  { id: "sport", emoji: "⚽", title: "Lifestyle & Sports", subtitle: "Tricks • Fitness • Cooking" },
  { id: "open", emoji: "🧩", title: "Open Talent", subtitle: "Anything goes — surprise us!" },
];





export default function ShowcaseMain({navigation}) {


  const [selectedCategory, setSelectedCategory] = useState(null);
  // const [title, setTitle] = useState("");
  const [describe,setDescribe]=useState('')
  const [categoryInput, setCategoryInput] = useState("Category");
  const [pickercategory,Setpickercategory]=useState(null)
  const [sendvideo,setSendvideo]=useState(null);
  const [feed,Setfeed]=useState([])
  const [showcaseCat,setshowcasecat]=useState({
    xp:0,
    Category:'',
    totallikes:0
  })
const [topusers,setTopusers]=useState([])

  useEffect(()=>{
    const getTrendingShow=async()=>{
      try{
        const res=await fetch(`${API_BASE_URL}/trending`);
        if(!res.ok){
          console.log(`Something went wrong in Showcasemain useffect `);
          return;
        }
const data=await res.json();
Setfeed(data)
      }catch(err){
        console.log(`${err} Something went wrong in Showcasemain useffect `);
      }
    }
    getTrendingShow()
  },[])
  const {user}=useContext(AuthorContext);
  const userId=user?.id;
  useEffect(()=>{
    const getshowcasecat=async()=>{
      try{
        const res=await fetch(`${API_BASE_URL}/getshowcaserank?user=${userId}`);
        if(!res.ok) {
          console.log('Something went wrong in the showcase user');
          return;
        }
        const data3=await res.json();
        setshowcasecat({
          xp:data3.totalvalue,
          Category:data3.category,
          totallikes:data3.totallikes

        });
    }catch(err){
      console.log('Something went wrong in the showcase user',err);
    }
  }
getshowcasecat()
  },[])
    useEffect(()=>{
      const getTopusers=async()=>{
        try{
          const res=await fetch(`${API_BASE_URL}/showcasetopusers`);
          if(!res.ok){
            console.log('Something went wrong getting top users');
            return;
          }
          const data=await res.json()
          setTopusers(data)
        }catch(err){
           console.log('Something went wrong getting top users',err);
        }
      }
      getTopusers()
    },[])
 
  const renderCategory = ({ item }) => {
    const active = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.cat, active && styles.catActive]}
        onPress={() => navigation.navigate('CampusShowcase',{show:item.title})}
      >
        <Text style={styles.catEmoji}>{item.emoji}</Text>
        <Text style={styles.catTitle}>{item.title}</Text>
        <Text style={styles.catSub}>{item.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderCard = ({ item }) => {
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
  
    return (
      <View style={styles.videoCard}>
        <Video
          source={{ uri: item.video ? `${API_BASE_URL}${item.video}` : undefined }}
          useNativeControls={true}
          resizeMode={Video.RESIZE_MODE_COVER}
          isMuted={false}
         
          
          style={styles.trendingVideo}
        />
  
        <View style={styles.overlayInfo}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username?.charAt(0)}</Text>
            </View>
  
            <View>
              <Text style={styles.authorName}>{item.username}</Text>
              <Text style={styles.authorMeta}>{timestamp(item.time_joined)}</Text>
            </View>
          </View>
  <TouchableOpacity onPress={()=>navigation.navigate('CampusPulse',{trending:item.id})}>
          <View style={styles.reactionsRow}>
           {/* <Text style={{fontWeight:'900',color:'black',fontSize:20}} numberOfLines={1}
ellipsizeMode="tail"
>Tap to view trending</Text> */}
          </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  




  

  const postFinalvalue=async()=>{
    if(!describe || !pickercategory || !sendvideo){
      Alert.alert('Please Input A value');
      return;
    }
    try{
      const res=await fetch(`${API_BASE_URL}/postshowcases`,{
        method:'POST',
        credentials:"include",
       headers:{'Content-Type':'application/json'},
        body:JSON.stringify({pickercategory,sendvideo,userId,describe})
      })
      if(!res.ok){
        console.log('Something went wrong');
      }
    }catch(err){
console.log(err);
    }finally{
      
      setDescribe('')
      setSendvideo(null)
    }
  }
const openFile=async()=>{
 
  const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(status!='granted'){
Alert.alert('Permission Required to access photos')
return;
  }
  let result=await ImagePicker.launchImageLibraryAsync({
    allowsEditing:false,
    mediaTypes:ImagePicker.MediaTypeOptions.Videos,
    // videoQuality:'high'
  });
  if(result.canceled || !result.assets || result.assets.length===0) return;
   const assets=result.assets[0];

   try{
    const formData=new FormData();
    formData.append('video',{
      uri:assets.uri,
      type:assets.type || 'video/mp4',
      name:assets.fileName || 'video.mp4'
    })
    const res=await fetch(`${API_BASE_URL}/api/videoupload`,{
      method:'POST',
      // headers:{'Content-Type':'multipart/form-data'},
      body:formData
    })
    const data=await res.json()
if(!data){
  console.log('Cannot fetch Videos');
}
const finalvideo=data.VideoUrl;
    setSendvideo(finalvideo);
   }catch(err){
    console.log(err);
   }finally{
    Alert.alert('The video has been uploaded')
   }
  }
  const number=(count)=>{
    if(count<=1000){
      return count;
    }else if(count>=1000 &&count<=1000000){
      return `${(count/1000).toFixed(1)}k `
    }else if(count>=100000 && count<=1000000000){
     return `${(count/1000000).toFixed(1)}m`
  }
  
}
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>BA</Text></View>
            <View>
              <Text style={styles.title}>Battle Arena — Showcase</Text>
              <Text style={styles.subtitleSmall}>Campus talent hub • Upload short videos </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.eyebrow}>🎬 Campus Showcase — Videos only</Text>
            <Text style={styles.heroTitle}>Show your skill. Win the crowd.</Text>
            {/* <Text style={styles.heroSub}>Short video showcases judged by engagement. Categories keep it fair — upload, tag, and let the campus vote. Weekly winners per category.</Text> */}
            {/* <View style={styles.heroActions}>
              <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>View Showcase</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAlt]}><Text style={[styles.btnText, styles.btnAltText]}>Explore Categories</Text></TouchableOpacity>
              <View style={styles.badge}><Text style={styles.badgeText}>Weekly Reset: Sun 11PM</Text></View>
            </View> */}
          </View>

          <View style={styles.heroRight}>
            <View style={{ marginBottom: 8 }}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
              <View style={styles.stat}>
                <Text style={styles.muted}>Your Rank</Text>
                <Text style={styles.statNumber}> {showcaseCat.Category}</Text>
                </View>
<View style={styles.stat}>
  <Text style={styles.muted}>XP</Text>
  <Text style={styles.statNumber}>{showcaseCat.xp}  </Text>
</View>

<View style={styles.stat}>
  <Text style={styles.muted}>Total Reactions</Text>
  <Text style={styles.statNumber}>{number(showcaseCat.totallikes)}</Text>
</View>

            </View>
          </View>
        </View>
</View>
        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionH2}>Choose a Category</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('CampusShowcase')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>

          <FlatList
            data={CATEGORIES}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderCategory}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </View>

        {/* Feed + Upload */}
        <View style={styles.feedSection}>
          <View style={{ flex: 1 }}>
            <View style={[styles.sectionTitle, { marginBottom: 12 }]}>
              <Text style={styles.sectionH2}>Trending Videos</Text>
              {/* <TouchableOpacity><Text style={styles.viewAll}>See trending →</Text></TouchableOpacity> */}
            </View>

            <FlatList
              data={feed}
              keyExtractor={(item)=>`active-${item?.id}`}
              renderItem={renderCard}
              scrollEnabled={false}
              initialNumToRender={3}
maxToRenderPerBatch={5}
windowSize={5}

              contentContainerStyle={{ paddingBottom: 10 }}
            />
          </View>

          <View style={styles.sidebar}>
          <View style={styles.uploadCard}>
  {/* Header */}
  <View style={styles.uploadHeader}>
    <Text style={styles.uploadTitle}>Upload a Showcase</Text>
    {/* <Text style={styles.uploadSubtitle}>Max 60s • MP4/WEBM</Text> */}
  </View>

  

  {/* Description Input */}
  <TextInput
    value={describe}
    onChangeText={setDescribe}
    placeholder="Give a small note about what it's about"
    style={styles.uploadInput}
    placeholderTextColor="#999"
  />

  {/* Category Picker */}
  <Text style={styles.label}>Choose a category</Text>
  <View style={styles.pickerWrapper}>
    <Picker
      itemStyle={{ color: "#041017", fontSize: 16}}
      selectedValue={pickercategory}
      onValueChange={(itemValue) => Setpickercategory(itemValue)}
      style={[styles.picker]}
      mode="dialog"
    >
      <Picker.Item label="Art & Design" value="Art & Design" />
      <Picker.Item label="Tech & Innovation" value="Tech & Innovation" />
      <Picker.Item label="Entertainment" value="Entertainment" />
      <Picker.Item label="Lifestyle & Sports" value="Lifestyle & Sports" />
      <Picker.Item label="Open Talent" value="Open Talent" />
    </Picker>
  </View>

  {/* Video Select Button */}
  <TouchableOpacity style={styles.videoButton} onPress={openFile}>
    <Text style={styles.videoButtonText}>Select your Video to post</Text>
  
  </TouchableOpacity>
  <Video
  source={{ uri: sendvideo ? `${API_BASE_URL}${sendvideo}` : undefined }}
  useNativeControls
  resizeMode={Video.RESIZE_MODE_COVER}
  isMuted
  style={styles.video}
/>

  {/* Tip + Submit */}
  <View style={styles.uploadFooter}>
    <Text style={styles.tipText}></Text>
    <TouchableOpacity style={styles.submitButton} onPress={postFinalvalue}>
      <Text style={styles.submitButtonText}>Submit</Text>
    </TouchableOpacity>
  </View>
</View>


            <View style={styles.leaderboard}>
              <Text style={styles.leadH3}>Top Creators — This Week</Text>
              
              <FlatList
  data={topusers}
  keyExtractor={(item) => `active-${item.id}`}
  renderItem={({ item }) => (
    <View style={styles.leaderItem}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
       
     <Image source={item.usersimage?{uri:`${API_BASE_URL}/uploads/${item.usersimage}`}:null} style={styles.topusersimage}/>
          <Text style={{ fontWeight: "700" }}>{item.username}</Text>
          <Text style={styles.mutedSmall}>{item.Category}</Text>
        
      </View>

      <Text style={{ fontWeight: "700" }}>{item.totalvalue}XP</Text>
    </View>
  )}
/>

              <TouchableOpacity style={{alignSelf:"center", marginTop:8}}>
                {/* <Text style={styles.viewAll}>Full leaderboard →</Text> */}
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={{fontWeight:"700"}}>How winners are chosen</Text>
              <Text style={styles.mutedSmall}>
                Weekly winners per category are chosen by engagement score (likes + unique comments). We limit one like per user per post to reduce farming.
              </Text>
              <View style={{flexDirection:"row",gap:8,marginTop:8}}>
                <View style={styles.tag}><Text style={{fontWeight:"700"}}>No Judges</Text></View>
                
              </View>
            </View>
          </View>
        </View>

        {/* Category leaders */}
        

    
          
        

      </ScrollView>
      <BottomNavigator navigation={navigation}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  /* APP BACKGROUND */
  safe: { 
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  container: { 
    padding: 20,
    paddingBottom: 140,
  },
muted:{
  fontSize:18,
 color: "#00AACC",
 marginBottom:10,
 borderColor:"#00AACC"
},
  /* HEADER */
  header: { 
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  brand: { 
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logo: { 
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  logoText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
  },

  title: { 
    color: "#000",
    fontWeight: "900",
    fontSize: 18,
  },

  subtitleSmall: { 
    color: "#555",
    fontSize: 12,
    marginTop: 2,
  },

  /* HERO CARD */
  hero: {
    marginBottom: 24,
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  eyebrow: {
    color: "#00AACC",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },

  heroTitle: {
    color: "#000",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 4,
  },

  heroSub: {
    color: "#444",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "90%",
  },

  /* SECTION */
  section: { 
    marginTop: 34,
    marginBottom: 18,
  },

  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
  },

  sectionH2: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
  },

  viewAll: {
    color: "#00AACC",
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* CATEGORY CARD */
  cat: {
    padding: 18,
    borderRadius: 20,
    marginRight: 14,
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    width: 180,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  catActive: {
    backgroundColor: "rgba(0,170,204,0.15)",
    borderColor: "#00AACC",
  },

  catEmoji: { 
    fontSize: 28,
  },

  catTitle: { 
    color: "#000",
    fontWeight: "800",
    marginTop: 8,
    fontSize: 15,
  },

  catSub: { 
    color: "#666",
    fontSize: 12,
    marginTop: 3,
  },

  /* TRENDING VIDEO CARD */
  videoCard: {
    marginBottom: 30,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#0F1117",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  
  trendingVideo: {
    width: "100%",
    height: 380,
  },
  
  overlayInfo: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(15,17,23,0.75)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backdropFilter: "blur(10px)", // ignored on RN but conceptually fine
  },
  

  authorRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  
  avatarText: {
    color: "#F5F5F7",
    fontSize: 18,
    fontWeight: "900",
  },
  
  authorName: {
    color: "#F5F5F7",
    fontWeight: "700",
    fontSize: 15,
  },
  
  authorMeta: {
    color: "#A1A1AA",
    fontSize: 12,
  },
  

  reactionsRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(155,107,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(155,107,255,0.4)",
  },
  

  reactions: { 
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },

  /* UPLOAD CARD */
  uploadCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    marginBottom: 34,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  uploadTitle: { 
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
  },

  uploadInput: {
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 14,
    borderRadius: 16,
    color: "#000",
    fontSize: 14,
  },

  pickerWrapper: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    marginTop: 16,
    overflow: "hidden",
  },

  videoButton: {
    backgroundColor: "#00AACC",
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 40,
  },

  videoButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
    textAlign: "center",
  },

  video: {
    width: "100%",
    height: 250,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#E4E4E4",
  },

  submitButton: {
    backgroundColor: "#9B5BFF",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 40,
    marginTop: 10,
  },

  submitButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
    textAlign: "center",
  },

  tipText: { 
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },

  uploadFooter: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* LEADERBOARD */
  leaderboard: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 34,
  },
  

  leadH3: {
    color: "#F5F5F7",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 18,
  },
  

  leaderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  

  mutedSmall: {
    color: "#A1A1AA",
    fontSize: 12,
  },
  

  /* SMALL CATEGORY CARDS */
  smallCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  topusersimage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(155,107,255,0.6)",
  },
  
// reactionsRow:{
//   width:'100%',
//   borderRadius:15,
//   backgroundColor:"#00AACC"
// }
});




