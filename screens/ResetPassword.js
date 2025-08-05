import React, { useState, useRef } from 'react';
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

export default function ResetPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleReset = async () => {
    setError('');

    if (!email || !code || !password) {
      setError('All fields are required');
      triggerShake();
      return;
    }

    try {
      const res = await fetch('http://172.20.10.4:3000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', 'Password has been reset.');
        navigation.navigate('Login');
      } else {
        setError(data.error || 'Something went wrong');
        triggerShake();
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not connect to server');
      triggerShake();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <BlurView intensity={60} tint="light" style={styles.glassCard}>
            <Text style={styles.heading}>Reset Password</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Reset Code"
                placeholderTextColor="#999"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="New Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </Animated.View>

            <TouchableOpacity onPress={handleReset} style={styles.button}>
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
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
});
