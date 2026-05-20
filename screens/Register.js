import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, View, Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.0.136:3000';

const universities = [
  { id: 1, name: "University of Lagos", short: "UNILAG" },
  { id: 2, name: "University of Ibadan", short: "UI" },
  { id: 3, name: "University of Port Harcourt", short: "UNIPORT" },
  { id: 4, name: "Covenant University", short: "CU" },
  { id: 5, name: "University of Nigeria, Nsukka", short: "UNN" },
  { id: 6, name: "Obafemi Awolowo University", short: "OAU" },
  { id: 7, name: "Ahmadu Bello University", short: "ABU" },
  { id: 8, name: "Federal University Oye-Ekiti", short: "FUOYE" },
  { id: 9, name: "University of Benin", short: "UNIBEN" },
  { id: 10, name: "Lagos State University", short: "LASU" },
  { id: 11, name: "University of Ilorin", short: "UNILORIN" },
  { id: 12, name: "Federal University of Technology, Akure", short: "FUTA" },
  { id: 13, name: "Babcock University", short: "BABCOCK" },
  { id: 14, name: "University of Abuja", short: "UNIABUJA" },
  { id: 15, name: "Federal University of Agriculture, Abeokuta", short: "FUNAAB" },
  { id: 16, name: "Federal University of Technology, Minna", short: "FUTMINNA" },
  { id: 17, name: "Federal University of Technology, Owerri", short: "FUTO" },
  { id: 18, name: "Nnamdi Azikiwe University", short: "UNIZIK" },
  { id: 19, name: "Ladoke Akintola University of Technology", short: "LAUTECH" },
  { id: 20, name: "Ekiti State University", short: "EKSU" },
  { id: 21, name: "University of Jos", short: "UNIJOS" },
  { id: 22, name: "Bayero University Kano", short: "BUK" },
  { id: 23, name: "University of Calabar", short: "UNICAL" },
  { id: 24, name: "American University of Nigeria", short: "AUN" },
  { id: 25, name: "Afe Babalola University", short: "ABUAD" },
  { id: 26, name: "Bowen University", short: "BOWEN" },
  { id: 27, name: "Redeemer's University", short: "RUN" },
  { id: 28, name: "Landmark University", short: "LMU" },
  { id: 29, name: "Pan-Atlantic University", short: "PAU" },
  { id: 30, name: "Nile University of Nigeria", short: "NILE" },
];



const userinterests = [
  { id: 1, name: "Football" }, { id: 2, name: "Basketball" }, { id: 3, name: "Music" },
  { id: 4, name: "Gaming" }, { id: 5, name: "Coding" }, { id: 6, name: "AI & Tech" },
  { id: 7, name: "Reading" }, { id: 8, name: "Writing" }, { id: 9, name: "Movies" },
  { id: 10, name: "Photography" }, { id: 11, name: "Fitness & Gym" }, { id: 12, name: "Fashion" },
  { id: 13, name: "Travel" }, { id: 14, name: "Cooking" }, { id: 15, name: "Entrepreneurship" },
  { id: 16, name: "Crypto & Finance" }, { id: 17, name: "Art & Design" }, { id: 18, name: "Dancing" },
  { id: 19, name: "Content Creation" }, { id: 20, name: "Chess" },
];

const MAX_INTERESTS = 5;

// ─── OTP Input — outside Register ────────────────────────────
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
      <TouchableOpacity style={otp.row} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
        {[...Array(codeLength)].map((_, index) => {
          const isActive = index === code.length;
          const isFilled = index < code.length;
          return (
            <View key={index} style={[otp.box, isActive && otp.boxActive, isFilled && otp.boxFilled, hasError && otp.boxError]}>
              <Text style={otp.boxText}>{code[index] || ''}</Text>
            </View>
          );
        })}
      </TouchableOpacity>
    </View>
  );
}


 function UniversitySelector({
  label,
  universities,
  selectedSchool,
  setSelectedSchool,
}) {
  return (
    <View style={s.wrapper}>
    

    {universities.map((item)=>{
          const isSelected = selectedSchool === item.name;
          return (
            <TouchableOpacity key={item.id}
              activeOpacity={0.85}
              onPress={() => setSelectedSchool(item.name)}
              style={[
                s.card,
                isSelected && s.cardSelected,
              ]}
            >
              <View style={s.leftAccent} />

              <View style={s.textWrap}>
                <Text style={[s.name, isSelected && s.nameSelected]}>
                  {item.name}
                </Text>
                <Text style={[s.short, isSelected && s.shortSelected]}>
                  {item.short}
                </Text>
              </View>

              {isSelected && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
    })}

         
        
      
    </View>
  );
}

// ─── Countdown — outside Register ────────────────────────────
function Countdown({ onExpire }) {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(sec => {
        if (sec > 0) return sec - 1;
        setMinutes(min => {
          if (min <= 0) { clearInterval(timer); onExpire(); return 0; }
          return min - 1;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  return (
    <Text style={styles.timerText}>
      Code expires in <Text style={styles.timerAccent}>{pad(minutes)}:{pad(seconds)}</Text>
    </Text>
  );
}
function YourDetails({ fullname, setFullname, username, setUsername, setUsernameAvailable,setEmailAvailable,
  email, setEmail, phone, setPhone, errors, 
  usernameAvailable, emailAvailable, checkAvailability }){
return(
  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      <View style={styles.inputBox}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, errors.fullname && styles.inputError]}
          value={fullname}
          onChangeText={setFullname}
          placeholder="Enter Full Name"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        {errors.fullname ? <Text style={styles.errorText}>{errors.fullname}</Text> : null}
      </View>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, errors.username && styles.inputError, usernameAvailable === true && styles.inputSuccess]}
          value={username}
          onChangeText={t => { setUsername(t); setUsernameAvailable(null); }}
          onBlur={() => checkAvailability('username', username)}
          placeholder="Enter Username"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="none"
        />
        {errors.username
          ? <Text style={styles.errorText}>{errors.username}</Text>
          : usernameAvailable === false
            ? <Text style={styles.errorText}>Username already taken</Text>
            : usernameAvailable === true
              ? <Text style={styles.successText}>✓ Username available</Text>
              : null}
      </View>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError, emailAvailable === true && styles.inputSuccess]}
          value={email}
          onChangeText={t => { setEmail(t); setEmailAvailable(null); }}
          onBlur={() => checkAvailability('email', email)}
          placeholder="Enter Email"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email
          ? <Text style={styles.errorText}>{errors.email}</Text>
          : emailAvailable === false
            ? <Text style={styles.errorText}>Email already registered</Text>
            : emailAvailable === true
              ? <Text style={styles.successText}>✓ Email available</Text>
              : null}
      </View>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter Phone Number"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="phone-pad"
        />
        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
      </View>

    </ScrollView>
)
}

function YourCampus({ selectedSchool, setSelectedSchool, 
  selectedInterests, toggleInterest, errors }){
return(
  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>University</Text>
     <UniversitySelector label='University' selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool} universities={universities}/>
      {errors.school ? <Text style={styles.errorText}>{errors.school}</Text> : null}

    

      <View style={styles.interestContainer}>
        <View style={styles.interestHeader}>
          <Text style={styles.interestTitle}>Interests</Text>
          <Text style={styles.remainingText}>{selectedInterests.length}/{MAX_INTERESTS}</Text>
        </View>
        {errors.interests ? <Text style={styles.errorText}>{errors.interests}</Text> : null}
        <View style={styles.interestContent}>
          {userinterests.map(item => {
            const selected = selectedInterests.some(i => i.id === item.id);
            return (
              <TouchableOpacity key={item.id} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleInterest(item)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item.name}</Text>
                {selected && <View style={styles.checkIcon}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
)
  }

  function FinalStep({ password, setPassword, confirm, setConfirm,
    showPassword, setShowPassword, showConfirm, setShowConfirm,
    errors, strengthLabel }){
     
        const strength = password ? strengthLabel(password) : null;
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputBox}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {strength && <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label} password</Text>}
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>
    
            <View style={styles.inputBox}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }, errors.confirm && styles.inputError, confirm && password === confirm && styles.inputSuccess]}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                  <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}
              {confirm && password === confirm && <Text style={styles.successText}>✓ Passwords match</Text>}
            </View>
    
            <Text style={styles.passwordHint}>Use 8+ characters, uppercase, numbers and symbols.</Text>
          </ScrollView>
        );
      
    }

    function ConfirmEmail({ email, code, setCode, codeError, 
      verifyLoading, handleVerifyEmail, handleResend, navigation,setCodeError }){
        return(
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingTop: 8 }}>
      <Text style={styles.stepTitle}>Check Your Email</Text>
      <Text style={styles.stepSub}>
        We sent a 6-digit code to{' '}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <OtpInput
        code={code}
        onChangeCode={t => { setCode(t); setCodeError(false); }}
        hasError={codeError}
      />

      {codeError && <Text style={styles.errorText}>Wrong or expired code. Try again.</Text>}

      <Countdown onExpire={() => navigation.replace('Login')} />

      <TouchableOpacity
        style={[styles.signtextbutton, (verifyLoading || code.length < 6) && { opacity: 0.5 }]}
        onPress={handleVerifyEmail}
        disabled={verifyLoading || code.length < 6}
      >
        <Text style={styles.signtext}>
          {verifyLoading ? 'Verifying...' : 'Verify & Join Buddy 🎉'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't get it? </Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
        )
      }
// ─── Main Component ───────────────────────────────────────────
export default function Register({ navigation }) {
  const [registerCount, setRegisterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 0
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Availability
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);

  // Step 1
  const [selectedSchool, setSelectedSchool] = useState(universities[2].name);

  const [selectedInterests, setSelectedInterests] = useState([]);

  // Step 2
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 3 — OTP
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // ─── Availability check ───────────────────────────────────
  const checkAvailability = async (field, value) => {
    if (!value.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: field === 'email' ? value : '',
          username: field === 'username' ? value : '',
        }),
      });
      const data = await res.json();
      if (field === 'email') setEmailAvailable(!data.emailTaken);
      if (field === 'username') setUsernameAvailable(!data.usernameTaken);
    } catch (err) {
      console.error('Availability check failed:', err);
    }
  };

  // ─── Password strength ────────────────────────────────────
  const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 12) score += 4;
    else if (pwd.length >= 8) score += 2;
    else score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*]/.test(pwd)) score += 1;
    if (!/(1234|abcd|qwerty)/.test(pwd)) score += 1;
    return score;
  };

  const strengthLabel = (pwd) => {
    const s = passwordStrength(pwd);
    if (s < 3) return { label: 'Weak', color: '#FF6B6B' };
    if (s < 6) return { label: 'Fair', color: '#FFD700' };
    return { label: 'Strong', color: '#00D2FF' };
  };

  // ─── Validate per step ────────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!/^[a-zA-Z ]{3,}$/.test(fullname))
        newErrors.fullname = 'Full name must be at least 3 letters.';
      if (!/^[a-zA-Z0-9_.-]{3,}$/.test(username.trim()))
        newErrors.username = 'Username: min 3 chars, no spaces.';
      if (usernameAvailable === false)
        newErrors.username = 'Username already taken.';
      if (!/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(email))
        newErrors.email = 'Invalid email address.';
      if (emailAvailable === false)
        newErrors.email = 'Email already registered.';
      if (!/^\d{11}$/.test(phone))
        newErrors.phone = 'Phone must be exactly 11 digits.';
    }
    if (step === 1) {
      if (!selectedSchool) newErrors.school = 'Please select a university.';
      
      if (selectedInterests.length === 0)
        newErrors.interests = 'Please select at least one interest.';
    }
    if (step === 2) {
      if (passwordStrength(password) < 3)
        newErrors.password = 'Password is too weak.';
      if (password !== confirm)
        newErrors.confirm = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Interest toggle ──────────────────────────────────────
  const toggleInterest = (interest) => {
    if (selectedInterests.some(i => i.id === interest.id)) {
      setSelectedInterests(selectedInterests.filter(i => i.id !== interest.id));
    } else {
      if (selectedInterests.length < MAX_INTERESTS) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Limit reached', `Max ${MAX_INTERESTS} interests allowed.`);
      }
    }
  };

  // ─── Send verification (end of step 2) ───────────────────
  const submitRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname,
          username,
          email,
          phone,
          password,
          selectedValueschool: selectedSchool,
          selectinterestname: selectedInterests.map(i => i.name),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setRegisterCount(3); // go to OTP step
      } else {
        Alert.alert('Error', result.error || 'Something went wrong.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────
  const handleVerifyEmail = async () => {
    if (!code.trim() || code.length < 6) {
      setCodeError(true);
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/verify-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(true);
        setCode('');
        Alert.alert('Error', data.error || 'Wrong or expired code.');
        return;
      }
      Alert.alert('Welcome to Buddy 🎉', 'Your account has been created!', [
        { text: "Let's go", onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ─── Resend code ──────────────────────────────────────────
  const handleResend = async () => {
    setCode('');
    setCodeError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) Alert.alert('Sent!', 'A new code has been sent to your email.');
      else Alert.alert('Error', 'Could not resend. Try again.');
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server.');
    }
  };

  // ─── Step handler ─────────────────────────────────────────
  const handleContinue = () => {
    if (!validateStep(registerCount)) return;
    if (registerCount === 2) {
      submitRegister(); // sends email, moves to OTP
    } else {
      setRegisterCount(c => c + 1);
    }
  };

  const handleBack = () => {
    if (registerCount > 0) setRegisterCount(c => c - 1);
  };
  

  // ─── STEP 2: Password ─────────────────────────────────────
  

  // ─── STEP 3: Confirm Email ────────────────────────────────
 

 
  const stepLabels = ['Your details', 'Your campus', 'Set password', 'Verify email'];
  const isOtpStep = registerCount === 3;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.loginBackground}>

          <View style={styles.buddylogosection}>
            <Image style={styles.image} source={require('../assets/buddy.png')} />
            <View style={styles.buddytext}>
              <Text style={styles.buddytexta}>bud</Text>
              <Text style={styles.buddytextb}>dy</Text>
            </View>
            <Text style={styles.buddysecondtext}>
              {isOtpStep ? 'One last step.' : 'Create your account.'}
            </Text>
            <View style={styles.parent}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.child, {
                  backgroundColor: registerCount === i ? '#00D2FF' : registerCount > i ? 'rgba(0,210,255,0.4)' : 'rgba(255,255,255,0.15)',
                  width: registerCount === i ? 28 : 18,
                }]} />
              ))}
            </View>
            <Text style={styles.stepLabel}>
              Step {registerCount + 1} of 4 — {stepLabels[registerCount]}
            </Text>
          </View>

          <View style={styles.stepContent}>
          {registerCount === 0 && (
  <YourDetails
    fullname={fullname}
    setFullname={setFullname}
    username={username}
    setUsername={setUsername}
    email={email}
    setEmail={setEmail}
    phone={phone}
    setPhone={setPhone}
    errors={errors}
    usernameAvailable={usernameAvailable}
    emailAvailable={emailAvailable}
    checkAvailability={checkAvailability}
    setEmailAvailable={setEmailAvailable}
    setUsernameAvailable={setUsernameAvailable}
  />
)}
  {registerCount === 1 && <YourCampus
selectedSchool={selectedSchool}
setSelectedSchool={setSelectedSchool}
selectedInterests={selectedInterests}
toggleInterest={toggleInterest}
errors={errors}
   />}
  {registerCount === 2 && <FinalStep 
  password={password}
  setPassword={setPassword}
  confirm={confirm}
  setConfirm={setConfirm}
  showConfirm={showConfirm}
  setShowConfirm={setShowConfirm}
  showPassword={showPassword}
  setShowPassword={setShowPassword}
  errors={errors}
  strengthLabel={strengthLabel}
  />}
  {registerCount === 3 && <ConfirmEmail
  email={email}
  code={code}
  setCode={setCode}
  codeError={codeError}
  verifyLoading={verifyLoading}
  handleVerifyEmail={handleVerifyEmail}
  handleResend={handleResend}
  setCodeError={setCodeError}
  navigation={navigation}
   />}
</View>

          {/* Hide main button on OTP step — OTP step has its own button */}
          {!isOtpStep && (
            <TouchableOpacity
              style={[styles.signtextbutton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleContinue}
              disabled={isSubmitting}
            >
              <Text style={styles.signtext}>
                {isSubmitting ? 'Sending code...' : registerCount === 2 ? 'Send Verification Code →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.otherscreen}>
            {registerCount > 0 && !isOtpStep ? (
              <TouchableOpacity onPress={handleBack}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                {isOtpStep ? '' : 'Already have an account?'}
              </Text>
            )}
            {!isOtpStep && (
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: '#00D2FF', fontSize: 13, fontWeight: '600' }}>Sign in →</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ─── OTP Styles ───────────────────────────────────────────────
const otp = StyleSheet.create({
  wrapper: { alignItems: 'center', width: '100%', marginVertical: 20 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  row: { flexDirection: 'row', gap: 10 },
  box: { width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: '#00D2FF', backgroundColor: 'rgba(0,210,255,0.08)' },
  boxFilled: { borderColor: 'rgba(0,210,255,0.4)' },
  boxError: { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.08)' },
  boxText: { fontSize: 22, fontWeight: '700', color: 'white' },
});

// ─── Main Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  loginBackground: { flex: 1, flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#0a0a0f', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  buddylogosection: { alignItems: 'center', gap: 8 },
  image: { width: 50, height: 50 },
  buddytext: { flexDirection: 'row', alignItems: 'baseline' },
  buddytexta: { fontSize: 30, fontWeight: '800', color: '#ffffff', letterSpacing: -1.5 },
  buddytextb: { fontSize: 30, fontWeight: '800', color: '#00D2FF', letterSpacing: -1.5 },
  buddysecondtext: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.4)' },
  parent: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  child: { height: 6, borderRadius: 4 },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, textTransform: 'uppercase' },
  stepContent: { flex: 1, marginVertical: 16 },
  inputBox: { marginBottom: 14 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', fontSize: 15, paddingHorizontal: 15, color: 'white' },
  inputError: { borderColor: '#FF6B6B' },
  inputSuccess: { borderColor: 'rgba(0,210,255,0.5)' },
  errorText: { color: '#FF6B6B', fontSize: 12, marginTop: 4, marginLeft: 4 },
  successText: { color: '#00D2FF', fontSize: 12, marginTop: 4, marginLeft: 4 },
  strengthText: { fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '600' },
  passwordRow: { flexDirection: 'row', gap: 8 },
  eyeBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  eyeText: { fontSize: 18 },
  passwordHint: { color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8, lineHeight: 18 },
  pickerWrap: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14, overflow: 'hidden' },
  picker: { height: 50, color: '#fff' },
  interestContainer: { marginTop: 8, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  interestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  interestTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  remainingText: { color: '#00D2FF', fontSize: 12, fontWeight: '600' },
  interestContent: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, margin: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipSelected: { backgroundColor: '#00D2FF', borderColor: '#00D2FF' },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  chipTextSelected: { color: '#0a0a0f', fontWeight: '600' },
  checkIcon: { position: 'absolute', top: -5, right: -5, backgroundColor: '#7C3AED', borderRadius: 8, padding: 2 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8, letterSpacing: -0.5 },
  stepSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  emailHighlight: { color: '#00D2FF', fontWeight: '600' },
  timerText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 16, marginTop: 8 },
  timerAccent: { color: '#00D2FF', fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  resendText: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  resendLink: { fontSize: 13, color: '#00D2FF', fontWeight: '700' },
  signtextbutton: { width: '100%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  signtext: { fontSize: 15, fontWeight: '800', color: '#0a0a0f' },
  otherscreen: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
});
const s = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },

  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
    overflow: "hidden",
  },

  cardSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    borderColor: "#7C3AED",
    transform: [{ scale: 1.01 }],
  },

  leftAccent: {
    width: 4,
    height: "100%",
    backgroundColor: "#00D2FF",
    borderRadius: 10,
    marginRight: 12,
  },

  textWrap: {
    flex: 1,
  },

  name: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },

  nameSelected: {
    color: "#ffffff",
  },

  short: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },

  shortSelected: {
    color: "#c4b5fd",
  },

  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00D2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#0a0a0f",
    fontWeight: "900",
  },
});