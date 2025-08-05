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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { AuthorContext } from './AuthorContext';

const API_BASE_URL = 'http://172.20.10.4:3000';

function MessageUser({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const scrollViewRef = useRef();

  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  const { recipientId, recipientName, recipientImage } = route.params;

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const fetchHistoricalMessages = useCallback(async () => {
    if (!myUserId || !recipientId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages?senderId=${myUserId}&receiverId=${recipientId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();

      const formattedMessages = data.map(msg => ({
        ...msg,
        isMine: msg.senderId === myUserId,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [myUserId, recipientId]);

  useEffect(() => {
    if (myUserId) {
      fetchHistoricalMessages();
    }
  }, [myUserId, fetchHistoricalMessages]);

  useEffect(() => {
    if (!myUserId) return;

    const newSocket = io(API_BASE_URL, {
      query: { userId: myUserId },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('newMessage', (message) => {
      const isMine = message.senderId === myUserId;
      setMessages(prev => [...prev, { ...message, isMine }]);
    });

    return () => newSocket.disconnect();
  }, [myUserId]);

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
      imageUri: recipientImage,
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
    const imageMessage = {
      senderId: myUserId,
      receiverId: recipientId,
      imageUri: `https://placehold.co/200x200?text=IMG`,
      type: 'image',
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
    return (
      <View
        key={msg.id}
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
          <Text style={styles.username}>{recipientName}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="user-x" size={24} color="red" />
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

        <View style={styles.messageBox}>
          <TouchableOpacity style={styles.iconButton} onPress={handleImagePicker}>
            <Feather name="plus" size={24} color="#000" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholderTextColor="#888"
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
  backButton: { padding: 8 },
  userSection: { alignItems: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc' },
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
    backgroundColor: '#daf0ff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  received: {
    backgroundColor: '#e4e6eb',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    color: '#000',
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
    height: 50,
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
});

export default MessageUser;
