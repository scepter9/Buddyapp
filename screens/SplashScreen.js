import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Image
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Buddy logo as inline SVG — no image file needed


export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    const checkSession = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const stored = await AsyncStorage.getItem('userSession');
        if (!stored) return navigation.replace('Login');

        const session = JSON.parse(stored);
        const timestamp = new Date(session.timestamp);
        const now = new Date();
        const daysPassed = (now - timestamp) / (1000 * 60 * 60 * 24);
        if (daysPassed > 7) return navigation.replace('Login');

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return navigation.replace('Login');

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Login with biometrics',
        });

        if (result.success) {
          navigation.replace('Home');
        } else { 
          navigation.replace('Login');
        }
      } catch (err) {
        console.log(err);
        navigation.replace('Login');
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* Background glow blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Center content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo mark */}
        <View style={styles.logoWrap}>
        <Image style={styles.image} source={require('../assets/buddy.png')}/>
        </View>

        {/* Wordmark */}
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkBud}>bud</Text>
          <Text style={styles.wordmarkDy}>dy</Text>
        </View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleFade }]}>
          Your campus, your people.
        </Animated.Text>
      </Animated.View>

      {/* Bottom tag */}
      <Animated.Text style={[styles.bottomTag, { opacity: subtitleFade }]}>
        Nigerian Universities Network
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow blobs — position absolute, blurred via opacity layering
  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#7C3AED',
    opacity: 0.12,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EC4899',
    opacity: 0.1,
  },

  content: {
    alignItems: 'center',
    gap: 8,
  },

  logoWrap: {
    marginBottom: 8,
  },

  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkBud: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1.5,
    fontFamily: 'System', // swap for Syne if loaded
  },
  wordmarkDy: {
    fontSize: 42,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: -1.5,
    fontFamily: 'System',
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  bottomTag: {
    position: 'absolute',
    bottom: 48,
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  image:{
    width: 120,
    height: 120,
    borderRadius: 20,
    resizeMode: 'contain'
  }
});
