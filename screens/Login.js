import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet,
  Platform, TextInput, KeyboardAvoidingView,
  Animated, Easing, TouchableWithoutFeedback, Keyboard, Alert
} from "react-native";

import { AuthorContext } from "./AuthorContext";



const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";




export default function Login({navigation}) {
  const { setUser } = useContext(AuthorContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading,setIsLoading]=useState(false)

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {

    setUsernameError('');
    setPasswordError('');

    if (!username || !password) {
      if (!username) setUsernameError('Username is required');
      if (!password) setPasswordError('Password is required');
      triggerShake();
      return;
    }
setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        navigation.replace('About');
      } else {
        if (data.error === 'Invalid username') setUsernameError('Invalid username');
        else if (data.error === 'Invalid password') setPasswordError('Invalid password');
        else Alert.alert('Login Failed', data.error || 'Unknown error');
        triggerShake();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not connect to server');
      triggerShake();
    }finally{
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
   const fetchsession=async()=>{
    if(isLoading) return;
    try{
      setIsLoading(true)  
      const res=await fetch(`${API_BASE_URL}/check-session`)
      if(!res.ok){
        console.log('Session check failed');
        return;
      }
      const data=await res.json()
      if (data.loggedIn) {
        setUser(data.user);
        navigation.replace('About');
      }
    }catch(err){
      console.log('Session check failed',err);
    }finally{
      setIsLoading(false)
    }
   }
    fetchsession()
  }, []); 
  return(
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
<View style={styles.loginBackground}>
  <View style={styles.buddylogosection}>
<Image style={styles.image} source={require('../assets/buddy.png')}/>
<View style={styles.buddytext}>
  <Text style={styles.buddytexta}>bud</Text>
  <Text style={styles.buddytextb}>dy</Text>
</View>

<Text style={styles.buddysecondtext}>Your campus, your people.</Text>
  </View>
 

<View style={styles.bottomsection}> 
<TextInput
  style={[styles.input, usernameError && styles.inputError]}
  value={username}
  onChangeText={setUsername}
  placeholder="Username"
  placeholderTextColor="rgba(255,255,255,0.3)"
  autoCapitalize="none"
/>
{usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
<TextInput
     style={[styles.input, passwordError && styles.inputError]}
  value={password}
  onChangeText={setPassword}
  placeholder="Password"
  placeholderTextColor="rgba(255,255,255,0.3)"
  autoCapitalize="none"
  secureTextEntry
/>
{passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
<TouchableOpacity 
  style={styles.signtextbutton} 
  onPress={handleLogin}
  disabled={isSubmitting}
>
  <Text style={styles.signtext}>
    {isSubmitting ? 'Signing in...' : 'Sign in'}
  </Text>
</TouchableOpacity>
</View>
<View style={styles.otherscreen}>
<TouchableOpacity onPress={() => navigation.navigate('Register')}>
<Text style={{color:'#A78BFA', fontSize:13, fontWeight:'600'}}>New here? Join free →</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => navigation.navigate('Forgotpassword')}>
<Text style={{color:'rgba(255,255,255,0.2)', fontSize:13}}>Forgot password?</Text>
</TouchableOpacity>
</View>
</View>
</TouchableWithoutFeedback>
</KeyboardAvoidingView>
  )
}

const styles=StyleSheet.create({
  loginBackground:{
    flex:1,
    flexDirection:'column',
    justifyContent:'space-between',
    backgroundColor:'#0a0a0f',
    paddingHorizontal:20,
    paddingTop:80,
    paddingBottom:40,
  },
  buddylogosection:{
    alignItems:'center',
    gap:10,
  },
image:{
  width:50,
  height:50,
},
buddytext:{
  flexDirection:'row',
  alignItems:'baseline'
},
buddytexta:{
  fontSize:30,
  fontWeight:'800',
  color:'#ffffff',
  letterSpacing:-1.5
},
buddytextb:{
  fontSize:30,
  fontWeight:'800',
  color: '#A78BFA',
  letterSpacing:-1.5
},
buddysecondtext:{
  fontSize:15,
  fontWeight:'300',
  color:'rgba(255,255,255,0.4)'
},
bottomsection:{
  alignItems:'center',
  justifyContent:'center',
  gap:20,
  marginBottom:15,
  width:'100%'
},
input:{
  width:'100%',
  height:50,
  borderRadius:15,
  borderWidth:1,
  backgroundColor:'rgba(255,255,255,0.07)',
  borderColor:'rgba(255,255,255,0.1)',
  fontSize:16,
  paddingHorizontal:15,
  color:'white',
},
signtextbutton:{
  width:'100%',
  backgroundColor:'#A78BFA',
  borderRadius:12,
  paddingVertical:14,
  alignItems:'center',
  justifyContent:'center',
},
signtext:{
  fontSize:15,
  fontWeight:'800',
  color:'#0a0a0f',
},
otherscreen:{
  flexDirection:'row',
  justifyContent:'space-between',
  width:'100%',
  marginTop:8,
},
inputError: {
  borderColor: 'red',
},
errorText: {
  color: '#FF6B6B',
  fontSize: 12,
  alignSelf:'flex-start',
  marginTop:-14,
  marginLeft:4,
},
})