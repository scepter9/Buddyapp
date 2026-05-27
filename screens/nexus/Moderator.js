import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { colors, radius, spacing } from '../Theme';


const API_BASE_URL = 'http://192.168.0.136:3000';

const FILTERS = ['All', 'Users', 'Rooms', 'Stories'];

const TYPE_CONFIG = {
  user:  { icon: 'user',      color: '#f87171', bg: 'rgba(239,68,68,0.1)',  label: 'USER'  },
  room:  { icon: 'hash',      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', label: 'ROOM'  },
  story: { icon: 'file-text', color: '#c084fc', bg: 'rgba(147,51,234,0.1)', label: 'STORY' },
};

const SEVERITY = {
  high: '#ef4444',
  med:  '#fbbf24',
  low:  'rgba(255,255,255,0.12)',
};

const WARNING_MESSAGES = {
  'Harassment or bullying': {
    user:  'Your account has been reported multiple times for harassment or bullying. Further violations will result in suspension.',
    story: 'This story has been reported for harassment. It will be removed if violations continue.',
    room:  'This room has been reported for bullying. Moderators are reviewing.',
  },
  'Hate speech': {
    user:  'Your account has been reported for hate speech. This is a final warning before suspension.',
    story: 'This story has been flagged for hate speech. Further violations will lead to removal.',
    room:  'This room has been flagged for hate speech. Further violations will lead to suspension.',
  },
  'Spam or misleading': {
    user:  'Your account has been reported for spam or misleading content. Further violations will lead to suspension.',
    story: 'This story has been flagged for misleading content. Verify your sources or it will be removed.',
    room:  'This room has been reported for spam. Further violations will lead to suspension.',
  },
  'Impersonation': {
    user:  'Your account has been reported for impersonation. Please verify your identity within 48 hours.',
    story: 'This story has been flagged for impersonation. Review it or it will be removed.',
    room:  'This room has been reported for impersonating an official organization.',
  },
  'Inappropriate content': {
    user:  'Your account has been reported for inappropriate content. This is a warning.',
    story: 'This story has been flagged for inappropriate content and is under review.',
    room:  'This room has been reported for inappropriate content. Moderators are reviewing.',
  },
};

const getWarningMessage = (reason, type, name) => {
  const group = WARNING_MESSAGES[reason];
  if (!group) return `Content reported for: ${reason}. (${type}: ${name})`;
  const base = group[type] ?? group.user;
  return `${base} (${type}: ${name})`;
};

const getSeverity = (count) => {
  if (count >= 3) return 'high';
  if (count >= 2) return 'med';
  return 'low';
};

const formatTimestamp = (time) => {
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

// ── Stat pill ──
function StatPill({ count, label, color }) {
  return (
    <View style={s.statPill}>
      <Text style={[s.statNum, { color }]}>{count ?? 0}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Report card ──
function ReportCard({ item, onDismiss, onView, onWarn }) {
  
  const type = item.reportidentity?.toLowerCase() ?? 'user';
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.user;
  const severity = getSeverity(item.reportcount ?? 1);
  const reportCount = item.reportcount ?? 1;

  return (
    <View style={[s.card, { borderLeftColor: SEVERITY[severity] }]}>

      {/* Top row */}
      <View style={s.cardTop}>
        <View style={[s.typeIcon, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={14} color={config.color} />
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTypeLabel}>{config.label}</Text>
          <Text style={s.cardName} numberOfLines={1}>{item.reportname}</Text>
          <Text style={s.cardReason} numberOfLines={1}>
            {item.reason}
            {reportCount > 1 ? ` · ${reportCount} reports` : ''}
          </Text>
        </View>
        <Text style={s.cardTime}>{formatTimestamp(item.reporttime)}</Text>
      </View>

      {/* Reporter */}
      <View style={s.reporterRow}>
        <Text style={s.reporterText}>
          Reported by{' '}
          <Text style={s.reporterName}>@{item.reporter_name ?? 'unknown'}</Text>
         
          {reportCount >= 2
            ? ` +${reportCount - 1} other${reportCount > 2 ? 's' : ''}`
            : ''}
        </Text>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, s.btnDismiss]} onPress={() => onDismiss(item.id)}>
          <Feather name="x" size={10} color="rgba(255,255,255,0.4)" />
          <Text style={[s.btnText, { color: 'rgba(255,255,255,0.4)' }]}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnView]} onPress={() => onView(item)}>
          <Feather name="eye" size={10} color="#c084fc" />
          <Text style={[s.btnText, { color: '#c084fc' }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnWarn]} onPress={() => onWarn(item)}>
          <Feather name="alert-triangle" size={10} color="#fbbf24" />
          <Text style={[s.btnText, { color: '#fbbf24' }]}>Warn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ──
export default function ModeratorScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ pending: 0, inReview: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // ── Fetch reports + stats ──
  useFocusEffect(
    useCallback(() => {
      const fetchAll = async () => {
        setLoading(true);
        try {
          const [reportsRes, statsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/modreports`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/modreports/stats`, { credentials: 'include' }),
          ]);

          if (reportsRes.ok) {
            const data = await reportsRes.json();
            setReports(data);
          }

          // BUG FIX: stats fetched separately — no more .lenght typo
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats({
              pending:  statsData.pending  ?? 0,
              inReview: statsData.inReview ?? 0,
              resolved: statsData.resolved ?? 0,
            });
          }
        } catch (err) {
          console.warn('ModeratorScreen fetch error:', err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }, [])
  );

  // ── Filter ──
  // BUG FIX: was using item.type — your data has item.reportidentity
  const filteredReports = reports.filter(r => {
    if (activeFilter === 'All') return true;
    const singular = activeFilter.toLowerCase().replace(/s$/, '');
    return r.reportidentity?.toLowerCase() === singular;
  });

  // ── Dismiss ──
  const handleDismiss = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/modreports/${id}/dismiss`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) return;
      setReports(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        resolved: prev.resolved + 1,
      }));
    } catch (err) {
      console.warn('Dismiss error:', err.message);
    }
  };

  // ── Warn ──
  const handleWarn = async (item) => {
    const message = getWarningMessage(
      item.reason,
      item.reportidentity?.toLowerCase() ?? 'user',
      item.reportname
    );

    try {
      // BUG FIX: was sending to req.query — backend now reads req.body
      const res = await fetch(`${API_BASE_URL}/modreports/warn`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theid: item.id,
          sender: item.reporterid,
          message,
        }),
      });
      if (!res.ok) return;
      setReports(prev => prev.filter(r => r.id !== item.id));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        inReview: prev.inReview + 1,
      }));
    } catch (err) {
      console.warn('Warn error:', err.message);
    }
  };

  // ── View — navigate to the actual content ──
  // BUG FIX: was using item.type — corrected to item.reportidentity
  const handleView = useCallback((item) => {
    const type = item.reportidentity?.toLowerCase();
    if (type === 'user') {
      navigation.navigate('Profile', { userId: item.reporterid });
    } else if (type === 'room') {
      navigation.navigate('DesignersHubScreen', {
        roomid: item.reporterid,
        roomname: item.reportname,
        roomcreator: item.room_creator,
      });
    } else if (type === 'story') {
      navigation.navigate('FullStory', { StoryID: item.reporterid });
    }
  }, [navigation]);

  // BUG FIX: removed [reports] dependency — handlers don't need it
  const renderReport = useCallback(({ item }) => (
    <ReportCard
      item={item}
      onDismiss={handleDismiss}
      onView={handleView}
      onWarn={handleWarn}
    />
  ), [handleView]);

  const ListHeader = useCallback(() => (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, activeFilter === f && s.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredReports.length > 0 && (
        <View style={s.secLabel}>
          <View style={[s.secDot, { backgroundColor: '#ef4444' }]} />
          <Text style={s.secText}>PENDING · {filteredReports.length}</Text>
        </View>
      )}
    </>
  ), [activeFilter, filteredReports.length]);

  const ListEmpty = useCallback(() => (
    <View style={s.emptyState}>
      <Text style={s.emptyEmoji}>✅</Text>
      <Text style={s.emptyTitle}>All clear</Text>
      <Text style={s.emptyDesc}>
        No pending reports{activeFilter !== 'All' ? ` for ${activeFilter}` : ''}.
      </Text>
    </View>
  ), [activeFilter]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />

      {/* Header */}
      <LinearGradient
        colors={['rgba(220,38,38,0.1)', 'rgba(147,51,234,0.06)', 'transparent']}
        style={s.header}
      >
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={18} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={s.modBadge}>
              <View style={s.modBadgeDot} />
              <Text style={s.modBadgeText}>MOD ONLY</Text>
            </View>
            <Text style={s.headerTitle}>Reports</Text>
            <Text style={s.headerSub}>Review and take action</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <StatPill count={stats.pending}  label="PENDING"   color="#f87171" />
          <StatPill count={stats.inReview} label="IN REVIEW" color="#fbbf24" />
          <StatPill count={stats.resolved} label="RESOLVED"  color="#34d399" />
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['transparent', '#ef4444', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.accent.purple} />
          <Text style={s.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={item => item.id.toString()}
          renderItem={renderReport}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={s.feedContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  blobTR: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(220,38,38,0.06)', top: -60, right: -60,
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: 14, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card, borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, flexShrink: 0,
  },
  modBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 5,
  },
  modBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#f87171' },
  modBadgeText: { fontSize: 8, fontWeight: '800', color: '#f87171', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
  headerSub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  headerDivider: { height: 1, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1, backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, padding: 10, alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 0.5, color: 'rgba(255,255,255,0.3)', marginTop: 3 },
  filterScroll: { paddingHorizontal: spacing.lg, paddingVertical: 10, gap: 6 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border.subtle, backgroundColor: colors.bg.card,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(147,51,234,0.18)',
    borderColor: 'rgba(147,51,234,0.4)',
  },
  filterText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
  filterTextActive: { color: '#c084fc' },
  secLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingHorizontal: spacing.lg,
  },
  secDot: { width: 5, height: 5, borderRadius: 3 },
  secText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, color: 'rgba(255,255,255,0.28)' },
  feedContent: { paddingBottom: 40 },
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderLeftWidth: 3, borderRadius: radius.lg,
    padding: 12, marginHorizontal: spacing.lg, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  typeIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTypeLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.28)', marginBottom: 1 },
  cardName: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  cardReason: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  cardTime: { fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 },
  reporterRow: {
    marginBottom: 8, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  reporterText: { fontSize: 9, color: 'rgba(255,255,255,0.25)' },
  reporterName: { color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 5 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 3, paddingVertical: 7, borderRadius: 8,
  },
  btnText: { fontSize: 9, fontWeight: '700' },
  btnDismiss: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnView:    { backgroundColor: 'rgba(147,51,234,0.12)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.28)' },
  btnWarn:    { backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.22)' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.text.muted },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  emptyDesc: { fontSize: 13, color: colors.text.muted, textAlign: 'center' },
});