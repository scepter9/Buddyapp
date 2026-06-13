import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, ScrollView,
  Modal, FlatList, KeyboardAvoidingView, Platform,
  Pressable, TextInput, Animated, PanResponder, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { AuthorContext } from './AuthorContext';
import { colors, radius, spacing } from './Theme';
import socket from './Socket';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

const formatTimestamp = (time) => {
  if (!time) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(time)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatNumber = (val) => {
  if (!val) return '0';
  if (val < 1000) return val.toString();
  return (val / 1000).toFixed(1) + 'k';
};

const safeParse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
};

export default function SavedPostScreen({ navigation, route }) {
  const { postId, roomId } = route.params;
  const { user } = useContext(AuthorContext);
  const searchid = user?.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likebyme, setLikebyme] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [book, setBook] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bookref = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const videoRef = useRef({});

  // Fetch the single post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getpost?postid=${postId}&roomid=${roomId}&userIs=${searchid}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setPost(data.post);
        setLikeCount(data.likeCount ?? 0);
        setLikebyme(data.likedByMe ?? false);
        setBook(data.bookmarked ?? true);
        setComments(data.comments ?? []);
      } catch (err) {
        console.warn('Fetch post error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, roomId, searchid]);

  // Socket — new comments
  useEffect(() => {
    const handler = (data) => {
      if (data.postid === postId) {
        setComments(prev => [...prev, data.newComment]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    };
    socket.on('ReleaseComment', handler);
    return () => socket.off('ReleaseComment', handler);
  }, [postId]);

  const postRoomLikes = async () => {
    if (isMutating) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    const wasLiked = likebyme;
    const willBeLiked = !wasLiked;
    setLikebyme(willBeLiked);
    setLikeCount(prev => willBeLiked ? prev + 1 : Math.max(0, prev - 1));
    setIsMutating(true);
    try {
      const endpoint = willBeLiked ? 'addroomlikes' : 'removeroomlikes';
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchid, roomdetais: postId, Roomid: roomId }),
      });
      if (!res.ok) {
        setLikebyme(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      setLikebyme(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsMutating(false);
    }
  };

  const postBookmark = async () => {
    const prevBook = book;
    const newBook = !book;
    setBook(newBook);
    Animated.sequence([
      Animated.timing(bookref, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(bookref, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    try {
      const endpoint = newBook ? 'add' : 'remove';
      const res = await fetch(`${API_BASE_URL}/postbook-${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchid, roomdetais: postId, Roomid: roomId }),
      });
      if (!res.ok) setBook(prevBook);
    } catch {
      setBook(prevBook);
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    socket.emit('RoomComment', {
      postid: postId,
      roomid: roomId,
      usersId: searchid,
      comment: commentText,
      replycommentid: selectedValue?.commentupdateid ?? null,
      replyusersid: selectedValue?.replyuserId ?? null,
      replyuserstext: selectedValue?.replyusertext ?? null,
    });
    setCommentText('');
    setSelectedValue(null);
  };

  const upperComments = comments.filter(c => c.replyid === null);

  if (loading) return (
    <View style={st.loadWrap}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator color={colors.accent.purple} size="large" />
    </View>
  );

  if (!post) return (
    <View style={st.loadWrap}>
      <StatusBar barStyle="light-content" />
      <Feather name="alert-circle" size={32} color={colors.text.muted} />
      <Text style={st.notFoundText}>Post not found</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={st.goBackBtn}>
        <Text style={st.goBackText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  const postImages = safeParse(post.postimage);
  const postVideos = safeParse(post.postvideo);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Saved post</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Author row */}
        <View style={st.card}>
          <View style={st.authorRow}>
            <LinearGradient colors={['#9333ea', '#6366f1']} style={st.avatarRing}>
              <Image source={{ uri: post.image }} style={st.avatar} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={st.fullname}>{post.fullname}</Text>
              <View style={st.metaRow}>
                <Text style={st.handle}>@{post.usersname}</Text>
                <View style={st.dot} />
                <Text style={st.time}>{formatTimestamp(post.posted_at)}</Text>
              </View>
            </View>
          </View>

          {/* Post text */}
          {post.post ? (
            <Text style={st.postText}>{post.post}</Text>
          ) : null}

          {/* Media */}
          {(postImages.length > 0 || postVideos.length > 0) && (
            <View style={st.mediaGrid}>
              {[...postImages, ...postVideos].map((uri, index) => {
                const total = postImages.length + postVideos.length;
                const isVideo = postVideos.includes(uri);
                let itemWidth = '100%';
                let itemHeight = 420;
                if (total === 2) { itemWidth = '49.5%'; itemHeight = 340; }
                if (total >= 3) { itemWidth = '49.5%'; itemHeight = 240; }

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.9}
                    style={[st.mediaItem, { width: itemWidth, height: itemHeight }]}
                    onPress={() => {
                      Object.values(videoRef.current).forEach(r => r?.pauseAsync());
                      navigation.navigate('ViewImage', { imagevalue: uri, mediatype: isVideo ? 'video' : 'image' });
                    }}
                  >
                    {isVideo ? (
                      <Video
                        source={{ uri }}
                        ref={r => { videoRef.current[index] = r; }}
                        style={st.mediaContent}
                        resizeMode="cover"
                        useNativeControls
                        shouldPlay={false}
                        isMuted
                      />
                    ) : (
                      <Image source={{ uri }} resizeMode="cover" style={st.mediaContent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Reactions */}
          <View style={st.reactions}>
            <View style={st.upvotePill}>
              <TouchableOpacity style={st.upvoteBtn} onPress={postRoomLikes}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Ionicons
                    name={likebyme ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                    size={18}
                    color={likebyme ? '#FF9500' : 'rgba(255,255,255,0.4)'}
                  />
                </Animated.View>
                <Text style={[st.upvoteCount, likebyme && { color: '#FF9500' }]}>
                  {formatNumber(likeCount)}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={st.reactionBtn} onPress={() => setCommentModal(true)}>
              <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.4)" />
              <Text style={st.reactText}>{formatNumber(upperComments.length)}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={st.bookmarkBtn} onPress={postBookmark}>
              <Animated.View style={{ transform: [{ scale: bookref }] }}>
                <Ionicons
                  name={book ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={book ? '#FF9500' : 'rgba(255,255,255,0.35)'}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats strip */}
        <View style={st.statsStrip}>
          <View style={st.statChip}>
            <Ionicons name="arrow-up-circle" size={14} color="#FF9500" />
            <Text style={st.statChipText}>{formatNumber(likeCount)} upvotes</Text>
          </View>
          <View style={st.statChip}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.accent.lavender} />
            <Text style={st.statChipText}>{formatNumber(upperComments.length)} comments</Text>
          </View>
          <View style={st.statChip}>
            <Ionicons name="bookmark" size={14} color="#FF9500" />
            <Text style={st.statChipText}>Saved</Text>
          </View>
        </View>

        {/* Comments preview — top 3 */}
        {upperComments.length > 0 && (
          <View style={st.commentsPreview}>
            <View style={st.commentsPreviewHeader}>
              <Text style={st.commentsPreviewTitle}>Top comments</Text>
              <TouchableOpacity onPress={() => setCommentModal(true)}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {upperComments.slice(0, 3).map(comment => (
              <View key={comment.id} style={st.commentRow}>
                <Image source={{ uri: comment.image }} style={st.commentAvatar} />
                <View style={st.commentContent}>
                  <View style={st.commentMeta}>
                    <Text style={st.commentName}>{comment.usersfull}</Text>
                    <Text style={st.commentTime}>{formatTimestamp(comment.posted_at)}</Text>
                  </View>
                  <Text style={st.commentText} numberOfLines={2}>{comment.commenttext}</Text>
                  <View style={st.commentReactions}>
                    <Ionicons name="heart-outline" size={13} color="rgba(255,255,255,0.3)" />
                    <Text style={st.commentLikeCount}>{comment.likecount ?? 0}</Text>
                  </View>
                </View>
              </View>
            ))}
            {upperComments.length > 3 && (
              <TouchableOpacity style={st.viewMoreBtn} onPress={() => setCommentModal(true)}>
                <Text style={st.viewMoreText}>View {upperComments.length - 3} more comments</Text>
                <Feather name="chevron-down" size={14} color={colors.accent.lavender} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add comment FAB */}
      <TouchableOpacity style={st.fab} onPress={() => setCommentModal(true)}>
        <LinearGradient colors={['#9333ea', '#6366f1']} style={st.fabGrad}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Full comment modal — same logic as DesignersHubScreen */}
      <Modal
        visible={commentModal}
        animationType="slide"
        onRequestClose={() => setCommentModal(false)}
        transparent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={st.modalOverlay}>
            <Pressable style={{ flex: 1 }} onPress={() => setCommentModal(false)} />
            <View style={st.modalSheet}>
              <View style={st.grabber} />
              <View style={st.modalHeader}>
                <Text style={st.modalTitle}>{comments.length} Comments</Text>
                <Pressable onPress={() => setCommentModal(false)} style={st.modalClose}>
                  <Ionicons name="close" size={22} color="#fff" />
                </Pressable>
              </View>

              <FlatList
                ref={flatListRef}
                data={upperComments}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={scrollEnabled}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ flex: 1 }}
                ListEmptyComponent={
                  <Text style={st.noComments}>No comments yet. Be the first!</Text>
                }
                renderItem={({ item: comment }) => (
                  <View style={st.fullCommentRow}>
                    <Image source={{ uri: comment.image }} style={st.fullCommentAvatar} />
                    <View style={st.fullCommentContent}>
                      <View style={st.fullCommentMeta}>
                        <Text style={st.fullCommentName}>{comment.usersfull}</Text>
                        <Text style={st.fullCommentTime}>{formatTimestamp(comment.posted_at)}</Text>
                      </View>
                      <Text style={st.fullCommentText}>{comment.commenttext}</Text>
                      <TouchableOpacity
                        style={st.replyBtn}
                        onPress={() => setSelectedValue({
                          commentupdateid: comment.id,
                          usersname: comment.usersfull,
                          replyuserId: comment.senderid,
                          replyusertext: comment.commenttext,
                        })}
                      >
                        <Ionicons name="arrow-redo-outline" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={st.replyBtnText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={st.commentLikeWrap}>
                      <Ionicons name="heart-outline" size={14} color="rgba(255,255,255,0.3)" />
                      <Text style={st.commentLikeCount}>{comment.likecount ?? 0}</Text>
                    </View>
                  </View>
                )}
              />

              <View style={st.inputArea}>
                {selectedValue && (
                  <View style={st.replyTag}>
                    <Text style={st.replyTagText}>
                      Replying to <Text style={{ fontWeight: '600' }}>{selectedValue.usersname}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedValue(null)}>
                      <Ionicons name="close" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={st.inputBar}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    placeholder="Add a comment..."
                    style={st.inputText}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    returnKeyType="send"
                    onSubmitEditing={handleComment}
                  />
                  <Pressable
                    onPress={handleComment}
                    style={[st.sendBtn, { opacity: commentText.trim() ? 1 : 0.4 }]}
                    disabled={!commentText.trim()}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  loadWrap: { flex: 1, backgroundColor: colors.bg.screen, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 15, color: colors.text.muted, marginTop: 8 },
  goBackBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle },
  goBackText: { color: colors.accent.lavender, fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '700', color: colors.text.secondary },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },

  // Post card
  card: { backgroundColor: colors.bg.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden', marginBottom: 12 },

  // Author
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  avatarRing: { width: 46, height: 46, borderRadius: 23, padding: 2, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  fullname: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  handle: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  time: { fontSize: 12, color: 'rgba(255,255,255,0.28)' },

  // Post text
  postText: { fontSize: 15, color: '#e2e8f0', lineHeight: 23, paddingHorizontal: 16, paddingBottom: 14 },

  // Media
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between' },
  mediaItem: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  mediaContent: { width: '100%', height: '100%' },

  // Reactions
  reactions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.05)', gap: 8 },
  upvotePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12 },
  upvoteCount: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  reactText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '500' },
  bookmarkBtn: { padding: 6 },

  // Stats strip
  statsStrip: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bg.card, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.subtle, paddingVertical: 6, paddingHorizontal: 12 },
  statChipText: { fontSize: 12, color: colors.text.secondary, fontWeight: '500' },

  // Comments preview
  commentsPreview: { backgroundColor: colors.bg.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, padding: 16, marginBottom: 12 },
  commentsPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  commentsPreviewTitle: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  seeAll: { fontSize: 12, fontWeight: '600', color: colors.accent.purple },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
  commentContent: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentName: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  commentTime: { fontSize: 11, color: colors.text.muted },
  commentText: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },
  commentReactions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  commentLikeCount: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle },
  viewMoreText: { fontSize: 13, color: colors.accent.lavender, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20 },
  fabGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  // Full comment modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { height: '80%', backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalClose: { position: 'absolute', right: 10 },
  noComments: { textAlign: 'center', marginTop: 30, fontSize: 14, color: 'rgba(255,255,255,0.3)' },

  // Full comment rows
  fullCommentRow: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  fullCommentAvatar: { width: 34, height: 34, borderRadius: 17 },
  fullCommentContent: { flex: 1 },
  fullCommentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fullCommentName: { fontSize: 13, fontWeight: '600', color: '#e5e5ea' },
  fullCommentTime: { fontSize: 11, color: '#8e8e93' },
  fullCommentText: { fontSize: 13, color: '#e5e5ea', lineHeight: 18 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  replyBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  commentLikeWrap: { alignItems: 'center', gap: 3 },

  // Input
  inputArea: { paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)', gap: 6 },
  replyTag: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  replyTagText: { color: '#ccc', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20 },
  inputText: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 4 },
  sendBtn: { marginLeft: 8, backgroundColor: colors.accent.purple, padding: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});