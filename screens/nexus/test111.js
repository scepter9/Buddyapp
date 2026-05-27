import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = 'http://192.168.0.136:3000';

const AudioMessage = ({ uri, isMine }) => {
  const soundRef = useRef(null);         // source of truth for the sound object
  const [isPlaying, setIsPlaying]  = useState(false);
  const [position,  setPosition]   = useState(0);
  const [duration,  setDuration]   = useState(0);

  // Set audio mode once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS:       false,
      playsInSilentModeIOS:     true,
      shouldDuckAndroid:        true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // FIX: on blur — stop, unload, and reset everything so it works fresh on return
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        setIsPlaying(false);
        setPosition(0);
        // keep duration so the timer still shows total length at rest
      };
    }, [])
  );

  const onPlaybackStatus = useCallback((status) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    if (status.durationMillis) setDuration(status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
    }
  }, []);

  const togglePlay = async () => {
    try {
      // FIX: check soundRef.current, not sound state
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.setPositionAsync(position);
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // First play or after returning to screen — load fresh
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `${API_BASE_URL}${uri}` },
        { shouldPlay: true },
        onPlaybackStatus
      );
      soundRef.current = newSound;
      setIsPlaying(true);
    } catch (err) {
      console.warn('AudioMessage error:', err.message);
    }
  };

  // Unload on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const BAR_COUNT = 28;
  const progress  = duration > 0 ? position / duration : 0;

  // Colours
  const playBtnBg  = isMine ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.12)';
  const playIcon   = isMine ? '#fff'                  : '#6366f1';
  const barActive  = isMine ? '#fff'                  : '#6366f1';
  const barInactive= isMine ? 'rgba(255,255,255,0.28)': 'rgba(99,102,241,0.22)';
  const timerColor = isMine ? 'rgba(255,255,255,0.65)': '#888';

  return (
    <View style={[a.wrapper, isMine ? a.sent : a.received]}>

      {/* Play / Pause */}
      <TouchableOpacity
        onPress={togglePlay}
        activeOpacity={0.8}
        style={[a.playBtn, { backgroundColor: playBtnBg }]}
      >
        <Feather name={isPlaying ? 'pause' : 'play'} size={15} color={playIcon} />
      </TouchableOpacity>

      {/* Waveform */}
      <View style={a.waveWrap}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          // Varied heights — deterministic so they don't repaint
          const h = 5 + Math.abs(Math.sin(i * 0.85 + 0.5)) * 13 + (i % 5 === 0 ? 6 : 0);
          const filled = i / BAR_COUNT < progress;
          return (
            <View
              key={i}
              style={[a.bar, { height: h, backgroundColor: filled ? barActive : barInactive }]}
            />
          );
        })}
      </View>

      {/* Timer */}
      <Text style={[a.timer, { color: timerColor }]}>
        {isPlaying ? formatTime(position) : formatTime(duration)}
      </Text>

    </View>
  );
};

const a = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    minWidth: 210,
    maxWidth: 290,
    gap: 10,
  },
  sent: {
    backgroundColor: '#5b5fc7',
  },
  received: {
    backgroundColor: '#f0f0f6',
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  waveWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 30,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  timer: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 34,
    textAlign: 'right',
    flexShrink: 0,
  },
});

export default AudioMessage;