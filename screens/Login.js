import React, { useState, useRef, useEffect , useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AuthorContext } from './AuthorContext';


export default function Login({ navigation }) {
  const { setUser } = useContext(AuthorContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

    try {
      const response = await fetch('http://172.20.10.4:3000/Login', {
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
      console.error(err);
      Alert.alert('Error', 'Could not connect to server');
      triggerShake();
    }
  };

  useEffect(() => {
    fetch('http://172.20.10.4:3000/check-session', {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser(data.user);
          navigation.replace('About');
        }
      })
      .catch(err => {
        console.log('Session check failed:', err);
      });
  }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <BlurView intensity={60} tint="light" style={styles.glassCard}>
            <Text style={styles.heading}>Sign In</Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <TextInput
                style={[styles.input, usernameError && styles.inputError]}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

              <TextInput
                style={[styles.input, passwordError && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </Animated.View>

            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkText}>Create an Account</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPass')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: '90%',
    padding: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  heading: {
    fontSize: 30,
    fontWeight: '600',
    marginBottom: 25,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    backgroundColor: 'black',
    height: 50,
    width: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007acc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLinks: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#222',
  },
  linkText: {
    color: '#007acc',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotText: {
    color: '#007acc',
    fontWeight: '500',
    textDecorationLine: 'underline',
    fontSize: 14,
    marginTop: 8,
  },
});
