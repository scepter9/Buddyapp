import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
   Clipboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { AuthorContext } from './AuthorContext';
import { UnreadMessagesContext } from './UnreadMessagesContext' // Import the context

const API_BASE_URL = 'http://172.20.10.4:3000';

function MessageUser({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

const fadeAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef();

  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const { recipientId, recipientName, recipientImage } = route.params;

  // Use the unread messages context
  const { resetUnreadCountForConversation } = useContext(UnreadMessagesContext);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) throw new Error();
  
      // Remove locally
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {
      Alert.alert('Error', 'Could not delete the message.');
    } finally {
      setSelectedMessageId(null);
    }
  };
  
  
  const handleCopy = (text) => {
    Clipboard.setString(text);
    closeDropdown();
  };
  
  const openDropdown = (id) => {
    setActiveMessageId(id);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setActiveMessageId(null));
  };


  const handleReply = (msg) => {
    setReplyingTo(msg);
    closeDropdown();
  };
  
  const handleBlockUser = () => {
    if (socket) {
      socket.emit('blockUser', { blockedId: recipientId });
      setIsBlocked(true); // update UI immediately
    }
  };
   
  const handleUnblockUser = () => {
    if (socket) {
      socket.emit('unblockUser', { blockedId: recipientId });
      setIsBlocked(false); // update UI immediately
    }
  };

  
  const fetchBlockStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/isBlocked/${recipientId}`);
      if (!res.ok) throw new Error('Failed to fetch block status');
      const data = await res.json();
      setIsBlocked(data.blocked);
    } catch (err) {
      console.error('Block status check failed', err);
    }
  };


  const fetchHistoricalMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages?senderId=${myUserId}&receiverId=${recipientId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        type: msg.type,
        text: msg.text,
        imageUri: msg.image_uri,
        timestamp: msg.timestamp,
        isMine: msg.sender_id === myUserId,
      }));

      setMessages(formattedMessages);
      // After fetching historical messages, mark them as read
      // Only mark as read if there are messages and the current user is the receiver
      if (formattedMessages.length > 0) {
        resetUnreadCountForConversation(recipientId, myUserId); // Pass senderId as recipientId and receiverId as myUserId
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to load messages.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [myUserId, recipientId, resetUnreadCountForConversation]);
 

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      query: { userId: myUserId },
      transports: ['websocket'],
    });
    setSocket(newSocket);
  
    newSocket.on('user_online', (onlineUserId) => {
      if (onlineUserId === recipientId) setIsRecipientOnline(true);
    });
  
    newSocket.on('user_offline', (offlineUserId) => {
      if (offlineUserId === recipientId) setIsRecipientOnline(false);
    });
  
    newSocket.on('message_deleted', (deletedId) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId));
    });
  
    newSocket.on('user_blocked', (blockedId) => {
      if (blockedId === recipientId) setIsBlocked(true);
    });
  
    newSocket.on('blocked_by_user', (blockerId) => {
      if (blockerId === recipientId) setIsBlocked(true);
    });
  
    newSocket.on('user_unblocked', (unblockedId) => {
      if (unblockedId === recipientId) setIsBlocked(false);
    });
  
    newSocket.on('unblocked_by_user', (unblockerId) => {
      if (unblockerId === recipientId) setIsBlocked(false);
    });
  
    newSocket.on('newMessage', (message) => {
      const isForThisConversation =
        (message.senderId === myUserId && message.receiverId === recipientId) ||
        (message.senderId === recipientId && message.receiverId === myUserId);
  
      if (isForThisConversation) {
        const isMine = message.senderId === myUserId;
        setMessages(prev => [...prev, { ...message, isMine }]);
        if (!isMine) resetUnreadCountForConversation(recipientId, myUserId);
      }
    });
  
    // ✅ Cleanup function
    return () => {
      newSocket.disconnect();
      newSocket.off('user_blocked');
      newSocket.off('blocked_by_user');
      newSocket.off('user_unblocked');
      newSocket.off('unblocked_by_user');
      newSocket.off('newMessage');
      newSocket.off('user_online');
      newSocket.off('user_offline');
      newSocket.off('message_deleted');
    };
  }, [myUserId, recipientId, resetUnreadCountForConversation]);
  

  useEffect(() => {
    if (myUserId) {
      fetchHistoricalMessages();
      fetchBlockStatus();
    }
  }, [fetchHistoricalMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (currentMessage.trim() === '' || isSending) return;
    setIsSending(true);

    const messageData = {
      senderId: myUserId,
      receiverId: recipientId,
      text: currentMessage,
      type: 'text',
      imageUri: recipientImage, // Set to null if no image is being sent
    };

    if (socket) {
      socket.emit('sendMessage', messageData, (response) => {
        setIsSending(false);
        if (response?.error) {
          Alert.alert('Error', 'Message failed to send.');
        } else {
          setCurrentMessage('');
        }
      });
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      ...messageData,
      isMine: true,
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleImagePicker = () => {
    // This is a simplified image picker, in a real app you'd use a library
    const imageMessage = {
      senderId: myUserId,
      receiverId: recipientId,
      imageUri: `https://placehold.co/200x200?text=IMG`,
      type: 'image',
      text: null, // Set text to null for image messages
    };

    if (socket) {
      socket.emit('sendMessage', imageMessage);
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      ...imageMessage,
      isMine: true,
      timestamp: new Date().toISOString(),
    }]);
  };

  const renderMessage = (msg) => {
    const isMenuOpen = activeMessageId === msg.id;
  
    return (
      <View key={msg.id} style={{ position: 'relative' }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (isMenuOpen ? closeDropdown() : openDropdown(msg.id))}
        >
          <View
            style={[
              styles.messageContainer,
              msg.isMine ? styles.sent : styles.received,
            ]}
          >
            {msg.type === 'image' ? (
              <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />
            ) : (
              <Text style={styles.messageText}>{msg.text}</Text>
            )}
          </View>
        </TouchableOpacity>
  
        {isMenuOpen && (
  <TouchableWithoutFeedback onPress={closeDropdown}>
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.dropdownMenu,
          { opacity: fadeAnim },
          { alignSelf: msg.isMine ? 'flex-end' : 'flex-start', marginTop: 6 }
        ]}
      >
        {msg.text && (
          <TouchableOpacity
            style={[styles.dropdownItem, styles.dropdownItemBorder]}
            activeOpacity={0.6}
            onPress={() => {
              handleCopy(msg.text);
              closeDropdown();
            }}
          >
            <Feather name="copy" size={18} color="#333" style={styles.dropdownIcon} />
            <Text style={styles.dropdownText}>Copy</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.dropdownItem, styles.dropdownItemBorder]}
          activeOpacity={0.6}
          onPress={() => {
            handleReply(msg);
            closeDropdown();
          }}
        >
          <Feather name="corner-up-left" size={18} color="#333" style={styles.dropdownIcon} />
          <Text style={styles.dropdownText}>Reply</Text>
        </TouchableOpacity>

        {msg.isMine && (
          <TouchableOpacity
            style={styles.dropdownItem}
            activeOpacity={0.6}
            onPress={() => {
              handleDelete(msg.id);
              closeDropdown();
            }}
          >
            <Feather name="trash-2" size={18} color="red" style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  </TouchableWithoutFeedback>
)}



      </View>
    );
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.userSection}>
          <Image
            source={recipientImage ? { uri: recipientImage } : require('../assets/image16.jpeg')}
            style={styles.avatar}
          />
           {isRecipientOnline && (
      <View style={styles.onlineDot} />
    )}
          <Text style={styles.username}>{recipientName}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton}  onPress={isBlocked ? handleUnblockUser : handleBlockUser}>
            <Feather name="user-x" size={24} color='red' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatBody}>
            {messages.map(renderMessage)}
          </ScrollView>
        )}
{isBlocked ? (
  <View style={[styles.messageBox,{justifyContent:'center',alignItems:'center'}]}>
      <Text style={{color:'#888'}}>You can't message this user</Text>
  </View>
):(
 
  
        <View style={styles.messageBox}>
 {replyingTo && (
  <View style={styles.replyPreview}>
    <View style={styles.replyContent}>
      <Text style={styles.replyAuthor}>
        {replyingTo.isMine ? 'You' : replyingTo.senderName}
      </Text>
      <Text style={styles.replyText} numberOfLines={1}>
        {replyingTo.text}
      </Text>
    </View>
    <TouchableOpacity onPress={() => setReplyingTo(null)}>
      <Feather name="x" size={20} color="#555" />
    </TouchableOpacity>
  </View>
)}




          <TouchableOpacity style={styles.iconButton} onPress={handleImagePicker}>
            <Feather name="plus" size={24} color="#000" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholderTextColor="#888"
            multiline={true}
            editable={!isSending}
          />
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="mic" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, (currentMessage.trim() === '' || isSending) && styles.disabledSendButton]}
            onPress={handleSendMessage}
            disabled={currentMessage.trim() === '' || isSending}
          >
            {isSending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={20} color="white" />}
          </TouchableOpacity>
        </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'limegreen',
    borderWidth: 1,
    borderColor: '#fff',
  },
  
  backButton: { padding: 8 },
  userSection: { alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ccc' },
  username: { marginTop: 4, fontWeight: 'bold', fontSize: 15 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 8 },
  keyboardAvoidingView: { flex: 1 },
  chatBody: { padding: 16, flexGrow: 1 },
  messageContainer: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  sent: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  received: {
    backgroundColor: 'gray',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    color: 'white',
    flexWrap: 'wrap',
  },
  chatImage: { width: 140, height: 140, borderRadius: 10 },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 16,
    marginHorizontal: 10,
    minHeight: 50,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  disabledSendButton: { backgroundColor: '#aaa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555' },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 150,
    maxWidth: 180,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 999,
    position: 'absolute',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  
  
  
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    padding: 8,
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 8,
  },
  replyLabel: {
    fontSize: 12,
    color: '#007bff',
    marginRight: 5,
  },
  replyText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  replyImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 5,
  },
  closeReply: {
    padding: 4,
  },
  
});

export default MessageUser;