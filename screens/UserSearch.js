import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, SafeAreaView, StatusBar, FlatList, ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// BUG FIX: missing imports
import { AuthorContext } from './AuthorContext';
import BottomNavigator from './BottomNavigator';
import { colors, radius, spacing } from './Theme';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

function UserRow({ user, onPress, score }) {
  const initials = user.FULLNAME
    ? user.FULLNAME.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <TouchableOpacity style={s.row} onPress={() => onPress(user.id)} activeOpacity={0.8}>
      {user.image ? (
        // BUG FIX: was missing /uploads/ in URI
        <Image source={{ uri: `${API_BASE_URL}/uploads/${user.image}` }} style={s.avatar} />
      ) : (
        <LinearGradient colors={['#9333ea', '#6366f1']} style={s.avatar}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </LinearGradient>
      )}
      <View style={s.userInfo}>
        <Text style={s.name} numberOfLines={1}>{user.FULLNAME || user.username}</Text>
        <Text style={s.handle} numberOfLines={1}>
          {user.username ? `@${user.username}` : user.email}
        </Text>
      </View>
      {/* Show score badge for suggestions */}
      {score !== undefined && (
        <View style={s.scoreBadge}>
          <Feather name="users" size={10} color="#c084fc" />
          <Text style={s.scoreText}>{score > 1 ? `+${score - 1}` : 'New'}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );
}

// ── Section header ──
function SectionHeader({ label, count }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionDot} />
      <Text style={s.sectionLabel}>{label}</Text>
      {count !== undefined && (
        <View style={s.sectionCount}>
          <Text style={s.sectionCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function UserSearch({ navigation }) {
  // BUG FIX: proper context destructuring
  const { user } = useContext(AuthorContext);
  const usersid = user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Fetch people you may know on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getusersyoumayknow`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.warn('Suggestions fetch error:', err.message);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [usersid]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/checkuser?SearchValue=${searchQuery.trim()}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.warn('Search error:', err.message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const goToProfile = useCallback((id) => {
    navigation.navigate('Profile', { userId: id });
  }, [navigation]);

  const isSearching = searchQuery.trim().length > 0;

 
  const listData = isSearching
    ? searchResults.map(u => ({ ...u, _type: 'search' }))
    : suggestions.map(u => ({ ...u, _type: 'suggestion' }));

  const renderItem = useCallback(({ item }) => (
    <UserRow
      user={item}
      onPress={goToProfile}
      score={item._type === 'suggestion' ? item.total_score : undefined}
    />
  ), [goToProfile]);

  const ListHeader = useCallback(() => {
    if (isSearching) {
      return (
        <SectionHeader
          label="SEARCH RESULTS"
          count={searchResults.length}
        />
      );
    }
    if (loadingSuggestions) return null;
    return (
      <SectionHeader
        label="PEOPLE YOU MAY KNOW"
        count={suggestions.length}
      />
    );
  }, [isSearching, searchResults.length, suggestions.length, loadingSuggestions]);

  // BUG FIX: proper empty state handling
  const ListEmpty = useCallback(() => {
    if (isSearching && searching) return null;
    if (isSearching && searchResults.length === 0) {
      return (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🔍</Text>
          <Text style={s.emptyTitle}>No results for "{searchQuery}"</Text>
          <Text style={s.emptyDesc}>Try a different name or username.</Text>
        </View>
      );
    }
    if (!isSearching && !loadingSuggestions && suggestions.length === 0) {
      return (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>👥</Text>
          <Text style={s.emptyTitle}>No suggestions yet</Text>
          <Text style={s.emptyDesc}>Join rooms and follow people to get better suggestions.</Text>
        </View>
      );
    }
    return null;
  }, [isSearching, searching, searchResults.length, searchQuery, loadingSuggestions, suggestions.length]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Find People</Text>
        <View style={{ width: 38 }} />
      </View>

      <LinearGradient
        colors={['transparent', '#9333ea', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color="rgba(255,255,255,0.3)" />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.accent.lavender} />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={15} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Loading suggestions */}
      {!isSearching && loadingSuggestions ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.accent.purple} />
          <Text style={s.loadingText}>Finding people you may know...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => `${item._type}-${item.id}`}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card, borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  headerDivider: { height: 1, marginBottom: 10 },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg.card, borderWidth: 1,
    borderColor: colors.border.subtle, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 11,
    marginHorizontal: spacing.lg, marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: 14 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  sectionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent.purple },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: colors.text.secondary, flex: 1 },
  sectionCount: {
    backgroundColor: 'rgba(147,51,234,0.12)', borderWidth: 1,
    borderColor: 'rgba(147,51,234,0.2)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sectionCountText: { fontSize: 10, fontWeight: '700', color: '#c084fc' },

  // ── List ──
  listContent: { paddingBottom: 100 },
  separator: { height: 1, backgroundColor: colors.border.subtle, marginLeft: 72 },

  // ── User row ──
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitials: { color: '#fff', fontSize: 15, fontWeight: '700' },
  userInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  handle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(147,51,234,0.1)',
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)',
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  scoreText: { fontSize: 10, fontWeight: '700', color: '#c084fc' },

  // ── States ──
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: colors.text.muted },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: colors.text.muted, textAlign: 'center', lineHeight: 18 },
});