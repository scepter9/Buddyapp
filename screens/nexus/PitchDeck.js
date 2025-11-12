import React, { useEffect, useState ,useContext} from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { FlatList } from "react-native";
import { AuthorContext } from '../AuthorContext';
import BottomNavigator from '../BottomNavigator';

const API_BASE_URL = "http://192.168.0.136:3000";


function PitchValue({item,navigation,isloading}){
  return(
    <TouchableOpacity onPress={()=>navigation.navigate('PitchScreen',{pitchid:item?.id})}>
    <View  style={styles.card}>
    {isloading && <ActivityIndicator/>}
              <Text style={styles.title}>{item.pitch_title}</Text>
              <Text style={styles.desc} numberOfLines={1}>{item.pitch_description}</Text>
  
              {/* <View style={styles.tagsContainer}>
                {pitch.tags.map((tag, j) => (
                  <Text key={j} style={styles.tag}>
                    {tag}
                  </Text>
                ))}
              </View> */}
  
              <View style={styles.meta}>
                <Text style={styles.metaText}>Posted By {item.pitch_creator}</Text>
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Text>💬 6</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text>❤️ 7</Text>
                  </View>
                </View>
              </View>
            </View>
            </TouchableOpacity>
  )
  }

const PitchDeck = ({navigation}) => {
  const { user } = useContext(AuthorContext);
  const username=user?.id;
  const [modalVisible, setModalVisible] = useState(false);
  const [writepitch,setwritepitch]=useState('')
  const [title,settitle]=useState('')
  const [pitchdata,setpitchdata]=useState([])
  const [display,setdisplay]=useState(false)
  const [findpitch,setfindpitch]=useState([])
  const [searchQuery,setSearchQuery]=useState('')
  const [isloading ,setisloading]=useState(false)

  useEffect(()=>{
    const fetchPitches=async()=>{
      try{
        setisloading(true)
        const response=await fetch(`${API_BASE_URL}/getpitches`);
        if(!response.ok){
          console.log('Something went wrong ');
          return;
        }
        const data=await response.json();
        setpitchdata(data)
       
      }catch(err){
        console.log(err);
      }finally{
        setisloading(false)
      }
    }
    fetchPitches()
  },[])

  useEffect(()=>{
    const searchPitch=setTimeout(async()=>{
      if(searchQuery.trim().length===0){
        setfindpitch([]);
        return;
      }
      try{
        const res=await fetch (`${API_BASE_URL}/searchpitchval?search=${searchQuery}`);
        if(!res.ok){
          console.log('Something went wrong');
          return;
        }
        const data=await res.json()
        setfindpitch(data);

      }catch(err){
        console.log(err);
      }
    },300)
    return()=>clearTimeout(searchPitch);
  },[searchQuery])
const sendPitch=async()=>{
try{
  setisloading(true)
  const res=await fetch(`${API_BASE_URL}/postpitches`,{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({writepitch,title,username})
  })
  if(!res.ok){
    console.log('Something went wrong ');
    return;
  }
}catch(err){
  console.log(err);
}finally{
  setisloading(false)
  setdisplay(true)
}

setwritepitch('')
settitle('')
setModalVisible(false)
}
  

  return (
    <SafeAreaView style={styles.mainscreen}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.appBar}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🚀</Text>
          </View>
          <Text style={styles.brand}>The Pitch Deck</Text>
          <View style={styles.headerRight}>
            {/* <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Saved</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.btnPrimaryText}>+ Post Pitch</Text>
            </TouchableOpacity>
          </View>
        </View>

      
        <View style={styles.filterBar}>
          <View style={styles.selectBox}>
            
          </View>
          <View style={styles.searchBox}>
            <Text>🔍</Text>
            <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholder="Search pitches"
              placeholderTextColor="#a1a6b3"
            />
          </View>
        </View>
      </View>



{/*   
      <ScrollView contentContainerStyle={styles.main}> */}
      {isloading ? (
          <ActivityIndicator size="large" color="#9a6bff" style={{ marginTop: 30 }} />
      ):
<FlatList
  data={searchQuery.trim() ? findpitch : pitchdata}
  keyExtractor={(item) => item?.id?.toString()}
  renderItem={({ item }) => (
    <PitchValue item={item} navigation={navigation} isloading={isloading} />
  )}
  contentContainerStyle={{ padding: 20 }}
  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
  ListEmptyComponent={() => (
    <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
      No pitches found.
    </Text>
  )}
/>
      }
      

       

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Post a Pitch</Text>
            <TextInput
            value={title}
            onChangeText={settitle}
              placeholder="Pitch title"
              placeholderTextColor="#a1a6b3"
              style={styles.input}
            />
            <TextInput
            value={writepitch}
            onChangeText={setwritepitch}
              placeholder="Write your pitch, write what you want to sell or advertise"
              placeholderTextColor="#a1a6b3"
              style={[styles.input, styles.textarea]}
              multiline
            />
         
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={sendPitch}>
                <Text style={styles.btnPrimaryText}>Post</Text>
                
                
              </TouchableOpacity>
              
            </View>
          </View>
        </View>
        {display && (  <Text style={styles.btnPrimaryTexte}>Your pitch has been posted</Text>)}
      </Modal>
    </View>
    <BottomNavigator navigation={navigation}/>
    </SafeAreaView>
  );
};

export default PitchDeck;

const styles = StyleSheet.create({
  mainscreen:{flex: 1, backgroundColor: "#0d0f14" },
  container: { flex: 1, backgroundColor: "#0d0f14" },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(13,15,20,0.8)",
  },
  searchpitch:{
flex: 1,
padding:20,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 20,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9a6bff",
  },
  logoText: { fontSize: 20 },
  brand: { color: "#f3f4f6", fontWeight: "700", fontSize: 18, marginLeft: 10 },
  headerRight: { flexDirection: "row", marginLeft: "auto", gap: 10 },
  btn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(30,32,40,0.7)",
  },
  btnText: { color: "#f3f4f6", fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "#9a6bff",
    borderWidth: 0,
  },
 
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnPrimaryTexte: { color: "green", fontWeight: "700" },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 20,
  },
  selectBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 12,
  },
  selectText: { color: "#f3f4f6", fontWeight: "600" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  searchInput: { color: "#fff", marginLeft: 6, width: 150 },

  main: { padding: 20, gap: 20 },
  card: {
    backgroundColor: "rgba(20,22,30,0.7)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 18 },
  desc: { color: "#a1a6b3", fontSize: 14, marginTop: 4 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    fontSize: 13,
    color: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#5ac8fa",
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  metaText: { color: "#a1a6b3", fontSize: 13 },
  metrics: { flexDirection: "row", gap: 8 },
  metric: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "rgba(20,22,30,0.9)",
    padding: 20,
    borderRadius: 20,
    width: "90%",
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    padding: 10,
    marginBottom: 10,
  },
  textarea: { height: 100 },
  tagArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 8,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9a6bff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagInput: {
    color: "#fff",
    flex: 1,
    minWidth: 80,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
});
