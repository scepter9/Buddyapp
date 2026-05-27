import React, { useState, useContext } from "react";
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
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { AuthorContext } from "../AuthorContext";
import { colors, radius, spacing } from "../Theme";

const API_BASE_URL = "http://192.168.0.136:3000";

// ── Labelled field ──
function Field({ label, icon, value, onChangeText, placeholder, multiline, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.row, focused && f.rowFocused]}>
        <Feather
          name={icon}
          size={15}
          color={focused ? colors.accent.lavender : "rgba(255,255,255,0.25)"}
          style={{ marginTop: multiline ? 2 : 0 }}
        />
        <TextInput
          style={[f.input, multiline && f.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline={multiline}
          maxLength={maxLength}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {maxLength && (
          <Text style={f.counter}>{value?.length ?? 0}/{maxLength}</Text>
        )}
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)", marginBottom: 7,
  },
  row: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  rowFocused: { borderColor: "rgba(147,51,234,0.5)" },
  input: { flex: 1, color: colors.text.primary, fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 120 },
  counter: { fontSize: 10, color: "rgba(255,255,255,0.2)", alignSelf: "flex-end" },
});

export default function RequestToWrite({ navigation }) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;
  // BUG FIX: was user?.fullname — should match rest of app using user?.name
  const myUserName = user?.name;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    // BUG FIX: request permissions before launching picker
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo library access to add an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const formData = new FormData();
      const ext = asset.uri.split(".").pop() || "jpg";
      formData.append("image", {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.${ext}`,
        type: asset.type || "image/jpeg",
      });

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      if (!uploadData.imageUrl) throw new Error("No image URL returned");

      setImage(uploadData.imageUrl);
    } catch (e) {
      Alert.alert("Upload failed", "Could not upload image. Try again.");
      console.warn("Image upload error:", e.message);
    } finally {
      setUploading(false);
    }
  };

  // BUG FIX: navigation was being destructured from the press event arg (undefined)
  // Now it correctly uses the navigation prop from the component
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please add a title for your story.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Missing content", "Please write your story before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/poststories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          myUserName,
          content: content.trim(),
          image,
          myUserId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Submitted! 🎉", "Your story has been sent for review.", [
          {
            text: "OK",
            // BUG FIX: navigate only on success, and correct screen name (was 'CampusPulsed')
            onPress: () => {
              setTitle("");
              setContent("");
              setImage(null);
              navigation.navigate("CampusPulse");
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to submit story.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Try again.");
      console.warn("Submit error:", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blobTR} pointerEvents="none" />
      <View style={s.blobBL} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Share Your Story</Text>
        <View style={{ width: 38 }} />
      </View>

      <LinearGradient
        colors={["transparent", "#9333ea", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.headerDivider}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Intro */}
          <View style={s.introCard}>
            <View style={s.introIconWrap}>
              <Feather name="edit-3" size={20} color="#c084fc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.introTitle}>Request to write</Text>
              <Text style={s.introDesc}>
                Submit your story or experience to Campus Pulse for review.
              </Text>
            </View>
          </View>

          {/* Fields */}
          <View style={s.fieldsCard}>
            <Field
              label="TITLE"
              icon="type"
              value={title}
              onChangeText={setTitle}
              placeholder="Give your story a title..."
              maxLength={80}
            />
            <Field
              label="YOUR STORY"
              icon="align-left"
              value={content}
              onChangeText={setContent}
              placeholder="Write something meaningful..."
              multiline
              maxLength={3000}
            />
          </View>

          {/* Image picker */}
          <View style={s.imageCard}>
            <Text style={s.imageLabel}>COVER IMAGE</Text>
            <Text style={s.imageHint}>Optional — adds visual appeal to your story</Text>

            {image ? (
              <View style={s.imagePreviewWrap}>
                <Image
                  source={{ uri: `${API_BASE_URL}/uploads/${image}` }}
                  style={s.imagePreview}
                />
                <TouchableOpacity
                  style={s.removeImageBtn}
                  onPress={() => setImage(null)}
                >
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={s.imagePickBtn}
                onPress={pickImage}
                disabled={uploading}
                activeOpacity={0.8}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.accent.lavender} />
                ) : (
                  <>
                    <Feather name="image" size={18} color={colors.accent.lavender} />
                    <Text style={s.imagePickText}>Select image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || uploading}
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={
                  submitting || uploading
                    ? ["rgba(147,51,234,0.4)", "rgba(99,102,241,0.4)"]
                    : ["#9333ea", "#6366f1"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.submitBtn}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="send" size={15} color="#fff" />
                    <Text style={s.submitText}>Submit Story</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },

  blobTR: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(147,51,234,0.08)", top: -60, right: -60,
  },
  blobBL: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(99,102,241,0.06)", bottom: 80, left: -80,
  },

  // ── Header ──
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text.primary },
  headerDivider: { height: 1, marginBottom: 8 },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: 12 },

  // ── Intro card ──
  introCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(147,51,234,0.1)",
    borderWidth: 1, borderColor: "rgba(147,51,234,0.2)",
    borderRadius: radius.lg, padding: 14, marginBottom: 16,
  },
  introIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  introTitle: { fontSize: 13, fontWeight: "700", color: colors.text.primary },
  introDesc: { fontSize: 11, color: colors.text.muted, marginTop: 2, lineHeight: 16 },

  // ── Fields card ──
  fieldsCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 16, marginBottom: 14,
  },

  // ── Image card ──
  imageCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 16, marginBottom: 20,
  },
  imageLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)", marginBottom: 4,
  },
  imageHint: { fontSize: 11, color: colors.text.muted, marginBottom: 12 },
  imagePickBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(147,51,234,0.1)",
    borderWidth: 1, borderColor: "rgba(147,51,234,0.2)",
    borderRadius: radius.md, padding: 14,
    borderStyle: "dashed",
  },
  imagePickText: { fontSize: 13, color: colors.accent.lavender, fontWeight: "600" },
  imagePreviewWrap: { position: "relative" },
  imagePreview: {
    width: "100%", height: 160, borderRadius: radius.md,
  },
  removeImageBtn: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Actions ──
  actions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 0.4,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
  },
  cancelText: { color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: 14 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: radius.lg, paddingVertical: 15,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});