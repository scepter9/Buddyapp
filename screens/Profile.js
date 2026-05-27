import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigator from './BottomNavigator';
import { colors, radius, spacing } from './Theme';

const API_BASE_URL = "http://192.168.0.136:3000";

// ── Stat pill ──
function StatItem({ count, label }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statCount}>{count ?? 0}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Info row ──
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Feather name={icon} size={15} color={colors.accent.lavender} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function Profile({ navigation, route }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

  const isViewingOwnProfile = userProfile?.id === loggedInUserId;

  const fetchProfileData = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const authRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!authRes.ok) {
        navigation.replace('Login');
        return;
      }

      const authData = await authRes.json();
      setLoggedInUserId(authData.id);

      const targetId = route.params?.userId || authData.id;
      console.log(targetId);

      const profileRes = await fetch(`${API_BASE_URL}/users/${targetId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!profileRes.ok) throw new Error('Profile not found.');
      const profileData = await profileRes.json();
      setUserProfile(profileData);

      if (targetId !== authData.id) {
        const followRes = await fetch(`${API_BASE_URL}/check-follow/${targetId}`, {
          credentials: 'include',
        });
        if (followRes.ok) {
          const followData = await followRes.json();
          setIsFollowing(followData.isFollowing);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [route.params?.userId, navigation]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchProfileData);
    return unsub;
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (isViewingOwnProfile || isFollowActionLoading) return;
    setIsFollowActionLoading(true);
    const endpoint = isFollowing ? 'unfollow' : 'follow';
    try {
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiver_id: userProfile?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setUserProfile(prev => ({
          ...prev,
          followers: isFollowing
            ? Math.max(0, (prev.followers ?? 0) - 1)
            : (prev.followers ?? 0) + 1,
        }));
      } else {
        Alert.alert('Failed', data.error || `Could not ${endpoint}.`);
      }
    } catch {
      Alert.alert('Network error', `Could not reach server.`);
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const infoRows = useMemo(() => [
    { icon: 'book', label: 'University', value: userProfile?.university },
    { icon: 'info', label: 'Bio', value: userProfile?.about },
  ], [userProfile]);

  const interestColors = ['#9333ea', '#6366f1', '#0284c7', '#db2777', '#16a34a', '#d97706'];

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (isLoadingProfile || !userProfile) {
    return (
      <View style={s.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.accent.purple} />
        <Text style={s.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const imageUri = userProfile.image
    ? { uri: `${API_BASE_URL}/uploads/${userProfile.image}` }
    : null;

  const handle = userProfile.email?.split('@')[0] || 'user';
 
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      {/* Ambient blob */}
      <View style={s.blob} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero section ── */}
        <View style={s.hero}>
          {/* Back button if viewing someone else */}
          {!isViewingOwnProfile && (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          )}

          {/* Avatar */}
          <TouchableOpacity onPress={!isViewingOwnProfile ?() => navigation.navigate('ViewImage', { imagevalue: `${API_BASE_URL}/uploads/${userProfile.image}`, mediatype: 'image' }):null}>
          <View style={s.avatarWrap}>
            <LinearGradient
              colors={['#9333ea', '#6366f1']}
              style={s.avatarRing}
            >
              <View style={s.avatarInner}>
                {imageUri ? (
                  <Image source={imageUri} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarInitials}>{initials}</Text>
                )}
              </View>
            </LinearGradient>
            {isViewingOwnProfile && (
              <TouchableOpacity
                style={s.editAvatarBtn}
                onPress={() => navigation.navigate('Editprofile', {
                  userId: userProfile.id,
                  currentProfile: userProfile,
                })}
              >
                <Feather name="camera" size={13} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          </TouchableOpacity>
         

          {/* Name + handle */}
          <View style={s.nameRow}>
            <Text style={s.name}>{userProfile.name}</Text>
            {userProfile.isPro && (
              <View style={s.proBadge}>
                <Text style={s.proText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={s.handle}>@{handle}</Text>

          {userProfile.joinDate && (
            <View style={s.joinRow}>
              <Feather name="calendar" size={11} color={colors.text.muted} />
              <Text style={s.joinText}>Joined {userProfile.joinDate}</Text>
            </View>
          )}
        </View>

        {/* ── Stats ── */}
    {/* ── Stats ── */}
<TouchableOpacity
  style={s.statsRow}
  onPress={() => navigation.navigate('FriendList', { userId: userProfile.id, type: 'profile' })}
  activeOpacity={0.8}
>
  <StatItem count={userProfile.following} label="Following" />
  <View style={s.statDivider} />
  <StatItem count={userProfile.followers} label="Followers" />
  <Feather name="chevron-right" size={14} color={colors.text.muted} style={{ marginLeft: 'auto', paddingRight: 4 }} />
</TouchableOpacity>

        {/* ── Info rows ── */}
        <View style={s.card}>
          {infoRows.map((row, i) => (
            <React.Fragment key={row.label}>
              <InfoRow {...row} />
              {i < infoRows.length - 1 && <View style={s.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Interests ── */}
        {userProfile.interests?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Interests</Text>
            <View style={s.interestWrap}>
              {userProfile.interests.map((interest, i) => (
                <View
                  key={i}
                  style={[
                    s.interestPill,
                    { backgroundColor: `${interestColors[i % interestColors.length]}22`,
                      borderColor: `${interestColors[i % interestColors.length]}55` }
                  ]}
                >
                  <Text style={[s.interestText, { color: interestColors[i % interestColors.length] }]}>
                    {interest}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Actions ── */}
        {isViewingOwnProfile ? (
          <View style={s.actionsWrap}>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => navigation.navigate('Editprofile', {
                userId: userProfile.id,
                currentProfile: userProfile,
              })}
              activeOpacity={0.85}
            >
              <Feather name="edit-2" size={15} color="#fff" />
              <Text style={s.primaryBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.navigate('UserSearch')}
              activeOpacity={0.85}
            >
              <Feather name="user-plus" size={15} color={colors.accent.lavender} />
              <Text style={s.secondaryBtnText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.actionsWrap}>
            <TouchableOpacity
              style={[s.primaryBtn, isFollowing && s.unfollowBtn]}
              onPress={handleFollowToggle}
              disabled={isFollowActionLoading}
              activeOpacity={0.85}
            >
              {isFollowActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather
                    name={isFollowing ? 'user-minus' : 'user-plus'}
                    size={15}
                    color="#fff"
                  />
                  <Text style={s.primaryBtnText}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.navigate('MessageUser', {
                recipientId: userProfile.id,
                recipientName: userProfile.name,
                recipientImage: `${API_BASE_URL}/uploads/${userProfile.image}`,
              })}
              activeOpacity={0.85}
            >
              <Feather name="mail" size={15} color={colors.accent.lavender} />
              <Text style={s.secondaryBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  loading: {
    flex: 1, backgroundColor: colors.bg.screen,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.text.muted },
  blob: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(147,51,234,0.08)', top: -80, right: -80,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 20 },

  // ── Hero ──
  hero: { alignItems: 'center', marginBottom: 20 },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    width: 96, height:96, borderRadius: 48,
    padding: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: colors.bg.screen,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '700' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent.purple,
    borderWidth: 2, borderColor: colors.bg.screen,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
  proBadge: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  proText: { color: '#fbbf24', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  handle: { fontSize: 13, color: colors.text.muted, marginBottom: 8 },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  joinText: { fontSize: 11, color: colors.text.muted },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 16, marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: 20, fontWeight: '800', color: colors.text.primary },
  statLabel: { fontSize: 11, color: colors.text.muted, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border.subtle },

  // ── Card ──
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 16, marginBottom: 14,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: colors.text.secondary, marginBottom: 12,
  },
  rowDivider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: 10 },

  // ── Info rows ──
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(147,51,234,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoLabel: { fontSize: 10, color: colors.text.muted, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, color: colors.text.primary, fontWeight: '500', lineHeight: 18 },

  // ── Interests ──
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: radius.full, borderWidth: 1,
  },
  interestText: { fontSize: 12, fontWeight: '600' },

  // ── Actions ──
  actionsWrap: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: colors.accent.purple,
    borderRadius: radius.lg, paddingVertical: 13,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  unfollowBtn: { backgroundColor: 'rgba(239,68,68,0.8)' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)',
    borderRadius: radius.lg, paddingVertical: 13,
  },
  secondaryBtnText: { color: colors.accent.lavender, fontWeight: '700', fontSize: 14 },
});