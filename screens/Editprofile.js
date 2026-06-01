import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from './Theme';
const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

// ── Labelled input ──
function Field({ label, icon, value, onChangeText, placeholder, multiline, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.inputRow, focused && f.inputFocused]}>
        <Feather name={icon} size={15} color={focused ? colors.accent.lavender : 'rgba(255,255,255,0.25)'} />
        <TextInput
          style={[f.input, multiline && f.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
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
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.35)', marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputFocused: { borderColor: 'rgba(147,51,234,0.5)' },
  input: { flex: 1, color: colors.text.primary, fontSize: 14, lineHeight: 20 },
  multiline: { minHeight: 80 },
  counter: { fontSize: 10, color: 'rgba(255,255,255,0.2)', alignSelf: 'flex-end' },
});

export default function EditProfile({ route, navigation }) {
  const { userId, currentProfile } = route?.params || {};

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [image, setImage] = useState(null);   // newly picked image
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      Alert.alert('Error', 'User ID is missing.');
      navigation.goBack();
      return;
    }
    if (currentProfile) {
      setName(currentProfile.name || '');
      setBio(currentProfile.about || '');
      setUniversity(currentProfile.university || '');
    }
  }, [userId, currentProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    const hasChanges =
      name.trim() !== (currentProfile?.name || '') ||
      bio.trim() !== (currentProfile?.about || '') ||
      university.trim() !== (currentProfile?.university || '') ||
      !!image;

    if (!hasChanges) {
      Alert.alert('No changes', 'You haven\'t changed anything yet.');
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (name.trim()) formData.append('name', name.trim());
    if (bio.trim()) formData.append('about', bio.trim());
    if (university.trim()) formData.append('university', university.trim());

    if (image) {
      const ext = image.uri.split('.').pop();
      formData.append('image', {
        uri: image.uri,
        name: `profile_${userId}_${Date.now()}.${ext}`,
        type: `image/${ext}`,
      });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update-profile`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        Alert.alert('Updated!', data.message || 'Profile saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Current avatar source
  const avatarSource = image
    ? { uri: image.uri }
    : currentProfile?.image
    ? { uri: `${API_BASE_URL}/uploads/${currentProfile.image}` }   // BUG FIX: removed stray newline
    : null;

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.blob} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar picker ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
              <LinearGradient
                colors={['#9333ea', '#6366f1']}
                style={s.avatarRing}
              >
                <View style={s.avatarInner}>
                  {avatarSource ? (
                    <Image source={avatarSource} style={s.avatarImg} />
                  ) : (
                    <Text style={s.avatarInitials}>{initials}</Text>
                  )}
                </View>
              </LinearGradient>
              <View style={s.cameraBtn}>
                <Feather name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>Tap to change photo</Text>
          </View>

          {/* ── Fields ── */}
          <View style={s.fieldsCard}>
            <Field
              label="DISPLAY NAME"
              icon="user"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              maxLength={40}
            />
            <Field
              label="UNIVERSITY"
              icon="book"
              value={university}
              onChangeText={setUniversity}
              placeholder="Your university"
              maxLength={80}
            />
            <Field
              label="BIO"
              icon="align-left"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people a bit about yourself..."
              multiline
              maxLength={160}
            />
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ['rgba(147,51,234,0.4)', 'rgba(99,102,241,0.4)'] : ['#9333ea', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.saveBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.screen },
  blob: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(147,51,234,0.07)', top: -60, right: -60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: 24 },

  // ── Avatar ──
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    padding: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 42,
    backgroundColor: colors.bg.screen,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitials: { color: '#fff', fontSize: 26, fontWeight: '700' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent.purple,
    borderWidth: 2, borderColor: colors.bg.screen, 
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 11, color: colors.text.muted, marginTop: 10 },

  // ── Fields card ──
  fieldsCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: radius.lg, padding: 16, marginBottom: 20,
  },

  // ── Save ──
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: radius.lg, paddingVertical: 15,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});