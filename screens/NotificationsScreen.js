import React, { useState, useCallback, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Alert, Animated, SafeAreaView,
  PanResponder, StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import BottomNavigator from './BottomNavigator';
import socket from './Socket';
import { AuthorContext } from './AuthorContext';

const API_BASE_URL = 'http://192.168.0.136:3000';

const TYPES = {
  FOLLOW:  'follow',
  LIKE:    'like',
  COMMENT: 'comment',
  ANON:    'anon',
};

const formatTimeAgo = (time) => {
  if (!time) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(time)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ─────────────────────────────────────────
// Single notification row
// ─────────────────────────────────────────
const NotificationItem = React.memo(function NotificationItem({
  notification, onFollowPress, onDelete, navigation,
}) {
  const { id, sender_name, sender_image, message, created_at, type, sender_id } = notification;

  const slideAnim = useRef(new Animated.Value(0)).current;
  // FIX: track whether delete bg is showing — only reveal on actual swipe
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && g.dx > 0,
    onPanResponderMove: (_, g) => {
      if (g.dx > 0) {
        const val = Math.min(g.dx, 120);
        slideAnim.setValue(val);
        // FIX: fade in the delete bg proportionally as user swipes
        deleteOpacity.setValue(val / 80);
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 70) {
        Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true })
          .start(() => onDelete(id));
      } else {
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
          Animated.timing(deleteOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    },
  })).current;

  const goToProfile = () => {
    if (sender_id) navigation.navigate('Profile', { userId: sender_id });
  };

  const typeConfig = {
    [TYPES.FOLLOW]:  { icon: 'user-plus',      color: '#9333ea', bg: 'rgba(147,51,234,0.12)' },
    [TYPES.LIKE]:    { icon: 'heart',           color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
    [TYPES.COMMENT]: { icon: 'message-circle',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
    [TYPES.ANON]:    { icon: 'shield-off',      color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  };
  const config = typeConfig[type] ?? { icon: 'bell', color: '#9333ea', bg: 'rgba(147,51,234,0.12)' };

  const renderBody = () => {
    switch (type) {
      case TYPES.FOLLOW:
        return (
          <View style={{ gap: 6 }}>
            <Text style={s.messageText}>
              <Text style={s.senderName} onPress={goToProfile}>{sender_name}</Text>
              {' '}followed you.
            </Text>
            <TouchableOpacity style={s.followBtn} onPress={() => onFollowPress(sender_id)}>
              <Text style={s.followBtnText}>Follow back</Text>
            </TouchableOpacity>
          </View>
        );
      case TYPES.LIKE:
        return (
          <Text style={s.messageText}>
            <Text style={s.senderName} onPress={goToProfile}>{sender_name}</Text>
            {' '}liked your post.
          </Text>
        );
      case TYPES.COMMENT:
        return (
          <Text style={s.messageText}>
            <Text style={s.senderName} onPress={goToProfile}>{sender_name}</Text>
            {' '}commented on your post.
          </Text>
        );
      case TYPES.ANON:
        return <Text style={s.messageText}>{message}</Text>;
      default:
        return (
          <Text style={s.messageText}>
            {sender_name && (
              <Text style={s.senderName} onPress={goToProfile}>{sender_name} </Text>
            )}
            {message}
          </Text>
        );
    }
  };

  return (
    <View style={s.rowShell}>
      {/* FIX: delete bg is invisible until swipe begins — controlled by deleteOpacity */}
      <Animated.View style={[s.deleteReveal, { opacity: deleteOpacity }]}>
        <Feather name="trash-2" size={17} color="#fff" />
        <Text style={s.deleteLabel}>Delete</Text>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[s.rowCard, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Left: type icon */}
        <View style={[s.typeIcon, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={16} color={config.color} />
        </View>

        {/* Avatar */}
        <TouchableOpacity onPress={goToProfile} activeOpacity={0.85}>
          {sender_image ? (
            <Image
              source={{ uri: `${API_BASE_URL}/uploads/${sender_image}` }}
              style={s.avatar}
            />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: config.bg }]}>
              <Feather name={config.icon} size={17} color={config.color} />
            </View>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={s.content}>
          {renderBody()}
          <Text style={s.timestamp}>{formatTimeAgo(created_at)}</Text>
        </View>
      </Animated.View>
    </View>
  );
});

// ─────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────
export default function NotificationScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthorContext);
  const loggedInUserId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-as-read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Mark as read error:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      markAsRead();

      const onNewNotif = (notif) => setNotifications((prev) => [notif, ...prev]);
      const onDeleted = ({ deletedId }) =>
        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));

      socket.on('newNotification', onNewNotif);
      socket.on('UpdateAfterdeletenotication', onDeleted);

      return () => {
        socket.off('newNotification', onNewNotif);
        socket.off('UpdateAfterdeletenotication', onDeleted);
      };
    }, [fetchNotifications, markAsRead])
  );

  useFocusEffect(
    useCallback(() => {
      if (loggedInUserId) socket.emit('registerUser', loggedInUserId);
    }, [loggedInUserId])
  );

  const handleDelete = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`${API_BASE_URL}/deletesinglenotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notid: id }),
      });
      if (!res.ok) {
        // re-fetch to restore if server failed
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearAll = () => {
    Alert.alert(
      'Clear all notifications',
      'This will remove all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all', style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                method: 'POST', credentials: 'include',
              });
              if (!res.ok) { Alert.alert('Error', 'Failed to clear notifications.'); return; }
              setNotifications([]);
            } catch {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          },
        },
      ]
    );
  };

  const handleFollowBack = async (targetUserId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/follow`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to follow back');
      Alert.alert('Done', 'Followed back!');
      fetchNotifications();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = useCallback(({ item }) => (
    <NotificationItem
      notification={item}
      onFollowPress={handleFollowBack}
      onDelete={handleDelete}
      navigation={navigation}
    />
  ), [handleDelete, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={s.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.centered}>
          <Text style={s.emptyEmoji}>😕</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchNotifications}>
            <Text style={s.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      {/* Ambient blobs */}
      <View style={s.blobTR} pointerEvents="none" />
      <View style={s.blobBL} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <Text style={s.headerSub}>{notifications.length} alert{notifications.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={clearAll} activeOpacity={0.8}>
            <Feather name="trash-2" size={15} color="#f87171" />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <LinearGradient
        colors={['transparent', 'rgba(147,51,234,0.5)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.divider}
      />

      {/* Swipe hint */}
      {notifications.length > 0 && (
        <View style={s.hintRow}>
          <Feather name="arrow-right" size={10} color="rgba(255,255,255,0.18)" />
          <Text style={s.hintText}>Swipe right to dismiss</Text>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyEmoji}>🔔</Text>
          <Text style={s.emptyTitle}>All caught up</Text>
          <Text style={s.emptyDesc}>No notifications yet. Check back later.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Styles — no Theme.js dependencies
// ─────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a12' },

  blobTR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(147,51,234,0.07)', top: -80, right: -80,
  },
  blobBL: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(99,102,241,0.05)', bottom: 100, left: -60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  divider: { height: 1, marginBottom: 6 },
  clearBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hint ──
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 20, marginBottom: 10,
  },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.18)' },

  list: { paddingHorizontal: 16, paddingBottom: 110 },

  // ── Row shell & swipe ──
  rowShell: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteReveal: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    gap: 8,
    borderRadius: 16,
  },
  deleteLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Card ──
  rowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#13111f',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 14,
  },

  typeIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21, flexShrink: 0,
  },
  avatarFallback: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  content: { flex: 1 },
  messageText: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19,
  },
  senderName: {
    fontWeight: '700', color: '#c084fc',
  },
  timestamp: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5,
  },

  // ── Follow back ──
  followBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#c084fc' },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  emptyEmoji: { fontSize: 44, marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  emptyDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', paddingHorizontal: 40, lineHeight: 19,
  },
  errorText: {
    fontSize: 14, color: '#f87171', textAlign: 'center', paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
    borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#c084fc' },
});