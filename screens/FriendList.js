import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthorContext } from './AuthorContext';
import { colors, radius, spacing } from './Theme';

const API_BASE_URL = "http://192.168.0.136:3000";

// ── Single friend row — outside component to avoid recreation ──
function FriendRow({ friend, onPress, onFollowToggle, isFollowingThem }) {
  const [following, setFollowing] = useState(isFollowingThem);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (loading) return;
    const next = !following;
    setFollowing(next);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${next ? 'follow' : 'unfollow'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiver_id: friend.id }),
      });
      if (!res.ok) setFollowing(!next); // rollback on failure
    } catch {
      setFollowing(!next);
    } finally {
      setLoading(false);
    }
  };

  const initials = friend.FULLNAME
    ? friend.FULLNAME.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => onPress}
      activeOpacity={0.65}
    >
      {/* Avatar */}
      {friend.image ? (
        <Image
          source={{ uri: `${API_BASE_URL}${friend.image}` }}
          style={s.avatar}
        />
      ) : (
        <LinearGradient colors={['#9333ea', '#6366f1']} style={s.avatar}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </LinearGradient>
      )}

      {/* Name + handle */}
      <View style={s.nameWrap}>
        <Text style={s.name} numberOfLines={1}>{friend.FULLNAME || friend.name}</Text>
        <Text style={s.handle} numberOfLines={1}>
          {friend.username ? `@${friend.username}` : friend.email}
        </Text>
      </View>

      {/* Follow button */}
      <TouchableOpacity
        style={[s.followBtn, following && s.followingBtn]}
        onPress={handleFollow}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={following ? colors.accent.lavender : '#fff'} />
        ) : (
          <Text style={[s.followBtnText, following && s.followingBtnText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Empty state ──
function EmptyState({ tab }) {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyEmoji}>{tab === 'following' ? '🔍' : '👥'}</Text>
      <Text style={s.emptyTitle}>
        {tab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
      </Text>
      <Text style={s.emptyDesc}>
        {tab === 'following'
          ? 'When they follow people, they\'ll appear here.'
          : 'When people follow this account, they\'ll appear here.'}
      </Text>
    </View>
  );
}

// ── Main screen ──
export default function FriendList({ navigation, route }) {
  const { userId,type } = route.params || {};
  const { user } = useContext(AuthorContext);
  const loggedInUserId = user?.id;

  const [activeTab, setActiveTab] = useState('following');
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (tab) => {
    if (!userId) return;
    setLoading(true);
    try {
      const endpoint = tab === 'following'
        ? `${API_BASE_URL}/users/${userId}/following`
        : `${API_BASE_URL}/users/${userId}/followers`;

      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();

      if (tab === 'following') setFollowing(data);
      else setFollowers(data);
    } catch (err) {
      console.warn('FriendList fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData('following');
      fetchData('followers');
    }, [fetchData])
  );

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const currentList = activeTab === 'following' ? following : followers;

  const renderItem = useCallback(({ item }) => {

    const toggleNavigate = () => {
  
      if (type === 'message') {
  
        navigation.navigate('MessageUser', {
          recipientId: item.id,
          recipientName: item.FULLNAME,
          recipientImage: item.image,
        });
  
      } else if (type === 'profile') {
  
        navigation.navigate('Profile', {
          userId: item.id,
        });
  
      }
  
    };
  
    return (
      <FriendRow
        friend={item}
        isFollowingThem={Boolean(item.isFollowing)}
        onPress={toggleNavigate}
      />
    );
  
  }, [navigation, type]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        {/* BUG FIX: centered title without position hack */}
        <Text style={s.headerTitle}>Friends</Text>
        <View style={{ width: 38 }} />
      </View>

      <LinearGradient
        colors={['transparent', '#9333ea', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      {/* Tabs */}
      <View style={s.tabRow}>
        {['following', 'followers'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => switchTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {/* Count badge */}
            <View style={[s.countBadge, activeTab === tab && s.countBadgeActive]}>
              <Text style={[s.countText, activeTab === tab && s.countTextActive]}>
                {tab === 'following' ? following.length : followers.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.accent.purple} />
          <Text style={s.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          // BUG FIX: key is friend.id not index
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  blobTR: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(147,51,234,0.07)', top: -60, right: -60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  // BUG FIX: clean centered title — no position hack
  headerTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text.primary,
  },
  headerDivider: { height: 1, marginBottom: 8 },

  // ── Tabs ──
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  tabActive: {
    backgroundColor: 'rgba(147,51,234,0.12)',
    borderColor: 'rgba(147,51,234,0.3)',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text.muted },
  tabTextActive: { color: '#c084fc' },
  countBadge: {
    backgroundColor: colors.bg.screen,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(147,51,234,0.2)',
    borderColor: 'rgba(147,51,234,0.3)',
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.text.muted },
  countTextActive: { color: '#c084fc' },

  // ── List ──
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: colors.border.subtle },

  // ── Friend row ──
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitials: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nameWrap: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  handle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  // ── Follow button ──
  followBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent.purple,
    minWidth: 80, alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.35)',
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  followingBtnText: { color: colors.accent.lavender },

  // ── Loading ──
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: colors.text.muted },

  // ── Empty state ──
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: colors.text.muted, textAlign: 'center', lineHeight: 18 },
});