import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import BottomNavigator from './BottomNavigator';
import { AuthorContext } from './AuthorContext';
import { useFocusEffect } from '@react-navigation/native';
import socket from './Socket';
import { colors, radius, spacing } from './Theme';

const API_BASE_URL = "http://192.168.0.136:3000";

const Messages = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;

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

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  useEffect(() => {
    if (!myUserId) return;

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
              setConversations(currentConvs =>
                currentConvs.map(conv => {
                  if (conv.other_user_id === otherPersonId && conv.other_user_name === 'Loading...') {
                    return {
                      ...conv,
                      other_user_name: userInfo.name || 'New User',
                      other_user_image_uri: userInfo.image
                        ? `${API_BASE_URL}/uploads/${userInfo.image}`
                        : null,
                    };
                  }
                  return conv;
                })
              );
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

    socket.on('newMessage', handleNewMessage);
    return () => socket.disconnect();
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderConversationItem = ({ item }) => {
    const isMyLastMessage = item.last_message_sender_id === myUserId;
    const isImageMessage = item.last_message_type === 'image';
    const isAudioMessage = item.last_message_type === 'audio';
    const hasUnread = item.unread_count > 0;

    const lastMsgText = isImageMessage
      ? '📷 Photo'
      : isAudioMessage
      ? '🎤 Voice message'
      : item.last_message_text || 'No messages yet.';

    const timeStr = item.last_message_timestamp
      ? new Date(item.last_message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={s.convItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={s.avatarWrap}>
          {item.other_user_image_uri ? (
            <Image
              source={{ uri: `${API_BASE_URL}/uploads/${item.other_user_image_uri}` }}
              style={s.avatar}
            />
          ) : (
            <LinearGradient colors={colors.gradient.brand} style={s.avatar}>
              <Text style={s.avatarInitials}>{getInitials(item.other_user_name)}</Text>
            </LinearGradient>
          )}
          {hasUnread && <View style={s.onlinePip} />}
        </View>

        {/* Content */}
        <View style={s.convContent}>
          <Text style={[s.convName, hasUnread && s.convNameUnread]} numberOfLines={1}>
            {item.other_user_name}
          </Text>
          <Text style={[s.convPreview, hasUnread && s.convPreviewUnread]} numberOfLines={1}>
            {isMyLastMessage ? (
              <Text style={s.youPrefix}>{'You: '}</Text>
            ) : null}
            {lastMsgText}
          </Text>
        </View>

        {/* Time + badge */}
        <View style={s.convMeta}>
          <Text style={[s.convTime, hasUnread && s.convTimeUnread]}>{timeStr}</Text>
          {hasUnread && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{String(item.unread_count)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient blob */}
      <View style={s.blob} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Messages</Text>
          <Text style={s.headerSub}>
            {conversations.length > 0 ? `${conversations.length} conversations` : 'No conversations yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => navigation.navigate('FriendList', { userId: myUserId, type: 'message' })}
          activeOpacity={0.8}
        >
          <Feather name="edit-3" size={18} color={colors.accent.lavender} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={s.body}>
        {isLoadingConversations ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.accent.purple} />
            <Text style={s.centerText}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIconWrap}>
              <Feather name="message-circle" size={32} color={colors.accent.lavender} />
            </View>
            <Text style={s.emptyTitle}>No messages yet</Text>
            <Text style={s.emptySub}>Start a chat to see it here</Text>
            <TouchableOpacity
              style={s.startChatBtn}
              onPress={() => navigation.navigate('FriendList', { userId: myUserId, type: 'message' })}
              activeOpacity={0.85}
            >
              <Feather name="user-plus" size={15} color="#fff" />
              <Text style={s.startChatBtnText}>Find someone to message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.other_user_id.toString()}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },

  blob: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(147,51,234,0.07)', top: -60, right: -60,
    pointerEvents: 'none',
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'android' ? 48 : 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: colors.text.primary, letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12, color: colors.text.muted, marginTop: 2,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 100 },

  // ── Conversation item ──
  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 14, marginBottom: 10,
  },

  avatarWrap: { position: 'relative' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.pill,
  },
  avatarInitials: { color: '#fff', fontWeight: '800', fontSize: 16 },
  onlinePip: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.online,
    borderWidth: 2, borderColor: colors.bg.screen,
  },

  convContent: { flex: 1, gap: 3 },
  convName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  convNameUnread: { fontWeight: '800', color: colors.text.primary },
  convPreview: { fontSize: 13, color: colors.text.muted },
  convPreviewUnread: { color: colors.text.secondary, fontWeight: '500' },
  youPrefix: { color: colors.accent.lavender, fontWeight: '600' },

  convMeta: { alignItems: 'flex-end', gap: 6 },
  convTime: { fontSize: 11, color: colors.text.muted },
  convTimeUnread: { color: colors.accent.lavender, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: colors.accent.purple,
    borderRadius: radius.full,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Empty / Loading ──
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  centerText: { marginTop: 12, fontSize: 14, color: colors.text.muted },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(147,51,234,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.text.muted, marginBottom: 24 },
  startChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent.purple,
    borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 20,
  },
  startChatBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default Messages;