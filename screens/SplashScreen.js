import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Run animations in parallel
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

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
    <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('../assets/image201.jpeg')} // Replace with a clean modern logo
          style={styles.logo}
        />
        <Text style={styles.title}>Buddy</Text>
        <Text style={styles.subtitle}>Connecting Students Seamlessly</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'Poppins', // Load a custom font if needed
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    marginTop: 10,
    textAlign: 'center',
  },
});
