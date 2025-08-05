import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import io from 'socket.io-client';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

import BottomNavigator from './BottomNavigator'; 


const API_BASE_URL = 'http://172.20.10.4:3000'; 

const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MESSAGE: 'message',
};

const NotificationItem = React.memo(({ notification, onFollowPress, navigation }) => {
  const { sender_name, sender_image, message, created_at, type, sender_id } = notification;

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const handleProfileView = () => {
    navigation.navigate('Profile', { userId: sender_id });
  };

  const renderContent = () => {
    switch (type) {
      case NOTIFICATION_TYPES.FOLLOW:
        return (
          <View style={notificationItemStyles.followContent}>
            <Text style={notificationItemStyles.messageText}>
              <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> followed you.
            </Text>
            <TouchableOpacity
              style={notificationItemStyles.followButton}
              onPress={() => onFollowPress(sender_id)}
            >
              <Text style={notificationItemStyles.followButtonText}>Follow </Text>
            </TouchableOpacity>
          </View>
        );
      case NOTIFICATION_TYPES.LIKE:
        return (
          <Text style={notificationItemStyles.messageText}>
            <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> liked your post.
          </Text>
        );
      case NOTIFICATION_TYPES.COMMENT:
        return (
          <Text style={notificationItemStyles.messageText}>
            <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> commented on your post: "{message}"
          </Text>
        );
      case NOTIFICATION_TYPES.MESSAGE:
        return (
          <Text style={notificationItemStyles.messageText}>
            <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> sent you a message.
          </Text>
        );
      default:
        return (
          <Text style={notificationItemStyles.messageText}>
            <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> {message}
          </Text>
        );
    }
  };

  const imageSource = sender_image
    ? { uri: `${API_BASE_URL}/uploads/${sender_image}` }
    : null;

  return (
    <TouchableOpacity onPress={handleProfileView} style={notificationItemStyles.notificationCard} activeOpacity={0.8}>
      <View style={notificationItemStyles.profileSection}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={notificationItemStyles.profileImage}
          />
        ) : (
          <View style={notificationItemStyles.profileImagePlaceholder} />
        )}
      </View>
      <View style={notificationItemStyles.contentSection}>
        {renderContent()}
        <Text style={notificationItemStyles.timestamp}>{formatTimeAgo(created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const fetchLoggedInUserId = useCallback(async () => {
    try {
      const authRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        credentials: 'include',
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        setLoggedInUserId(authData.id);
      } else {
        console.warn('Failed to get logged-in user ID for WebSocket registration.');
      }
    } catch (err) {
      console.error('Error fetching logged-in user ID:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        credentials: 'include', // Correct for sending cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data); // Assumes backend directly provides 'type'
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // New function to mark notifications as read
  const markNotificationsAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-as-read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        console.log('Notifications marked as read in backend.');
        // If your badge is handled by a global state, update it here.
        // Otherwise, BottomNavigator will need to re-fetch its count.
      } else {
        const errorData = await response.json();
        console.error('Failed to mark notifications as read:', errorData.error);
      }
    } catch (err) {
      console.error('Network error marking notifications as read:', err);
    }
  }, []);

// Inside your NotificationsScreen component

useEffect(() => {
  // This function should be called when the NotificationsScreen loads
  const markNotificationsAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-as-read`, {
        method: 'POST', // Or PATCH, depending on your API design
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      console.log('Notifications marked as read on the server.');
      
      // OPTIONAL: If you have a way to update the state of the other screen, do it here.
      // For instance, if you're using a global state manager like Redux or Zustand, you'd dispatch an action here.
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  markNotificationsAsRead();
}, []);

  useEffect(() => {
    fetchLoggedInUserId(); // Fetch logged-in user ID initially

    const socket = io(API_BASE_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (loggedInUserId) {
        socket.emit('registerUser', loggedInUserId);
        console.log(`Emitting registerUser for ${loggedInUserId}`);
      } else {
        console.warn('loggedInUserId not available for WebSocket registration yet.');
      }
    });

    socket.on('newNotification', (newNotif) => {
      console.log('Received new real-time notification:', newNotif);
      setNotifications(prevNotifications => [newNotif, ...prevNotifications]);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchNotifications, loggedInUserId, fetchLoggedInUserId]);

  // Use useFocusEffect to fetch data and mark notifications as read when screen is focused
  useFocusEffect(

    useCallback(() => {
      fetchNotifications(); // Re-fetch all notifications
      markNotificationsAsRead(); // Mark them as read in the backend
      // No cleanup needed for fetch, as it's a one-time call
    }, [fetchNotifications, markNotificationsAsRead])
  );

  const handleFollowBack = async (targetUserId) => {
    console.log(`Attempting to follow back user with ID: ${targetUserId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver_id: targetUserId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to follow back');
      }
      Alert.alert('Success', 'Followed back successfully!');
      fetchNotifications(); // Re-fetch to update the notification list
    } catch (err) {
      console.error('Error following back:', err);
      Alert.alert('Error', `Error following back: ${err.message}`);
    }
  };

  const renderNotification = ({ item }) => (
    <NotificationItem notification={item} onFollowPress={handleFollowBack} navigation={navigation} />
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1A5252" />
        <Text style={styles.loadingText}>Loading Notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f7fa', '#ffffff']} // Light blue to white gradient
      style={styles.container}
    >
      <Text style={styles.header}>Notifications</Text>

      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>No notifications yet.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <BottomNavigator navigation={navigation} />
    </LinearGradient>
  );
};

const notificationItemStyles = StyleSheet.create({
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12, // Slightly more rounded
    marginBottom: 10,
    // Stronger shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Increased offset
    shadowOpacity: 0.15, // Increased opacity
    shadowRadius: 6, // Increased radius
    elevation: 6, // Increased elevation for Android
    borderColor: '#eee',
    borderWidth: 1,
  },
  profileSection: {
    marginRight: 15,
  },
  profileImage: {
    width: 40, // Slightly larger image
    height: 40,
    borderRadius: 20, // Half of width/height for perfect circle
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#1A5252', // Border matching theme
  },
  profileImagePlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aaa',
  },
  contentSection: {
    flex: 1,
  },
  messageText: {
    fontSize: 15, // Slightly smaller
    color: '#333',
    marginBottom: 4, // Reduced margin
    lineHeight: 22, // Improved readability
  },
  senderName: {
    fontWeight: 'bold',
    color: '#1A5252', // Theme color for sender name
  },
  timestamp: {
    fontSize: 11, // Slightly smaller
    color: '#777',
  },
  followContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  followButton: {
    backgroundColor: '#1A5252',
    paddingVertical: 7, // Slightly more padding
    paddingHorizontal: 14,
    borderRadius: 25, // More rounded button
    marginLeft: 10,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14, // Slightly larger font
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // LinearGradient replaces backgroundColor here
    paddingHorizontal: 20, // Horizontal padding moved here
    paddingTop: 50, // Adjust for status bar/header
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8', // Keep fallback background
  },
  header: {
    alignSelf: 'center',
    fontSize: 30, // Larger header
    fontWeight: '800', // Bolder header
    color: '#2c3e50', // Darker, more prominent color
    marginBottom: 30, // More space below header
  },
  flatListContent: {
    paddingBottom: 20,
  },
  noNotificationsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#1A5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationScreen;