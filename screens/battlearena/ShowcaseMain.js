// App.js
import React, { useState ,useContext} from "react";
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
  
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Picker } from "@react-native-picker/picker";
import { AuthorContext } from "../AuthorContext";
const { width } = Dimensions.get("window");
const API_BASE_URL = "http://192.168.0.136:3000";

const CATEGORIES = [
  { id: "art", emoji: "🎨", title: "Art & Design", subtitle: "Illustration • UI • Motion • Fashion" },
  { id: "tech", emoji: "💻", title: "Tech & Innovation", subtitle: "Demos • Mini Projects • Robotics" },
  { id: "ent", emoji: "🎭", title: "Entertainment", subtitle: "Music • Dance • Comedy • Drama" },
  { id: "sport", emoji: "⚽", title: "Lifestyle & Sports", subtitle: "Tricks • Fitness • Cooking" },
  { id: "open", emoji: "🧩", title: "Open Talent", subtitle: "Anything goes — surprise us!" },
];

const FEED = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60",
    title: "Hope — UI Redesign Reel",
    desc: "30s breakdown of a campus app concept — motion + color study.",
    author: "Hope Mark",
    meta: "Computer Eng • 2h ago",
    reactions: "❤️ 1.2k • 💬 120",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=60",
    title: "Ada — Mini API Demo",
    desc: "60s demo: from Postman to preview — serverless backend in 90s.",
    author: "Ada C.",
    meta: "Software • 4h ago",
    reactions: "🔥 980 • 💬 86",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=60",
    title: "Chika — Campus Freestyle",
    desc: "Short rap about exams — raw and unfiltered.",
    author: "Chika O.",
    meta: "Arts • 1d ago",
    reactions: "✨ 710 • 💬 45",
  },
];

const LEADERS = [
  { id: "l1", name: "Hope Mark", rank: 1, xp: "1.2k" },
  { id: "l2", name: "Ada C.", rank: 2, xp: "980" },
  { id: "l3", name: "Chika O.", rank: 3, xp: "820" },
];

export default function ShowcaseMain() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [describe,setDescribe]=useState('')
  const [categoryInput, setCategoryInput] = useState("Category");
  const [pickercategory,Setpickercategory]=useState(null)
  const [sendvideo,setSendvideo]=useState(null)

  const {user}=useContext(AuthorContext);
  const userId=user?.id;
  const renderCategory = ({ item }) => {
    const active = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.cat, active && styles.catActive]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Text style={styles.catEmoji}>{item.emoji}</Text>
        <Text style={styles.catTitle}>{item.title}</Text>
        <Text style={styles.catSub}>{item.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <ImageBackground source={{ uri: item.image }} style={styles.media} imageStyle={styles.mediaRadius}>
          {/* Could add overlay or play icon */}
        </ImageBackground>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.desc}</Text>

        <View style={styles.metaRow}>
          <View style={styles.author}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.author}</Text>
              <Text style={styles.authorMeta}>{item.meta}</Text>
            </View>
          </View>
          <Text style={styles.reactions}>{item.reactions}</Text>
        </View>
      </View>
    );
  };

  const openFile=async()=>{
  const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(status!='granted'){
Alert.alert('Permission Required to access photos')
return;
  }
  let result=await ImagePicker.launchImageLibraryAsync({
    allowsEditing:false,
    mediaTypes:ImagePicker.MediaTypeOptions.Videos,
    videoQuality:'high'
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
      headers:{'Content-Type':'multi-part/form-data'},
      body:formData
    })
    const data=await res.json()
if(!data){
  console.log('Cannot fetch Videos');
}

   }catch(err){
    console.log(err);
   }finally{
    const finalvideo=data.VideoUrl;
    setSendvideo(finalvideo);
   }
  };

  const postFinalvalue=async()=>{
    if(!title || !pickercategory || !sendvideo){
      Alert.alert('Please Input A value');
      return;
    }
    try{
      const res=await fetch(`${API_BASE_URL}/postshowcases`,{
        method:'POST',
        credentials:"include",
       headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title,pickercategory,sendvideo,userId,describe})
      })
      if(!res.ok){
        console.log('Something went wrong');
      }
    }catch(err){
console.log(err);
    }finally{
      setTitle('')
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
              <Text style={styles.subtitleSmall}>Campus talent hub • Upload short videos • Weekly top creators</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.ctaBtn]}>
              <Text style={styles.ctaText}>1v1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctaBtn]}>
              <Text style={styles.ctaText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.eyebrow}>🎬 Campus Showcase — Videos only</Text>
            <Text style={styles.heroTitle}>Show your skill. Win the crowd.</Text>
            <Text style={styles.heroSub}>Short video showcases judged by engagement. Categories keep it fair — upload, tag, and let the campus vote. Weekly winners per category.</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>View Showcase</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAlt]}><Text style={[styles.btnText, styles.btnAltText]}>Explore Categories</Text></TouchableOpacity>
              <View style={styles.badge}><Text style={styles.badgeText}>Weekly Reset: Sun 11PM</Text></View>
            </View>
          </View>

          <View style={styles.heroRight}>
            <View style={{ marginBottom: 8 }}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
                <Text style={styles.muted}>Your Rank</Text>
                <Text style={{fontWeight:"800"}}>Specialist</Text>
              </View>
              <View style={styles.stat}><Text style={styles.muted}>XP</Text><Text style={styles.statNumber}>1,240</Text></View>
              <View style={styles.stat}><Text style={styles.muted}>Total Reactions</Text><Text style={styles.statNumber}>5.2k</Text></View>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionH2}>Choose a Category</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>

          <FlatList
            data={CATEGORIES}
            keyExtractor={(i) => i.id}
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
              <TouchableOpacity><Text style={styles.viewAll}>See trending →</Text></TouchableOpacity>
            </View>

            <FlatList
              data={FEED}
              keyExtractor={(i) => i.id}
              renderItem={renderCard}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          </View>

          {/* Right column now stacked below on mobile */}
          <View style={styles.sidebar}>
            <View style={styles.uploadCard}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
                <Text style={{fontWeight:"700"}}>Upload a Showcase</Text>
                <Text style={styles.muted}>Max 60s • MP4/WEBM</Text>
              </View>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Give it a title (e.g. 'Parkour Run - 30s')"
                style={styles.uploadInput}
              />
<TextInput
value={describe}
onValueChange={setDescribe}
placeholder="Give a small note about what its about"
style={styles.uploadInput}
/>
              <View style={{flexDirection:"row",gap:8,alignItems:"center"}}>
                <Picker
                selectedValue={pickercategory}
                onValueChange={(itemValue)=>Setpickercategory(itemValue)}
                style={styles.picker}
                mode='dialog'
                >
                  <Picker.item label='Art & Design' value='Art & Design'/>
                  <Picker.item label='Tech & Innovation' value='Tech & Innovation'/>
                  <Picker.item label='Entertainment' value='Entertainment'/>
                  <Picker.item label='Lifestyle & Sports' value='Lifestyle & Sports'/>
                  <Picker.item label='Open Talent' value='Open Talent'/>
                </Picker>
                <TouchableOpacity style={[styles.selectInput, {flex:1}]} onPress={openFile}>
                  <Text>Choose file</Text>

                </TouchableOpacity>
              </View>

              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
                <Text style={styles.mutedSmall}>Tip: Clear title + category gets more eyes</Text>
                <TouchableOpacity style={styles.btn} onPress={postFinalvalue}><Text style={styles.btnText}>Submit</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.leaderboard}>
              <Text style={styles.leadH3}>Top Creators — This Week</Text>
              {LEADERS.map((l) => (
                <View key={l.id} style={styles.leaderItem}>
                  <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
                    <View style={[styles.rank, l.rank === 1 ? styles.rank1 : l.rank === 2 ? styles.rank2 : styles.rank3]}>
                      <Text style={{fontWeight:"800"}}>{l.rank}</Text>
                    </View>
                    <View>
                      <Text style={{fontWeight:"700"}}>{l.name}</Text>
                      <Text style={styles.mutedSmall}>{l.rank === 1 ? "Specialist" : l.rank === 2 ? "Challenger" : "Rising"} • {l.xp} XP</Text>
                    </View>
                  </View>
                  <Text style={{fontWeight:"700"}}>{l.xp}</Text>
                </View>
              ))}
              <TouchableOpacity style={{alignSelf:"center", marginTop:8}}>
                <Text style={styles.viewAll}>Full leaderboard →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={{fontWeight:"700"}}>How winners are chosen</Text>
              <Text style={styles.mutedSmall}>
                Weekly winners per category are chosen by engagement score (likes + unique comments). We limit one like per user per post to reduce farming.
              </Text>
              <View style={{flexDirection:"row",gap:8,marginTop:8}}>
                <View style={styles.tag}><Text style={{fontWeight:"700"}}>No Judges</Text></View>
                <View style={styles.tagAlt}><Text style={{fontWeight:"700"}}>Weekly Reset</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* Category leaders */}
        <View style={{marginTop:22}}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionH2}>Category Leaders</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
          </View>

          <View style={{flexDirection:"row",justifyContent:"space-between",gap:8}}>
            <View style={styles.smallCard}><Text style={{fontWeight:"700"}}>Art & Design</Text><Text style={styles.mutedSmall}>Top creator: Hope Mark • 1.2k reactions</Text></View>
            <View style={styles.smallCard}><Text style={{fontWeight:"700"}}>Tech & Innovation</Text><Text style={styles.mutedSmall}>Top creator: Ada C. • 980 reactions</Text></View>
            <View style={styles.smallCard}><Text style={{fontWeight:"700"}}>Entertainment</Text><Text style={styles.mutedSmall}>Top creator: Chika O. • 710 reactions</Text></View>
          </View>
        </View>

        <View style={{height:40}} />

        <View style={{alignItems:"center", marginBottom:40}}>
          <Text style={styles.mutedSmall}>© 2025 Campus Nexus — Showcase • Designed by Hope Mark Nkoo</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffdfa" },
  container: { padding: 18 },

  // header
  picker:{
    width:150,
    height:50,
    backgroundColor:'grey',
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#ff6b6b", alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoText: { color: "#06121a", fontWeight: "800" },
  title: { fontSize: 16, fontWeight: "800" },
  subtitleSmall: { fontSize: 12, color: "#6b6b76" },

  headerActions: { flexDirection: "row", gap: 8 },
  ctaBtn: { backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  ctaText: { fontWeight: "700" },

  // hero
  hero: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: "row", gap: 12 },
  heroLeft: { flex: 1 },
  eyebrow: { fontSize: 12, color: "#6b6b76", fontWeight: "600", marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#8a2be2" },
  heroSub: { fontSize: 13, color: "#6b6b76", marginBottom: 12 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 10 },

  btn: { backgroundColor: "#6be4ff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, shadowColor: "#000", elevation: 2 },
  btnText: { fontWeight: "800" },
  btnAlt: { backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  btnAltText: { color: "#111" },

  badge: { backgroundColor: "#ffd166", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: "700", fontSize: 12 },

  heroRight: { width: 160, padding: 8, borderRadius: 12, backgroundColor: "#fffefc", marginLeft: 8 },

  muted: { color: "#6b6b76" },
  mutedSmall: { color: "#6b6b76", fontSize: 12 },

  stat: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  statNumber: { fontWeight: "800" },

  // section
  section: { marginTop: 10 },
  sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionH2: { fontSize: 18, fontWeight: "800" },
  viewAll: { fontSize: 13, color: "#6b6b76" },

  // categories
  cat: { width: width * 0.6, marginRight: 12, padding: 14, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  catActive: { transform: [{ translateY: -6 }], shadowColor: "#000", elevation: 4 },
  catEmoji: { fontSize: 26 },
  catTitle: { fontSize: 14, fontWeight: "700", marginTop: 6 },
  catSub: { fontSize: 12, color: "#6b6b76", marginTop: 4 },

  // feed
  feedSection: { marginTop: 18, gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  media: { height: 170, borderRadius: 10, overflow: "hidden", marginBottom: 12, width: "100%" },
  mediaRadius: { borderRadius: 10 },
  cardTitle: { fontSize: 15, marginBottom: 6, fontWeight: "700" },
  cardDesc: { color: "#6b6b76", marginBottom: 8 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#6be4ff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", color: "#041017" },
  authorName: { fontWeight: "700" },
  authorMeta: { color: "#6b6b76", fontSize: 12 },
  reactions: { color: "#6b6b76", fontSize: 13 },

  // sidebar (stacked)
  sidebar: { marginTop: 16 },

  uploadCard: { padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)", marginBottom: 12 },
  uploadInput: { marginTop: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  selectInput: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginTop: 8 },

  leaderboard: { padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)", marginBottom: 12 },
  leadH3: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  leaderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" },
  rank: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rank1: { backgroundColor: "linear-gradient(90deg,#ffd166,#ff6b6b)" }, // note: RN doesn't support CSS gradients here; keep as placeholder
  rank2: { backgroundColor: "#ffd166" },
  rank3: { backgroundColor: "#a6e3a1" },

  infoBox: { padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  tag: { backgroundColor: "#6be4ff", padding: 6, borderRadius: 8 },
  tagAlt: { backgroundColor: "#8a2be2", padding: 6, borderRadius: 8 },

  smallCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)", marginRight: 8 },
});
