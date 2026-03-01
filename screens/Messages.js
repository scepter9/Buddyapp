import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import BottomNavigator from './BottomNavigator';
import { AuthorContext } from './AuthorContext';
import { io } from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = "http://192.168.0.136:3000";

const MessageScreen = ({ navigation }) => {
  const [visible, setVisible] = useState(false);
  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!myUserId) {
      setIsLoadingConversations(false);
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/conversations?userId=${myUserId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [myUserId]);

  const searchUsers = useCallback(async (query) => {
    if (!query) {
      setFriends([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/search?q=${query}`);
      if (!response.ok) throw new Error('Failed to search users');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search for users.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    searchUsers(text);
  };

  const startNewChat = (recipient) => {
    closeModal();
    navigation.navigate('MessageUser', {
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientImage: recipient.image ? `${API_BASE_URL}/uploads/${recipient.image}` : null,
    });
  };
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  useEffect(() => {
    if (!myUserId) return;
    const newSocket = io(API_BASE_URL, { query: { userId: myUserId } });

    const handleNewMessage = async (message) => {
      const otherPersonId = message.senderId === myUserId ? message.receiverId : message.senderId;

      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(conv => conv.other_user_id === otherPersonId);
        let updatedConversations;

        if (conversationIndex !== -1) {
          updatedConversations = [...prevConversations];
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            last_message_text: message.text || (message.imageUri ? 'Image' : ''),
            last_message_timestamp: message.timestamp,
            last_message_sender_id: message.senderId,
          };
        } else {
          const tempNewConversation = {
            other_user_id: otherPersonId,
            other_user_name: 'Loading...',
            other_user_image_uri: null,
            last_message_text: message.text || (message.imageUri ? 'Image' : ''),
            last_message_timestamp: message.timestamp,
            last_message_sender_id: message.senderId,
          };
          updatedConversations = [tempNewConversation, ...prevConversations];

          const fetchNewUserInfo = async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/users/${otherPersonId}`);
              const userInfo = await res.json();
              setConversations(currentConvs => currentConvs.map(conv => {
                if (conv.other_user_id === otherPersonId && conv.other_user_name === 'Loading...') {
                  return {
                    ...conv,
                    other_user_name: userInfo.name || 'New User',
                    other_user_image_uri: userInfo.image ? `${API_BASE_URL}/uploads/${userInfo.image}` : null,
                  };
                }
                return conv;
              }));
            } catch (err) {
              console.error('Failed to fetch user info:', err);
            }
          };
          fetchNewUserInfo();
        }

        updatedConversations.sort((a, b) => {
          const timeA = new Date(a.last_message_timestamp).getTime();
          const timeB = new Date(b.last_message_timestamp).getTime();
          return timeB - timeA;
        });

        return updatedConversations;
      });
    };
    newSocket.on('newMessage', handleNewMessage);
    return () => newSocket.disconnect();
  }, [myUserId]);

  const handleConversationPress = (conversation) => {
   
    const imageUrl = conversation.other_user_image_uri
    ? `${API_BASE_URL}/uploads/${conversation.other_user_image_uri}`
    : null;
    navigation.navigate('MessageUser', {
      recipientId: conversation.other_user_id,
      recipientName: conversation.other_user_name,
      recipientImage: imageUrl,
    });
  };

  const renderConversationItem = ({ item }) => {
    const isMyLastMessage = item.last_message_sender_id === myUserId;
    const isImageMessage = item.last_message_text === 'Image';
    const hasUnread = item.unread_count > 0;
  
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        <Image
          source={item.other_user_image_uri
            ? { uri: `${API_BASE_URL}/uploads/${item.other_user_image_uri}` }
            : require('../assets/image16.jpeg')}
          style={styles.conversationAvatar}
        />
        <View style={styles.conversationContent}>
          <Text style={[styles.conversationName, hasUnread && styles.unreadName]} numberOfLines={1}>{item.other_user_name}</Text>
          <Text style={[styles.lastMessageText, hasUnread && styles.unreadLastMessage]} numberOfLines={1}>
            <Text style={isMyLastMessage ? styles.myLastMessagePrefix : null}>
              {isMyLastMessage ? 'You: ' : ''}
            </Text>
            {isImageMessage ? (
              <Feather name="image" size={14} color="#888" style={{ marginRight: 5 }} />
            ) : null}
            {isImageMessage ? ' Photo' : item.last_message_text || 'No messages yet.'}
          </Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            {item.last_message_timestamp ? new Date(item.last_message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          {/* The new unread count badge */}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => startNewChat(item)}>
      <Image
  source={
    item.image
      ? { uri: `${API_BASE_URL}/uploads/${item.image}` }
      : require('../assets/image16.jpeg')
  }
  style={styles.friendImage}
/>

      <View style={styles.namevalue}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E3A8A', '#2B4DA0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.headerButton} onPress={openModal}>
            <Feather name="edit-3" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search conversations"
          placeholderTextColor="#E0E7FF"
        />
      </LinearGradient>

      <View style={styles.mainContent}>
        {isLoadingConversations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="message-square" size={50} color="#CBD5E1" />
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySubText}>Start a new chat to see it here!</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.other_user_id.toString()}
            contentContainerStyle={styles.conversationList}
          />
        )}
      </View>
      <BottomNavigator navigation={navigation} />

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Chat</Text>
              <View style={styles.spacer} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Search name or username"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />

            {isSearching ? (
              <ActivityIndicator size="large" color="#1E3A8A" />
            ) : friends.length > 0 ? (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ flexGrow: 1 }}
              />
            ) : (
              <Text style={styles.noResultsText}>
                {searchQuery ? 'No users found.' : 'Search for friends to start a new chat.'}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 25 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 50,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 16,
    color: '#fff',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  conversationList: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  conversationAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
  },
  conversationContent: {
    flex: 1,
  },
  conversationName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  lastMessageText: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  myLastMessagePrefix: {
    fontWeight: 'bold',
    color: '#495057',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF5C5C',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  input: {
    backgroundColor: '#F1F3F6',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15, // Added spacing here
  },
  namevalue: {
    flexDirection: 'column',
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#222',
  },
  email: {
    fontSize: 14,
    color: '#777',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#495057',
    marginTop: 15,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 16,
    color: '#868e96',
    marginTop: 5,
    textAlign: 'center',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  // Add these styles to your StyleSheet.create({}) object

unreadName: {
  fontWeight: 'bold', // Bolder font for unread conversations
},
unreadLastMessage: {
  fontWeight: 'bold',
  color: '#333', // Darker color to signify new message
},
timestampContainer: {
  alignItems: 'flex-end',
},
unreadBadge: {
  backgroundColor: '#E74C3C', // A bold color like red
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 5,
  marginTop: 5,
},
unreadBadgeText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
},
});

export default MessageScreen;