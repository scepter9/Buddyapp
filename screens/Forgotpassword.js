import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://172.20.10.4:3000/forgot-password', { email });

      if (res.data.success) {
        Alert.alert('Success', 'A reset code has been sent to your email.');

        navigation.navigate('ResetPass', {
          userId: res.data.userId,
          email: email,
        });
      } else {
        Alert.alert('Error', res.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Server Error', 'Could not send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center',
  },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
});

export default ForgotPassword;
