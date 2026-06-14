import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
  StatusBar, 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AuthorContext } from "../AuthorContext";
import { colors, radius, spacing } from "../Theme";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

// ── Custom Select component (replaces Picker) ─────────────────────────────
function CustomSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={s.selectBox}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={s.selectValue}>{selected?.label ?? "Select..."}</Text>
        <Feather name="chevron-down" size={16} color={colors.text.muted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={s.selectOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={s.selectSheet}>
            <View style={s.selectHeader}>
              <Text style={s.selectHeaderTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Feather name="x" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.selectOption, isActive && s.selectOptionActive]}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  activeOpacity={0.75}
                >
                  {opt.icon ? (
                    <Text style={s.selectOptionIcon}>{opt.icon}</Text>
                  ) : null}
                  <Text style={[s.selectOptionText, isActive && s.selectOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {isActive && (
                    <Feather
                      name="check"
                      size={15}
                      color={colors.accent.purple}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Options ───────────────────────────────────────────────────────────────
const VISIBILITY_OPTIONS = [
  { label: "Public — Anyone can join", value: "public", icon: "🌍" },
  { label: "Private — Invite only", value: "private", icon: "🔒" },
];

const TYPE_OPTIONS = [
  { label: "Arts", value: "Arts", icon: "🎨" },
  { label: "Sport", value: "Sport", icon: "⚽" },
  { label: "Coding", value: "Coding", icon: "💻" },
  { label: "Science", value: "Science", icon: "🔬" },
  { label: "Fun", value: "Fun", icon: "🎉" },
  { label: "Innovation", value: "Innovation", icon: "💡" },
  { label: "Finance", value: "Finance", icon: "📈" },
];

// ── Main screen ───────────────────────────────────────────────────────────
export default function CreateRoomScreen({ navigation }) {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id;

  const [roomname, setroomname] = useState("");
  const [description, setdescription] = useState("");
  const [selectmode, setSelectmode] = useState("public");
  const [selecttype, setSelecttype] = useState("Arts");
  const [roompasskey, setroompasskey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateroomkeyforprivate = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const submitRoom = async () => {
    if (!roomname.trim() || !description.trim()) {
      Alert.alert("Missing info", "Please fill in the room name and description.");
      return;
    }
    setIsSubmitting(true);
    const key = selectmode === "private" ? generateroomkeyforprivate() : "";
    setroompasskey(key);

    try {
      const response = await fetch(`${API_BASE_URL}/createinterestroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomname,
          description,
          selectmode,
          selecttype,
          roompasskey: key,
          myUserId,
        }),
      });

      if (!response.ok) {
        Alert.alert("Error", "Something went wrong. Please try again.");
      } else {
        if (selectmode === "private") {
          setShowKeyModal(true);
        } else {
          Alert.alert("Room Created! 🎉", `"${roomname}" is live.`, [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        }
        setroomname("");
        setdescription("");
      }
    } catch (err) {
      Alert.alert("Network error", "Could not reach the server.");
      console.log("Create room error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />

      {/* Ambient blobs */}
      <View style={[s.blob, { top: -60, right: -60, backgroundColor: "rgba(147,51,234,0.1)" }]} pointerEvents="none" />
      <View style={[s.blob, { bottom: 40, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(99,102,241,0.07)" }]} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Room</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero text */}
        <View style={s.heroWrap}>
          <LinearGradient colors={colors.gradient.brand} style={s.heroIconWrap}>
            <Feather name="radio" size={22} color="#fff" />
          </LinearGradient>
          <Text style={s.heroTitle}>Launch a Room</Text>
          <Text style={s.heroSub}>Create a space for your community to connect</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>

          {/* Room name */}
          <Text style={s.label}>Room Name</Text>
          <View style={s.inputWrap}>
            <Feather name="hash" size={15} color={colors.text.muted} style={s.inputIcon} />
            <TextInput
              placeholder="e.g. Midnight Coders"
              placeholderTextColor={colors.text.muted}
              style={s.input}
              value={roomname}
              onChangeText={setroomname}
              maxLength={40}
            />
          </View>
          <Text style={s.charCount}>{roomname.length}/40</Text>

          {/* Description */}
          <Text style={s.label}>Description</Text>
          <View style={[s.inputWrap, s.textAreaWrap]}>
            <TextInput
              placeholder="Describe the vibe of this room..."
              placeholderTextColor={colors.text.muted}
              style={[s.input, s.textArea]}
              multiline
              value={description}
              onChangeText={setdescription}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
          <Text style={s.charCount}>{description.length}/200</Text>

          <View style={s.divider} />

          {/* Visibility picker */}
          <CustomSelect
            label="Visibility"
            options={VISIBILITY_OPTIONS}
            value={selectmode}
            onChange={setSelectmode}
          />

          <View style={{ height: 16 }} />

          {/* Type picker */}
          <CustomSelect
            label="Room Type"
            options={TYPE_OPTIONS}
            value={selecttype}
            onChange={setSelecttype}
          />

          {/* Private notice */}
          {selectmode === "private" && (
            <View style={s.privateNotice}>
              <Feather name="info" size={13} color={colors.warning} />
              <Text style={s.privateNoticeText}>
                A unique passkey will be generated. Save it — it cannot be recovered.
              </Text>
            </View>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={s.submitBtn}
          onPress={submitRoom}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={colors.gradient.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.submitGradient}
          >
            {isSubmitting ? (
              <Text style={s.submitText}>Creating...</Text>
            ) : (
              <>
                <Feather name="zap" size={16} color="#fff" />
                <Text style={s.submitText}>Launch Room</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Private key modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <View style={s.keyModalOverlay}>
          <View style={s.keyModalBox}>
            {/* Warning icon */}
            <View style={s.keyModalIconWrap}>
              <Feather name="lock" size={24} color={colors.warning} />
            </View>

            <Text style={s.keyModalTitle}>Save Your Passkey</Text>
            <Text style={s.keyModalSub}>
              This is the only way to access or manage your private room.
            </Text>

            {/* Key display */}
            <View style={s.keyDisplay}>
              <Text style={s.keyDisplayText}>{roompasskey}</Text>
            </View>

            <View style={s.keyWarningBox}>
              <Feather name="alert-triangle" size={13} color={colors.warning} />
              <Text style={s.keyWarningText}>
                If you lose this key, access to the room is permanently lost and cannot be recovered.
              </Text>
            </View>

            <TouchableOpacity
              style={s.keyModalBtn}
              onPress={() => { setShowKeyModal(false); navigation.goBack(); }}
            >
              <Text style={s.keyModalBtnText}>I've saved it, got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },

  blob: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    pointerEvents: "none",
  },

  // ── Header ──
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "android" ? 48 : 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15, fontWeight: "700", color: colors.text.secondary,
  },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: 8 },

  // ── Hero ──
  heroWrap: { alignItems: "center", marginBottom: 24 },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24, fontWeight: "800", color: colors.text.primary, marginBottom: 6,
  },
  heroSub: { fontSize: 13, color: colors.text.muted, textAlign: "center" },

  // ── Card ──
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.xl, padding: spacing.lg, marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: 16 },

  // ── Labels / Inputs ──
  label: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.5,
    color: colors.text.muted, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bg.input,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, marginBottom: 4,
    paddingHorizontal: 12,
  },
  textAreaWrap: { alignItems: "flex-start", paddingTop: 10, paddingBottom: 6 },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, fontSize: 14, color: colors.text.primary,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  textArea: { minHeight: 90 },
  charCount: { fontSize: 10, color: colors.text.muted, textAlign: "right", marginBottom: 14 },

  // ── Custom select ──
  selectBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.bg.input,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 4,
  },
  selectValue: { fontSize: 14, color: colors.text.primary, flex: 1 },

  selectOverlay: {
    flex: 1, backgroundColor: colors.bg.overlay,
    justifyContent: "flex-end",
  },
  selectSheet: {
    backgroundColor: colors.bg.modal,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border.subtle,
    paddingBottom: 32,
  },
  selectHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  selectHeaderTitle: {
    fontSize: 14, fontWeight: "700", color: colors.text.primary,
  },
  selectOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  selectOptionActive: { backgroundColor: colors.accent.softPurple },
  selectOptionIcon: { fontSize: 18 },
  selectOptionText: { fontSize: 14, color: colors.text.secondary, flex: 1 },
  selectOptionTextActive: { color: colors.text.primary, fontWeight: "600" },

  // ── Private notice ──
  privateNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.2)",
    borderRadius: radius.md, padding: 12, marginTop: 14,
  },
  privateNoticeText: {
    flex: 1, fontSize: 12, color: colors.warning, lineHeight: 17,
  },

  // ── Submit ──
  submitBtn: { borderRadius: radius.lg, overflow: "hidden", marginBottom: 8 },
  submitGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // ── Key modal ──
  keyModalOverlay: {
    flex: 1, backgroundColor: colors.bg.overlay,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
  },
  keyModalBox: {
    backgroundColor: colors.bg.modal,
    borderWidth: 1, borderColor: colors.border.medium,
    borderRadius: radius.xl, padding: spacing.lg,
    width: "100%", alignItems: "center",
  },
  keyModalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  keyModalTitle: {
    fontSize: 19, fontWeight: "800", color: colors.text.primary, marginBottom: 8,
  },
  keyModalSub: {
    fontSize: 13, color: colors.text.muted, textAlign: "center", marginBottom: 20,
  },
  keyDisplay: {
    backgroundColor: colors.bg.input,
    borderWidth: 1, borderColor: colors.border.purple,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 28,
    marginBottom: 16,
  },
  keyDisplayText: {
    fontSize: 26, fontWeight: "800", color: colors.accent.lavender,
    letterSpacing: 6,
  },
  keyWarningBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.2)",
    borderRadius: radius.md, padding: 12, marginBottom: 24, width: "100%",
  },
  keyWarningText: {
    flex: 1, fontSize: 12, color: colors.warning, lineHeight: 17,
  },
  keyModalBtn: {
    backgroundColor: colors.accent.purple,
    borderRadius: radius.lg, paddingVertical: 13,
    paddingHorizontal: 32, width: "100%", alignItems: "center",
  },
  keyModalBtnText: {
    color: "#fff", fontWeight: "700", fontSize: 14,
  },
});