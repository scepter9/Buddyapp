import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import BottomNavigator from './BottomNavigator';
const MessageScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}></Text>
        </TouchableOpacity>

        <View style={styles.messageSection}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TextInput
            style={styles.inputText}
            placeholder="Search messages"
            placeholderTextColor="#888"
          />
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>
          <Feather name="edit-3" size={24} color="#444" />
            </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Messages or chat previews go here */}
      </View>
      <BottomNavigator navigation={navigation} />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f7fa',
    },
    header: {
      height: 100,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#d2d6dc',
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerButton: {
      padding: 8,
    },
    headerButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#444',
    },
    messageSection: {
      alignItems: 'center',
      gap: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
    },
    inputText: {
      width: 250,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: '#cbd5e0',
      borderRadius: 24,
      fontSize: 14,
      backgroundColor: '#fff',
    },
    mainContent: {
      flex: 1,
      padding: 20,
    },
  });
  
export default MessageScreen;
