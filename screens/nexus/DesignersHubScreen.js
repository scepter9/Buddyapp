import React, {
  useEffect, useState, useContext, useMemo,
  useRef, useCallback
} from "react";
import {
  View, Text, Image, TouchableOpacity, Share,
  StyleSheet, SafeAreaView, FlatList, ImageBackground,
  Modal, TouchableWithoutFeedback, Alert, TextInput,
  KeyboardAvoidingView, Platform, Animated, Pressable,
  Keyboard, ActivityIndicator, PanResponder, StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { AuthorContext } from "../AuthorContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../Socket";
import Slideupbar from "../Slideupbar";
import { Video } from "expo-av";
import { colors, radius, spacing } from "../Theme";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

const FALLBACK_ROOM_IMAGE = {
  uri: "https://picsum.photos/800/400",
};


const formatTimestamp = (time) => {
  if (!time) return "Just now";
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
  if (!val) return "0";
  if (val < 1000) return val.toString();
  if (val < 1_000_000) return (val / 1000).toFixed(1) + "k";
  return (val / 1_000_000).toFixed(1) + "m";
};

const safeParse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
};

function TheComments({
  item, onSelect, onSelectidforindex, onremove,
  thepostid, Roomid, isAdminstate, setScrollEnabled,
  replies = [],onLikeupdate,
  userisId,
}) {
  const { user } = useContext(AuthorContext);
  const commentid = item.id;
  const [likebyme, setLikebyme] = useState(Boolean(item.likestate));
  const [likeCount, setLikeCount] = useState(item.likecount ?? 0);
  const [isMutating, setIsMutating] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const eraseCommentRef = useRef(null);

  const canDelete = Number(item.senderid) === Number(userisId) || isAdminstate;

  useEffect(() => {
    translateX.setValue(0);
  }, [item.id]);

  eraseCommentRef.current = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/removeroomcomment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentid, thepostid, Roomid }),
      });
      if (!res.ok) return;
      onremove(commentid);
    } catch (err) {
      console.warn("Delete comment error:", err.message);
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
      const endpoint = willBeLiked ?`addcommentroomlikes`:`removecommentroomlikes`
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userisId, commentid }),
      });
      if (!res.ok) {
        setLikebyme(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
        console.log('issue');
      }else {
       
        const newCount = willBeLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
        onLikeupdate?.(commentid, willBeLiked, newCount);
      }
     
    } catch {
      setLikebyme(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.log('issue');
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
    <View style={styles.cmRootShell}>

  <View style={{position:'relative'}}>
      {canDelete && (
        <View style={styles.deleteContain}>
          <Feather name="trash-2" size={16} color="#fff" />
        </View>
      )}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.cmRootShellSwipe, { transform: [{ translateX }] }]}
      >
        <View style={styles.cmPrimaryLane}>
          <Image
            source={{ uri: item.image }}
            style={styles.cmAvatarOrb}
          />
          <View style={styles.cmContentColumn}>
            <View style={styles.cmTopRow}>
              <View style={styles.cmTextColumn}>
                <Text style={styles.cmHandleText}>{item.usersfull}</Text>
                {item.replyid && (
                  <TouchableOpacity
                    onPress={() => onSelectidforindex(item.replyid)}
                    style={styles.replyPreviewBubble}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replyLabel}>Replied to</Text>
                    <View style={styles.replyUserRow}>
                      <Image
                        source={{ uri: item.replyUserImage}}
                        style={styles.replyPreviewAvatar}
                      />
                      <Text style={styles.replyPreviewName}>
                        {item.replyUserName}:{" "}
                        <Text numberOfLines={1} style={styles.replyPreviewNamee}>
                          {item.replytext}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={styles.cmMessageBody}>{item.commenttext}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => onSelect(item.id, item.usersfull, item.senderid, item.commenttext)}
                >
                  <Ionicons name="arrow-redo-outline" color="#fff" size={18} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cmPulseButton} onPress={postRoomLikes}>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Ionicons
                      name={likebyme ? "heart" : "heart-outline"}
                      size={18}
                      color={likebyme ? "#ff2ed8" : "#fff"}
                    />
                  </Animated.View>
                  <Text style={styles.cmPulseCount}>{likeCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cmTimestamp}>{formatTimestamp(item.posted_at)}</Text>
          </View>
        </View>
      </Animated.View>
</View>
      {replies.length > 0 && (
        <TouchableOpacity onPress={() => setShowReplies(v => !v)} style={styles.viewReplyButton}>
          <View style={styles.viewReplyLine} />
          <Text style={styles.viewReplyText}>
            {showReplies ? "Hide replies" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && replies.map(reply => (
        <View key={reply.id} style={styles.viewReplyIndent}>
         
          <MemoizedComments
            item={reply}
            userisId={userisId}
            onSelect={(id, name, userid, text) =>
              onSelect(item.id, name, userid, text)
            }
            onSelectidforindex={onSelectidforindex}
            thepostid={thepostid}
            Roomid={Roomid}
            onremove={onremove}
            isAdminstate={isAdminstate}
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
  if (prev.isAdminstate !== next.isAdminstate) return false;
  if (prev.replies.length !== next.replies.length) return false;
  for (let i = 0; i < prev.replies.length; i++) {
    if (prev.replies[i]?.id !== next.replies[i]?.id) return false;
    if (prev.replies[i]?.commenttext !== next.replies[i]?.commenttext) return false;
    if (prev.replies[i]?.likecount !== next.replies[i]?.likecount) return false;
  }
  return true;
});

// ─────────────────────────────────────────
// PostChild
// ─────────────────────────────────────────
const PostChild = React.memo(function PostChild({
  item, user, navigation, Roomid, Adminstate, onDelete, isShow,
}) {
  const searchid = user?.id;
  const roomdetais = item.id;
  const videoRef = useRef({});

  const [likebyme, setLikebyme] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isMutating, setIsMutating] = useState(false);
  const [postComments, setPostComments] = useState([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [commentModal, setCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const isUser = item.sender_id === searchid;
  const [selectedValue, setSelectedValue] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [book,setisbook]=useState(false)
  const bookref=useRef(new Animated.Value(1)).current;
const isbookmark=()=>{
setisbook(true);
Animated.sequence([
  Animated.timing(bookref,{
    toValue:1.3,
    duration:150,
    useNativeDriver:true
  }),
  Animated.timing(bookref,{
    toValue:1,
    duration:150,
    useNativeDriver:true
  })
]).start()

}
  const didInitialLoad = useRef(false);
  const [showPost, setShowPost] = useState(false);

  const upperComments = postComments.filter(c => c.replyid === null);

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
    const index = postComments.findIndex(u => u.id === theid);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    }
  }, [postComments]);

  // Fetch like state
  useEffect(()=>{
    if(!searchid || !roomdetais) return;
    const fetchlikestate=async()=>{
     
      try{
        const res=await fetch(`${API_BASE_URL}/fetchlikestate?user=${searchid}&room=${roomdetais}`)
        if(!res.ok){
          console.log('something went wrong');
          return;
        }
        const data=await res.json()
        setLikebyme(data.length>0)
      }catch(err){
        console.log(err);
      }
        }
        fetchlikestate()
  },[searchid,roomdetais])
   useEffect(()=>{
    const fetchlikes=async()=>{
      if(!searchid || !roomdetais) return
      try{
        const res=await fetch(`${API_BASE_URL}/fetchlikes?room=${roomdetais}`)
        if(!res.ok){
          console.log('something went wrong');
          return;
        }
        const data=await res.json()
        setLikeCount(data.count)
      }catch(err){
        console.log(err);
      }
    }
    fetchlikes()
   },[searchid,roomdetais])

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (showPost) return;
      setShowPost(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/fetchpostcomment?postid=${roomdetais}&roomid=${Roomid}&userIs=${searchid}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setPostComments(data);
      } catch (err) {
        console.warn("Comment fetch error:", err.message);
      } finally {
        setShowPost(false);
      }
    };
    fetchComments();
  }, [roomdetais, Roomid]);

  // Socket — new comments
  useEffect(() => {
    const handler = (data) => {
      if (data.postid === roomdetais) {
        setPostComments(prev => [...prev, data.newComment]);
      }
    };
    socket.on("ReleaseComment", handler);
    return () => socket.off("ReleaseComment", handler);
  }, [roomdetais]);

  // Scroll to end on new comment — but skip initial load
  useEffect(() => {
    if (!didInitialLoad.current) {
      didInitialLoad.current = true;
      return;
    }
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [postComments.length]);

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
      const endpoint = willBeLiked ?`addroomlikes`:`removeroomlikes`
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchid, roomdetais }),

      });
      if (!res.ok) {
        setLikebyme(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
        console.log('error');
      }
      
    } catch {
      setLikebyme(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.log('error1');
    } finally {
      setIsMutating(false);
    }
  };

  const loadOlderComments = async () => {
    if (loadingMore || !hasMore || postComments.length === 0) return;
    setLoadingMore(true);
    try {
      const lastPosted = postComments[postComments.length - 1].posted_at;
      const res = await fetch(
        `${API_BASE_URL}/getcommentolder?lasttime=${lastPosted}&postid=${roomdetais}&roomid=${Roomid}&userIs=${searchid}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPostComments(prev => {
          const existing = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(p => !existing.has(p.id))];
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    socket.emit("RoomComment", {
      postid: roomdetais,
      roomid: Roomid,
      usersId: searchid,
      comment: commentText,
      replycommentid: selectedValue?.commentupdateid ?? null,
      replyusersid: selectedValue?.replyuserId ?? null,
      replyuserstext: selectedValue?.replyusertext ?? null,
    });
    setCommentText("");
    setSelectedValue(null);
  };

  const deletePost = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/deleteroompostlogic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomdetais, searchid }),
      });
      if (!res.ok) return;
      onDelete(roomdetais);
    } catch (err) {
      console.warn("Delete post error:", err.message);
    }
  };

  const renderComment = useCallback(({ item: comment }) => {
    const replying = postComments.filter(c => c.replyid === comment.id);
    return (
      <MemoizedComments
        item={comment}
        userisId={searchid}
        onSelect={setUser}
        onSelectidforindex={setUserIndex}
        thepostid={roomdetais}
        Roomid={Roomid}
        onremove={(id) => setPostComments(prev => prev.filter(a => a.id !== id))}
        isAdminstate={Adminstate}
        setScrollEnabled={setScrollEnabled}
        replies={replying}
        onLikeupdate={(id,liked,count)=>setPostComments(prev=>
          prev.map(c=>c.id===id?{...c,likestate:liked,likecount:count}:c)
          )}
      />
    );
  }, [setUser, setUserIndex, searchid, postComments]);

  const postImages = safeParse(item.postimage);
  const postVideos = safeParse(item.postvideo);

  return (
    <View style={styles.post}>
      <View style={styles.userRow}>
        <Image
          source={{ uri: item.image}}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username} numberOfLines={1}>{item.fullname}</Text>
            <Text style={styles.handle} numberOfLines={1}>@{item.usersname}</Text>
          </View>
          <Text style={styles.time}>{formatTimestamp(item.posted_at)}</Text>
        </View>
        {(isUser || Adminstate) && (
          <TouchableOpacity style={styles.moreBtn} onPress={()=>
          Alert.alert('Confirm Delete','Are you sure you want to delete this post',
          [{text:'Cancel',style:'default',onPress:()=>{console.log('Woah')}},
        {text:'delete',style:'destructive',onPress:()=>deletePost()}])
          }>
            <Ionicons name="ellipsis-horizontal-outline" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View> 

      {item.post ? <Text style={styles.postText}>{item.post}</Text> : null}

      {(postImages.length > 0 || postVideos.length > 0) && (
        <View style={styles.mediaContainer}>
          {[...postImages, ...postVideos].map((uri, index) => {
            const total = postImages.length + postVideos.length;
            const fullUri = `${uri}`;
            const isVideo = postVideos.includes(uri);
            let itemWidth = "100%";
            let itemHeight = 450;
            if (total === 2) { itemWidth = "49.5%"; itemHeight = 400; }
            if (total === 3) {
              itemWidth = index === 2 ? "100%" : "49.5%";
              itemHeight = index === 2 ? 320 : 260;
            }
            if (total >= 4) { itemWidth = "49.5%"; itemHeight = 260; }

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={[styles.mediaItem, { width: itemWidth, height: itemHeight }]}
                onPress={() => {
                 
                  Object.values(videoRef.current).forEach(ref => ref?.pauseAsync());
                  navigation.navigate("ViewImage", { imagevalue: fullUri, mediatype: isVideo ? "video" : "image" });
                }}
              >
                {isVideo ? (
                  <Video
                    source={{ uri: fullUri }}
                    ref={(ref) => { videoRef.current[index] = ref; }}
                    style={styles.mediaContent}
                    resizeMode="cover"
                    useNativeControls
                    shouldPlay={false}
                    isLooping={false}
                    isMuted
                  />
                ) : (
                  <Image source={{ uri: fullUri }} resizeMode="cover" style={styles.mediaContent} />
                )}
                {total > 4 && index === 3 && (
                  <View style={styles.mediaOverflow}>
                    <Text style={styles.mediaOverflowText}>+{total - 4}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.reactions}>
  {/* Upvote pill */}
  <View style={styles.upvotePill}>
    <TouchableOpacity style={styles.upvoteBtn} onPress={postRoomLikes}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={likebyme ? "arrow-up-circle" : "arrow-up-circle-outline"}
          size={18}
          color={likebyme ? "#FF9500" : "rgba(255,255,255,0.4)"}
        />
      </Animated.View>
      <Text style={[styles.upvoteCount, likebyme && { color: '#FF9500' }]}>
        {formatNumber(likeCount)}
      </Text>
    </TouchableOpacity>
    {/* <View style={styles.upvoteSep} />
    <TouchableOpacity style={styles.upvoteBtn}>
      <Ionicons name="arrow-down-circle-outline" size={18} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity> */}
  </View>

  {/* Comments */}
  <TouchableOpacity style={styles.reactionBtn} onPress={() => setCommentModal(true)}>
    <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.4)" />
    <Text style={styles.reactText}>{formatNumber(upperComments.length)}</Text>
  </TouchableOpacity>

  <View style={styles.reactionSpacer} />

  
  <TouchableOpacity style={styles.bookmarkBtn} onPress={isbookmark}>
  <Animated.View style={{ transform: [{ scale: bookref }] }}>
    <Ionicons
      name={book ? 'bookmark' : 'bookmark-outline'}
      size={22}
      color={book ? '#FF9500' : 'rgba(255,255,255,0.35)'}
    />
  </Animated.View>
</TouchableOpacity>
</View>

      {/* Comment modal */}
      <Modal
        visible={commentModal}
        animationType="slide"
        onRequestClose={() => setCommentModal(false)}
        transparent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={styles.commentModalOverlay}>
            <Pressable style={{ flex: 1 }} onPress={() => setCommentModal(false)} />
            <View style={styles.commentModalSheet}>
              <View style={styles.grabber} />
              <View style={styles.commentModalHeader}>
                <Text style={styles.commentModalTitle}>{postComments.length} Comments</Text>
                <Pressable onPress={() => setCommentModal(false)} style={styles.commentModalClose}>
                  <Ionicons name="close" size={22} color="#fff" />
                </Pressable>
              </View>

              {isShow && (
                <View style={styles.swipeBanner}>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                  <Text style={styles.swipeBannerText}>
                    Swipe right to delete {Adminstate ? "a" : "your"} comment
                  </Text>
                </View>
              )}

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
                    <View style={{ paddingVertical: 16, alignItems: "center" }}>
                      <ActivityIndicator color={colors.accent.purple} />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                }
                style={{ flex: 1 }}
              />

              <View style={styles.inputArea}>
                {selectedValue && (
                  <View style={styles.replyTag}>
                    <View style={styles.replyTagContent}>
                      <Ionicons name="arrow-undo-outline" size={13} color="#6D5BFF" />
                      <Text style={styles.replyTagText}>
                        Replying to{" "}
                        <Text style={{ fontWeight: "600" }}>{selectedValue.usersname}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedValue(null)}>
                      <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.inputBar}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    placeholder="Type a comment..."
                    style={styles.inputText}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    blurOnSubmit={false}
                    returnKeyType="send"
                    onSubmitEditing={handleComment}
                  />
                  <Pressable
                    onPress={handleComment}
                    style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.4 }]}
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
    </View>
  );
});

// ─────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────
export default function DesignersHubScreen({ navigation, route }) {
  const { roomid, roomname, roomcreator } = route.params;
  const { user } = useContext(AuthorContext);
  const searchid = user?.id;

  const [postsArray, setPostsArray] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [bioModal, setBioModal] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioStore, setBioStore] = useState(null);
  const [roomImage, setRoomImage] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showReport, setShowReport] = useState(false);
  

  const bannerAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const postsArrayRef = useRef(postsArray);
  const showKey = `${searchid}-showkey`;
  const isAdmin = searchid === roomcreator;

  useEffect(() => { postsArrayRef.current = postsArray; }, [postsArray]);

  
  // Socket setup
  useEffect(() => {
    if (!searchid || !roomid) return;
    socket.emit("joingrouproom", { receiveroomid: roomid, usersValue: searchid });

    const onOnline = (count) => setOnlineCount(count);
    // BUG FIX: store handler reference for proper cleanup
    const onImage = (value) => setRoomImage(value);
    const onBio = (data) => setBioStore(data);

    socket.on("online-count", onOnline);
    socket.on("getimage", onImage);
    socket.on("gottenbio", onBio);

    return () => {
      socket.emit("leavegrouproom", roomid);
      socket.off("online-count", onOnline);
   
      socket.off("getimage", onImage);
      socket.off("gottenbio", onBio);
    };
  }, [searchid, roomid]);

  // Fetch room image + bio
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/roomimage?roompassid=${roomid}`);
        if (!res.ok) return;
        const data = await res.json();
        setRoomImage(data.room_image);
        setBioStore(data.roombio);
      } catch (err) {
        console.warn("Room image fetch:", err.message);
      }
    };
    fetch_();
  }, [roomid]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getroom?roomid=${roomid}`);
        if (!res.ok) return;
        const data = await res.json();
        setPostsArray(data);
      } catch (err) {
        console.warn("Posts fetch error:", err.message);
      }
    };
    fetchPosts();
  }, [roomid]);

  // Swipe hint — show once per user
  useEffect(() => {
    if (!searchid) return;
    AsyncStorage.getItem(showKey).then(val => {
      if (!val) {
        setShowSwipeHint(true);
        AsyncStorage.setItem(showKey, `shown-${searchid}`);
      }
    });
  }, [searchid]);

 useEffect(()=>{
const handler=(data)=>{
  if(data.room_of_posts_id!==roomid) return;
  if(data.sender_id===searchid){
    setPostsArray(prev=>{
      const existing =new Set(prev.map(p=>p.id))
      if(existing.has(data.id)) return prev;
      return [data,...prev]

    }
      );
      flatListRef.current?.scrollToOffset({offset:0,animated:true})
  }else{
    triggerBanner[data]
  }
}
socket.on('PushResponse',handler);
return()=>socket.off('PushResponse',handler)
 },[roomid,searchid])
  useEffect(() => {
    if (!postsArrayRef.current.length) return;
    const interval = setInterval(async () => {
      try {
        const arr = postsArrayRef.current;
        if (!arr.length) return;
        const res = await fetch(
          `${API_BASE_URL}/getroomlater?checktime=${arr[0].posted_at}&roomid=${roomid}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) triggerBanner(data);
      } catch (err) {
        console.warn("Poll error:", err.message);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [roomid]);

  const triggerBanner = (fetchedPosts) => {
    setPendingPosts(fetchedPosts);
    setShowBanner(true);
    Animated.spring(bannerAnim, { toValue: 1, useNativeDriver: true, friction: 10, tension: 80 }).start();
  };

  const mergeBanner = () => {
    Animated.timing(bannerAnim, { toValue: 0, useNativeDriver: true, duration: 200 }).start(() => {
      setPostsArray(prev => {
        const existing = new Set(prev.map(p => p.id));
        return [...pendingPosts.filter(p => !existing.has(p.id)), ...prev];
      });
      setPendingPosts([]);
      setShowBanner(false);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  };

  const loadOlderPosts = async () => {
    if (loadingMore || !hasMore || postsArray.length === 0) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/getroomolder?lasttime=${postsArray[postsArray.length - 1].posted_at}&roomid=${roomid}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPostsArray(prev => {
          const existing = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(p => !existing.has(p.id))];
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleimage = async () => {
    
     
  
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Access required to access photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;
    setRoomImage(null)


   const asset=result.assets[0]
   try{
    const formData1=new FormData();
    formData1.append("image", {
      uri: asset.uri,
      type: asset.type || "image/jpeg",
      name: asset.fileName || "room.jpg",
    });      
  
   
   
    const postimage=await fetch(`${API_BASE_URL}/api/upload`,{
      method:'POST',
      body:formData1
    })
    if(!postimage.ok) {
      console.log('something is wrong ');
      return;
    }
    const data=await postimage.json()
  
    const theimage=data.imageUrl
    if (!socket) return;
socket.emit("sendimage", theimage);


   }
   catch(err){
    Alert.alert("Upload failed", "Could not upload image."); 
   }

 
};

  const handleBio = () => {
    if (!bioText.trim()) return;
    socket.emit("updatebio", bioText);
    setBioModal(false);
  };

  const confirmLeave = () => {
    Alert.alert(
      isAdmin ? "Delete Room" : "Leave Room",
      "Are you sure? This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: isAdmin ? "Delete" : "Leave", style: "destructive", onPress: leaveLogic },
      ]
    );
  };

  const leaveLogic = async () => {
    if (!searchid || !roomid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${isAdmin ? "Deleteroom" : "leaveroom"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomid, searchid }),
      });
      if (!res.ok) return;
    } catch (err) {
      console.warn("Leave error:", err.message);
    } finally {
      navigation.navigate("InterestRoom");
    }
  };

  
  const ListFooter = useCallback(() =>
    loadingMore ? (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator color={colors.accent.purple} />
      </View>
    ) : null
  , [loadingMore]);

  const imageSource = roomImage
    ? { uri: roomImage }
    : FALLBACK_ROOM_IMAGE; // BUG FIX: no more watermark fallback

  return (
    <LinearGradient colors={["#0b0f14", "#080812"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* Header image */}
        <ImageBackground
          style={styles.header}
          source={imageSource}
          imageStyle={styles.headerImage}
        >
          <View style={styles.overlay} />
          <View style={styles.topIconsRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation.navigate("InterestRoom")}
            >
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpenModal(true)} style={styles.headerMenuBtn}>
              <Feather name="more-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.title}>#{roomname}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{onlineCount} online</Text>
          </View>
          {bioStore ? (
            <Text style={styles.roomBio} numberOfLines={4}>{bioStore}</Text>
          ) : null}
        </View>

        {/* New posts banner */}
        {showBanner && (
          <Animated.View style={[styles.newPostsBanner, {
            opacity: bannerAnim,
            transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }]}>
            <TouchableOpacity style={styles.newPostsPill} onPress={mergeBanner} activeOpacity={0.8}>
              <Ionicons name="time-outline" size={13} color="#fff" />
              <Text style={styles.newPostsText}>
                {formatNumber(pendingPosts.length)} new {pendingPosts.length === 1 ? "post" : "posts"}
              </Text>
              <Ionicons name="chevron-down" size={13} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Report sheet */}
        {showReport && (
          <Slideupbar
            senderId={searchid}
            reporthead="Room"
            reportedname={roomname}
            stuffimage={roomImage}
            onClose={() => setShowReport(false)}
          />
        )}

        {/* Posts feed */}
        <FlatList
          ref={flatListRef}
          data={postsArray}
          onEndReached={loadOlderPosts}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostChild
              item={item}
              navigation={navigation}
              user={user}
              Roomid={roomid}
              Adminstate={isAdmin}
              isShow={showSwipeHint}
              onDelete={(id) => setPostsArray(prev => prev.filter(p => p.id !== id))}
            />
          )}
          contentContainerStyle={styles.scrollContent}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts yet.</Text>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("NewPostScreen", { roomid })}
        >
          <LinearGradient
            colors={["#9333ea", "#6366f1"]}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Options modal */}
        <Modal
          animationType="fade"
          transparent
          visible={openModal}
          onRequestClose={() => setOpenModal(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setOpenModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.menuBox}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setOpenModal(false); confirmLeave(); }}>
                  <Feather name={isAdmin ? "trash-2" : "log-out"} size={15} color="#f87171" />
                  <Text style={[styles.menuText, { color: "#f87171" }]}>
                    {isAdmin ? "Delete Room" : "Leave Room"}
                  </Text>
                </TouchableOpacity>

                {isAdmin && (
                  <>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity 
  style={styles.menuItem} 
  onPress={handleimage} 
  disabled={!isAdmin}
>
  <Feather name="image" size={15} color={colors.text.primary} />
  <Text style={styles.menuText}>Change Wallpaper</Text>
</TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setOpenModal(false); setBioModal(true); }}>
                      <Feather name="edit-3" size={15} color={colors.text.primary} />
                      <Text style={styles.menuText}>Edit Room Bio</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => { setOpenModal(false); navigation.navigate("MembersScreen", { roomid, roomname, roomcreator }); }}
                >
                  <Feather name="users" size={15} color={colors.text.primary} />
                  <Text style={styles.menuText}>View Members</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />
                 <TouchableOpacity style={styles.menuItem} onPress={() => { setOpenModal(false); setShowReport(true); }}> 
                  <Feather name="flag" size={15} color="#f87171" />
                  <Text style={[styles.menuText, { color: "#f87171" }]}>Report Room</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* Bio modal */}
        <Modal visible={bioModal} animationType="fade" transparent>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.bioModalOverlay}>
                <View style={styles.bioModalBox}>
                  <Text style={styles.bioModalTitle}>Room Bio</Text>
                  <TextInput
                    value={bioText}
                    onChangeText={setBioText}
                    placeholder="Add a bio for this room..."
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    multiline
                    textAlignVertical="top"
                    style={styles.bioInput}
                    maxLength={200}
                  />
                  <View style={styles.bioActions}>
                    <TouchableOpacity style={styles.bioCancelBtn} onPress={() => setBioModal(false)}>
                      <Text style={styles.bioCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bioSaveBtn} onPress={handleBio}>
                      <Text style={styles.bioSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

  // ── Header ──
  header: { width: "100%", height: 200, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden", marginBottom: 8 },
  headerImage: { resizeMode: "cover" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  topIconsRow: { position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  headerMenuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },

  // ── Info box ──
  infoBox: {
    marginHorizontal: 16, marginTop: -28, padding: 16, borderRadius: 20,
    backgroundColor: "rgba(20,20,35,0.92)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  title: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  onlineText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  roomBio: { marginTop: 8, fontSize: 13, lineHeight: 18, color: "rgba(203,213,225,0.8)" },

  // ── New posts banner ──
  newPostsBanner: { alignItems: "center", marginTop: 8, marginBottom: 4, zIndex: 10 },
  newPostsPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
  },
  newPostsText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // ── Post card ──

  post: {
  backgroundColor: '#111827',
  borderRadius: 14,
  padding: 0,
  overflow: 'hidden',
  marginBottom: 6,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
},
userRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  padding: 14,
  paddingBottom: 10,
  gap: 10,
},
avatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
},

userInfo: {
  flex: 1,
  marginLeft: 0,
},

nameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
},

username: {
  color: '#f1f5f9',
  fontWeight: '600',
  fontSize: 14,
},
handle: {
  color: 'rgba(255,255,255,0.35)',
  fontSize: 12,
},

time: {
  color: 'rgba(255,255,255,0.28)',
  fontSize: 11,
  marginTop: 2,
},
moreBtn: {
  padding: 6,
  borderRadius: 8,
},

postText: {
  color: '#e2e8f0',
  fontSize: 14,
  lineHeight: 21,
  paddingHorizontal: 14,
  paddingBottom: 10,
},

  // ── Media ──
  mediaContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
  mediaItem: { marginBottom: 4, borderRadius: 12, overflow: "hidden", backgroundColor: "#222" },
  mediaContent: { width: "100%", height: "100%", borderRadius: 12 },
  mediaOverflow: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  mediaOverflowText: { color: "#fff", fontSize: 24, fontWeight: "800" },

  // ── Reactions ──
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  
  // Upvote pill — wraps like/dislike together
  upvotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  
  upvoteSep: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  
  upvoteCount: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  
  reactText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Add this new one for the spacer
  reactionSpacer: {
    flex: 1,
  },
  
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: 'rgba(255,255,255,0.35)',
  },
  
  shareBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },

  // ── FAB ──
  fab: { position: "absolute", bottom: 24, right: 20 },
  fabGradient: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", elevation: 8 },

  // ── Comment modal ──
  commentModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  commentModalSheet: { height: "82%", backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 8 },
  commentModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#222" },
  commentModalTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  commentModalClose: { position: "absolute", right: 10 },
  swipeBanner: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,59,48,0.85)", alignSelf: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginVertical: 8 },
  swipeBannerText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  noComments: { textAlign: "center", marginTop: 30, fontSize: 14, color: "rgba(255,255,255,0.3)" },
  inputArea: { paddingHorizontal: 0, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 24 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)", gap: 6 },
  replyTag: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  replyTagContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  replyTagText: { color: "#ccc", fontSize: 13 },
  inputBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#1c1c1e", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20 },
  inputText: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 4 },
  sendBtn: { marginLeft: 8, backgroundColor: colors.accent.purple, padding: 8, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // ── Options menu ──
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  menuBox: { position: "absolute", top: 56, right: 16, width: 200, borderRadius: 16, backgroundColor: "rgba(20,20,36,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingVertical: 4, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  menuText: { color: "#e5e7eb", fontSize: 14, fontWeight: "500" },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 16 },

  // ── Bio modal ──
  bioModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  bioModalBox: { width: "100%", backgroundColor: "#13111f", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(147,51,234,0.2)" },
  bioModalTitle: { fontSize: 16, fontWeight: "700", color: "#f0ecff", marginBottom: 12 },
  bioInput: { width: "100%", minHeight: 100, borderRadius: 12, padding: 12, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle, color: "#f0ecff", fontSize: 14, textAlignVertical: "top", marginBottom: 14 },
  bioActions: { flexDirection: "row", gap: 10 },
  bioCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle, alignItems: "center" },
  bioCancelText: { color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  bioSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accent.purple, alignItems: "center" },
  bioSaveText: { color: "#fff", fontWeight: "700" },

  // ── Comments ──
  cmRootShell: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)", position: "relative" },
  cmRootShellSwipe: { width: "100%", backgroundColor: "#111", borderRadius: 12 },
  deleteContain: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    width: 72,
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cmPrimaryLane: { flexDirection: "row" },
  cmAvatarOrb: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: "#333" },
  cmContentColumn: { flex: 1 },
  cmTopRow: { flexDirection: "row", alignItems: "flex-start" },
  cmTextColumn: { flex: 1 },
  cmHandleText: { color: "#8e8e93", fontWeight: "500", fontSize: 14 },
  cmMessageBody: { color: "#e5e5ea", fontSize: 13, lineHeight: 19, marginTop: 2 },
  cmTimestamp: { color: "#8e8e93", fontSize: 11, marginTop: 4 },
  cmPulseButton: { marginTop: 4, marginLeft: 8, alignItems: "center", flexDirection: "row", gap: 4 },
  cmPulseCount: { color: "#8e8e93", fontSize: 12 },
  replyPreviewBubble: { backgroundColor: "rgba(109,91,255,0.12)", borderLeftWidth: 2.5, borderLeftColor: "rgba(109,91,255,0.5)", padding: 7, borderRadius: 8, borderTopLeftRadius: 0, marginBottom: 5, alignSelf: "flex-start" },
  replyLabel: { fontSize: 10, color: "rgba(109,91,255,0.7)", marginBottom: 2 },
  replyUserRow: { flexDirection: "row", alignItems: "center" },
  replyPreviewAvatar: { width: 16, height: 16, borderRadius: 8, marginRight: 5 },
  replyPreviewName: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  replyPreviewNamee: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontStyle: "italic" },
  viewReplyButton: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, gap: 6 },
  viewReplyLine: { width: 20, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  viewReplyText: { color: "#1D9BF0", fontSize: 12, fontWeight: "600" },
  viewReplyIndent: { marginLeft: 18, borderLeftWidth: 1.5, borderLeftColor: "rgba(255,255,255,0.07)" },
  emptyText: { color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 30, fontSize: 14 },
});