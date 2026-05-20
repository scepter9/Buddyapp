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
import { colors, radius, spacing } from './Theme';

const API_BASE_URL = 'http://192.168.0.136:3000';

// BUG FIX: added LIKE and COMMENT which were missing — LIKE was used in switch but not defined
const TYPES = {
  FOLLOW:  'follow',
  LIKE:    'like',
  COMMENT: 'comment',
  ANON:    'anon',
};

// BUG FIX: formatTimeAgo was called but never defined anywhere — defined here
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


  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && g.dx > 0,
    onPanResponderMove: (_, g) => {
      if (g.dx > 0) slideAnim.setValue(Math.min(g.dx, 120));
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 60) {
        Animated.timing(slideAnim, { toValue: 150, duration: 200, useNativeDriver: true })
          .start(() => onDelete(id));
      } else {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const goToProfile = () => {
    if (sender_id) navigation.navigate('Profile', { userId: sender_id });
  };

  // Icon and accent color per type
  const typeConfig = {
    [TYPES.FOLLOW]:  { icon: 'user-plus', color: '#9333ea' },
    [TYPES.LIKE]:    { icon: 'heart',     color: '#f43f5e' },
    [TYPES.COMMENT]: { icon: 'message-circle', color: '#0284c7' },
    [TYPES.ANON]:    { icon: 'shield-off', color: '#6366f1' },
  };
  const config = typeConfig[type] ?? { icon: 'bell', color: colors.accent.purple };

  const renderBody = () => {
    switch (type) {
      case TYPES.FOLLOW:
        return (
          <View style={s.followRow}>
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
        // System notification — no sender
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
      {/* Delete reveal */}
      <View style={s.deleteReveal}>
        <Feather name="trash-2" size={16} color="#fff" />
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[s.rowCard, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Type icon */}
        <View style={[s.typeIcon, { backgroundColor: `${config.color}22` }]}>
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
            <View style={[s.avatarFallback, { backgroundColor: `${config.color}33` }]}>
              <Feather name={config.icon} size={18} color={config.color} />
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
  const [disabledRequests, setDisabledRequests] = useState({});

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

      // BUG FIX: only add NEW listeners here — no socket.disconnect() in cleanup
      // socket.disconnect() would kill the shared socket for the whole app
      const onNewNotif = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };

      // BUG FIX: backend now emits { deletedId } — use that to filter locally
      const onDeleted = ({ deletedId }) => {
        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
      };

      socket.on('newNotification', onNewNotif);
      socket.on('UpdateAfterdeletenotication', onDeleted);

      return () => {
        socket.off('newNotification', onNewNotif);
        socket.off('UpdateAfterdeletenotication', onDeleted);
        // do NOT call socket.disconnect() here
      };
    }, [fetchNotifications, markAsRead])
  );

  // Register user room for targeted socket events
  useFocusEffect(
    useCallback(() => {
      if (loggedInUserId) {
        socket.emit('registerUser', loggedInUserId);
      }
    }, [loggedInUserId])
  );

  // ── Delete single ──
  const handleDelete = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/deletesinglenotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notid: id }),
      });
      if (!res.ok) {
        Alert.alert('Error', 'Could not delete notification.');
        return;
      }
      // BUG FIX: was missing return in setNotifications callback — state never updated
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Could not delete notification.');
    }
  }, []);

  // ── Clear all ──
  const clearAll = async () => {
    Alert.alert(
      'Clear all notifications',
      'This will remove all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                method: 'POST',
                credentials: 'include',
              });
              if (!res.ok) {
                Alert.alert('Error', 'Failed to clear notifications.');
                return;
              }
              setNotifications([]);
            } catch {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          },
        },
      ]
    );
  };

  // ── Follow back ──
  const handleFollowBack = async (targetUserId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to follow back');
      Alert.alert('Done', 'Followed back successfully!');
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
          <ActivityIndicator size="large" color={colors.accent.purple} />
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
          <Text style={s.errorEmoji}>😕</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchNotifications}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <Text style={s.headerSub}>{notifications.length} total</Text>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={clearAll}>
            <Feather name="trash-2" size={16} color="#f87171" />
          </TouchableOpacity>
        )}
      </View>

      <LinearGradient
        colors={['transparent', '#9333ea', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      {/* Hint */}
      <View style={s.swipeHint}>
        <Feather name="arrow-right" size={11} color="rgba(255,255,255,0.2)" />
        <Text style={s.swipeHintText}>Swipe right to dismiss</Text>
      </View>

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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  blobTR: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(147,51,234,0.08)', top: -60, right: -60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 18, paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text.primary },
  headerSub: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  headerDivider: { height: 1, marginBottom: 8 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Swipe hint ──
  swipeHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.lg, marginBottom: 8,
  },
  swipeHintText: { fontSize: 11, color: 'rgba(255,255,255,0.2)' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  // ── Row ──
  rowShell: { position: 'relative', marginBottom: 10 },
  deleteReveal: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 72,
    backgroundColor: '#ef4444', borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 14,
  },
  typeIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    flexShrink: 0,
  },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { flex: 1 },
  messageText: { fontSize: 13, color: colors.text.primary, lineHeight: 18 },
  senderName: { fontWeight: '700', color: colors.accent.lavender },
  timestamp: { fontSize: 11, color: colors.text.muted, marginTop: 4 },

  // ── Follow back ──
  followRow: { gap: 6 },
  followBtn: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6,
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#c084fc' },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: colors.text.muted },
  errorEmoji: { fontSize: 36, marginBottom: 4 },
  errorText: { fontSize: 14, color: '#f87171', textAlign: 'center', paddingHorizontal: 40 },
  retryBtn: {
    marginTop: 8, backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
    borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 10,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#c084fc' },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  emptyDesc: { fontSize: 13, color: colors.text.muted, textAlign: 'center', paddingHorizontal: 40 },
});