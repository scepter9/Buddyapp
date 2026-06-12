import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Modal,
  PanResponder,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

const DEFAULT_REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Spam or misleading',
  'Impersonation',
];

export default function Slideupbar({
  senderId,
  reporthead,
  reportedname,
  stuffimage,
  onClose,
  reasons = DEFAULT_REASONS,
}) {
  const positionAnim = useRef(new Animated.Value(300)).current;
  const [selectedReason, setSelectedReason] = useState(null);
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(false);
  const textInputRef = useRef(null);

  useEffect(() => {
    Animated.spring(positionAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const hideAnim = () => {
    Animated.spring(positionAnim, {
      toValue: 400,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) positionAnim.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          hideAnim();
        } else {
          Animated.spring(positionAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const submitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please pick a reason before submitting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/postreport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          reporthead,
          reportedname,
          reason: selectedReason,
          details: userText.trim() || null,
        }),
      });

      if (!res.ok) {
        Alert.alert('Something went wrong 😪', 'Please try again.');
        return;
      }

      Alert.alert('Report submitted', 'Thanks for keeping the community safe.', [
        { text: 'OK', onPress: hideAnim },
      ]);
    } catch (err) {
      Alert.alert('Something went wrong 😪', 'Please try again.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!selectedReason && !loading;

  return (
    <Modal
      visible={true}
      transparent={true} 
      animationType="none"
      onRequestClose={hideAnim}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={hideAnim}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.sheet, { transform: [{ translateY: positionAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Target header */}
            <View style={styles.targetRow}>
              <View style={styles.avatarWrap}>
                {stuffimage ? (
                  <Image
                    source={{ uri: `${stuffimage}` }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {reportedname?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.targetText}>
                <Text style={styles.reportingLabel}>Reporting {reporthead}</Text>
                <Text style={styles.reportedName}>{reportedname}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Title */}
            <Text style={styles.title}>Why are you reporting?</Text>
            <Text style={styles.subtitle}>Select the most relevant reason</Text>

            {/* Reasons */}
            <View style={styles.reasonsWrap}>
              {reasons.map((reason, index) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                    onPress={() => setSelectedReason(isSelected ? null : reason)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radio, isSelected && styles.radioFilled]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Extra details input */}
            <TextInput
              ref={textInputRef}
              value={userText}
              onChangeText={setUserText}
              placeholder="Add more details (optional)..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.textInput}
              multiline
              maxLength={300}
              returnKeyType="done"
              blurOnSubmit
            />
          </ScrollView>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={submitReport}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>

        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#151122',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(147,51,234,0.2)',
    paddingHorizontal: 18,
    paddingBottom: 34,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    backgroundColor: 'rgba(147,51,234,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  targetText: {
    flex: 1,
  },
  reportingLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    marginBottom: 2,
  },
  reportedName: {
    fontSize: 16,
    color: '#f0ecff',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0ecff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
  },
  reasonsWrap: {
    gap: 8,
    marginBottom: 18,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  reasonRowSelected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioFilled: {
    borderColor: '#ef4444',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  reasonText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#f0ecff',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f0ecff',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(220,38,38,0.35)',
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});