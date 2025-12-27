import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";
import { AuthorContext } from "../AuthorContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.0.136:3000";

function CommentSection({ item }) {
  return (
    <View style={styles.comment}>
      <View style={styles.commentHeader}>
        <Text style={styles.name}>{item.users_name}</Text>
        <Text style={styles.timeText}>• Just now</Text>
      </View>
      <Text style={styles.commentText}>{item.comment_text}</Text>
    </View>
  );
}

export default function PitchScreen({ route }) {
  const { user } = useContext(AuthorContext);
  const usersname = user?.fullname;
  const users = user?.id;
  const { pitchid } = route.params;

  const [pitchdatava, setpitchdatava] = useState({});
  const [socket, setSocket] = useState(null);
  const [commentcount, setcommentcount] = useState(0);
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const commentSocket = io(API_BASE_URL, {
      query: { userId: users },
      transports: ["websocket"],
    });
    setSocket(commentSocket);
    commentSocket.on("connect", () => {
      console.log("User Connected");
    });
    return () => commentSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("joinPitch", pitchid);
    }
  }, [socket]);

  useEffect(() => {
    const Fetchmaindetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/fetchuserpitch?pitch=${pitchid}`);
        const data = await res.json();
        setpitchdatava(data[0]);
      } catch (err) {
        console.log(err);
      }
    };
    Fetchmaindetails();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetchpitchcomment?pitch=${pitchid}`);
        const data = await response.json();
        setComments(data);
        const number = await AsyncStorage.getItem("setcommentcount");
        const numbercount = JSON.parse(number);
        setcommentcount(numbercount);
      } catch (err) {
        console.log(err);
      }
    };
    fetchComments();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("comment", (data) => {
      const formattedcomment = {
        id: data.id,
        users_name: data.user,
        comment_text: data.commenttext,
        pitchid: data.pitchid,
      };
      setComments((prev) => [...prev, formattedcomment]);
      setcommentcount((count) => {
        const newCount = count + 1;
        AsyncStorage.setItem("setcommentcount", JSON.stringify(newCount));
        return newCount;
      });
    });
    return () => socket.off("comment");
  }, [socket]);

  const handlePost = () => {
    if (input.trim().length === 0) {
      Alert.alert("Comment cannot be empty");
      return;
    }
    if (socket) {
      socket.emit("SendComment", {
        username: usersname,
        comment: input,
        pitchuser: pitchid,
      });
    }
    setInput("");
    setcommentcount((count) => {
      const newCount = count + 1;
      AsyncStorage.setItem("setcommentcount", JSON.stringify(newCount));
      return newCount;
    });
  };

  return (
    <LinearGradient
      colors={["#0b0f19", "#151a27", "#181b27"]}
      style={styles.container}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.pitchCard}>
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.03)"]}
            style={styles.pitchInner}
          >
            <Text style={styles.pitchTitle}>{pitchdatava.pitch_title}</Text>
            <Text style={styles.pitchText}>{pitchdatava.pitch_description}</Text>
            <View style={styles.stats}>
              <Text style={styles.stat}>❤️ 123 likes</Text>
              <Text style={styles.stat}>💬 {commentcount || 0} comments</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.commentHeader}>💬 Discussion</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item?.id?.toString()}
          renderItem={({ item }) => <CommentSection item={item} />}
          contentContainerStyle={{ gap: 14 }}
        />
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Drop your thought..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity onPress={handlePost} style={styles.button}>
          <LinearGradient
            colors={["#8b5cf6", "#6366f1"]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.buttonInner}
          >
            <Text style={styles.buttonText}>Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pitchCard: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  pitchInner: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pitchTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pitchText: {
    color: "#a6accd",
    lineHeight: 22,
    fontSize: 15,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  stat: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    color: "#fff",
    fontSize: 13,
  },
  commentHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  comment: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  timeText: {
    color: "#8b92b2",
    fontSize: 12,
  },
  commentText: {
    color: "#c7c9d3",
    fontSize: 14,
    lineHeight: 18,
  },
  inputArea: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 12,
  },
  button: { borderRadius: 12, overflow: "hidden" },
  buttonInner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
