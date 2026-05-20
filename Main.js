import React, { useContext, useEffect, useState } from 'react';
import { Alert,View } from 'react-native';
const API_BASE_URL = "http://192.168.0.136:3000";
import { AuthorContext } from './screens/AuthorContext';
function Main(props) {
   
    return (
    
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
           
    
          <View style={styles.searchBoxContainer}>
            <TextInput
              placeholder="🔍 Search by name or username"
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
            />
          </View>
          {users.length===0 && peopleKnow.length>0(
            <Text>people you may know</Text>
          )}
    
          {users.length > 0 && (
            <ScrollView style={styles.dropdown}>
              {users.map((user) => (
                <TouchableOpacity
                  key={`user-${user.id}`}
                  style={styles.userCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate('Profile', { userId: user.id }); 
                  }}
                >
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/uploads/${user.image}`,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>
                      {user.FULLNAME || user.username}
                    </Text>
                    <Text style={styles.email}>{user.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
            </ScrollView>
          )}

{users.length ===0 &&  peopleKnow.length>0 (
    
            <ScrollView style={styles.dropdown}>
              {peopleKnow.map((user) => (
                <TouchableOpacity
                  key={`user-${user.id}`}
                  style={styles.userCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate('Profile', { userId: user.id }); 
                  }}
                >
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/uploads/${user.image}`,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>
                      {user.FULLNAME || user.username}
                    </Text>
                    <Text style={styles.email}>{user.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
            </ScrollView>
          )}
           <BottomNavigator navigation={navigation} />
        </KeyboardAvoidingView>
        
      );
}

export default Main;