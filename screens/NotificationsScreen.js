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
  Modal,
  SafeAreaView
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the clear button
import { io } from 'socket.io-client';
import BottomNavigator from './BottomNavigator';


const API_BASE_URL = "http://192.168.0.136:3000";

const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MESSAGE: 'message',
  JOINMEET: 'JoinRoom',
  SHOULDACCEPT:'sentbuddy'
};

const NotificationItem = React.memo(({ notification, onFollowPress, onAcceptJoinPress, navigation, disvalue ,socket,user}) => {
  const {id, sender_name, sender_image, message, created_at, type, sender_id } = notification;
  const [openmodal,setopenmodal]=useState(false)

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `Just now`;
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
const openconnect=()=>{
  setopenmodal(true)
}
  const handleProfileView = () => {
    navigation.navigate('Profile', { userId: sender_id });
  };
  const onahandlekipjoin=()=>{
if(!socket || !user) return;
const sendingvalues={
  yourid:user,
  notid:id
}
socket.emit('Removethisnotification',sendingvalues)
  }
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
              <Text style={notificationItemStyles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        );
      case NOTIFICATION_TYPES.LIKE:
        return (
          <Text style={notificationItemStyles.messageText}>
            <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> liked your post.
          </Text>
        );
        case NOTIFICATION_TYPES.SHOULDACCEPT:
          return (
            <View style={notificationItemStyles.followContent}>
            <Text style={notificationItemStyles.messageText}>
              <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>{sender_name}</Text> Sent you a buddy request based on your shared interest✨.
            </Text>
             <TouchableOpacity
             style={notificationItemStyles.followButton}
             onPress={openconnect}
             disabled={disvalue}
           >
             <Text style={notificationItemStyles.followButtonText}>Connect🤝</Text>
           </TouchableOpacity>
           <TouchableOpacity
             style={notificationItemStyles.followButtone}
             onPress={onahandlekipjoin}
             disabled={disvalue}
           >
             <Text style={notificationItemStyles.followButtonText}>Skip</Text>
           </TouchableOpacity>
           </View>
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
      case NOTIFICATION_TYPES.JOINMEET:
        return (
          <View style={notificationItemStyles.followContent}>
            <Text style={notificationItemStyles.messageText}>
              <Text style={notificationItemStyles.senderName} onPress={handleProfileView}>
                {sender_name}
              </Text> wants to join your meetup.
            </Text>
            <TouchableOpacity
              style={notificationItemStyles.followButton}
              onPress={() => onAcceptJoinPress(sender_id)}
              disabled={disvalue}
            >
              <Text style={notificationItemStyles.followButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
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
    <View style={{flex:1,backgroundColor: 'rgba(255,255,255,0.7)'}}>
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
    <Modal
  visible={openmodal}
  animationType="fade"
  onRequestClose={() => setopenmodal(false)}
  transparent
>
  <View style={styles.modalOverlay}>

    <LinearGradient
      colors={["#0F1023", "#1B1336", "#2B0F3F"]}
      style={styles.modalBackground}
    >

      <View style={styles.modalCard}>

        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.matchBadge}
        >
          <Text style={styles.badgeText}>⚡ NEW MATCH</Text>
        </LinearGradient>

        <Text style={styles.titleText}>Epic Match</Text>
        <Text style={styles.titleAccent}>Unlocked 🔥</Text>

        <Text style={styles.subtitleText}>
          You just matched with a buddy 🤝, same weird energy, similar interests,
          zero chills. Ready to see what chaos unfolds?
        </Text>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarInner}>
            <Image source={imageSource} style={styles.avatarImage} />
          </View>
          <Text style={styles.handshakeEmoji}>🤝</Text>
        </View>

        <Text style={styles.usernameText}>{sender_name}</Text>

        <View style={styles.actionsRow}>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("MessageUser", {
                recipientId: id,
                recipientName: sender_name,
                recipientImage: imageSource,
              })
            }
          >
            <LinearGradient
              colors={["#FF4FA3", "#D946EF", "#8B5CF6"]}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                Dive in already! 🚀
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setopenmodal(false)}
          >
            <Text style={styles.secondaryButtonText}>Nah, Later</Text>
          </TouchableOpacity>

        </View>

      </View>

    </LinearGradient>

  </View>
</Modal>
    </View>
  );
});

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [disabledRequests, setDisabledRequests] = useState({});
  const [socket,Setsocket]=useState(null)
  

useEffect(()=>{
  if(!loggedInUserId) return;
  const notifisocket=io(API_BASE_URL,{
    query:{userId:loggedInUserId},
    transports:['websocket']
  })
  Setsocket(notifisocket)
  return()=>notifisocket.disconnect()
},[loggedInUserId])
useEffect(() => {
  if (!socket) return;

  const fetchafterremove = (data) => {
    setNotifications(data);
  };

  socket.on('UpdateAfterdeletenotication', fetchafterremove);

  return () => {
    socket.off('UpdateAfterdeletenotication', fetchafterremove);
  };
}, [socket]);


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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAllNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE', // DELETE is a good verb for clearing a resource
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications on the server.');
      }

      setNotifications([]); // Clear local state
      Alert.alert('Success', 'All notifications have been cleared.');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      Alert.alert('Error', `Failed to clear notifications: ${err.message}`);
    }
  };

  const markNotificationsAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-as-read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        console.log('Notifications marked as read in backend.');
      } else {
        const errorData = await response.json();
        console.error('Failed to mark notifications as read:', errorData.error);
      }
    } catch (err) {
      console.error('Network error marking notifications as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchLoggedInUserId();

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

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      markNotificationsAsRead();
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
      fetchNotifications();
    } catch (err) {
      console.error('Error following back:', err);
      Alert.alert('Error', `Error following back: ${err.message}`);
    }
  };

  // Change this function
  const handleAcceptJoinRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/acceptJoinRequest`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to accept join request');
  
      Alert.alert('Success', 'You accepted the join request!');
  
      // Mark only this request as disabled
      setDisabledRequests(prev => ({ ...prev, [requestId]: true }));
  
      fetchNotifications();
    } catch (err) {
      console.error('Error accepting join request:', err);
      Alert.alert('Error', err.message);
    }
  };
  


  const renderNotification = ({ item }) => (
    <NotificationItem
  notification={item}
  onFollowPress={handleFollowBack}
  onAcceptJoinPress={handleAcceptJoinRequest}
  navigation={navigation}
  disvalue={!!disabledRequests[item.id]} // only disable that one
  socket={socket}
  user={loggedInUserId}
/>

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
      colors={['#f0f9ff', '#e0f7fa']}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="#1A5252" />
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>No notifications yet. You're all caught up! 🎉</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) =>  item.id.toString() }
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  profileSection: {
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#1A5252',
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  senderName: {
    fontWeight: '700',
    color: '#1A5252',
  },
  timestamp: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  followContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  followButton: {
    backgroundColor: '#1A5252',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginLeft: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  followButtone: {
    backgroundColor: '#FF5252',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginLeft: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A5252',
  },
  clearButton: {
    padding: 8,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  flatListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noNotificationsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
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
 
 

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  
    modalBackground: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
  
    modalCard: {
      width: "82%",
      paddingTop: 35,
      paddingBottom: 30,
      borderRadius: 28,
      alignItems: "center",
      backgroundColor: "rgba(58,42,90,0.85)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
  
    matchBadge: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 15,
    },
  
    badgeText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 12,
    },
  
    titleText: {
      fontSize: 26,
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
    },
  
    titleAccent: {
      fontSize: 26,
      fontWeight: "700",
      color: "#C084FC",
      textAlign: "center",
      marginBottom: 10,
    },
  
    subtitleText: {
      color: "#B4B0D0",
      fontSize: 13,
      textAlign: "center",
      paddingHorizontal: 30,
      marginBottom: 25,
    },
  
    avatarWrapper: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#34D399",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
  
    avatarInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: "hidden",
    },
  
    avatarImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
  
    handshakeEmoji: {
      position: "absolute",
      right: -10,
      top: 5,
      fontSize: 18,
    },
  
    usernameText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      marginTop: 8,
    },
  
    actionsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
  
    primaryButton: {
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 18,
    },
  
    primaryButtonText: {
      color: "#fff",
      fontWeight: "700",
    },
  
    secondaryButton: {
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.08)",
    },
  
    secondaryButtonText: {
      color: "#D1D5DB",
      fontWeight: "600",
    },
  
  });




export default NotificationScreen;