import React, { useState ,useEffect,useContext} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
const API_BASE_URL = "http://192.168.0.136:3000";
import { AuthorContext } from '../AuthorContext';

export default function RequestToWrite({navigation}) {

  const { user } = useContext(AuthorContext);
    const myUserId = user?.id;
    const myUserName=user?.fullname;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);


  const PostValues=async({navigation})=>{
    if (!title || !content) {
      Alert.alert('Please fill in the title and content before submitting');
      return;
    }
    try{
     
      
      const response=await fetch(`${API_BASE_URL}/poststories`,{
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body:JSON.stringify({
title,myUserName,content,image,myUserId
        })

      })
      const data=await response.json()
      if(response.ok){
        console.log('Posted succesfully',data);
      }
      else{
        console.log('Error occured',data);
      }
    }catch(e){
      console.error(`An error occurred:`, e);

    }
    setContent('')
    setTitle('')
    navigation.navigate('CampusPulsed') 
  }
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

     
    const assets=result.assets[0]
    const imageUri=assets.uri;
    const fileName=assets.fileName || imageUri.split("/").pop() || 'photo.png'
    const fileType = assets.type || 'image/jpeg';

    
    try{
      const formData = new FormData();

      formData.append("image",{
        uri:imageUri,
        name:fileName,
        type:fileType,
      });
      const uploadRes=await fetch(`${API_BASE_URL}/api/upload`,{
        method:'POST',
        body:formData,
        headers:{'Content-Type':'multipart/form-data'}
      })
      const uploadResult = await uploadRes.json();
if (!uploadResult.imageUrl) throw new Error('Upload failed');
const uploadResultUri = uploadResult.imageUrl;
setImage(uploadResultUri);


        } catch(e){
          console.log(e);
        }
       
  };


  return (
    <LinearGradient
      colors={["#0f172a", "#1e1b4b", "#312e81"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrapper}>
            <BlurView intensity={80} tint="dark" style={styles.card}>
              <Text style={styles.heading}>✍️ Request to Write</Text>
              <Text style={styles.subText}>
                Submit your story, experience, or thoughts to Campus Pulse 🚀
              </Text>

              <View style={styles.inputField}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  placeholder="Enter your story title"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>Upload Image (optional)</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={{ color: "#cbd5e1" }}>
                    {image ? "Change Image" : "Select Image"}
                  </Text>
                </TouchableOpacity>
                {image && (
                  <Image
                    source={{ uri: `${API_BASE_URL}${image}` }}
                    style={{
                      width: "100%",
                      height: 150,
                      borderRadius: 12,
                      marginTop: 10,
                    }}
                  />
                )}
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>Your Story</Text>
                <TextInput
                  placeholder="Write something meaningful..."
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { height: 140, textAlignVertical: "top" }]}
                  multiline
                  value={content}
                  onChangeText={setContent}
                />
              </View>

              <View style={styles.emojiBar}>
                {["🔥", "💡", "🎉", "🌍", "✨"].map((emoji, i) => (
                  <Text key={i} style={styles.emoji}>
                    {emoji}
                  </Text>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={()=>navigation.goBack()}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.send]} onPress={PostValues}>
                  <Text style={styles.sendText}>Send 🚀</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardWrapper: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    padding: 24,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#f1f5f9",
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
  },
  uploadBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  emojiBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginVertical: 16,
  },
  emoji: {
    fontSize: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cancelText: {
    color: "#f1f5f9",
    fontWeight: "600",
  },
  send: {
    backgroundColor: "#4f46e5",
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
});
