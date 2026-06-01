import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Keyboard, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, View,
} from 'react-native';

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

// ─── OTP Input ────────────────────────────────────────────────
function OtpInput({ code, onChangeCode, hasError }) {
  const inputRef = useRef(null);
  const codeLength = 6;

  return (
    <View style={otp.wrapper}>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChangeCode}
        keyboardType="number-pad"
        maxLength={codeLength}
        style={otp.hidden}
      />
      <TouchableOpacity
        style={otp.row}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
      >
        {[...Array(codeLength)].map((_, index) => {
          const isActive = index === code.length;
          const isFilled = index < code.length;
          return (
            <View
              key={index}
              style={[
                otp.box,
                isActive && otp.boxActive,
                isFilled && otp.boxFilled,
                hasError && otp.boxError,
              ]}
            >
              <Text style={otp.boxText}>{code[index] || ''}</Text>
            </View>
          );
        })}
      </TouchableOpacity>
    </View>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────
function Countdown({ onExpire }) {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(sec => {
        if (sec > 0) return sec - 1;
        setMinutes(min => {
          if (min <= 0) {
            clearInterval(timer);
            onExpire();
            return 0;
          }
          return min - 1;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = n => String(n).padStart(2, '0');

  return (
    <Text style={s.timerText}>
      Code expires in{' '}
      <Text style={s.timerAccent}>{pad(minutes)}:{pad(seconds)}</Text>
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ForgotPassword({ navigation }) {
  const [step, setStep] = useState(0); 
  const [mode, setMode] = useState('password'); 

  // Step 0
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 1
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Step 2
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const goToStep = next => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  // ── Step 0: Send code ──
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      triggerShake();
      return;
    }
    try {
      setEmailLoading(true);
      const endpoint = mode === 'password' ? '/forgot-password' : '/forgot-username';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Something went wrong');
        triggerShake();
        return;
      }
      goToStep(1);
    } catch (err) {
      console.error(err);
      Alert.alert('Server Error', 'Could not connect. Please try again.');
      triggerShake();
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Step 1: Verify OTP ──
  const handleVerifyCode = async () => {
    if (code.length < 6) {
      triggerShake();
      setCodeError(true);
      return;
    }
    try {
      setVerifyLoading(true);
      const res = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(true);
        setCode('');
        triggerShake();
        Alert.alert('Invalid code', data.error || 'Wrong or expired code.');
        return;
      }
      setCodeError(false);
      // If forgot username, we're done — backend already emailed username
      if (mode === 'username') {
        Alert.alert('Done!', 'Your username has been sent to your email.', [
          { text: 'Back to Login', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }
      goToStep(2);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not verify code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Step 2: Reset password ──
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Fill in both fields');
      triggerShake();
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match');
      triggerShake();
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Must be at least 6 characters.');
      triggerShake();
      return;
    }
    try {
      setResetLoading(true);
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Reset failed.');
        triggerShake();
        return;
      }
      Alert.alert('Password Reset!', 'You can now log in with your new password.', [
        { text: 'Login', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Server Error', 'Could not reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── Step labels ──
  const stepLabels = mode === 'password'
    ? ['Enter Email', 'Verify Code', 'New Password']
    : ['Enter Email', 'Verify Code'];

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.screen}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => step === 0 ? navigation.goBack() : goToStep(step - 1)}
            >
              <Text style={s.backArrow}>←</Text>
            </TouchableOpacity>

            {/* Progress dots */}
            <View style={s.dotsRow}>
              {stepLabels.map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.dot,
                    step === i && s.dotActive,
                    step > i && s.dotDone,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Mode toggle — only on step 0 */}
          {step === 0 && (
            <View style={s.modeToggle}>
              <TouchableOpacity
                style={[s.modeBtn, mode === 'password' && s.modeBtnActive]}
                onPress={() => setMode('password')}
              >
                <Text style={[s.modeBtnText, mode === 'password' && s.modeBtnTextActive]}>
                  Forgot Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modeBtn, mode === 'username' && s.modeBtnActive]}
                onPress={() => setMode('username')}
              >
                <Text style={[s.modeBtnText, mode === 'username' && s.modeBtnTextActive]}>
                  Forgot Username
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <Animated.View style={[s.content, { opacity: fadeAnim }]}>

            {/* ── STEP 0: Email ── */}
            {step === 0 && (
              <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
                <Text style={s.stepTitle}>
                  {mode === 'password' ? 'Reset Password' : 'Find Username'}
                </Text>
                <Text style={s.stepSub}>
                  {mode === 'password'
                    ? "Enter your email and we'll send you a 6-digit reset code valid for 10 minutes."
                    : "Enter your email and we'll send your username to your inbox."}
                </Text>
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity
                  style={[s.btnPrimary, emailLoading && s.btnDisabled]}
                  onPress={handleSendCode}
                  disabled={emailLoading}
                >
                  <Text style={s.btnPrimaryText}>
                    {emailLoading ? 'Sending...' : 'Send Code →'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── STEP 1: OTP ── */}
            {step === 1 && (
              <View style={{ width: '100%' }}>
                <Text style={s.stepTitle}>Check Your Email</Text>
                <Text style={s.stepSub}>
                  We sent a 6-digit code to{' '}
                  <Text style={s.emailHighlight}>{email}</Text>
                </Text>

                <OtpInput
                  code={code}
                  onChangeCode={text => { setCode(text); setCodeError(false); }}
                  hasError={codeError}
                />

                {codeError && (
                  <Text style={s.errorText}>Wrong or expired code. Try again.</Text>
                )}

                <Countdown onExpire={() => navigation.replace('Login')} />

                <TouchableOpacity
                  style={[s.btnPrimary, (verifyLoading || code.length < 6) && s.btnDisabled]}
                  onPress={handleVerifyCode}
                  disabled={verifyLoading || code.length < 6}
                >
                  <Text style={s.btnPrimaryText}>
                    {verifyLoading ? 'Verifying...' : 'Verify Code →'}
                  </Text>
                </TouchableOpacity>

                <View style={s.resendRow}>
                  <Text style={s.resendText}>Didn't get it? </Text>
                  <TouchableOpacity onPress={() => { setCode(''); setCodeError(false); setStep(0); }}>
                    <Text style={s.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP 2: New Password ── */}
            {step === 2 && (
              <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
                <Text style={s.stepTitle}>New Password</Text>
                <Text style={s.stepSub}>Almost there. Set a strong new password.</Text>

                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>New Password</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      secureTextEntry={!showNew}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowNew(v => !v)}>
                      <Text style={s.eyeText}>{showNew ? '🙈' : '👁'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Confirm Password</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={[s.input, { flex: 1 }, confirmPassword && newPassword !== confirmPassword && s.inputError]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repeat password"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                      <Text style={s.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <Text style={s.errorText}>Passwords do not match</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, resetLoading && s.btnDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                >
                  <Text style={s.btnPrimaryText}>
                    {resetLoading ? 'Resetting...' : 'Reset Password 🎉'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

          </Animated.View>

          {/* Footer */}
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={s.footerLink}>← Back to Login</Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ─── OTP Styles ───────────────────────────────────────────────
const otp = StyleSheet.create({
  wrapper: { alignItems: 'center', width: '100%', marginVertical: 24 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  row: { flexDirection: 'row', gap: 10 },
  box: {
    width: 46, height: 54,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  boxActive: {
    borderColor: '#00D2FF',
    backgroundColor: 'rgba(0,210,255,0.08)',
  },
  boxFilled: { borderColor: 'rgba(0,210,255,0.4)' },
  boxError: { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.08)' },
  boxText: { fontSize: 22, fontWeight: '700', color: 'white' },
});

// ─── Main Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: 'white' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 28, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: { backgroundColor: '#00D2FF', width: 36 },
  dotDone: { backgroundColor: 'rgba(0,210,255,0.4)' },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#00D2FF' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  modeBtnTextActive: { color: '#0a0a0f' },

  content: { flex: 1, alignItems: 'flex-start' },

  stepTitle: {
    fontSize: 26, fontWeight: '800',
    color: 'white', letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    lineHeight: 21, marginBottom: 28,
  },
  emailHighlight: { color: '#00D2FF', fontWeight: '600' },

  fieldWrap: { width: '100%', marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    width: '100%', height: 52,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16, fontSize: 15,
    color: 'white',
  },
  inputError: { borderColor: '#FF6B6B' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  eyeText: { fontSize: 18 },

  btnPrimary: {
    width: '100%', paddingVertical: 15,
    backgroundColor: '#ffffff', borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#0a0a0f' },

  errorText: {
    color: '#FF6B6B', fontSize: 12,
    marginTop: 6, marginLeft: 2,
  },
  timerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', marginBottom: 20,
  },
  timerAccent: { color: '#00D2FF', fontWeight: '700' },
  resendRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 16,
  },
  resendText: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  resendLink: { fontSize: 13, color: '#00D2FF', fontWeight: '700' },

  footerLink: {
    fontSize: 13, color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
});
 