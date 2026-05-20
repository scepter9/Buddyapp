import React, {
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { AuthorContext } from '../AuthorContext';
import BottomNavigator from '../BottomNavigator';
import { colors, radius, spacing } from '../Theme';

const API_BASE_URL = 'http://192.168.0.136:3000';


function PasscodeModal({ visible, onClose, onSubmit, error }) {
  const [passcode, setPasscode] = useState('');

  const handleSubmit = () => {
    onSubmit(passcode);
    setPasscode('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={m.overlay}>
        <View style={m.box}>
          <LinearGradient
            colors={['rgba(147,51,234,0.15)', 'rgba(99,102,241,0.08)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={m.iconWrap}>
            <Feather name="lock" size={22} color="#c084fc" />
          </View>
          <Text style={m.title}>Private Room</Text>
          <Text style={m.sub}>Enter the passcode to join</Text>

          <TextInput
            style={[m.input, error && m.inputError]}
            value={passcode}
            onChangeText={setPasscode}
            placeholder="Passcode"
            placeholderTextColor="rgba(255,255,255,0.2)"
            secureTextEntry
            autoFocus
          />
          {error && (
            <Text style={m.errorText}>Incorrect passcode. Try again.</Text>
          )}

          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={m.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9333ea', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={m.submitGrad}
              >
                <Text style={m.submitText}>Join</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  box: {
    width: '100%',
    backgroundColor: '#13111f',
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147,51,234,0.25)',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text.primary, marginBottom: 4 },
  sub: { fontSize: 12, color: colors.text.muted, marginBottom: 18 },
  input: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text.primary, fontSize: 15, marginBottom: 8,
    letterSpacing: 2,
  },
  inputError: { borderColor: 'rgba(239,68,68,0.5)' },
  errorText: { fontSize: 12, color: '#f87171', marginBottom: 8, alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  submitBtn: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  submitGrad: { paddingVertical: 13, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});


const RoomCard = React.memo(function RoomCard({ item, navigation, isJoined }) {
  const { user } = useContext(AuthorContext);
  const sender = user?.id;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);

  // Fetch member avatars
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/imagefromusers?roomidforimage=${item.id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setRoomUsers(data);
      } catch (err) {
        // BUG FIX: don't throw inside useEffect — silent fail is fine here
        console.warn('RoomCard avatar fetch:', err.message);
      }
    };
    fetchUsers();
  }, [item.id]);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();

  const navigateToRoom = () => {
    navigation.navigate('DesignersHubScreen', {
      roomid: item.id,
      roomname: item.roomname,
      roomcreator: item.creatorid,
    });
  };

  const checkPassword = async (passcode) => {
    if (!passcode.trim()) {
      Alert.alert('Enter passcode', 'Please type the passcode first.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/join-private-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId: item.id, userId: sender, passcode }),
      });
      if (!res.ok) {
        setPasscodeError(true);
        return;
      }
      setPasscodeError(false);
      setModalVisible(false);
      navigateToRoom();
    } catch (err) {
      console.warn('Private room join error:', err.message);
    }
  };

  const handlePress = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/checkroommembers?userid=${sender}&room_id=${item.id}`
      );
      if (!res.ok) return;
      const alreadyJoined = await res.json();

      if (alreadyJoined) {
        navigateToRoom();
        return;
      }

      if (item.selectmode === 'public') {
        const joinRes = await fetch(`${API_BASE_URL}/postroommembers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomid: item.id, userid: sender }),
        });
        if (!joinRes.ok) return;
        navigateToRoom();
        return;
      }

      if (item.selectmode === 'private') {
        setPasscodeError(false);
        setModalVisible(true);
      }
    } catch (err) {
      console.warn('handlePress error:', err.message);
    }
  };

  const isPrivate = item.selectmode === 'private';

  return (
    <>
      <PasscodeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={checkPassword}
        error={passcodeError}
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={[s.roomCard, isJoined && s.roomCardJoined]}
        >
          {/* Room type accent line */}
          <LinearGradient
            colors={isJoined ? ['#34d399', 'transparent'] : ['#9333ea', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.roomAccent}
          />

          {/* Top row */}
          <View style={s.roomTop}>
            <View style={s.roomIconWrap}>
              {item.icon ? (
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              ) : (
                <Feather name="hash" size={20} color={colors.accent.lavender} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.roomNameRow}>
                <Text style={s.roomName} numberOfLines={1}>
                  {item.roomname}
                </Text>
                {isPrivate && (
                  <View style={s.privateBadge}>
                    <Feather name="lock" size={9} color="#fbbf24" />
                    <Text style={s.privateBadgeText}>PRIVATE</Text>
                  </View>
                )}
              </View>
              <Text style={s.roomType}>{item.selecttype}</Text>
            </View>

            {/* Join / View button */}
            <TouchableOpacity
              style={[s.joinBtn, isJoined && s.viewBtn]}
              onPress={handlePress}
              activeOpacity={0.85}
            >
              <Text style={[s.joinText, isJoined && s.viewText]}>
                {isJoined ? 'View' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {item.roomdescription ? (
            <Text style={s.roomDesc} numberOfLines={2}>
              {item.roomdescription}
            </Text>
          ) : null}

          {/* Footer — member avatars + count */}
          <View style={s.roomFooter}>
            {/* Stacked avatars */}
            <View style={s.avatarStack}>
              {roomUsers.slice(0, 4).map((u, i) => (
                <View
                  key={i}
                  style={[s.avatarItem, { marginLeft: i === 0 ? 0 : -10 }]}
                >
                  <Image
                    source={{ uri: `${API_BASE_URL}${u.image}` }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
              ))}
            </View>
            <Text style={s.memberCount}>
              {item.members_count ?? 0} member{item.members_count !== 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
});

// ─────────────────────────────────────────
// Section header
// ─────────────────────────────────────────
function SectionHeader({ label, sub }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionDot} />
      <Text style={s.sectionLabel}>{label}</Text>
      {sub && <Text style={s.sectionSub}>{sub}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────
export default function InterestRoom({ navigation }) {
  const { user } = useContext(AuthorContext);
  const sender = user?.id;

  const [activeRooms, setActiveRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // BUG FIX: precompute joined room IDs as a Set — O(1) lookup per card
  const joinedRoomIds = useMemo(
    () => new Set(joinedRooms.map(r => r.id)),
    [joinedRooms]
  );

  // BUG FIX: merged both useFocusEffect calls into one
  useFocusEffect(
    useCallback(() => {
      const fetchAll = async () => {
        setLoading(true);
        try {
          const [activeRes, joinedRes] = await Promise.all([
            fetch(`${API_BASE_URL}/getactiverooms`),
            fetch(`${API_BASE_URL}/getjoinroom?yourid=${sender}`),
          ]);

          if (activeRes.ok) {
            const data = await activeRes.json();
            setActiveRooms(data);
          }
          if (joinedRes.ok) {
            const data = await joinedRes.json();
            setJoinedRooms(data);
          }
        } catch (err) {
          console.warn('InterestRoom fetch error:', err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }, [sender])
  );

  // Search with debounce
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/searchinterestroom?search=${searchQuery.trim()}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.warn('Search error:', err.message);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      <View style={s.blobTR} pointerEvents="none" />
      <View style={s.blobBL} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <LinearGradient colors={['#9333ea', '#6366f1']} style={s.headerIcon}>
            <Feather name="radio" size={16} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={s.headerTitle}>Mission Control</Text>
            <Text style={s.headerSub}>Interest Rooms</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('CreateRoomScreen')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#c084fc" />
          <Text style={s.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['transparent', '#9333ea', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Search bar ── */}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={s.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Find rooms..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            returnKeyType="search"
          />
          {/* BUG FIX: replaced Text 'loading rooms....' with ActivityIndicator */}
          {searching ? (
            <ActivityIndicator size="small" color={colors.accent.lavender} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={15} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Search results ── */}
        {isSearching && (
          <View style={s.section}>
            {searchResults.length === 0 && !searching ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🔍</Text>
                <Text style={s.emptyText}>No rooms found for "{searchQuery}"</Text>
              </View>
            ) : (
              // BUG FIX: replaced FlatList inside ScrollView with .map()
              searchResults.map(item => (
                <RoomCard
                  key={`search-${item.id}`}
                  item={item}
                  navigation={navigation}
                  isJoined={joinedRoomIds.has(item.id)}
                />
              ))
            )}
          </View>
        )}

        {!isSearching && (
          <>
            {/* ── Joined rooms ── */}
            {joinedRooms.length > 0 && (
              <View style={s.section}>
                <SectionHeader label="YOUR ROOMS" sub="Quick access" />
                {/* BUG FIX: .map() instead of FlatList inside ScrollView */}
                {joinedRooms.map(item => (
                  <RoomCard
                    key={`joined-${item.id}`}
                    item={item}
                    navigation={navigation}
                    isJoined
                  />
                ))}
              </View>
            )}

            {/* ── Active communities ── */}
            <View style={s.section}>
              <SectionHeader label="ACTIVE COMMUNITIES" sub="Discover" />
              {loading ? (
                <View style={s.loadingWrap}>
                  <ActivityIndicator color={colors.accent.purple} />
                  <Text style={s.loadingText}>Loading rooms...</Text>
                </View>
              ) : activeRooms.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>🏠</Text>
                  <Text style={s.emptyText}>No active rooms yet</Text>
                  <TouchableOpacity
                    style={s.emptyAction}
                    onPress={() => navigation.navigate('CreateRoomScreen')}
                  >
                    <Text style={s.emptyActionText}>Create the first one</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeRooms.map(item => (
                  <RoomCard
                    key={`active-${item.id}`}
                    item={item}
                    navigation={navigation}
                    isJoined={joinedRoomIds.has(item.id)}
                  />
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },

  blobTR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(147,51,234,0.08)', top: -80, right: -80,
  },
  blobBL: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.06)', bottom: 100, left: -80,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  headerSub: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  headerDivider: { height: 1, marginBottom: 10 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(147,51,234,0.12)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)',
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  createBtnText: { fontSize: 13, fontWeight: '700', color: '#c084fc' },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: 14 },

  // ── Section ──
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12,
  },
  sectionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent.purple },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.text.secondary,
    flex: 1,
  },
  sectionSub: { fontSize: 11, color: colors.text.muted },

  // ── Room card ──
  roomCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 14,
    marginBottom: 10, overflow: 'hidden',
  },
  roomCardJoined: {
    borderColor: 'rgba(52,211,153,0.2)',
    backgroundColor: 'rgba(52,211,153,0.04)',
  },
  roomAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  },
  roomTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  roomIconWrap: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: 'rgba(147,51,234,0.12)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  roomName: { fontSize: 14, fontWeight: '800', color: colors.text.primary, flex: 1 },
  privateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
  },
  privateBadgeText: { fontSize: 7, fontWeight: '800', color: '#fbbf24', letterSpacing: 1 },
  roomType: { fontSize: 10, color: colors.text.muted, fontWeight: '500' },
  roomDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 17, marginBottom: 10,
  },

  // Join / View
  joinBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
    backgroundColor: colors.accent.purple,
    flexShrink: 0,
  },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  viewBtn: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  viewText: { color: '#34d399', fontWeight: '700', fontSize: 12 },

  // Footer
  roomFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarStack: { flexDirection: 'row' },
  avatarItem: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(147,51,234,0.2)',
    borderWidth: 1.5, borderColor: colors.bg.screen,
    overflow: 'hidden',
  },
  memberCount: { fontSize: 11, color: colors.text.muted, fontWeight: '500' },

  // ── States ──
  loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  loadingText: { fontSize: 13, color: colors.text.muted },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyEmoji: { fontSize: 36, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.text.muted, textAlign: 'center' },
  emptyAction: {
    marginTop: 8, backgroundColor: 'rgba(147,51,234,0.15)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)',
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8,
  },
  emptyActionText: { fontSize: 13, fontWeight: '700', color: '#c084fc' },
});