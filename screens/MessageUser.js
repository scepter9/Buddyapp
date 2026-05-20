import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
    SafeAreaView, Platform, KeyboardAvoidingView, ActivityIndicator,
    Image, Animated, TouchableWithoutFeedback, Dimensions, PanResponder, Alert,
} from 'react-native';
import { AuthorContext } from './AuthorContext';
import { UnreadMessagesContext } from './UnreadMessagesContext';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import socket from './Socket'
import Slideupbar from './Slideupbar';

const API_BASE_URL = 'http://192.168.0.136:3000';
const { width: screenWidth } = Dimensions.get('window');

const useToast = () => {
    const [toast, setToast] = useState(null);
    const timeoutRef = useRef(null);
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const show = useCallback((message, type = 'default') => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setToast({ message, type });
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        timeoutRef.current = setTimeout(() => {
            Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(null));
        }, 2500);
    }, [opacityAnim]);

    const ToastComponent = toast ? (
        <Animated.View style={[toastStyles.container, toastStyles[toast.type] || {}, { opacity: opacityAnim }]}>
            <Text style={toastStyles.text}>{toast.message}</Text>
        </Animated.View>
    ) : null;

    return { show, ToastComponent };
};

const toastStyles = StyleSheet.create({
    container: {
        position: 'absolute', bottom: 90, alignSelf: 'center', backgroundColor: '#1a1a1a',
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, zIndex: 9999,
        shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 10,
    },
    text: { color: '#fff', fontSize: 14, fontWeight: '500' },
    error: { backgroundColor: '#e74c3c' },
    success: { backgroundColor: '#27ae60' },
});

const AudioMessage = ({ uri, isMine }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

    const togglePlay = async () => {
        if (sound) {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
            return;
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: `${API_BASE_URL}${uri}` },
            { shouldPlay: true },
            (status) => {
                if (status.isLoaded) {
                    setPosition(status.positionMillis);
                    setDuration(status.durationMillis || 0);
                    const progress = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
                    progressAnim.setValue(progress);
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPosition(0);
                        progressAnim.setValue(0);
                    }
                }
            }
        );
        setSound(newSound);
        setIsPlaying(true);
    };

    const formatTime = (ms) => {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    const barCount = 24;

    return (
        <View style={[audioStyles.wrapper, isMine ? audioStyles.wrapperSent : audioStyles.wrapperReceived]}>
            <TouchableOpacity onPress={togglePlay} style={audioStyles.playBtn}>
                <Feather name={isPlaying ? 'pause' : 'play'} size={18} color={isMine ? '#007bff' : '#555'} />
            </TouchableOpacity>
            <View style={audioStyles.waveform}>
                {Array.from({ length: barCount }).map((_, i) => {
                    const h = 6 + Math.sin(i * 0.8) * 5 + (i % 3 === 0 ? 8 : 0);
                    const filled = duration > 0 && (i / barCount) < (position / duration);
                    return (
                        <View key={i} style={[audioStyles.bar, { height: h },
                            filled ? (isMine ? audioStyles.barFilledSent : audioStyles.barFilledReceived)
                                   : (isMine ? audioStyles.barEmptySent : audioStyles.barEmptyReceived)]} />
                    );
                })}
            </View>
            <Text style={[audioStyles.timer, isMine ? audioStyles.timerSent : audioStyles.timerReceived]}>
                {formatTime(position || duration)}
            </Text>
        </View>
    );
};

const audioStyles = StyleSheet.create({
    wrapper: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 20, minWidth: 200 },
    wrapperSent: { backgroundColor: '#0066dd' },
    wrapperReceived: { backgroundColor: '#ececec' },
    playBtn: {
        width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)', marginRight: 10,
    },
    waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
    bar: { width: 3, borderRadius: 3 },
    barFilledSent: { backgroundColor: '#fff' },
    barEmptySent: { backgroundColor: 'rgba(255,255,255,0.4)' },
    barFilledReceived: { backgroundColor: '#007bff' },
    barEmptyReceived: { backgroundColor: '#bbb' },
    timer: { fontSize: 11, marginLeft: 8, minWidth: 30 },
    timerSent: { color: 'rgba(255,255,255,0.85)' },
    timerReceived: { color: '#888' },
});

const SWIPE_THRESHOLD = 60;

const SwipeableMessage = ({ children, onSwipe }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
        onPanResponderMove: (_, g) => {
            if (g.dx > 0 && g.dx < SWIPE_THRESHOLD + 20) translateX.setValue(g.dx);
        },
        onPanResponderRelease: (_, g) => {
            if (g.dx >= SWIPE_THRESHOLD) onSwipe();
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        },
    })).current;

    return (
        <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
            {children}
        </Animated.View>
    );
};

function MessageUser({ navigation, route }) {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isRecipientOnline, setIsRecipientOnline] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false); 
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isTypingIndicatorVisible, setIsTypingIndicatorVisible] = useState(false);
    const [showReport, setShowReport] = useState(false);
const [clearstate,setClearstate]=useState(false)

    const recordingRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const dropdownAnim = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef();
    const messageRefs = useRef({});
    const isNearBottomRef = useRef(true);
    const typingTimerRef = useRef(null);

    const { user } = useContext(AuthorContext);
    const myUserId = user?.id;
    const { recipientId, recipientName, recipientImage } = route.params;
    const { resetUnreadCountForConversation } = useContext(UnreadMessagesContext);
    const { show: showToast, ToastComponent } = useToast();

    const scrollToBottom = (animated = true) => {
        scrollViewRef.current?.scrollToEnd({ animated });
    };

    const openDropdown = useCallback((id) => {
        messageRefs.current[id]?.measureInWindow((x, y, width, height) => {
            const dropdownWidth = 170;
            let finalX = x;
            const msg = messages.find(m => m.id === id);
            if (msg?.isMine) finalX = x + width - dropdownWidth;
            finalX = Math.max(10, Math.min(finalX, screenWidth - dropdownWidth - 10));
            const dropdownHeight = 160;
            let finalY = y - dropdownHeight - 8;
            if (finalY < 80) finalY = y + height + 8;
            setDropdownPosition({ x: finalX, y: finalY });
            setActiveMessageId(id);
            dropdownAnim.setValue(0);
            Animated.timing(dropdownAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        });
    }, [messages, dropdownAnim]);

    const closeDropdown = useCallback(() => {
        Animated.timing(dropdownAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setActiveMessageId(null));
    }, [dropdownAnim]);

    const handleDelete = async (id) => {
        closeDropdown();
        try {
            const res = await fetch(`${API_BASE_URL}/messages/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setMessages(prev => prev.filter(m => m.id !== id));
            showToast('Message deleted', 'success');
        } catch {
            showToast('Could not delete message', 'error');
        }
    };

    // const handleCopy = (text) => {
    //     const Clipboard = require('@react-native-clipboard/clipboard').default;
    //     Clipboard.setString(text);
    //     closeDropdown();
    //     showToast('Copied to clipboard');
    // };

    const handleReply = (msg) => {
        setReplyingTo(msg);
        closeDropdown();
    };

    const handleBlockUser = () => {
        socket?.emit('blockUser', { blockedId: recipientId });
        setIsBlocked(true);
        closeDropdown();
    };

    const handleUnblockUser = () => {
        socket?.emit('unblockUser', { blockedId: recipientId });
        setIsBlocked(false);
    };
    const editname = (username) => {
        if (!username) return '??';
        return username.slice(0, 2).toUpperCase();
      };
      const confirmClearChat = () => {
        Alert.alert(
            'Clear chat',
            'This will delete all messages for both of you. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearChat },
            ]
        );
    };
    const fetchBlockStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/isBlocked/${recipientId}`);
            const data = await res.json();
            setIsBlocked(data.blocked);
        } catch {}
    };

    const fetchHistoricalMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/messages?senderId=${myUserId}&receiverId=${recipientId}`);
            const data = await res.json();
            const formatted = data.map(msg => ({
                id: msg.id, senderId: msg.sender_id, receiverId: msg.receiver_id,
                type: msg.type, text: msg.text, imageUri: msg.image_uri,
                audioUri: msg.audio_uri, timestamp: msg.timestamp,
                replyToId: msg.reply_to_id, status: 'sent',
                isMine: msg.sender_id === myUserId,
            }));
            setMessages(formatted);
            if (formatted.length > 0) resetUnreadCountForConversation(recipientId, myUserId);
        } catch {
            showToast('Failed to load messages', 'error');
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollToBottom(false), 100);
        }
    }, [myUserId, recipientId]);

    useEffect(() => {
       

        socket.on('user_online', id => { if (id === recipientId) setIsRecipientOnline(true); });
        socket.on('chat_cleared', ({ by }) => {
            if (by === recipientId) setMessages([]);
        });
        socket.on('user_offline', id => { if (id === recipientId) setIsRecipientOnline(false); });
        socket.on('message_deleted', id => setMessages(prev => prev.filter(m => m.id !== id)));
        socket.on('user_blocked', id => { if (id === recipientId) setIsBlocked(true); });
        socket.on('blocked_by_user', id => { if (id === recipientId) setIsBlocked(true); });
        socket.on('user_unblocked', id => { if (id === recipientId) setIsBlocked(false); });
        socket.on('unblocked_by_user', id => { if (id === recipientId) setIsBlocked(false); });
        socket.on('typing', ({ senderId }) => {
            if (senderId === recipientId) {
                setIsTypingIndicatorVisible(true);
                setTimeout(() => setIsTypingIndicatorVisible(false), 3000);
            }
        });
        socket.on('newMessage', (message) => {
            const relevant = (message.senderId === myUserId && message.receiverId === recipientId)
                || (message.senderId === recipientId && message.receiverId === myUserId);
            if (relevant) {
                setMessages(prev => {
                    const exists = prev.find(m => m.id === message.id);
                    if (exists) return prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m);
                    return [...prev, { ...message, isMine: message.senderId === myUserId, status: 'sent' }];
                });
                if (message.senderId !== myUserId) resetUnreadCountForConversation(recipientId, myUserId);
            }
        });
        return () => {
            socket.off('user_online');
            socket.off('chat_cleared');
            socket.off('user_offline');
            socket.off('message_deleted');
            socket.off('user_blocked');
            socket.off('blocked_by_user');
            socket.off('user_unblocked');
            socket.off('unblocked_by_user');
            socket.off('typing');
            socket.off('newMessage');
        };
    }, [myUserId, recipientId]);

    useEffect(() => {
        if (myUserId) { fetchHistoricalMessages(); fetchBlockStatus(); }
    }, [fetchHistoricalMessages]);

    useEffect(() => {
        if (isNearBottomRef.current) setTimeout(() => scrollToBottom(true), 60);
    }, [messages]);

    const emitTyping = useCallback(() => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        socket.emit('typing', { receiverId: recipientId });
        typingTimerRef.current = setTimeout(() => {}, 2000);
    }, [recipientId]);

    const handleSendMessage = () => {
        if (!currentMessage.trim() || isSending) return;
        const tempId = `temp_${Date.now()}`;
        const messageData = {
            senderId: myUserId, receiverId: recipientId,
            text: currentMessage.trim(), type: 'text',
            imageUri: null, audioUri: null,
            replyToId: replyingTo?.id || null,
        };
        setMessages(prev => [...prev, { id: tempId, ...messageData, isMine: true, timestamp: new Date().toISOString(), status: 'sending' }]);
        setCurrentMessage('');
        setReplyingTo(null);
        setIsSending(true);
        socket?.emit('sendMessage', messageData, (res) => {
            setIsSending(false);
            if (res?.error) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
                showToast('Failed to send', 'error');
            } else if (res?.id) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.id, status: 'sent' } : m));
            }
        });
    };

    const handleImagePicker = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { showToast('Permission required', 'error'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' });
        try {
            const res = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!data.imageUrl) throw new Error();
            const msg = { senderId: myUserId, receiverId: recipientId, imageUri: data.imageUrl, type: 'image', text: null, replyToId: replyingTo?.id || null };
            socket?.emit('sendMessage', msg);
            setMessages(prev => [...prev, { id: Date.now().toString(), ...msg, isMine: true, timestamp: new Date().toISOString(), status: 'sent' }]);
            setReplyingTo(null);
        } catch {
            showToast('Image upload failed', 'error');
        }
    };

    const startRecording = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') { showToast('Microphone permission required', 'error'); return; }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    };

    const stopAndSendRecording = async () => {
        if (!recordingRef.current) return;
        clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingDuration(0);
        try {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;
            if (!uri) return;
            const formData = new FormData();
            formData.append('audio', { uri, name: `voice_${Date.now()}.m4a`, type: 'audio/m4a' });
            const res = await fetch(`${API_BASE_URL}/api/upload-audio`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!data.audioUrl) throw new Error();
            const msg = { senderId: myUserId, receiverId: recipientId, audioUri: data.audioUrl, type: 'audio', text: null, replyToId: replyingTo?.id || null };
            socket?.emit('sendMessage', msg);
            setMessages(prev => [...prev, { id: Date.now().toString(), ...msg, isMine: true, timestamp: new Date().toISOString(), status: 'sent' }]);
            setReplyingTo(null);
        } catch {
            showToast('Failed to send voice message', 'error');
        }
    };

    const cancelRecording = async () => {
        if (!recordingRef.current) return;
        clearInterval(recordingTimerRef.current);
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
        setIsRecording(false);
        setRecordingDuration(0);
        showToast('Recording cancelled');
    };

    const Reportuser=()=>{
Alert.alert('Report User',
`Are you sure you want to Report ${recipientName}`,
[{text:'Cancel',onPress:()=>console.log('cancelled'),style:'cancel'},
{text:'Ok',onPress:()=>setShowReport(true),style:'default'}
]
)
    }
    const clearChat=async()=>{
        if(!myUserId || !recipientId) return;
try{
    setClearstate(true)
    const res=await fetch(`${API_BASE_URL}/clearchat`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({myUserId,recipientId})
    })
    if(!res.ok){
        Alert.alert('Something went wrong 😪', 'Please try again.');
        return;
    }
    
}catch(err){
    Alert.alert('Something went wrong 😪', 'Please try again.');
      console.log(err);
}finally{
    setClearstate(false)
}
    }
    const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const renderMessage = (msg) => {
        const repliedTo = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

        return (
            <SwipeableMessage key={msg.id} onSwipe={() => handleReply(msg)}>
                <View
                    ref={el => (messageRefs.current[msg.id] = el)}
                    style={[styles.messageRow, msg.isMine ? styles.messageRowSent : styles.messageRowReceived]}
                >
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onLongPress={() => openDropdown(msg.id)}
                        delayLongPress={350}
                        onPress={activeMessageId ? closeDropdown : undefined}
                        style={[
                            styles.bubble,
                            msg.isMine ? styles.bubbleSent : styles.bubbleReceived,
                            msg.type === 'image' && styles.bubbleImage,
                            msg.type === 'audio' && styles.bubbleAudio,
                            msg.status === 'failed' && styles.bubbleFailed,
                        ]}
                    >
                        {repliedTo && (
                            <View style={[styles.quotedMessage, msg.isMine ? styles.quotedSent : styles.quotedReceived]}>
                                <Text style={[styles.quotedAuthor, msg.isMine ? styles.quotedAuthorSent : styles.quotedAuthorReceived]}>
                                    {repliedTo.isMine ? 'You' : recipientName}
                                </Text>
                                <Text style={[styles.quotedText, msg.isMine ? styles.quotedTextSent : styles.quotedTextReceived]} numberOfLines={1}>
                                    {repliedTo.type === 'image' ? '📷 Photo' : repliedTo.type === 'audio' ? '🎤 Voice message' : repliedTo.text}
                                </Text>
                            </View>
                        )}

                        {msg.type === 'image' && (
                            <TouchableOpacity onPress={() => navigation.navigate('ViewImage', { imagevalue: `${API_BASE_URL}${msg.imageUri}`, mediatype: 'imagee' })}>
                                <Image source={{ uri: `${API_BASE_URL}${msg.imageUri}` }} style={styles.chatImage} />
                            </TouchableOpacity>
                        )}

                        {msg.type === 'audio' && (
                            <AudioMessage uri={msg.audioUri} isMine={msg.isMine} />
                        )}

                        {msg.type === 'text' && (
                            <Text style={msg.isMine ? styles.textSent : styles.textReceived}>{msg.text}</Text>
                        )}

                        <View style={styles.metaRow}>
                            <Text style={[styles.timestamp, msg.isMine ? styles.timestampSent : styles.timestampReceived]}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {msg.isMine && (
                                <Text style={styles.statusMark}>
                                    {msg.status === 'sending' ? '○' : msg.status === 'failed' ? '✕' : '✓✓'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </SwipeableMessage>
        );
    };

    const renderDropdown = () => {
        if (!activeMessageId) return null;
        const msg = messages.find(m => m.id === activeMessageId);
        if (!msg) return null;
        return (
            <TouchableWithoutFeedback onPress={closeDropdown}>
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Animated.View style={[styles.dropdown, {
                        opacity: dropdownAnim,
                        transform: [{ scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                        top: dropdownPosition.y,
                        left: dropdownPosition.x,
                    }]}>
                        {msg.type === 'text' && (
                            <TouchableOpacity style={[styles.dropdownItem, styles.dropdownBorder]} onPress={() => handleCopy(msg.text)}>
                                <Feather name="copy" size={16} color="#444" />
                                <Text style={styles.dropdownLabel}>Copy</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.dropdownItem, styles.dropdownBorder]} onPress={() => handleReply(msg)}>
                            <Feather name="corner-up-left" size={16} color="#444" />
                            <Text style={styles.dropdownLabel}>Reply</Text>
                        </TouchableOpacity>
                        {msg.isMine && (
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDelete(msg.id)}>
                                <Feather name="trash-2" size={16} color="#e74c3c" />
                                <Text style={[styles.dropdownLabel, { color: '#e74c3c' }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                        {!msg.isMine && (
                            <TouchableOpacity style={styles.dropdownItem} onPress={isBlocked ? handleUnblockUser : handleBlockUser}>
                                <Feather name={isBlocked ? 'user-check' : 'user-x'} size={16} color={isBlocked ? '#27ae60' : '#e74c3c'} />
                                <Text style={[styles.dropdownLabel, { color: isBlocked ? '#27ae60' : '#e74c3c' }]}>
                                    {isBlocked ? 'Unblock' : 'Block'}
                                </Text>
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Feather name="chevron-left" size={26} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerUser} activeOpacity={0.7}>
                    <View>
                    {recipientImage ? (
    <Image source={{ uri: recipientImage }} style={styles.avatar} />
) : (
    <View style={styles.avatarFallback}>
        <Text style={styles.avatarInitials}>{editname(recipientName)}</Text>
    </View>
)}
                        {isRecipientOnline && <View style={styles.onlineDot} />}
                    </View>
                    <View>
                        <Text style={styles.headerName}>{recipientName}</Text>
                        <Text style={styles.headerStatus}>
                            {isTypingIndicatorVisible ? 'typing...' : isRecipientOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap:6 }}>
                    <TouchableOpacity style={styles.headerBtn} onPress={Reportuser}>
                        <Feather name="flag" size={24} color="#FF4444" />

                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn} onPress={confirmClearChat}>
                        <Feather name="trash-2" size={24} color="#666666" />
                    </TouchableOpacity>
                </View>
            </View>

            {showReport && (
        <Slideupbar
          senderId={myUserId}       
          reporthead="User"             
          reportedname={recipientName}
          stuffimage={recipientImage}
          onClose={() => {
            setShowReport(false);        
           
          }}
        />
      )}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {isLoading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={styles.loadingText}>Loading messages…</Text>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.chatBody}
                        keyboardDismissMode="interactive"
                        onScrollBeginDrag={closeDropdown}
                        onScroll={({ nativeEvent }) => {
                            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                            isNearBottomRef.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100;
                        }}
                        scrollEventThrottle={100}
                    >
                        {messages.map(renderMessage)}
                    </ScrollView>
                )}

                {renderDropdown()}
                {ToastComponent}

                {isBlocked ? (
                    <View style={styles.blockedBar}>
                        <Feather name="slash" size={14} color="#aaa" />
                        <Text style={styles.blockedText}>You can't send messages to this person.</Text>
                    </View>
                ) : (
                    <View style={styles.inputArea}>
                        {replyingTo && (
                            <View style={styles.replyBanner}>
                                <View style={styles.replyAccent} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.replyBannerAuthor}>
                                        Replying to {replyingTo.isMine ? 'yourself' : recipientName}
                                    </Text>
                                    <Text style={styles.replyBannerText} numberOfLines={1}>
                                        {replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'audio' ? '🎤 Voice message' : replyingTo.text}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Feather name="x" size={16} color="#888" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {isRecording ? (
                            <View style={styles.recordingBar}>
                                <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordBtn}>
                                    <Feather name="trash-2" size={20} color="#e74c3c" />
                                </TouchableOpacity>
                                <View style={styles.recordingPulse} />
                                <Text style={styles.recordingLabel}>Recording · {formatDuration(recordingDuration)}</Text>
                                <TouchableOpacity onPress={stopAndSendRecording} style={styles.sendRecordBtn}>
                                    <Feather name="send" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.inputRow}>
                                <TouchableOpacity style={styles.inputIconBtn} onPress={handleImagePicker}>
                                    <Feather name="image" size={22} color="#007bff" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Message…"
                                    value={currentMessage}
                                    onChangeText={(t) => { setCurrentMessage(t); emitTyping(); }}
                                    placeholderTextColor="#aaa"
                                    multiline
                                    editable={!isSending}
                                />
                                {currentMessage.trim() ? (
                                    <TouchableOpacity
                                        style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
                                        onPress={handleSendMessage}
                                        disabled={isSending}
                                    >
                                        {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="send" size={18} color="#fff" />}
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.micBtn}
                                        onPressIn={startRecording}
                                        delayLongPress={200}
                                    >
                                        <Feather name="mic" size={22} color="#007bff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    header: {
        flexDirection: 'row', alignItems: 'center', height: 62,
        paddingHorizontal: 6, backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8e8e8',
    },
    headerBtn: { padding: 10 },
    headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 2 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' },
    onlineDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 11, height: 11, borderRadius: 6, backgroundColor: '#2ecc71',
        borderWidth: 2, borderColor: '#fff',
    },
    headerName: { fontSize: 16, fontWeight: '600', color: '#111' },
    headerStatus: { fontSize: 12, color: '#888', marginTop: 1 },

    chatBody: { paddingHorizontal: 14, paddingVertical: 12, flexGrow: 1 },

    messageRow: { marginBottom: 4 },
    messageRowSent: { alignItems: 'flex-end' },
    messageRowReceived: { alignItems: 'flex-start' },
    avatarFallback: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#007bff',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },

    bubble: {
        maxWidth: '78%', borderRadius: 16, padding: 10,
        shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
    },
    bubbleSent: { backgroundColor: '#007bff', borderBottomRightRadius: 4 },
    bubbleReceived: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
    bubbleImage: { backgroundColor: 'transparent', padding: 0, shadowOpacity: 0 },
    bubbleAudio: { padding: 4 },
    bubbleFailed: { opacity: 0.6 },

    textSent: { fontSize: 15, color: '#fff', lineHeight: 21 },
    textReceived: { fontSize: 15, color: '#111', lineHeight: 21 },

    chatImage: { width: 220, height: 280, borderRadius: 14 },

    quotedMessage: {
        borderRadius: 8, padding: 8, marginBottom: 6,
        borderLeftWidth: 3,
    },
    quotedSent: { backgroundColor: 'rgba(0,0,0,0.15)', borderLeftColor: 'rgba(255,255,255,0.6)' },
    quotedReceived: { backgroundColor: '#f0f0f0', borderLeftColor: '#007bff' },
    quotedAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    quotedAuthorSent: { color: 'rgba(255,255,255,0.9)' },
    quotedAuthorReceived: { color: '#007bff' },
    quotedText: { fontSize: 13 },
    quotedTextSent: { color: 'rgba(255,255,255,0.75)' },
    quotedTextReceived: { color: '#666' },

    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
    timestamp: { fontSize: 11 },
    timestampSent: { color: 'rgba(255,255,255,0.65)' },
    timestampReceived: { color: '#aaa' },
    statusMark: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },

    dropdown: {
        position: 'absolute', backgroundColor: '#fff', borderRadius: 12,
        minWidth: 160, paddingVertical: 4,
        shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16,
        elevation: 12, zIndex: 999,
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
    dropdownBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0' },
    dropdownLabel: { fontSize: 15, color: '#222', fontWeight: '500' },

    inputArea: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e8e8e8' },

    replyBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
    },
    replyAccent: { width: 3, height: 34, borderRadius: 2, backgroundColor: '#007bff' },
    replyBannerAuthor: { fontSize: 12, fontWeight: '700', color: '#007bff', marginBottom: 2 },
    replyBannerText: { fontSize: 13, color: '#777' },

    inputRow: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 10, paddingVertical: 8, gap: 6,
    },
    inputIconBtn: { padding: 8, marginBottom: 2 },
    input: {
        flex: 1, backgroundColor: '#f4f4f4', borderRadius: 22,
        paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 15, color: '#111', maxHeight: 110, minHeight: 42,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', marginBottom: 2,
    },
    sendBtnDisabled: { backgroundColor: '#99c0f0' },
    micBtn: { padding: 8, marginBottom: 2 },

    recordingBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10, gap: 12,
    },
    cancelRecordBtn: { padding: 6 },
    recordingPulse: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c',
    },
    recordingLabel: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
    sendRecordBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center',
    },

    blockedBar: {
        height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    blockedText: { color: '#aaa', fontSize: 14 },

    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#888', fontSize: 14 },
});

export default MessageUser;