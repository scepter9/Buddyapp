import React, { useState } from 'react';
import {View,Text, TextInput, TouchableOpacity} from 'react-native'
import { Ionicons } from '@expo/vector-icons';
function test111(props) {
    const [isFocused,setisFocused]=useState(false)
    const [isFocusedpass,setisFocusedpass]=useState(false)
    const [issecure,setisSecure]=useState(false)
    return (
       <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0D1B2A',padding:15}}>
        <View style={{alignItems:'center',justifyContent:'center',gap:8}}>
<View style={{alignItems:'center',overflow:'hidden',justifyContent:'center',backgroundColor:'#1A936F'}}>
  <Ionicons name='qr-code-outline' size={24} color='#ffffff'/>
</View>
<Text style={{fontSize:30,color:'#ffffff',fontWeight:'800'}}>VerifyQR Admin</Text>
<Text style={{fontSize:18,color:'#94A3B8',fontWeight:'400'}}>Authorized access only</Text>
        </View>

        <Text style={{fontSize:18,color:'#94A3B8',fontWeight:'400',marginBottom:5}}>Email address</Text>
        <TextInput
        value={email}
        onChangeText={setemail}
        placeholder='admin@company.com'
        placeholderTextColor='#F7F8FC'
        style={{width:'100%',height:50,padding:12,fontSize:12,borderRadius:14,borderColor:'#E2E8F0',backgroundColor:'#0D1B2A',borderWidth:1,paddingHorizontal:14,paddingVertical
    :12,maxHeight:70,marginBottom:15
    }}
        multiline
        maxLength={300}
        onFocus={()=>setisFocused(true)}
        onBlur={()=>setisFocused(false)}
        />
<View style={{flexDirection:'row',alignItems:'center',position:'relative'}}>
<Text style={{fontSize:18,color:'#94A3B8',fontWeight:'400',marginBottom:5}}>Password</Text>
        <TextInput
        value={pass}
        onChangeText={setpass}
        placeholder='Enter you password'
        placeholderTextColor='#F7F8FC'
        style={{width:'100%',height:50,padding:12,fontSize:12,borderRadius:14,borderColor:'#E2E8F0',backgroundColor:'#0D1B2A',borderWidth:1,paddingHorizontal:14,paddingVertical
    :12,maxHeight:70,marginBottom:15,}}
        multiline
        maxLength={300}
        onFocus={()=>setisFocused(true)}
        onBlur={()=>setisFocused(false)}
        secureTextEntry={!issecure}
        />
        <TouchableOpacity onPress={()=>setisSecure(!issecure)} style={{position:'absolute',right:6}}>
            <Ionicons name={!issecure ?'eye-off' :'eye'} size={20} color='#ffffff'/>
        </TouchableOpacity>
        </View>
<View style={{paddingVertical:14,width:'100%',borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#1A936F',marginBottom:5}}>
    <Text style={{fontSize:30,color:'#ffffff',fontWeight:'800'}}>Sign in </Text>
</View>

       </View>
    );
}

export default test111;