import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, KeyboardAvoidingView, ActivityIndicator,
  Image, Animated, TouchableWithoutFeedback, Dimensions, PanResponder, Alert, StatusBar,
} from 'react-native';
import { AuthorContext } from './AuthorContext';
import { UnreadMessagesContext } from './UnreadMessagesContext';
import * as ImagePicker from 'expo-image-picker';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import socket from './Socket';
import Slideupbar from './Slideupbar';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from './Theme';
import * as Clipboard from 'expo-clipboard';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";
const { width: screenWidth } = Dimensions.get('window');

// ── Toast ──────────────────────────────────────────────────────────────────
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
    <Animated.View style={[ts.container, ts[toast.type] || {}, { opacity: opacityAnim }]}>
      <Text style={ts.text}>{toast.message}</Text>
    </Animated.View>
  ) : null;

  return { show, ToastComponent };
};

const ts = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: colors.bg.modal,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: radius.full, zIndex: 9999,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  text: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  error: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.3)' },
  success: { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' },
});

// ── Audio message ───────────────────────────────────────────────────────────
const AudioMessage = ({ uri, isMine }) => {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        setIsPlaying(false);
        setPosition(0);
      };
    }, [])
  );

  const onPlaybackStatus = useCallback((status) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    if (status.durationMillis) setDuration(status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  }, []);

  const togglePlay = async () => {
    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.setPositionAsync(position ?? 0);
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `${API_BASE_URL}${uri}` },
        { shouldPlay: true },
        onPlaybackStatus
      );
      soundRef.current = newSound;
      setIsPlaying(true);
    } catch (err) {
      console.warn('AudioMessage togglePlay error:', err.message);
    }
  };

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); };
  }, []);

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const BAR_COUNT = 28;
  const progress = duration > 0 ? position / duration : 0;
  const playBtnBg = isMine ? 'rgba(255,255,255,0.18)' : 'rgba(147,51,234,0.15)';
  const playIcon = isMine ? '#fff' : colors.accent.lavender;
  const barActive = isMine ? '#fff' : colors.accent.lavender;
  const barInactive = isMine ? 'rgba(255,255,255,0.25)' : colors.border.medium;
  const timerColor = isMine ? 'rgba(255,255,255,0.6)' : colors.text.muted;

  return (
    <View style={[aw.wrapper, isMine ? aw.sent : aw.received]}>
      <TouchableOpacity onPress={togglePlay} activeOpacity={0.8} style={[aw.playBtn, { backgroundColor: playBtnBg }]}>
        <Feather name={isPlaying ? 'pause' : 'play'} size={15} color={playIcon} />
      </TouchableOpacity>
      <View style={aw.waveWrap}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const h = 5 + Math.abs(Math.sin(i * 0.85 + 0.5)) * 13 + (i % 5 === 0 ? 6 : 0);
          const filled = i / BAR_COUNT < progress;
          return <View key={i} style={[aw.bar, { height: h, backgroundColor: filled ? barActive : barInactive }]} />;
        })}
      </View>
      <Text style={[aw.timer, { color: timerColor }]}>
        {isPlaying ? formatTime(position) : formatTime(duration)}
      </Text>
    </View>
  );
};

const aw = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 22, minWidth: 210, maxWidth: 290, gap: 10,
  },
  sent: { backgroundColor: colors.accent.purple },
  received: { backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle },
  playBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  waveWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 30, overflow: 'hidden' },
  bar: { width: 3, borderRadius: 2 },
  timer: { fontSize: 11, fontWeight: '600', minWidth: 34, textAlign: 'right', flexShrink: 0 },
});

// ── Swipeable ───────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 60;
const SwipeableMessage = ({ children, onSwipe }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => { if (g.dx > 0 && g.dx < SWIPE_THRESHOLD + 20) translateX.setValue(g.dx); },
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

// ── Main component ──────────────────────────────────────────────────────────
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
  const [clearstate, setClearstate] = useState(false);

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

  const scrollToBottom = (animated = true) => scrollViewRef.current?.scrollToEnd({ animated });

  const markAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length) return;
    try {
      socket.emit('mark-read', { themessages: messageIds, sender: recipientId, receiver: myUserId });
      setMessages(prev =>
        prev.map(item => messageIds.includes(item.id) ? { ...item, isRead: true, status: 'seen' } : item)
      );
    } catch (err) { console.log('Failed to mark as read', err); }
  }, [myUserId, recipientId]);

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
    Animated.timing(dropdownAnim, { toValue: 0, duration: 140, useNativeDriver: true })
      .start(() => setActiveMessageId(null));
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

  const handleReply = (msg) => { setReplyingTo(msg); closeDropdown(); };
  const handleBlockUser = () => { socket?.emit('blockUser', { blockedId: recipientId }); setIsBlocked(true); closeDropdown(); };
  const handleUnblockUser = () => { socket?.emit('unblockUser', { blockedId: recipientId }); setIsBlocked(false); };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
        isMine: msg.sender_id === myUserId, isRead: msg.is_read === 1,
      }));
      const unRead = formatted.filter(prev => !prev.isRead && prev.senderId === recipientId);
      if (unRead.length > 0) markAsRead(unRead.map(p => p.id));
      setMessages(formatted);
      if (formatted.length > 0) resetUnreadCountForConversation(recipientId, myUserId);
    } catch {
      showToast('Failed to load messages', 'error');
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [myUserId, recipientId, markAsRead]);

  useEffect(() => {
    socket.on('user_online', id => { if (id === recipientId) setIsRecipientOnline(true); });
    socket.on('chat_cleared', ({ by }) => { if (by === recipientId) setMessages([]); });
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
      const relevant =
        (message.senderId === myUserId && message.receiverId === recipientId) ||
        (message.senderId === recipientId && message.receiverId === myUserId);
      if (relevant) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === message.id);
          if (exists) return prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m);
          return [...prev, { ...message, isMine: message.senderId === myUserId, status: 'sent' }];
        });
        if (message.senderId === recipientId) markAsRead([message.id]);
        if (message.senderId !== myUserId) resetUnreadCountForConversation(recipientId, myUserId);
      }
    });
    socket.on('messages_read', ({ messageIds }) => {
      setMessages(prev => prev.map(m => messageIds.includes(m.id) ? { ...m, isRead: true, status: 'seen' } : m));
    });
    return () => {
      socket.off('user_online'); socket.off('chat_cleared'); socket.off('user_offline');
      socket.off('message_deleted'); socket.off('user_blocked'); socket.off('blocked_by_user');
      socket.off('user_unblocked'); socket.off('unblocked_by_user'); socket.off('typing');
      socket.off('newMessage'); socket.off('messages_read');
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
      imageUri: null, audioUri: null, replyToId: replyingTo?.id || null,
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

  const Reportuser = () => {
    Alert.alert(
      'Report User',
      `Are you sure you want to report ${recipientName}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Report', onPress: () => setShowReport(true), style: 'destructive' },
      ]
    );
  };

  const clearChat = async () => {
    if (!myUserId || !recipientId) return;
    try {
      setClearstate(true);
      const res = await fetch(`${API_BASE_URL}/clearchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myUserId, recipientId }),
      });
      if (!res.ok) { Alert.alert('Something went wrong 😪', 'Please try again.'); return; }
      setMessages([]);
    } catch (err) {
      Alert.alert('Something went wrong 😪', 'Please try again.');
      console.log(err);
    } finally {
      setClearstate(false);
    }
  };
  const handleCopy = async (msg) => {
    const text = msg.message || msg.text;
  
    if (!text) {
      Alert.alert('Nothing to copy');
      return;
    }
  
    await Clipboard.setStringAsync(text);
    closeDropdown();
  };
  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const renderMessage = (msg) => {
    const repliedTo = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

    return (
      <SwipeableMessage key={msg.id} onSwipe={() => handleReply(msg)}>
        <View
          ref={el => (messageRefs.current[msg.id] = el)}
          style={[s.messageRow, msg.isMine ? s.messageRowSent : s.messageRowReceived]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => openDropdown(msg.id)}
            delayLongPress={350}
            onPress={activeMessageId ? closeDropdown : undefined}
            style={[
              s.bubble,
              msg.isMine ? s.bubbleSent : s.bubbleReceived,
              msg.type === 'image' && s.bubbleImage,
              msg.type === 'audio' && s.bubbleAudio,
              msg.status === 'failed' && s.bubbleFailed,
            ]}
          >
            {repliedTo && (
              <View style={[s.quotedMessage, msg.isMine ? s.quotedSent : s.quotedReceived]}>
                <Text style={[s.quotedAuthor, msg.isMine ? s.quotedAuthorSent : s.quotedAuthorReceived]}>
                  {repliedTo.isMine ? 'You' : recipientName}
                </Text>
                <Text style={[s.quotedText, msg.isMine ? s.quotedTextSent : s.quotedTextReceived]} numberOfLines={1}>
                  {repliedTo.type === 'image' ? '📷 Photo' : repliedTo.type === 'audio' ? '🎤 Voice message' : repliedTo.text}
                </Text>
              </View>
            )}

            {msg.type === 'image' && (
              <TouchableOpacity onPress={() => navigation.navigate('ViewImage', { imagevalue: `${API_BASE_URL}${msg.imageUri}`, mediatype: 'image' })}>
                <Image source={{ uri: `${API_BASE_URL}${msg.imageUri}` }} style={s.chatImage} />
              </TouchableOpacity>
            )}

            {msg.type === 'audio' && <AudioMessage uri={msg.audioUri} isMine={msg.isMine} />}

            {msg.type === 'text' && (
              <Text style={msg.isMine ? s.textSent : s.textReceived}>{msg.text}</Text>
            )}

            <View style={s.metaRow}>
              <Text style={[s.timestamp, msg.isMine ? s.timestampSent : s.timestampReceived]}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {msg.isMine && (
                <Ionicons
                  name={
                    msg.status === 'sending' ? 'time-outline'
                    : msg.status === 'failed' ? 'close-circle-outline'
                    : 'checkmark-done'
                  }
                  size={15}
                  color={
                    msg.status === 'failed' ? colors.danger
                    : msg.status === 'seen' ? colors.accent.indigo
                    : 'rgba(255,255,255,0.45)'
                  }
                />
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
          <Animated.View style={[s.dropdown, {
            opacity: dropdownAnim,
            transform: [{ scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            top: dropdownPosition.y, left: dropdownPosition.x,
          }]}>
            <TouchableOpacity style={[s.dropdownItem, s.dropdownBorder]} onPress={() => handleReply(msg)}>
              <Feather name="corner-up-left" size={15} color={colors.accent.lavender} />
              <Text style={s.dropdownLabel}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
  style={[s.dropdownItem, s.dropdownBorder]}
  onPress={() => handleCopy(msg)}
>
  <Feather
    name="copy"
    size={15}
    color={colors.text.primary}
  />
  <Text style={s.dropdownLabel}>Copy</Text>
</TouchableOpacity>
            {msg.isMine && (
              <TouchableOpacity style={s.dropdownItem} onPress={() => handleDelete(msg.id)}>
                <Feather name="trash-2" size={15} color={colors.danger} />
                <Text style={[s.dropdownLabel, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}
            {!msg.isMine && (
              <TouchableOpacity style={s.dropdownItem} onPress={isBlocked ? handleUnblockUser : handleBlockUser}>
                <Feather name={isBlocked ? 'user-check' : 'user-x'} size={15} color={isBlocked ? colors.online : colors.danger} />
                <Text style={[s.dropdownLabel, { color: isBlocked ? colors.online : colors.danger }]}>
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
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Feather name="chevron-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.headerUser}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Profile', { userId: recipientId })}
        >
          <View style={s.headerAvatarWrap}>
            {recipientImage ? (
              <Image source={{ uri: recipientImage }} style={s.headerAvatar} />
            ) : (
              <LinearGradient colors={colors.gradient.brand} style={s.headerAvatar}>
                <Text style={s.headerAvatarInitials}>{getInitials(recipientName)}</Text>
              </LinearGradient>
            )}
            {isRecipientOnline && <View style={s.onlineDot} />}
          </View>
          <View>
            <Text style={s.headerName}>{recipientName}</Text>
            <Text style={[s.headerStatus, isRecipientOnline && s.headerStatusOnline]}>
              {isTypingIndicatorVisible ? 'typing...' : isRecipientOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={s.headerBtn} onPress={Reportuser}>
            <Feather name="flag" size={18} color={colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={confirmClearChat}>
            <Feather name="trash-2" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {showReport && (
        <Slideupbar
          senderId={myUserId}
          reporthead="User"
          reportedname={recipientName}
          stuffimage={recipientImage}
          onClose={() => setShowReport(false)}
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent.purple} />
            <Text style={s.loadingText}>Loading messages…</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={s.chatBody}
            keyboardDismissMode="interactive"
            onScrollBeginDrag={closeDropdown}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              isNearBottomRef.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100;
            }}
            scrollEventThrottle={100}
          >
            {messages.map(renderMessage)}

            {/* Typing indicator */}
            {isTypingIndicatorVisible && (
              <View style={s.typingWrap}>
                <View style={s.typingBubble}>
                  <View style={s.typingDot} />
                  <View style={[s.typingDot, { opacity: 0.6 }]} />
                  <View style={[s.typingDot, { opacity: 0.3 }]} />
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {renderDropdown()}
        {ToastComponent}

        {isBlocked ? (
          <View style={s.blockedBar}>
            <Feather name="slash" size={14} color={colors.text.muted} />
            <Text style={s.blockedText}>You can't send messages to this person.</Text>
          </View>
        ) : (
          <View style={s.inputArea}>
            {replyingTo && (
              <View style={s.replyBanner}>
                <View style={s.replyAccent} />
                <View style={{ flex: 1 }}>
                  <Text style={s.replyBannerAuthor}>
                    {'Replying to '}{replyingTo.isMine ? 'yourself' : recipientName}
                  </Text>
                  <Text style={s.replyBannerText} numberOfLines={1}>
                    {replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'audio' ? '🎤 Voice message' : replyingTo.text}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            )}

            {isRecording ? (
              <View style={s.recordingBar}>
                <TouchableOpacity onPress={cancelRecording} style={s.recordIconBtn}>
                  <Feather name="trash-2" size={20} color={colors.danger} />
                </TouchableOpacity>
                <View style={s.recordingPulse} />
                <Text style={s.recordingLabel}>{'Recording · '}{formatDuration(recordingDuration)}</Text>
                <TouchableOpacity onPress={stopAndSendRecording} style={s.sendBtn}>
                  <Feather name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.inputRow}>
                <TouchableOpacity style={s.inputIconBtn} onPress={handleImagePicker}>
                  <Feather name="image" size={21} color={colors.accent.lavender} />
                </TouchableOpacity>
                <TextInput
                  style={s.input}
                  placeholder="Message…"
                  value={currentMessage}
                  onChangeText={(t) => { setCurrentMessage(t); emitTyping(); }}
                  placeholderTextColor={colors.text.muted}
                  multiline
                  editable={!isSending}
                />
                {currentMessage.trim() ? (
                  <TouchableOpacity
                    style={[s.sendBtn, isSending && s.sendBtnDisabled]}
                    onPress={handleSendMessage}
                    disabled={isSending}
                  >
                    {isSending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Feather name="send" size={16} color="#fff" />}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.inputIconBtn} onPressIn={startRecording} delayLongPress={200}>
                    <Feather name="mic" size={21} color={colors.accent.lavender} />
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? 42 : 10,
    backgroundColor: colors.bg.screen,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  headerUser: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.pill,
  },
  headerAvatarInitials: { color: '#fff', fontWeight: '800', fontSize: 13 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: colors.online, borderWidth: 2, borderColor: colors.bg.screen,
  },
  headerName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  headerStatus: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  headerStatusOnline: { color: colors.online },

  // ── Chat body ──
  chatBody: { paddingHorizontal: 14, paddingVertical: 16, flexGrow: 1 },

  messageRow: { marginBottom: 4 },
  messageRowSent: { alignItems: 'flex-end' },
  messageRowReceived: { alignItems: 'flex-start' },

  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10 },
  bubbleSent: {
    backgroundColor: colors.accent.purple,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderBottomLeftRadius: 4,
  },
  bubbleImage: { backgroundColor: 'transparent', padding: 0 },
  bubbleAudio: { padding: 4 },
  bubbleFailed: { opacity: 0.55 },

  textSent: { fontSize: 15, color: '#fff', lineHeight: 21 },
  textReceived: { fontSize: 15, color: colors.text.primary, lineHeight: 21 },
  chatImage: { width: 220, height: 280, borderRadius: 14 },

  quotedMessage: { borderRadius: 8, padding: 8, marginBottom: 6, borderLeftWidth: 3 },
  quotedSent: { backgroundColor: 'rgba(0,0,0,0.2)', borderLeftColor: 'rgba(255,255,255,0.5)' },
  quotedReceived: { backgroundColor: colors.bg.pill, borderLeftColor: colors.accent.purple },
  quotedAuthor: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  quotedAuthorSent: { color: 'rgba(255,255,255,0.85)' },
  quotedAuthorReceived: { color: colors.accent.lavender },
  quotedText: { fontSize: 12 },
  quotedTextSent: { color: 'rgba(255,255,255,0.65)' },
  quotedTextReceived: { color: colors.text.muted },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
  timestamp: { fontSize: 10 },
  timestampSent: { color: 'rgba(255,255,255,0.55)' },
  timestampReceived: { color: colors.text.muted },

  // Typing indicator
  typingWrap: { alignItems: 'flex-start', marginBottom: 6, paddingLeft: 4 },
  typingBubble: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: 14, borderBottomLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.accent.lavender,
  },

  // ── Dropdown ──
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.bg.modal,
    borderRadius: radius.md, minWidth: 160, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border.medium,
    zIndex: 999,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  dropdownBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  dropdownLabel: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },

  // ── Input area ──
  inputArea: {
    backgroundColor: colors.bg.screen,
    borderTopWidth: 1, borderTopColor: colors.border.subtle,
  },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.card,
  },
  replyAccent: { width: 3, height: 32, borderRadius: 2, backgroundColor: colors.accent.purple },
  replyBannerAuthor: { fontSize: 11, fontWeight: '700', color: colors.accent.lavender, marginBottom: 2 },
  replyBannerText: { fontSize: 12, color: colors.text.muted },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 10, gap: 8,
  },
  inputIconBtn: { padding: 8, marginBottom: 1 },
  input: {
    flex: 1,
    backgroundColor: colors.bg.input,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15, color: colors.text.primary,
    maxHeight: 110, minHeight: 42,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accent.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 1,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(147,51,234,0.4)' },

  recordingBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  recordIconBtn: { padding: 6 },
  recordingPulse: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.danger,
  },
  recordingLabel: { flex: 1, fontSize: 14, color: colors.text.secondary, fontWeight: '500' },

  blockedBar: {
    height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.screen,
  },
  blockedText: { color: colors.text.muted, fontSize: 14 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: colors.text.muted, fontSize: 14 },
});

export default MessageUser;