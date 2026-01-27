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
    Dimensions,
} from 'react-native';
 
import { io } from 'socket.io-client';
import { AuthorContext } from './AuthorContext';
import { UnreadMessagesContext } from './UnreadMessagesContext'; // Import the context
import * as ImagePicker from 'expo-image-picker';
import { Feather } from "@expo/vector-icons";
import { Audio } from 'expo-av';
const API_BASE_URL = "http://192.168.0.136:3000";
const { height: screenHeight } = Dimensions.get('window');

// Custom component for the message bubble to handle long press
const MessageBubble = ({ msg, onLongPress, onPress, children, isMenuOpen }) => (
    <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress} // Tap to close the menu
        onLongPress={() => onLongPress(msg.id)} // Long press to open the menu
        delayLongPress={400} // Added a slight delay for long press
        style={[
            styles.messageContainer,
            msg.isMine ? styles.sent : styles.received,
            isMenuOpen && (msg.isMine ? styles.sentActive : styles.receivedActive), // Optional: Add a highlight
            msg.type === 'image' && styles.imageMessageContainer, // Adjust padding/margin for image
        ]}
    >
        {children}
    </TouchableOpacity>
);


function MessageUser({ navigation, route }) {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isRecipientOnline, setIsRecipientOnline] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [socket, setSocket] = useState(null);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, align: 'left' });
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);


    // Animations for the dropdown menu
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    const scrollViewRef = useRef();
    const messageRefs = useRef({}); // To store refs for each message view
    const uploadedImageRef = useRef(null);

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
            closeDropdown();
        }
    };


    const handleCopy = (text) => {
        Clipboard.setString(text);
        closeDropdown();
    };

    const openDropdown = (id) => {
        // Find the layout of the message bubble
        messageRefs.current[id]?.measureInWindow((x, y, width, height) => {
            const dropdownWidth = 160;
            const dropdownHeight = 150; // A rough estimate for 3-4 items

            let finalX = x;
            let align = 'left';

            if (messages.find(m => m.id === id)?.isMine) {
                // Sent message: align dropdown to the right of the bubble
                finalX = x + width - dropdownWidth;
                align = 'right';
            } else {
                // Received message: align dropdown to the left of the bubble
                finalX = x;
                align = 'left';
            }

            // Simple collision check for top edge
            let finalY = y - dropdownHeight - 10; // Position above the message bubble

            if (finalY < 100) { // If it collides with the header or top
                finalY = y + height + 10; // Position below the message bubble
            }

            // Collision check for left/right screen edges
            if (finalX < 10) finalX = 10;
            if (finalX + dropdownWidth > Dimensions.get('window').width - 10) {
                finalX = Dimensions.get('window').width - dropdownWidth - 10;
            }


            setDropdownPosition({ x: finalX, y: finalY, align });
            setActiveMessageId(id);

            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const closeDropdown = () => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => setActiveMessageId(null));
    };


    const handleReply = (msg) => {
        setReplyingTo(msg);
        // setCurrentMessage(`@${msg.isMine ? 'You' : recipientName} `);
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
        // Use a slight delay to ensure the scroll happens after render and layout calculation
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);


    
    const handleSendMessage = () => {
        if (currentMessage.trim() === '' || isSending) return;
        setIsSending(true);

        const replyToMessageId = replyingTo?.id || null;

        const messageData = {
            senderId: myUserId,
            receiverId: recipientId,
            text: currentMessage,
            type: 'text',
            imageUri: null,
            replyToId: replyToMessageId,
        };

        if (socket) {
            socket.emit('sendMessage', messageData, (response) => {
                setIsSending(false);
                if (response?.error) {
                    Alert.alert('Error', 'Message failed to send.');
                } else {
                    setCurrentMessage('');
                    setReplyingTo(null);
                }
            });
        }

        // Optimistic update
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            ...messageData,
            isMine: true,
            timestamp: new Date().toISOString(),
        }]);
        setCurrentMessage('');
        setReplyingTo(null);
    };

    const handleImagePicker = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
        if (status !== "granted") {
          alert("Permission required to access photos");
          return;
        }
      
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });
      
        if (result.canceled || !result.assets || result.assets.length === 0) return;
      
        const asset = result.assets[0];
        const imageUri = asset.uri;
      
        // Try to extract the filename and MIME type
        const filename = asset.fileName || imageUri.split("/").pop() || "photo.jpg";
        const fileType = asset.type || "image/jpeg";
      
        try {
          const formData = new FormData();
          formData.append("image", {
            uri: imageUri,
            name: filename,   // ✅ dynamic name
            type: fileType,   // ✅ dynamic MIME type
          });
      
          const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
            method: "POST",
            body: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
      
          const uploadResult = await uploadResponse.json();
          if (!uploadResult.imageUrl) throw new Error("Upload failed");
      
          const uploadedImageUrl = uploadResult.imageUrl;
       
          setUploadedImageUrl(uploadedImageUrl); 
          uploadedImageRef.current = uploadResult.imageUrl;
          console.log("Uploaded image URL:", `${API_BASE_URL}${uploadedImageUrl}`);


          const replyToMessageId = replyingTo?.id || null;
      
          const imageMessage = {
            senderId: myUserId,
            receiverId: recipientId,
            imageUri: uploadedImageUrl,
            type: "image",
            text: null,
            replyToId: replyToMessageId,
          };
      console.log(uploadedImageUrl);
          if (socket) socket.emit("sendMessage", imageMessage);
      
          // Optimistic update
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              ...imageMessage,
              isMine: true,
              timestamp: new Date().toISOString(),
            },
          ]);
          setReplyingTo(null);
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Upload failed", "Please try again.");
        }
      };
      

      const startRecording=async()=>{
        setIsRecording(true);
        try{
            const permission=await Audio.requestPermissionsAsync()
            if(permission.status!=='granted'){
                alert('Permission to access microphone is required!');
                return;
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
              });

              const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
              );
              setRecording(recording);
        }catch (err) {
            console.error('Failed to start recording', err);
          }


      }
      
      const stopRecording=async()=>{
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri);
            setRecording(null);
          } catch (err) {
            console.error('Stop recording error:', err);
          }
      }


      const playRecording=async()=>{
        const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
    setSound(sound);
    await sound.playAsync();
      }








    const renderMessage = (msg) => {
        const isMenuOpen = activeMessageId === msg.id;
        const dropdownAlignment = msg.isMine ? styles.dropdownMenuSent : styles.dropdownMenuReceived;

        // Find the replied-to message locally for display
        const repliedToMsg = messages.find(m => m.id === msg.replyToId);
        const repliedToText = repliedToMsg ? (repliedToMsg.type === 'image' ? 'Image' : (repliedToMsg.text || '')) : 'Deleted Message';
        const repliedToAuthor = repliedToMsg ? (repliedToMsg.isMine ? 'You' : recipientName) : 'User';

        return (
            <View
                key={msg.id}
                ref={el => (messageRefs.current[msg.id] = el)}
                style={{
                    alignSelf: msg.isMine ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                }}
            >
                <MessageBubble
                    msg={msg}
                    isMenuOpen={isMenuOpen}
                    onPress={isMenuOpen ? closeDropdown : () => {}} // Tap on bubble to close dropdown
                    onLongPress={openDropdown}
                    style={[
                      styles.messageContainer,
                      msg.type === 'image'
                        ? { backgroundColor: 'transparent', padding: 0 } // override for images
                        : msg.isMine
                          ? styles.sent
                          : styles.received,
                      msg.type === 'image' && styles.imageMessageContainer,
                    ]}
                >
                   {msg.replyToId && (
  <View style={styles.replyPreviewContainer}>
    <View style={styles.replyBar} />
    <View style={styles.replyContent}>
      <Text style={styles.replyingToLabel}>
        {repliedToAuthor === 'You' ? 'You' : repliedToAuthor}
      </Text>
      <Text style={styles.replySnippet} numberOfLines={1}>
        {repliedToText}
      </Text>
    </View>
  </View>
)}


                    {msg.type === 'image' ? (
                      <TouchableOpacity   activeOpacity={0.8}
                      onPress={() => navigation.navigate('ViewImage', { imagevalue: `${API_BASE_URL}${msg.imageUri}` ,mediatype:'imagee'})}
                      onLongPress={openDropdown}
                      >
                     
                    
                     <Image source={{ uri: `${API_BASE_URL}${msg.imageUri}` }} style={styles.chatImage} />


                        </TouchableOpacity>
                        //  console.log(`${API_BASE_URL}${msg.imageUri}`);
                    ) : (
                        <Text style={msg.isMine ? styles.sentMessageText : styles.receivedMessageText}>{msg.text}</Text>
                    )}
                </MessageBubble>
            </View>
        );
    };

    const renderDropdown = () => {
        if (!activeMessageId) return null;

        const msg = messages.find(m => m.id === activeMessageId);
        if (!msg) return null;

        const isText = msg.type === 'text' && msg.text;

        return (
            <TouchableWithoutFeedback onPress={closeDropdown}>
                <View style={styles.fullScreenOverlay}>
                    <Animated.View
                        style={[
                            styles.dropdownMenu,
                            {
                                opacity: opacityAnim,
                                transform: [{ scale: scaleAnim }],
                                top: dropdownPosition.y,
                                left: dropdownPosition.x,
                                // Align the arrow/menu to the bubble's side
                                alignItems: dropdownPosition.align === 'right' ? 'flex-end' : 'flex-start',
                            },
                        ]}
                    >
                        {isText && (
                            <TouchableOpacity
                                style={[styles.dropdownItem, styles.dropdownItemBorder]}
                                activeOpacity={0.7}
                                onPress={() => handleCopy(msg.text)}
                            >
                                <Feather name="copy" size={18} color="#333" style={styles.dropdownIcon} />
                                <Text style={styles.dropdownText}>Copy</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.dropdownItem, isText && styles.dropdownItemBorder]}
                            activeOpacity={0.7}
                            onPress={() => handleReply(msg)}
                        >
                            <Feather name="corner-up-left" size={18} color="#333" style={styles.dropdownIcon} />
                            <Text style={styles.dropdownText}>Reply</Text>
                        </TouchableOpacity>

                        {msg.isMine && (
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                activeOpacity={0.7}
                                onPress={() => handleDelete(msg.id)}
                            >
                                <Feather name="trash-2" size={18} color="#e74c3c" style={styles.dropdownIcon} />
                                <Text style={[styles.dropdownText, { color: '#e74c3c' }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
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
                    <TouchableOpacity style={styles.iconButton} onPress={isBlocked ? handleUnblockUser : handleBlockUser}>
                        <Feather name={isBlocked ? "user-check" : "user-x"} size={24} color={isBlocked ? '#2ecc71' : '#e74c3c'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Feather name="menu" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' :'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : (
                    <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatBody} onScrollBeginDrag={closeDropdown}>
                        {messages.map(renderMessage)}
                    </ScrollView>
                )}
                {renderDropdown()}

                {isBlocked ? (
                    <View style={styles.blockedMessageBox}>
                        <Text style={styles.blockedText}>You are blocked or have blocked this user.</Text>
                    </View>
                ) : (
                    <View style={styles.inputArea}>
                        {replyingTo && (
                            <View style={styles.replyPreview}>
                                <View style={styles.replyContent}>
                                    <Text style={styles.replyAuthor}>
                                        Replying to {replyingTo.isMine ? 'You' : recipientName}
                                    </Text>
                                    <Text style={styles.replyText} numberOfLines={1}>
                                        {replyingTo.type === 'image' ? 'Image' : replyingTo.text}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.closeReply}>
                                    <Feather name="x" size={18} color="#555" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.messageBox}>
                            <TouchableOpacity style={styles.iconButton} onPress={handleImagePicker}>
                                <Feather name="image" size={24} color="#007bff" />
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
                            <TouchableOpacity
    style={[
        styles.iconButton,
        isRecording && { backgroundColor: '#ff4d4d', borderRadius: 30 },
    ]}
    onPressIn={startRecording}   // 👈 Start when pressed down
    onPressOut={stopRecording}   // 👈 Stop when released
>
    <Feather
        name={isRecording ? "square" : "mic"}
        size={24}
        color={isRecording ? "#fff" : "#007bff"}
    />
</TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sendButton, (currentMessage.trim() === '' || isSending) && styles.disabledSendButton]}
                                onPress={handleSendMessage}
                                disabled={currentMessage.trim() === '' || isSending}
                            >
                                {isSending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={20} color="white" />}
                            </TouchableOpacity>
                        </View>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'limegreen',
        borderWidth: 1,
        borderColor: '#fff',
    },
    backButton: { padding: 8 },
    userSection: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
    username: { fontWeight: '600', fontSize: 16, color: '#333' },
    actionButtons: { flexDirection: 'row', gap: 4 },
    iconButton: { padding: 8 },
    keyboardAvoidingView: { flex: 1 },
    chatBody: { padding: 16, flexGrow: 1 },

    // --- Message Styles (Updated) ---
    messageContainer: {
        maxWidth: '78%',
        padding: 10,
        borderRadius: 12,
        minHeight: 38,
        justifyContent: 'center',
    },
    imageMessageContainer: {
      backgroundColor: 'transparent',  // remove blue/grey background
      padding: 0,                      // no extra padding around image
      borderRadius: 0,                 // prevent extra rounded corners from bubble
      alignItems: 'flex-start',        // keep alignment consistent
    },
    
    sent: {
        backgroundColor: '#007bff',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    received: {
        backgroundColor: '#e5e5e5',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    sentMessageText: {
        fontSize: 15,
        color: 'white',
        flexWrap: 'wrap',
    },
    receivedMessageText: {
        fontSize: 15,
        color: '#333',
        flexWrap: 'wrap',
    },
    chatImage: {
        width: 200,
        height: 350,
        borderRadius: 20,
    },
    // --- Reply In-Message Bubble ---
    inReplyToContainer: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 8,
        borderRadius: 8,
        marginBottom: 5,
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(255,255,255,0.7)',
    },
    inReplyToAuthor: {
        fontSize: 13,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
    },
    inReplyToText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    // --- Input Area ---
    inputArea: {
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        paddingTop: 5,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    messageInput: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
        borderRadius: 22,
        paddingHorizontal: 14,
        fontSize: 16,
        marginHorizontal: 5,
        minHeight: 44,
        maxHeight: 120, // Limit height for multiline
        paddingTop: Platform.OS === 'ios' ? 12 : 10,
        paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    },
    sendButton: {
        backgroundColor: '#007bff',
        borderRadius: 22,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
        width: 44,
        marginLeft: 5,
    },
    disabledSendButton: { backgroundColor: '#aaa' },
    blockedMessageBox: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    blockedText: { color: '#888', fontStyle: 'italic' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#555' },

    // --- Dropdown Menu (Updated) ---
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 998,
        backgroundColor: 'transparent',
    },
    dropdownMenu: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 5,
        minWidth: 150,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        zIndex: 999,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    dropdownItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0',
    },
    dropdownIcon: {
        marginRight: 12,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },

    // --- Reply Preview (Updated) ---
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        padding: 8,
        marginHorizontal: 10,
        marginBottom: 5,
        borderRadius: 6,
    },
    replyContent: {
        flex: 1,
        paddingRight: 10,
    },
    replyAuthor: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#007bff',
    },
    replyText: {
        fontSize: 14,
        color: '#555',
    },
    closeReply: {
        padding: 5,
    },
    replyPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderLeftWidth: 3,
        borderLeftColor: '#4a90e2',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginBottom: 6,
        maxWidth: '90%',
      },
      
      replyBar: {
        width: 3,
        height: '100%',
        backgroundColor: '#4a90e2',
        borderRadius: 2,
        marginRight: 6,
      },
      
      replyContent: {
        flex: 1,
      },
      
      replyingToLabel: {
        fontSize: 12,
        color: '#b0b0b0',
        marginBottom: 2,
      },
      
      replySnippet: {
        fontSize: 14,
        color: '#e0e0e0',
      },
      
});

export default MessageUser;