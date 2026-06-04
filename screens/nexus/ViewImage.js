import React, { useEffect, useRef, useState } from "react";
import {
  View, Image, TouchableOpacity, StyleSheet,
  Text, Animated, Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Video } from "expo-av";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export default function ViewImage({ route, navigation }) {
  const { imagevalue, mediatype } = route.params;

  // ── download state ────────────────────────────────────────
  const [downloadState, setDownloadState] = useState('idle');
  // idle | downloading | done | error
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const doneAnim = useRef(new Animated.Value(0)).current;
  const downloadRef = useRef(null); // stores the resumable download

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // animate progress bar width
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // when done — flash green then reset
  useEffect(() => {
    if (downloadState === 'done') {
      Animated.sequence([
        Animated.timing(doneAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(doneAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setDownloadState('idle'));
    }
  }, [downloadState]);

  const handleDownload = async () => {
    if (downloadState === 'downloading') return;

    try {
      // ask permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to save images to your gallery.');
        return;
      }

      setDownloadState('downloading');
      setProgress(0);

      const filename = imagevalue.split('/').pop()?.split('?')[0] || `buddy_${Date.now()}.jpg`;
      const localUri = FileSystem.documentDirectory + filename;

      // ── resumable download — gives us progress callbacks ──
      const downloadResumable = FileSystem.createDownloadResumable(
        imagevalue,
        localUri,
        {},
        (downloadProgressEvent) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgressEvent;
          if (totalBytesExpectedToWrite > 0) {
            const pct = totalBytesWritten / totalBytesExpectedToWrite;
            setProgress(pct);
          }
        }
      );

      downloadRef.current = downloadResumable;

      const result = await downloadResumable.downloadAsync();

      if (!result || result.status !== 200) {
        setDownloadState('error');
        Alert.alert('Error', 'Could not download file.');
        return;
      }

      // save to camera roll
      await MediaLibrary.saveToLibraryAsync(result.uri);

      // clean up temp file
      await FileSystem.deleteAsync(result.uri, { idempotent: true });

      setProgress(1);
      setDownloadState('done');

    } catch (err) {
      console.error('Download error:', err);
      setDownloadState('error');
      Alert.alert('Download failed', 'Something went wrong. Try again.');
      setTimeout(() => setDownloadState('idle'), 2000);
    }
  };

  // ── what to show on the save button ──────────────────────
  const renderSaveButton = () => {
    if (downloadState === 'done') {
      return (
        <Animated.View style={[styles.menuButton, styles.doneBtn, { opacity: doneAnim }]}>
          <Feather name="check" size={14} color="#22c55e" />
          <Text style={[styles.saveBtnText, { color: '#22c55e' }]}>Saved</Text>
        </Animated.View>
      );
    }

    if (downloadState === 'error') {
      return (
        <View style={[styles.menuButton, styles.errorBtn]}>
          <Feather name="alert-circle" size={14} color="#ff6b6b" />
          <Text style={[styles.saveBtnText, { color: '#ff6b6b' }]}>Failed</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleDownload}
        disabled={downloadState === 'downloading'}
        activeOpacity={0.8}
      >
        {downloadState === 'downloading'
          ? <Text style={styles.saveBtnText}>{Math.round(progress * 100)}%</Text>
          : (
            <>
              <Feather name="download" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )
        }
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Feather name="x" size={26} color="#fff" />
      </TouchableOpacity>

      {/* save button — images only */}
      {mediatype === 'image' && renderSaveButton()}

      {/* progress bar — shows during download */}
      {downloadState === 'downloading' && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* media */}
      {mediatype === 'image' ? (
        <Image
          source={{ uri: imagevalue }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <Video
          source={{ uri: imagevalue }}
          style={styles.image}
          resizeMode="contain"
          useNativeControls
          shouldPlay={false}
          isLooping={false}
          isMuted={false}
          volume={1.0}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 52,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  doneBtn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  errorBtn: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D2FF',
    borderRadius: 2,
  },
});