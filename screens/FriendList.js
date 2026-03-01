import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
const API_BASE_URL = "http://192.168.0.136:3000";

// Add `route` to the component props to access navigation parameters
const FriendList = ({ navigation, route }) => { 
  const [activeTab, setActiveTab] = useState('following');
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get the userId from the navigation parameters
  const { userId } = route.params || {};

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === 'following'
          ? `${API_BASE_URL}/users/${userId}/following`
          : `${API_BASE_URL}/users/${userId}/followers`;

      const res = await fetch(endpoint, {
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        if (activeTab === 'following') {
          setFollowing(data);
        } else {
          setFollowers(data);
        }
      } else {
        console.error(data.error || 'Failed to load');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId]); // Add userId and activeTab to the dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Rest of your component code remains the same...
  const renderFriendList = (data) =>
    data.map((friend, index) => (
      <TouchableOpacity key={index} style={styles.mainbodylist} onPress={() => {
        navigation.navigate('Profile', { userId: friend.id });
      }}>
        <Image
          source={friend.image ? { uri: `${API_BASE_URL}/uploads/${friend.image}` } : require('../assets/image16.jpeg')}
          style={styles.image}
        />
        <View style={styles.namevalue}>
          <Text style={styles.name}>{friend.FULLNAME || friend.name}</Text>
          <Text style={styles.email}>{friend.username || friend.email}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => {
          navigation.navigate('Profile', { userId: friend.id });
        }}>
          <Text style={styles.buttonText}>
            {friend.isFollowing ? 'Following' : activeTab === 'followers' ? 'Follow back' : 'Following'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>
            <Feather name="arrow-left" size={25} color="black" />
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Main Body */}
      <View style={styles.mainbody}>
        {/* Tabs */}
        <View style={styles.mainbodyheader}>
          <TouchableOpacity
            onPress={() => setActiveTab('following')}
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}
            >
              Following
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('followers')}
            style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}
            >
              Followers
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
          ) : activeTab === 'following'
            ? renderFriendList(following)
            : renderFriendList(followers)}
        </ScrollView>
      </View>
    </View>
  );
};

export default FriendList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 90,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  back: {
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -40 }],
  },
  mainbody: {
    marginHorizontal: '5%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    flex: 1,
    elevation: 3,
  },
  mainbodyheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    height: 60,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontWeight: '500',
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: '600',
  },
  mainbodylist: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 15,
  },
  image: {
    backgroundColor: 'gainsboro',
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  namevalue: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
  button: {
    backgroundColor: 'black',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
});