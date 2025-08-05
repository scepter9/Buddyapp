import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // npm install @react-native-async-storage/async-storage

export default function Register({ navigation }) {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!/^[a-zA-Z ]{3,}$/.test(fullname))
      newErrors.fullname = 'Full name must be at least 3 letters.';

    if (!/^[a-zA-Z0-9_.-]{3,}$/.test(username))
      newErrors.username = 'Username must be at least 3 characters and can contain letters, numbers, _, -, or .';

    if (!/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(email))
      newErrors.email = 'Invalid email address.';

    if (!/^\d{11}$/.test(phone))
      newErrors.phone = 'Phone must be exactly 11 digits.';

    const score = passwordStrength(password);
    if (score < 4) newErrors.password = 'Password is weak.';

    if (password !== confirm)
      newErrors.confirm = 'Passwords do not match.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 12) score += 4;
    else if (pwd.length >= 8) score += 2;
    else score += 1;

    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*]/.test(pwd)) score += 1;

    if (!/(1234|abcd|qwerty)/.test(pwd)) score += 1;

    return score;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        const userData = {
          fullname,
          username,
          email,
          phone,
          password,
        };
  
        const response = await fetch('http://172.20.10.4:3000/Register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          Alert.alert('Success', result.message);
          navigation.navigate('Login');
        } else {
          Alert.alert('Error', result.error || 'Something went wrong');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to register user.');
      }
    }
  };
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Register</Text>

        <InputField label="Full Name" value={fullname} onChangeText={setFullname} error={errors.fullname} />
        <InputField label="Username" value={username} onChangeText={setUsername} error={errors.username} />
        <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} />
        <InputField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
        <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
        <InputField label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({ label, error, ...props }) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && { borderColor: 'red' }]}
        placeholder={`Enter ${label}`}
        placeholderTextColor="#888"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#222',
  },
  inputBox: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
