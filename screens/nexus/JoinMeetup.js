import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, ImageBackground, StyleSheet, TextInput, Platform,Alert } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { AuthorContext } from '../AuthorContext';

// ===== Config =====
const API_BASE_URL = "http://192.168.0.136:3000"; // keep as-is

// ===== Reusable: Neon Search Bar (visual only, no filtering) =====


// ===== Card =====
const MeetupCard = ({ userval,item, sendJoinRequest, navigation ,acceptedrequest,participants}) => {
  const [status, setStatus] = useState('idle'); // idle | pending | accepted
  const isHost = item.host_id === userval;
 
  // check if current user is participant
  const isParticipant = participants?.some((p) => {
   
    return p.user_id === userval && p.meetup_id ===item.id;
  });
  
  

  useEffect(() => {
    let mounted = true;
    if (isHost) {
      setStatus('accepted');
      return;
    }
    acceptedrequest(item.id).then((res) => {
      if (!mounted) return;
      if (res?.status === 'accepted') {
        setStatus('accepted');
      } else if (res?.status === 'pending') {
        setStatus('pending');
      }
    });
    return () => { mounted = false };
  }, [item.id, isHost, acceptedrequest]);

  const handlePress = async () => {
    if (status === 'accepted') {
      navigation.navigate('ChatScreen', { meetupId: item.id });
      return;
    }
    if (status === 'idle') {
      const ok = await sendJoinRequest(item);
      if (ok) setStatus('pending');
    }
  };

  const handleSeeWho = () => {
    if (isParticipant || isHost) {
      navigation.navigate('AttendeesScreen', { meetupVal: item.id });
    } else {
      Alert.alert('Access denied', 'You’re not part of this meetup.');
      console.log(isParticipant,participants)
    }
  };

  const buttonText =
    status === 'accepted'
      ? 'Open group chat'
      : status === 'pending'
      ? 'Pending Approval...'
      : 'Request to Join';

  // Nice fallback initials for “host” bubble (purely visual)
  const hostInitials = useMemo(() => {
    const t = (item?.host || 'New Host').trim().split(/\s+/);
    return (t[0]?.[0] || 'H') + (t[1]?.[0] || '');
  }, [item?.host]);

  return (
    <View style={styles.card}>
      <View style={styles.cardBorder} />
      <ImageBackground
        source={{ uri: item.banner || 'https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?q=80&w=1400&auto=format&fit=crop' }}
        style={styles.banner}
        imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
      >
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerTopRow}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Open spots</Text>
          </View>
          <View style={styles.hostBubble}>
            <Text style={styles.hostText}>{hostInitials}</Text>
          </View>
        </View>

        <View style={styles.bannerBottomRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.emoji || '☕'} {item.title}
          </Text>
          <Text style={styles.metaLine}>
            <Feather name="calendar" size={14} color="#c9d7ff" />  {item.year}-{item.month}-{item.day}  ·   <Feather name="clock" size={14} color="#c9d7ff" />  {item.hour}-{item.minute}
          </Text>
          <Text style={styles.metaLine}>
            <Feather name="map-pin" size={14} color="#c9d7ff" />  {item.location}   ·   <Feather name="activity" size={14} color="#c9d7ff" />  Vibe: {item.vibe}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.cardBody}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.badgeInfo]}>
            <Feather name="users" size={12} color="#c9eaff" />
            <Text style={styles.badgeText}>{item.size} going</Text>
          </View>
          <View style={[styles.badge, styles.badgeSoft]}>
            <Feather name="zap" size={12} color="#ffe8b0" />
            <Text style={styles.badgeText}>{item.vibe}</Text>
          </View>
          <View style={[styles.badge, styles.badgeNew]}>
            <Feather name="star" size={12} color="#caffdf" />
            <Text style={styles.badgeText}>New host</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.9} style={[styles.btn, styles.btnPrimary]}  onPress={ handlePress}>
            <Feather name="send" size={16} color="#0b1020" />
            <Text style={styles.btnPrimaryText}>{buttonText}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.9} style={[styles.btn, styles.btnGhost]}  onPress={handleSeeWho} >
            <Feather name="eye" size={16} color="#cfe0ff" />
            <Text style={styles.btnGhostText}>See who’s going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ===== Screen =====
export default function JoinMeetup({ navigation }) {
  const { user } = useContext(AuthorContext);
  const [meetups, setMeetups] = useState([]);
  const [query, setQuery] = useState('');
  const [truevalue,settruevalue]=useState(false)
  const [participants,setparticipants]=useState([])
  const userIs=user?.id;
  const [searchmeet,setSearchmeet]=useState('');
  const [searchmeetdata,setSearchmeetdata]=useState([])
  const [isloading,setisloading]=useState(false);

  useEffect(() => {
    const getMeetups = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/Createmeet`);
        const data = await res.json();
        setMeetups(data);
      } catch (e) {
        console.error('Error fetching meetups', e);
      }
    };
    getMeetups();
  }, []);
useEffect(()=>{
  const getmeetupUsers=async()=>{
    try{
      const res=await fetch(`${API_BASE_URL}/meetupusers`)
      const data =await res.json()
      setparticipants(data)
    } catch(err){
      if(err){
        Alert.alert(`An err occured ${err} `)
      }
    }
  }
  getmeetupUsers()
  
},[])
  const sendJoinRequest = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/joinRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ meetupId: item.id }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Request Sent', data);
        return true;
      } else {
        console.log('Something went wrong', data);
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  };
  const acceptedrequest = async (meetupId) => {
    try {
      const responded = await fetch(`${API_BASE_URL}/accepted?meetupId=${meetupId}`, {
        credentials: 'include'
      });
      const datavalue = await responded.json();
  
      if (responded.ok) {
        return datavalue;   // ✅ return status object, e.g. { status: 'accepted' }
      }
      return null;
    } catch (err) {
      console.log(`this occurred ${err}`);
      return null;
    }
  };
  useEffect(() => {
    if (searchmeet.trim().length === 0) {
      setSearchmeetdata([]);
      return;
    }
  
    const timeoutId = setTimeout(async () => {
      try {
        setisloading(true);
        const res = await fetch(`${API_BASE_URL}/searchmeetupusers?searchkey=${encodeURIComponent(searchmeet)}`);
        if (!res.ok) {
          console.log('Something went wrong');
          return;
        }
        const data = await res.json();
        setSearchmeetdata(data);
      } catch (err) {
        console.log('Search failed', err);
      } finally {
        setisloading(false);
      }
    }, 500); // debounce delay (500ms)
  
    return () => clearTimeout(timeoutId);
  }, [searchmeet]);
  
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={22} color="#eaf2ff" />
          </TouchableOpacity>
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>NX</Text></View>
            <Text style={styles.brandText}>NEXUS • Discover</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity activeOpacity={0.8} style={styles.headerIcon}>
            <Feather name="bell" size={18} color="#cfe0ff" />
          </TouchableOpacity>
        </View>

        {/* “Crazy & beautiful” Search */}
        <View style={styles.searchWrap}>
      <View style={styles.searchGlow} />
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color="#c3d4ff" style={{ marginRight: 10 }} />
        <TextInput
          value={searchmeet}
          onChangeText={setSearchmeet}
          placeholder="Search by title"
          placeholderTextColor="#8da3d8"
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity activeOpacity={0.8} style={styles.searchChip}>
          <Feather name="hash" size={16} color="#0b1020" />
          <Text style={styles.searchChipText}>trending</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchUnderbar}>
        <View style={styles.dot} />
        <View style={[styles.dot, { width: 24 }]} />
        <View style={[styles.dot, { width: 10 }]} />
      </View>
      <FlatList
      data={searchmeetdata}
      keyExtractor={(item)=>`Active-${item?.id}`}
      renderItem={({item})=>(<MeetupCard userval={userIs} item={item} sendJoinRequest={sendJoinRequest} navigation={navigation}  acceptedrequest={acceptedrequest} participants={participants}/>)}
      ListFooterComponent={<Text style={styles.footer}>© NEXUS — Discover & meet great people near you.</Text>}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      
      />
    </View>

        {/* Feed */}
        <FlatList
          data={meetups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MeetupCard userval={userIs} item={item} sendJoinRequest={sendJoinRequest} navigation={navigation}  acceptedrequest={acceptedrequest} participants={participants}/>}
          ListFooterComponent={<Text style={styles.footer}>© NEXUS — Discover & meet great people near you.</Text>}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

// ===== Styles =====
const BG = '#070a12';
const CARD = 'rgba(255,255,255,0.06)';
const GLASS = 'rgba(255,255,255,0.07)';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? 18 : 8,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 },
  logo: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#6ae0ff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6ae0ff', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, elevation: 4
  },
  logoText: { fontWeight: '800', color: '#0a0f1a' },
  brandText: { fontWeight: '700', color: '#eaf2ff', fontSize: 16, letterSpacing: 0.3 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },

  // Search
  searchWrap: { paddingHorizontal: 16, marginBottom: 6, marginTop: 8 },
  searchGlow: {
    position: 'absolute', left: 26, right: 26, top: 16, height: 40, borderRadius: 999,
    backgroundColor: '#6ae0ff33', filter: 'blur(16px)'
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(14,19,35,0.9)',
    borderWidth: 1, borderColor: '#233152',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#6ae0ff', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },
  searchInput: { flex: 1, color: '#eaf2ff', fontSize: 15 },
  searchChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#6ae0ff',
    flexDirection: 'row', alignItems: 'center', gap: 6
  },
  searchChipText: { color: '#0b1020', fontWeight: '700', fontSize: 12, letterSpacing: 0.2 },
  searchUnderbar: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 8 },
  dot: { height: 4, width: 4, borderRadius: 999, backgroundColor: '#6ae0ff55' },

  // Card
  card: {
    backgroundColor: CARD, borderRadius: 20, marginTop: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 6,
  },
  cardBorder: {
    position: 'absolute', inset: 0, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(110,210,255,0.12)'
  },
  banner: { height: 168, justifyContent: 'flex-end' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'linear-gradient(180deg, rgba(7,10,18,0.05) 0%, rgba(7,10,18,0.35) 50%, rgba(7,10,18,0.85) 100%)'
  },
  // NOTE: React Native doesn't support CSS gradients in backgroundColor.
  // We'll emulate with layered views:
  bannerTopRow: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37, 200, 130, 0.14)', borderColor: 'rgba(37,200,130,0.35)', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999
  },
  statusDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#39e69a' },
  statusText: { color: '#caffdf', fontSize: 12, fontWeight: '700' },
  hostBubble: {
    width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  hostText: { color: '#fff', fontWeight: '700' },

  bannerBottomRow: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 60 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2, marginBottom: 6 },
  metaLine: { color: '#c9d7ff', fontSize: 12.5, marginTop: 2 },

  cardBody: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(11,16,28,0.75)' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, backgroundColor: GLASS, borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: { color: '#e8f2ff', fontSize: 12, fontWeight: '700' },
  badgeInfo: { backgroundColor: 'rgba(75, 189, 255, 0.12)', borderColor: 'rgba(75,189,255,0.3)' },
  badgeSoft: { backgroundColor: 'rgba(255, 220, 120, 0.12)', borderColor: 'rgba(255,220,120,0.35)' },
  badgeNew: { backgroundColor: 'rgba(84, 230, 160, 0.12)', borderColor: 'rgba(84,230,160,0.35)' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8
  },
  btnPrimary: {
    backgroundColor: '#6ae0ff',
    shadowColor: '#6ae0ff', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 4
  },
  btnPrimaryText: { color: '#0b1020', fontWeight: '800', letterSpacing: 0.3 },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.05)' },
  btnGhostText: { color: '#cfe0ff', fontWeight: '800', letterSpacing: 0.3 },

  footer: { textAlign: 'center', color: '#91a6d8', fontSize: 12.5, marginTop: 26, opacity: 0.9 },
});
