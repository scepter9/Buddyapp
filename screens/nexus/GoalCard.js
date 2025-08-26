import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const GoalCard = ({ title, sub, mutedText, tagStyle, id, onComplete }) => {
  const [text, setText] = useState('Join');
  const [openmodal, setOpenModal] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [count, setCount] = useState(0);

  const storageKey = `goalState_${id}`;

  // Load state from AsyncStorage on component mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(storageKey);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          const lastUpdatedDate = parsedState.date;
          const today = new Date().toDateString();

          // Reset the button's state for the new day
          if (lastUpdatedDate === today) {
            setText(parsedState.text);
            setDisabled(parsedState.disabled);
          } else {
            setText('Join');
            setDisabled(false);
          }
          setCount(parsedState.count); // The count persists
        }
      } catch (e) {
        console.error('Failed to load state', e);
      }
    };

    loadState();
  }, [id]);

  // Save state to AsyncStorage whenever it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        const today = new Date().toDateString();
        const stateToSave = JSON.stringify({ text, disabled, count, date: today });
        await AsyncStorage.setItem(storageKey, stateToSave);
      } catch (e) {
        console.error('Failed to save state', e);
      }
    };

    saveState();
  }, [text, disabled, count, id]);

  const SetClickFunction = () => {
    if (text === 'Join') {
      setText('I did it');
    } else if (text === 'I did it') {
      setOpenModal(true);
      setCount((prev) => prev + 1);
    }
  };

  const HandelCancel = () => {
    setOpenModal(false);
    setText('Done');
    setDisabled(true);
    
    // Call the onComplete function from the parent and pass the XP value
    if (onComplete) {
      onComplete(50); // Pass the XP value of 50
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={SetClickFunction} disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
        <Text style={[styles.tag, tagStyle]}>{text}</Text>
      </TouchableOpacity>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={styles.meta}>
        {/* Correctly replaces the placeholder with the current count */}
        <Text style={styles.muted}>{mutedText.replace('{count}', count)}</Text>
      </View>

      <Modal
        visible={openmodal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Success 🎉</Text>
            <Text style={styles.modalText}>
              Great job putting yourself out there. {"\n"}+50xp
            </Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={HandelCancel}>
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffffee",
    borderRadius: 22,
    padding: 18,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tag: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 6,
    color: "#0f1222",
  },
  sub: {
    fontSize: 13,
    color: "#6b7081",
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  muted: {
    fontSize: 12,
    color: "#6b7081",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b60ff",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  cancelBtn: {
    backgroundColor: "#3b60ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default GoalCard;