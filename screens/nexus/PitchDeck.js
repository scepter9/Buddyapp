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
  mainscreen: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },

  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },

  // HEADER
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(20,25,40,0.85)",
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(10px)",
  },

  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logoText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },

  brand: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    width: "60%",
  },

  searchInput: {
    color: "#fff",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },

  // CARD
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 18,
    shadowColor: "#8257e6",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    transform: [{ scale: 1 }],
  },

  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 4,
  },

  desc: {
    color: "#c0c4d7",
    fontSize: 14,
    lineHeight: 20,
  },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  metaText: {
    color: "#a1a6b3",
    fontSize: 13,
  },

  metrics: {
    flexDirection: "row",
    gap: 8,
  },

  metric: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  // FLOATING ACTION BUTTON
  fab: {
    position: "absolute",
    bottom: 80,
    right: 24,
    backgroundColor: "linear-gradient(135deg, #8257e6, #9a6bff)",
    width: 58,
    height: 58,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8257e6",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  fabText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "rgba(18,22,35,0.95)",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },

  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 14,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#fff",
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },

  textarea: {
    height: 100,
    textAlignVertical: "top",
  },

  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },

  btnPrimary: {
    backgroundColor: "#8257e6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});


