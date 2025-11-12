 import React, { useState ,useEffect,useContext} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  Alert,
  FlatList,
  
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";


const API_BASE_URL = "http://192.168.0.136:3000";
import BottomNavigator from '../BottomNavigator';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthorContext } from '../AuthorContext';

export default function CampusPulse({navigation}) {
  const { user } = useContext(AuthorContext);
    const myUserId = user?.id;
  const [stories,setstories]=useState([])
 

useEffect(()=>{
  const Fetchstories=async()=>{
    try{
      const response=await fetch(`${API_BASE_URL}/pulsedata`)
      if (!response.ok) throw new Error("Network response not ok");
const data = await response.json();

      setstories(data)
    }catch(err){
      if(err){
        
      }console.log(err);
    }
  }
  Fetchstories();
},[])




function StoryCard({ item, navigation }) {
  const API_BASE_URL = 'http://172.20.10.4:3000';
  const likeKey = `like_${item.ID}`;
  const dislikeKey = `dislike_${item.ID}`;

  const [increase, setIncrease] = useState(0);
  const [decrease, setDecrease] = useState(0);
  const [love, setLove] = useState(false);
  const [hate, setHate] = useState(false);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const savedLike = await AsyncStorage.getItem(likeKey);
        const savedDislike = await AsyncStorage.getItem(dislikeKey);
        if (savedLike) setIncrease(JSON.parse(savedLike));
        if (savedDislike) setDecrease(JSON.parse(savedDislike));
      } catch (err) {
        console.log(err);
      }
    };
    fetchValues();
  }, []);

  const PositiveCount = async () => {
    try {
      if (hate) {
        const getHate = await AsyncStorage.getItem(dislikeKey);
        const updateGetHate = JSON.parse(getHate) - 1;
        setDecrease(updateGetHate);
        await AsyncStorage.setItem(dislikeKey, JSON.stringify(updateGetHate));
        setHate(false);
      }

      if (!love) {
        const newValue = increase + 1;
        setIncrease(newValue);
        setLove(true);
        await AsyncStorage.setItem(likeKey, JSON.stringify(newValue));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const NegativeCount = async () => {
    try {
      if (love) {
        const getLove = await AsyncStorage.getItem(likeKey);
        const updateGetLove = JSON.parse(getLove) - 1;
        setIncrease(updateGetLove);
        await AsyncStorage.setItem(likeKey, JSON.stringify(updateGetLove));
        setLove(false);
      }

      if (!hate) {
        const newValue = decrease + 1;
        setDecrease(newValue);
        setHate(true);
        await AsyncStorage.setItem(dislikeKey, JSON.stringify(newValue));
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.card}>
      <ImageBackground
        source={{
          uri: item.image ? `${API_BASE_URL}${item.image}` : null,
        }}
        style={styles.storyImage}
        imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
      >
        <View style={styles.overlay} />
        <Text style={styles.storyTitle}>{item.title}</Text>
      </ImageBackground>

      <View style={styles.storyBody}>
        <Text style={styles.storyMeta}>{item.author}</Text>
        <Text style={styles.storyText} numberOfLines={7}>
          {item.post}
        </Text>

        <View style={styles.storyFooter}>
          <View style={styles.likeDislike}>
            <View style={styles.voteBtn}>
              <TouchableOpacity onPress={PositiveCount} style={{ alignItems: 'center' }}>
                <Text style={styles.reaction}>{increase < 1 ? '' : increase}</Text>
                <FontAwesome name="thumbs-up" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.voteBtn}>
              <TouchableOpacity onPress={NegativeCount} style={{ alignItems: 'center' }}>
                <Text style={styles.reaction}>{decrease < 1 ? '' : decrease}</Text>
                <FontAwesome name="thumbs-down" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('FullStory', { StoryID: item.ID })}
          >
            <Text style={styles.btnText}>Read More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


  

  return (
<SafeAreaView style={styles.wrapper}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Campus Pulse ⚡</Text>
        <Text style={styles.subHeader}>Your Stories. Your Voice.</Text>
      </View>


      {/* Main Content */}
      <View style={{ flex: 1 }}>
  <FlatList
  ListHeaderComponent={() => (
    <View style={styles.requestSection}>
      <Text style={styles.requestTitle}>Want to Share Your Story?</Text>
      <Text style={styles.requestText}>
        Request to write and inspire others with your experiences on Campus Pulse.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("RequestToWrite")}
      >
        <Text style={styles.btnText}>Request to Write ✍️</Text>
      </TouchableOpacity>
    </View>
  )}
    data={stories}
    keyExtractor={(item) => item.ID?.toString()}
    renderItem={({ item }) => (
      <StoryCard item={item} navigation={navigation} />
    )}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
      padding: 20,
      paddingBottom: 180, // 👈 ensures footer/request section is visible
    }}
    // ListFooterComponent={() => (
    //   <View>
    //     {/* Request Section */}
    //     <View style={styles.requestSection}>
    //       <Text style={styles.requestTitle}>Want to Share Your Story?</Text>
    //       <Text style={styles.requestText}>
    //         Request to write and inspire others with your experiences on Campus Pulse.
    //       </Text>
    //       <TouchableOpacity
    //         style={styles.btn}
    //         onPress={() => navigation.navigate("RequestToWrite")}
    //       >
    //         <Text style={styles.btnText}>Request to Write ✍️</Text>
    //       </TouchableOpacity>
    //     </View>

        
    //     {/* <View style={styles.footerFixed}>
    //     <Text style={styles.footerText}>© 2025 Campus Pulse. All Rights Reserved.</Text>
    //   </View> */}
    //   </View>
    // )}
  />
</View>
</View>

    <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  voteBtn: {
    backgroundColor: '#2f2f4f', // darker modern shade for contrast
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerFixed: {
    backgroundColor: "#151527",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  
  wrapper: {
    flex: 1,
    backgroundColor: "#24243d",
  },
  container: {
    flex: 1,
    backgroundColor: "#1b1b2f",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingVertical: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  main: {
    padding: 20,
    gap: 25,
  },

  // Story Card
  card: {
    backgroundColor: "#24243d",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
    marginBottom: 40,
  },
  storyImage: {
    height: 200,
    justifyContent: "flex-end",
  },
  requestSection: {
    backgroundColor: "#232338",
    position: 'absolute',
  bottom: 90, // just above bottom nav
  left: '10%',
  right: '10%',
  paddingVertical: 15,
  borderRadius: 30,
  alignItems: 'center',
  elevation: 5,
  },
  
  
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    margin: 15,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subHeader: {
    color: "#e0e7ff",
    fontSize: 14,
    marginTop: 4,
  },
  storyBody: {
    padding: 16,
  },
  storyMeta: {
    fontSize: 16,
    fontWeight: '700',
    color: "#a5b4fc", // deep slate blue-gray
    letterSpacing: 0.3,
    marginBottom:20,
  },
  
  
  
  storyText: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 15,
    lineHeight: 20,
  },
  storyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likeDislike: {
    flexDirection: "row",
    gap: 16,
  },
  reaction: {
    fontSize: 20,
    color: "#cbd5e1",
  },
  btn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Request Section
  requestSection: {
    backgroundColor: "#232338",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 4,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#fff",
    textAlign: "center",
  },
  requestText: {
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 20,
  },

  // Footer
  footer: {
    marginTop: 20,
    backgroundColor: "#151527",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
