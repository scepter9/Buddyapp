import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, ScrollView,
  Modal, FlatList, KeyboardAvoidingView, Platform,
  Pressable, TextInput, Animated, PanResponder, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { AuthorContext } from '../AuthorContext';
import { colors, radius, spacing } from '../Theme';
import socket from '../Socket';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

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
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const formatNumber = (val) => {
  if (!val) return '0';
  if (val < 1000) return val.toString();
  if (val < 1_000_000) return (val / 1000).toFixed(1) + 'k';
  return (val / 1_000_000).toFixed(1) + 'm';
};

const safeParse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
};

// ─────────────────────────────────────────
// TheComments — lifted from DesignersHubScreen
// ─────────────────────────────────────────
function TheComments({
  item, onSelect, onSelectidforindex, onremove,
  thepostid, Roomid, setScrollEnabled,
  replies = [], onLikeupdate, userisId,
}) {
  const commentid = item.id;
  const [likebyme, setLikebyme] = useState(Boolean(item.likestate));
  const [likeCount, setLikeCount] = useState(item.likecount ?? 0);
  const [isMutating, setIsMutating] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const eraseCommentRef = useRef(null);

  const canDelete = Number(item.senderid) === Number(userisId)

  useEffect(() => {
    translateX.setValue(0);
  }, [item.id]);

  eraseCommentRef.current = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/removeroomcomment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentid, thepostid, Roomid }),
      });
      if (!res.ok) return;
      onremove(commentid);
    } catch (err) {
      console.warn('Delete comment error:', err.message);
    }
  };

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
      const endpoint = willBeLiked ? 'addcommentroomlikes' : 'removecommentroomlikes';
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userisId, commentid, thepostid, Roomid }),
      });
      if (!res.ok) {
        setLikebyme(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      } else {
        const newCount = willBeLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
        onLikeupdate?.(commentid, willBeLiked, newCount);
      }
    } catch {
      setLikebyme(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsMutating(false);
    }
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canDelete,
    onMoveShouldSetPanResponder: (_, g) =>
      canDelete && Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 5,
    onPanResponderGrant: () => setScrollEnabled(false),
    onPanResponderMove: (_, g) => {
      if (g.dx > 0) translateX.setValue(Math.min(g.dx, 120));
    },
    onPanResponderRelease: (_, g) => {
      setScrollEnabled(true);
      if (g.dx > 60) {
        Animated.timing(translateX, { toValue: 150, duration: 250, useNativeDriver: true })
          .start(() => eraseCommentRef.current?.());
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [canDelete]);

  return (
    <View style={st.cmRootShell}>
      <View style={{ position: 'relative' }}>
        {canDelete && (
          <View style={st.deleteContain}>
            <Feather name="trash-2" size={16} color="#fff" />
          </View>
        )}
        <Animated.View
          {...panResponder.panHandlers}
          style={[st.cmRootShellSwipe, { transform: [{ translateX }] }]}
        >
          <View style={st.cmPrimaryLane}>
            <Image source={{ uri: item.image }} style={st.cmAvatarOrb} />
            <View style={st.cmContentColumn}>
              <View style={st.cmTopRow}>
                <View style={st.cmTextColumn}>
                  <Text style={st.cmHandleText}>{item.usersfull}</Text>
                  {item.replyid && (
                    <TouchableOpacity
                      onPress={() => onSelectidforindex(item.replyid)}
                      style={st.replyPreviewBubble}
                      activeOpacity={0.8}
                    >
                      <Text style={st.replyLabel}>Replied to</Text>
                      <View style={st.replyUserRow}>
                        <Image source={{ uri: item.replyUserImage }} style={st.replyPreviewAvatar} />
                        <Text style={st.replyPreviewName}>
                          {item.replyUserName}:{' '}
                          <Text numberOfLines={1} style={st.replyPreviewNamee}>
                            {item.replytext}
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <Text style={st.cmMessageBody}>{item.commenttext}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ padding: 8 }}
                    onPress={() => onSelect(item.id, item.usersfull, item.senderid, item.commenttext)}
                  >
                    <Ionicons name="arrow-redo-outline" color="#fff" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity style={st.cmPulseButton} onPress={postRoomLikes}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <Ionicons
                        name={likebyme ? 'heart' : 'heart-outline'}
                        size={18}
                        color={likebyme ? '#ff2ed8' : '#fff'}
                      />
                    </Animated.View>
                    <Text style={st.cmPulseCount}>{likeCount}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={st.cmTimestamp}>{formatTimestamp(item.posted_at)}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {replies.length > 0 && (
        <TouchableOpacity onPress={() => setShowReplies(v => !v)} style={st.viewReplyButton}>
          <View style={st.viewReplyLine} />
          <Text style={st.viewReplyText}>
            {showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && replies.map(reply => (
        <View key={reply.id} style={st.viewReplyIndent}>
          <MemoizedComments
            item={reply}
            userisId={userisId}
            onSelect={(id, name, userid, text) => onSelect(item.id, name, userid, text)}
            onSelectidforindex={onSelectidforindex}
            thepostid={thepostid}
            Roomid={Roomid}
            onremove={onremove}
           
            setScrollEnabled={setScrollEnabled}
            replies={[]}
          />
        </View>
      ))}
    </View>
  );
}

const MemoizedComments = React.memo(TheComments, (prev, next) => {
  if (prev.item.id !== next.item.id) return false;
  if (prev.item.commenttext !== next.item.commenttext) return false;
  if (prev.item.likecount !== next.item.likecount) return false;
  if (prev.item.likestate !== next.item.likestate) return false;

  if (prev.replies.length !== next.replies.length) return false;
  for (let i = 0; i < prev.replies.length; i++) {
    if (prev.replies[i]?.id !== next.replies[i]?.id) return false;
    if (prev.replies[i]?.commenttext !== next.replies[i]?.commenttext) return false;
    if (prev.replies[i]?.likecount !== next.replies[i]?.likecount) return false;
  }
  return true;
});

// ─────────────────────────────────────────
// SavedPostScreen
// ─────────────────────────────────────────
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
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bookref = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const videoRef = useRef({});
  const didInitialLoad = useRef(false);

  const upperComments = comments.filter(c => c.replyid === null);

  // ── Fetch single post + initial data ──
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/getpost?postid=${postId}&roomid=${roomId}&userIs=${searchid}`
        );
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

  // ── Socket — new comments ──
  useEffect(() => {
    const handler = (data) => {
      if (data.postid === postId) {
        setComments(prev => [...prev, data.newComment]);
      }
    };
    socket.on('ReleaseComment', handler);
    return () => socket.off('ReleaseComment', handler);
  }, [postId]);

  // ── Scroll to end on new comment (skip initial load) ──
  useEffect(() => {
    if (!didInitialLoad.current) {
      didInitialLoad.current = true;
      return;
    }
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [comments.length]);

  // ── Callbacks ──
  const setUser = useCallback((id, name, userid, thetext) => {
    setSelectedValue({
      commentupdateid: id,
      usersname: name,
      replyuserId: userid,
      replyusertext: thetext,
    });
  }, []);

  const setUserIndex = useCallback((theid) => {
    if (!theid) return;
    const index = comments.findIndex(u => u.id === theid);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    }
  }, [comments]);

  // ── Like post ──
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

  // ── Bookmark ──
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

  // ── Send comment ──
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

  // ── Load older comments ──
  const loadOlderComments = async () => {
    if (loadingMore || !hasMore || comments.length === 0) return;
    setLoadingMore(true);
    try {
      const lastPosted = comments[comments.length - 1].posted_at;
      const res = await fetch(
        `${API_BASE_URL}/getcommentolder?lasttime=${lastPosted}&postid=${postId}&roomid=${roomId}&userIs=${searchid}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setComments(prev => {
          const existing = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(p => !existing.has(p.id))];
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Render comment item ──
  const renderComment = useCallback(({ item: comment }) => {
    const replying = comments.filter(c => c.replyid === comment.id);
    return (
      <MemoizedComments
        item={comment}
        userisId={searchid}
        onSelect={setUser}
        onSelectidforindex={setUserIndex}
        thepostid={postId}
        Roomid={roomId}
        onremove={(id) => setComments(prev => prev.filter(a => a.id !== id))}
        setScrollEnabled={setScrollEnabled}
        replies={replying}
        onLikeupdate={(id, liked, count) =>
          setComments(prev =>
            prev.map(c => c.id === id ? { ...c, likestate: liked, likecount: count } : c)
          )
        }
      />
    );
  }, [setUser, setUserIndex, searchid, comments, postId, roomId]);

  // ─────────────────────────────────────────
  // Loading / Not Found states
  // ─────────────────────────────────────────
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
        {/* Post card */}
        <View style={st.card}>
          {/* Author row */}
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
          {post.post ? <Text style={st.postText}>{post.post}</Text> : null}

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
                      navigation.navigate('ViewImage', {
                        imagevalue: uri,
                        mediatype: isVideo ? 'video' : 'image',
                      });
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

          {/* Reactions bar */}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={st.fab} onPress={() => setCommentModal(true)}>
        <LinearGradient colors={['#9333ea', '#6366f1']} style={st.fabGrad}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Full comment modal — DesignersHubScreen pattern */}
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

              {/* Swipe hint — shown to everyone since we don't have Adminstate here */}
              <View style={st.swipeBanner}>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
                <Text style={st.swipeBannerText}>Swipe right to delete your comment</Text>
              </View>

              <FlatList
                scrollEnabled={scrollEnabled}
                ref={flatListRef}
                data={upperComments}
                keyExtractor={(item) => item?.id.toString()}
                renderItem={renderComment}
                showsVerticalScrollIndicator={false}
                onEndReached={loadOlderComments}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews
                contentContainerStyle={{ paddingBottom: 10 }}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                      <ActivityIndicator color={colors.accent.purple} />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <Text style={st.noComments}>No comments yet. Be the first!</Text>
                }
                style={{ flex: 1 }}
              />

              <View style={st.inputArea}>
                {selectedValue && (
                  <View style={st.replyTag}>
                    <View style={st.replyTagContent}>
                      <Ionicons name="arrow-undo-outline" size={13} color="#6D5BFF" />
                      <Text style={st.replyTagText}>
                        Replying to{' '}
                        <Text style={{ fontWeight: '600' }}>{selectedValue.usersname}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedValue(null)}>
                      <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={st.inputBar}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    placeholder="Type a comment..."
                    style={st.inputText}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    blurOnSubmit={false}
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

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20 },
  fabGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { height: '80%', backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalClose: { position: 'absolute', right: 10 },
  noComments: { textAlign: 'center', marginTop: 30, fontSize: 14, color: 'rgba(255,255,255,0.3)' },

  // Swipe banner
  swipeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(147,51,234,0.12)', paddingHorizontal: 12, paddingVertical: 6, marginVertical: 8, borderRadius: 8 },
  swipeBannerText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  // Input
  inputArea: { paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)', gap: 6 },
  replyTag: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  replyTagContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyTagText: { color: '#ccc', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20 },
  inputText: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 4 },
  sendBtn: { marginLeft: 8, backgroundColor: colors.accent.purple, padding: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // ── Comment item styles (from DesignersHubScreen) ──
  cmRootShell: { marginBottom: 2 },
  cmRootShellSwipe: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10 },
  deleteContain: { position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center', zIndex: 0 },
  cmPrimaryLane: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cmAvatarOrb: { width: 34, height: 34, borderRadius: 17, marginTop: 2 },
  cmContentColumn: { flex: 1 },
  cmTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cmTextColumn: { flex: 1, marginRight: 8 },
  cmHandleText: { fontSize: 13, fontWeight: '700', color: '#e5e5ea', marginBottom: 3 },
  cmMessageBody: { fontSize: 13, color: '#c7c7cc', lineHeight: 18 },
  cmTimestamp: { fontSize: 11, color: '#8e8e93', marginTop: 4 },
  cmPulseButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  cmPulseCount: { fontSize: 12, color: '#e5e5ea' },

  // Reply preview
  replyPreviewBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, borderLeftWidth: 2, borderLeftColor: '#9333ea', paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  replyLabel: { fontSize: 10, color: '#9333ea', marginBottom: 2, fontWeight: '600' },
  replyUserRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replyPreviewAvatar: { width: 14, height: 14, borderRadius: 7 },
  replyPreviewName: { fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 },
  replyPreviewNamee: { color: 'rgba(255,255,255,0.35)' },

  // View replies
  viewReplyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 60, paddingVertical: 6 },
  viewReplyLine: { width: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  viewReplyText: { fontSize: 12, color: colors.accent.lavender, fontWeight: '600' },
  viewReplyIndent: { paddingLeft: 44 },
});