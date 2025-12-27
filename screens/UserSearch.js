import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useNavigation } from '@react-navigation/native';
import BottomNavigator from './BottomNavigator';
const API_BASE_URL = "http://192.168.0.136:3000";
const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();

  // Debounced API search
  const searchUsers = debounce(async (term) => {
    if (term.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/checkuser`, {
        SearchValue: term,
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
    }
  }, 300);

  useEffect(() => {
    searchUsers(searchTerm);
    return () => searchUsers.cancel();
  }, [searchTerm]);

  return (
    
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}> ←</Text>
      </TouchableOpacity> */}

      <View style={styles.searchBoxContainer}>
        <TextInput
          placeholder="🔍 Search by name or username"
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
      </View>

      {users.length > 0 && (
        <ScrollView style={styles.dropdown}>
          {users.map((user) => (
            <TouchableOpacity
              key={`user-${user.id}`}
              style={styles.userCard}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate('Profile', { userId: user.id }); 
              }}
            >
              <Image
                source={{
                  uri: `${API_BASE_URL}/uploads/${user.image}`,
                }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>
                  {user.FULLNAME || user.username}
                </Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
           {/* <BottomNavigator navigation={navigation} /> */}
        </ScrollView>
      )}
       <BottomNavigator navigation={navigation} />
    </KeyboardAvoidingView>
    
  );
};

export default UserSearch;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f1f3f5',
      paddingHorizontal: 16,
      paddingTop: 50,
    },
    searchBoxContainer: {
      backgroundColor: '#ffffffdd',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 12,
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginTop: 15,
        marginLeft: 10,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#e6e6e6',
      },
      backText: {
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
      },
    searchInput: {
      fontSize: 16,
      color: '#333',
    },
    dropdown: {
      backgroundColor: '#fff',
      borderRadius: 16,
      maxHeight: 350,
      paddingVertical: 6,
      marginTop: 6,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 3,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomColor: '#f1f1f1',
      borderBottomWidth: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 14,
      backgroundColor: '#ccc',
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 17,
      fontWeight: '600',
      color: '#222',
    },
    email: {
      fontSize: 14,
      color: '#666',
      marginTop: 2,
    },
  });
  