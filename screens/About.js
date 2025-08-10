import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import BottomNavigator from './BottomNavigator';

const API_BASE_URL = 'http://172.20.10.4:3000';

export default function About({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const heroOpacity = useRef(new Animated.Value(0)).current;

  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`${API_BASE_URL}/About`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread/count`, { // Assume you have a new endpoint for the unread count
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch unread notifications count. Response:', response.status, errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setNotificationCount(data.count); // Assuming the response is { count: 5 }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, []);

  // Use useFocusEffect to refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchNotificationCount();
      
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      return () => {
        // Optional cleanup when the screen loses focus
      };
    }, [fetchUserData, fetchNotificationCount])
  );

  useEffect(() => {
    let socket;
    if (user && user.id) {
      socket = io(API_BASE_URL, { withCredentials: true });

      socket.on('connect', () => {
        console.log('Connected to WebSocket server from About screen');
        socket.emit('registerUser', user.id);
      });

      socket.on('newNotification', (newNotif) => {
        console.log('New real-time notification received:', newNotif);
        // Increment the count without needing to re-fetch all notifications
        setNotificationCount(prevCount => prevCount + 1);
      });
      
      // Listen for a 'notificationRead' event from the server
      socket.on('notificationRead', () => {
          console.log('Server confirmed a notification was read.');
          setNotificationCount(prevCount => Math.max(0, prevCount - 1));
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server from About screen');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error from About screen:', err.message);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const Card = ({ item }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
      <Pressable
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Image source={item.image} style={styles.cardImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardSubtitle}>Tap to explore this tool</Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  if (isLoadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A5252" />
        <Text style={styles.loadingText}>Loading Homepage...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.headerContent, { backgroundColor: '#1A5252' }]}>
        <Text style={styles.headerTitle}>Buddy</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileImageContainer}>
          {user?.image ? (
            <Image
              source={{ uri: `${API_BASE_URL}/uploads/${user.image}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {
            navigation.navigate('NotificationsScreen');
          }}
        >
          <Feather name="bell" size={24} color='white' />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.heroSection, { opacity: heroOpacity }]}>
        <LinearGradient
          colors={['#e0f7fa', '#ffffff']}
          style={styles.heroBackground}
        >
          <Text style={[styles.welcomeTitle, styles.light.text]}>
            Welcome {user?.name || 'Buddy'}!
          </Text>
          <Text style={[styles.welcomeDesc, styles.light.text]}>
            AI tools at your service.
          </Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.cardContainer}>
        {[
          {
            image: Platform.OS === 'ios' ? require('../assets/image203.gif') : require('../assets/image1.jpeg'),
            label: 'Text Summary and Extraction',
          },
          {
            image: Platform.OS === 'ios' ? require('../assets/image206.gif') : require('../assets/image4.jpeg'),
            label: 'Quiz Generators',
          },
          {
            image: Platform.OS === 'ios' ? require('../assets/image207.gif') : require('../assets/image0.jpeg'),
            label: 'Smart Flashcards',
          },
          {
            image: Platform.OS === 'ios' ? require('../assets/image210.gif') : require('../assets/image2.jpeg'),
            label: 'Study Planner',
          },
          {
            image: Platform.OS === 'ios' ? require('../assets/image209.gif') : require('../assets/image92.jpeg'),
            label: 'Resource Library',
          },
        ].map((item, index) => (
          <Card item={item} key={index} />
        ))}
      </ScrollView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContent: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
  },
  profileImageContainer: {
    zIndex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    backgroundColor: '#ccc',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    zIndex: 0,
  },
  notificationButton: {
    zIndex: 1,
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginVertical: 15,
    alignItems: 'center',
  },
  heroBackground: {
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 80,
  },
  card: {
    width: 300,
    height: 220,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#000',
    position: 'relative',
  },
  cardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    borderRadius: 12,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#ddd',
  },
  light: {
    background: { backgroundColor: '#fff' },
    text: { color: '#000' },
  },
  dark: {
    background: { backgroundColor: '#121212' },
    text: { color: '#f0f0f0' },
  },
});