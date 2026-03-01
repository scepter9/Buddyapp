
import React, { useContext, useEffect, useState ,useRef} from 'react';
import {
View,
Text,
Image,
StyleSheet,
Dimensions,
SafeAreaView,
TouchableOpacity,
Animated
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
const API_BASE_URL = "http://192.168.0.136:3000";
import { io } from "socket.io-client";
const { width } = Dimensions.get('window');
import { AuthorContext } from '../AuthorContext';
import BottomNavigator from '../BottomNavigator';
import * as Haptics from 'expo-haptics'


export default function Match({navigation}){
    const {user}=useContext(AuthorContext)
    const usersid=user?.id;
    const [buddies,Setbuddies]=useState([])
    const [currentIndex,setCurrentindex]=useState(0)
    const [socket,setSocket]=useState(null)
    
    
const opacityval=useRef(new Animated.Value(1)).current
const scaleAnim = useRef(new Animated.Value(0.8)).current; // start slightly small
const opacityAnim = useRef(new Animated.Value(0)).current; // start invisible
const bubbleOpacity = useRef(new Animated.Value(0)).current;
const bubbleTranslateY = useRef(new Animated.Value(20)).current;


    useEffect(()=>{
        const fetchBuddy=async()=>{
try{
    if (!usersid) return;
    const res=await fetch(`${API_BASE_URL}/api/matches?userId=${usersid}`)
    if(!res.ok){
        console.log('Something went wrong while fetching buddies');
        return
    }
    const data=await res.json()
    Setbuddies(data)
    
}catch(err){
    console.log(`${err} in buddies`);
}
        }
        fetchBuddy()
    },[usersid])
    useEffect(()=>{
        if (!usersid) return;
const Buddysocket=io(API_BASE_URL,{
    query:{userId:usersid},
    transports:['websocket']
});
setSocket(Buddysocket);
return()=>Buddysocket.disconnect();
    },[usersid])
    const joinInterest = buddies[currentIndex]
    ? [
        buddies[currentIndex].shared_answer_1,
        buddies[currentIndex].shared_answer_2,
        buddies[currentIndex].shared_answer_3,
        buddies[currentIndex].shared_answer_4,
      ].filter(Boolean)
    : [];
  
    const handleSkip = (userid) => {
        if (!socket || !userid) return;
      
        const payload = {
          skipper: usersid,
          skipped: userid,
        };
      
        // tell backend
        socket.emit('Removeuser', payload);
      
        // subtle haptic (skip ≠ celebration)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
        // fade card out
        Animated.timing(opacityval, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          // move index AFTER fade
          if (currentIndex < buddies.length - 1) {
            setCurrentindex(i => i + 1);
          } else {
            navigation.navigate('CampusNexus');
            return;
          }
      
          // fade next card in
          Animated.timing(opacityval, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });
      };
      
      const handleConnect = (userid) => {
        if (!socket || !userid) return;
      
        const userDetails = {
          skipper: usersid,
          skipped: userid,
        };
      const notificationSend={
        sender:usersid,
        receiver:userid,
        type:'sentbuddy',
        message:'Buddy Request'
      }
        // Emit to server
        socket.emit('Removeuser', userDetails);
        socket.emit('Updatenotifi',notificationSend)
      
        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
        // Show the bubble
        showBubble();
      setTimeout(() => {
        if (currentIndex < buddies.length - 1) {
          setCurrentindex((i) => i + 1);
        } else {
          navigation.navigate('CampusNexus');
        }
      }, 1600);
        // Move to next buddy or navigate if done
       
      };
      
      const showBubble = () => {
        
        opacityval.setValue(1);

        bubbleOpacity.setValue(0);
        bubbleTranslateY.setValue(20);
      
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleTranslateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(bubbleOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bubbleTranslateY, {
              toValue: 20,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }, 3500);
      };
      
  
  
  if (!buddies.length) {
    return (
      <SafeAreaView style={{ flex: 1 ,alignItems:'center'}}>
        <View style={styles.noUser}>
        <Text style={{ color: '#000',
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 22,}}>No Matches yet…</Text>
      <TouchableOpacity style={{ width:100,height:100,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:'#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 15,}}onPress={()=>navigation.goBack()}>
       
          <Text style={{        color: '#0b3d2e',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 22,}}>Go Back</Text>
     
      </TouchableOpacity>
        </View>
        
      </SafeAreaView>
    );
  }
  
   return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E3A3A' }}>
      <LinearGradient
        colors={['#4DB6AC', '#1E3A3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Find Your Campus Buddy</Text>
        </View>
  
        {/* Animated content */}
        <Animated.View style={{ opacity: opacityval }}>
          {/* Interest Tags */}
          <View style={styles.tagsContainer}>
            {joinInterest.length > 0 &&
              joinInterest.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}✨ </Text>
                </View>
              ))}
          </View>
  
          {/* Main Card */}
          <View style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* Profile Image */}
            <View style={styles.imageContainer}>
              <Image
                source={
                  buddies[currentIndex]?.theimage
                    ? { uri: `${API_BASE_URL}/uploads/${buddies[currentIndex].theimage}` }
                    : { uri: 'https://randomuser.me/api/portraits/men/32.jpg' }
                }
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            </View>
  
            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.name}>
                {buddies[currentIndex]?.thename}
              </Text>
  
              <Text style={styles.major}>Computer Science Major</Text>
  
              <Text style={styles.matchPercentage}>
  {Number(buddies[currentIndex]?.similarity_percent || 0).toFixed(0)} %match
</Text>

  
              <Text style={styles.matchSubtitle}>
                Based on your interests
              </Text>
  
              <Text style={styles.commonTopics}>4 common topics</Text>
  
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.skipButton]}
                  onPress={() => handleSkip(buddies[currentIndex]?.other_user)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>❌</Text>
                </TouchableOpacity>
  
                <TouchableOpacity
  style={[styles.actionButton, styles.connectButton]}
  activeOpacity={0.8}
  onPress={() => handleConnect(buddies[currentIndex]?.other_user)}
>
  <Text style={styles.buttonIcon}>🤝</Text>
</TouchableOpacity>

{/* FLOATING BUBBLE (GLOBAL) */}
<Animated.View
  pointerEvents="none"
  style={[
    styles.bubble,
    {
      opacity: bubbleOpacity,
      transform: [{ translateY: bubbleTranslateY }],
    },
  ]}
>
  <Text style={styles.bubbleText}>
    Interest sent!🌟 Lets see if the vibe matches.
  </Text>
</Animated.View>


              </View>
            </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
  
      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
     
      justifyContent: 'flex-start', // start at top, not center
      paddingTop: 60,
    },
    cardWrapper: {
        width: '100%',
        alignItems: 'center',
      },
      
    headerContainer: {
      alignItems: 'center',
      width: '100%',
      marginBottom: 10,
    },
    title: {
      fontSize: 36,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',          // allows multiple lines
        justifyContent: 'center',  // center each line
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginTop: 15,
        width: '100%',             // make sure it uses full parent width
      },
      tag: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        margin: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
      },
      
    tagText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    card: {
      width: '85%',
   
      maxWidth: 380,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 30,
      paddingHorizontal: 20,
      paddingTop: 70, // leave room for image
      paddingBottom: 30,
      alignItems: 'center',
      marginTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    imageContainer: {
      position: 'absolute',
      top: -60,
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      borderWidth: 4,
      borderColor: '#FFFFFF',
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 15,
      elevation: 10,
    },
    cardContent: {
      alignItems: 'center',
      marginTop: 10,
    },
    name: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 10,
    },
    major: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 10,
    },
    matchPercentage: {
      fontSize: 44,
      fontWeight: '900',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 255, 255, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
      marginVertical: 5,
    },
    matchSubtitle: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.85,
      marginBottom: 5,
    },
    commonTopics: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.7,
      marginBottom: 15,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around', // better spacing
      width: '100%',
      marginTop: 20,
    },
    actionButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 15,
    },
    skipButton: {
      backgroundColor: '#FF5252',
    },
    connectButton: {
      backgroundColor: '#1DE9B6',
    },
    buttonIcon: {
      fontSize: 32, // bigger emoji
      fontWeight: '600',
    },
    bubble: {
      position: 'absolute',
      bottom: 140, // above buttons
      left: 20,
      right: 20,
      alignSelf: 'center',
    
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 28,
    
      backgroundColor: 'rgba(29, 233, 182, 0.95)',
    
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
    
      
      bubbleText: {
        color: '#0b3d2e',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 22,
      },
      noUser:{
        paddingHorizontal:12,
        paddingVertical:22,
        backgroundColor:'#fff',
        borderRadius:12,
      }
      
  });
  


