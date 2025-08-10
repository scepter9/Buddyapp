import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const NewMessage = () => {
  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  return (
    <View style={styles.container}>
      {/* Button to trigger modal */}
      <TouchableOpacity style={styles.triggerButton} onPress={openModal}>
        <Text style={styles.triggerButtonText}>Start New Chat</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Chat</Text>
              <View style={{ width: 50 }} /> {/* Spacer */}
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.input}
              placeholder="Search name or username"
              placeholderTextColor="#999"
            />

            {/* Section Title */}
            <Text style={styles.sectionTitle}>Friends</Text>

            {/* List */}
            <ScrollView>
              <TouchableOpacity style={styles.mainbodylist}>
                <View style={styles.image} />
                <View style={styles.namevalue}>
                  <Text style={styles.name}>Jane Simmons</Text>
                  <Text style={styles.email}>jane@example.com</Text>
                </View>
              </TouchableOpacity>

              {/* Add more items here if needed */}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NewMessage;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    triggerButton: {
      padding: 12,
      backgroundColor: '#000',
      borderRadius: 10,
    },
    triggerButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    modalWrapper: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: '#fff',
      width: '90%',
      height: '90%',
      borderRadius: 16,
      padding: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    cancelText: {
      fontSize: 14,
      color: '#333',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 14,
      marginBottom: 20,
      color: '#333',
    },
    sectionTitle: {
      fontWeight: '600',
      fontSize: 16,
      marginBottom: 10,
    },
    mainbodylist: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    image: {
      width: 50,
      height: 50,
      backgroundColor: 'gainsboro',
      borderRadius: 25,
      marginRight: 12,
    },
    namevalue: {
      flexDirection: 'column',
    },
    name: {
      fontWeight: '600',
      fontSize: 16,
    },
    email: {
      fontSize: 14,
      color: 'gray',
    },
  });
  