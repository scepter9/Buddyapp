import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Platform, TextInput, KeyboardAvoidingView,
  Animated, Easing, TouchableWithoutFeedback, Keyboard, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthorContext } from "./AuthorContext";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

export default function Login({ navigation }) {
  const { setUser } = useContext(AuthorContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setUsernameError('');
    setPasswordError('');
    if (!username || !password) {
      if (!username) setUsernameError('Username is required');
      if (!password) setPasswordError('Password is required');
      triggerShake();
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        navigation.replace('About');
      } else {
        if (data.error === 'Invalid username') setUsernameError('Invalid username');
        else if (data.error === 'Invalid password') setPasswordError('Invalid password');
        else Alert.alert('Login Failed', data.error || 'Unknown error');
        triggerShake();
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchsession = async () => {
      if (isLoading) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/check-session`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
          navigation.replace('About');
        }
      } catch (err) {
        console.log('Session check failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchsession();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>

          {/* Background orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* ── Logo section ── */}
          <View style={styles.logoSection}>
            <Image source={require('../assets/buddy.png')} style={styles.logoImage} />
            <View style={styles.brandRow}>
              <Text style={styles.brandA}>bud</Text>
              <Text style={styles.brandB}>dy</Text>
            </View>
            <Text style={styles.tagline}>Your campus, your people.</Text>
          </View>

          {/* ── Form section ── */}
          <Animated.View style={[styles.formSection, { transform: [{ translateX: shakeAnim }] }]}>

            <View style={styles.welcomePill}>
              <Ionicons name="sparkles" size={12} color="#A78BFA" />
              <Text style={styles.welcomePillText}>Welcome back</Text>
            </View>

            <Text style={styles.formTitle}>Sign in to{'\n'}your campus</Text>
            <Text style={styles.formSub}>Connect with people who matter</Text>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <Ionicons name="at" size={18} color={username ? '#A78BFA' : 'rgba(255,255,255,0.25)'} />
              <TextInput
                style={styles.fieldInput}
                value={username}
                onChangeText={t => { setUsername(t); setUsernameError(''); }}
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.2)"
                autoCapitalize="none"
              />
            </View>
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

            {/* Password */}
            <View style={[styles.fieldWrap, { marginTop: 12 }]}>
              <Ionicons name="lock-closed" size={18} color={password ? '#A78BFA' : 'rgba(255,255,255,0.25)'} />
              <TextInput
                style={styles.fieldInput}
                value={password}
                onChangeText={t => { setPassword(t); setPasswordError(''); }}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.2)"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="rgba(255,255,255,0.25)"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity
              onPress={() => navigation.navigate('Forgotpassword')}
              style={styles.forgotRow}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.btnPrimary, isSubmitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Text>
              {!isSubmitting && (
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
              )}
            </TouchableOpacity>

          </Animated.View>

          {/* ── Bottom ── */}
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>New here? <Text style={styles.registerLink}>Join free →</Text></Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07070d',
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // orbs
  orb1: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124,58,237,0.13)',
    top: -80, left: -80,
  },
  orb2: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,210,255,0.07)',
    bottom: 100, right: -60,
  },

  // logo
  logoSection: {
    alignItems: 'center',
    gap: 6,
  },
  logoImage: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandA: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1.5,
  },
  brandB: {
    fontSize: 32,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },

  // form
  formSection: {
    width: '100%',
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  welcomePillText: {
    fontSize: 11,
    color: '#A78BFA',
    letterSpacing: 0.3,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 28,
  },

  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 12,
    color: 'rgba(167,139,250,0.6)',
  },
  btnPrimary: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },

  
  bottomRow: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
  },
  registerLink: {
    color: '#A78BFA',
    fontWeight: '700',
  },
});