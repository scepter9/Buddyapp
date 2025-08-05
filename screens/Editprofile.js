import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; // For modern icons
import BottomNavigator from './BottomNavigator';
function EditProfile({ route, navigation }) {
  const { userId, currentProfile } = route?.params || {};
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      Alert.alert('Error', 'User ID is missing.');
      navigation.goBack();
    }
    if (currentProfile) {
      setBio(currentProfile.bio || '');
      setName(currentProfile.name || '');
    }
  }, [userId, currentProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant media library permissions to select an image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (bio.trim() === '' && name.trim() === '' && !image) {
      Alert.alert('No Changes', 'You haven’t made any changes.');
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (name.trim()) formData.append('name', name.trim());
    if (bio.trim()) formData.append('about', bio.trim());

    if (image) {
      const uriParts = image.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = `profile_${userId}_${Date.now()}.${fileType}`;

      formData.append('image', {
        uri: image.uri,
        name: fileName,
        type: `image/${fileType}`,
      });
    }

    try {
      const response = await fetch('http://172.20.10.4:3000/update-profile', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert('Success', result.message || 'Profile updated!');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>

      <Text style={styles.header}>Edit Profile</Text> */}

      <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.avatar} />
        ) : currentProfile?.image ? (
          <Image source={{ uri: `http://172.20.10.4:3000/uploads/${currentProfile.image}` }} style={styles.avatar} />
        ) : (
          <Ionicons name="camera" size={32} color="#aaa" />
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell us about yourself..."
        value={bio}
        onChangeText={setBio}
        multiline
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUpdate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Save Changes'}</Text>
      </TouchableOpacity>
      <BottomNavigator navigation={navigation} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 25,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default EditProfile;
