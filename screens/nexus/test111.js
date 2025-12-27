const VideoItem = ({ item, navigation,onLikeUpdate ,isActive,socket,userValue}) => {
    const animatedSize=useRef(new Animated.Value(1)).current;
   const [pause,setPaused]=useState(false)
     const [likevalue,setLikevalue]=useState(false)
     const [openModal,setOpenModal]=useState(false)
     const [commentState,setCommentState]=useState([]);
     // const [asyncState,SetasyncState]=useState(null)
     const videoRef = useRef(null);
     const [commentQuery,setCommentQuery]=useState('')
    const {user}=useContext(AuthorContext);
    const users=user?.id;
    const theuserimage=user?.image;
    const theusername=user?.fullname;
    const [playState,setPlayState]=useState(true);
    
   
     useEffect(() => {
       if (videoRef.current) {
         if(isActive){
           videoRef.current.playAsync()
           setPlayState(true);
         }else{
           videoRef.current.pauseAsync()
           setPlayState(false)
         }
       }
     }, [isActive]);
     useEffect(() => {
       const loadLikes = async () => {
         const stored = await AsyncStorage.getItem(`sample-${item.id}`);
         if (stored !== null) setLikevalue(JSON.parse(stored));
       };
       loadLikes();
     }, []);
   useEffect(()=>{
     const fetchComment=async()=>{
       try{
         const fetchparams= new URLSearchParams({
           userId:users,
           videovalue:item.id
         })
         const res=await fetch(`${API_BASE_URL}/fetchingcomment?searching=${fetchparams}`)
         if(!res.ok){
           console.log('Something went wrong in commentfetch');
           return;
         }
         const data=await res.json();
         setCommentState(data)
       }catch(err){
         console.log('Something went wrong in commentfetch', err);
       }
     }
     fetchComment();
   },[])
    useEffect(()=>{
     const commentSend=item?.id;
     if(!socket) return;
     socket.emit('JoinComment',commentSend);
    },[])
    useEffect(() => {
     if (!socket) return;
   
     socket.on("NewComment", (value) => {
       const UpdatedMessage = {
         id: value.id,
         videoid: value.videoid,
         userid: value.userid,
         actul_comment: value.actual_comment,
         usersname: value.namee,
         usersimage: value.imagee,
       };
       setCommentState(prev => [...prev, UpdatedMessage]);
     });
   
     return () => socket.off("NewComment");
   }, [socket]);
   
     const runHeartanimation = () => {
       setTimeout(() => {
         Animated.sequence([
           Animated.timing(animatedSize, { toValue: 1.3, duration: 150, useNativeDriver: true }),
           Animated.timing(animatedSize, { toValue: 1, duration: 150, useNativeDriver: true })
         ]).start();
       }, 200);
     };
     
     const number=(count)=>{
       if(count<=1000){
         return count;
       }else if(count>=1000 &&count<=1000000){
         return `${(count/1000).toFixed(1)}k `
       }else if(count>=100000 && count<=1000000000){
        return `${(count/1000000).toFixed(1)}m`
     }
     
   }
   
     const toggleLike = async (item) => {
       runHeartanimation()
       const postId = item?.id;
       const newLikeValue = !likevalue; // toggle
     
       try {
         const endpoint = newLikeValue ? 'postlikesincrease' : 'postlikesdecrease';
         const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ postId,userValue })
         });
     
         if (!res.ok) {
           console.log('Something wrong posting likes in campusShowcase');
           return; // exit without updating local state
         }
     
         // ✅ only update state if backend call succeeds
         const newCount = newLikeValue ? item.likes + 1 : item.likes - 1;
         onLikeUpdate(postId, newCount);
         setLikevalue(newLikeValue);
         await AsyncStorage.setItem(`sample-${postId}`, JSON.stringify(newLikeValue));
     
       } catch (err) {
         console.log('Something wrong posting likes in campusShowcase', err);
       }
     };
     useFocusEffect(
       useCallback(() => {
         return () => {
           if (videoRef.current) {
             videoRef.current.pauseAsync();
           }
         };
       }, [])
     );
     
   
   
   const renderItemVideo = ({ item }) => (
     <View style={styles.commentItem}>
       <Image source={{ uri: `${API_BASE_URL}/uploads/${item.usersimage}` }} style={styles.commentAvatar} />
       <View style={styles.commentTextArea}>
         <Text style={styles.commentUser}>{item.usersname}</Text>
         <Text style={styles.commentText}>{item.actul_comment}</Text>
       </View>
     </View>
   );
   
   const sendComment = () => {
     if (!currentComment.trim()) return;
     socket.emit("SendVideoComment", {
       videoo: item.id,
       user: users,
       comment: commentQuery,
       usersimage: theuserimage,
       usersname: theusername,
     });
     setCurrentComment("");
   };
   
     return (
       <LinearGradient
       colors={["#0A0F1F", "#1A2240"]} // dark navy blend
       style={{ height, width }}
     >
         <TouchableOpacity onPress={()=>{setPaused(prev=>!prev)}}>
         {/* VIDEO */}
         <Video
           ref={videoRef}
           source={{ uri: item?.video ? `${API_BASE_URL}${item.video}` : null }}
           style={styles.video}
           resizeMode="cover"
   isLooping
   isMuted={false}
   volume={1.0}
   useNativeControls={false}
   shouldPlay={!pause && isActive}
         />
         </TouchableOpacity>
         
   
   
         {/* HEADER */}
         {/* <View style={styles.header}>
         
         
         </View> */}
   
         {/* RIGHT SIDE BUTTONS */}
   
         {!playState && (
     <TouchableOpacity 
       style={styles.play}
       onPress={() => {
         videoRef.current.playAsync();
         setPlayState(true);
       }}
     >
       <FontAwesome name="play" size={40} color="white" />
     </TouchableOpacity>
   )}
   
         <View style={styles.bottomInfo}>
           <Text style={styles.username}>@{item.username}</Text>
           {/* <Text style={styles.title}>{item.title}</Text> */}
           <Text style={styles.caption}>{item.caption}</Text>
         </View>
   
         <View style={styles.bottomPanel}>
   
             <TouchableOpacity style={styles.actionBtn} onPress={()=>navigation.navigate('Profile',{userId:item.sender_id})}>
        <View style={styles.icon}><Image source={{ uri: item.userimage ?`${API_BASE_URL}/uploads/${item.userimage}` :null}} style={styles.image} /></View>
           </TouchableOpacity>
   
           <TouchableOpacity style={styles.actionBtn} onPress={()=>toggleLike(item)}>
             <Animated.View style={{transform:[{scale:animatedSize}]}}>
             <Text 
     style={[
       styles.icon 
      
     ]}
   >
   <FontAwesome 
     name={likevalue ? "heart" : "heart-o"} 
     size={28} 
     color={likevalue ? 'red':'white'}
   />
   </Text>
   
             </Animated.View>
             <Text style={styles.actiontext}>{number(item.likes)}</Text>
           </TouchableOpacity>
   
           <TouchableOpacity style={styles.actionBtn} onPress={()=>setOpenModal(true)}>
             <Text style={styles.icon}><FontAwesome name="comment-o" size={28} color="white"/></Text>
             <Text style={styles.actiontext}>{item.comment_count}</Text>
           </TouchableOpacity>
   
           {/* <TouchableOpacity style={styles.actionBtn}>
             <Text style={styles.icon}><Feather name="message-circle" size={24} color='white'/></Text>
             <Text style={styles.actiontext}>{item.likes}</Text>
           </TouchableOpacity> */}
         </View>
   
         {/* BOTTOM INFO */}
        
         <Modal
     visible={openModal}
     animationType="slide"
     transparent
   >
     <KeyboardAvoidingView
       style={{ flex: 1 }}
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalSheet}>
   
           {/* HEADER */}
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Comments</Text>
             <TouchableOpacity onPress={() => setOpenModal(false)} style={styles.closeBtn}>
               <Feather name="x" size={24} color="#fff" />
             </TouchableOpacity>
           </View>
   
           {/* COMMENT LIST */}
           <FlatList
             data={commentState}
             renderItem={renderItemVideo}
             style={{ flex: 1 }}
           />
   
           {/* INPUT BAR — now moves up with keyboard */}
           <View style={styles.inputWrapper}>
             <TextInput
               style={styles.inputBox}
               placeholder="Add a comment..."
               placeholderTextColor="rgba(255,255,255,0.5)"
               value={commentQuery}
               onChangeText={setCommentQuery}
             />
   
             <TouchableOpacity onPress={sendComment} style={styles.sendBtn}>
               <Feather name="send" size={22} color="#fff" />
             </TouchableOpacity>
           </View>
   
         </View>
       </View>
     </KeyboardAvoidingView>
   </Modal>
   
   
   </LinearGradient>
     );
   };
   