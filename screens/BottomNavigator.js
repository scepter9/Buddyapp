import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
    SafeAreaView,
    Pressable,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Make sure to pass the 'navigation' prop to BottomNavigator if you're using it for navigation.
// It looks like this component is being used without being part of a Navigator itself,
// so 'navigation' needs to be passed down from a parent screen (like About.js).
function BottomNavigator({ navigation }) { // <-- Added navigation prop here
    // Removed darkMode as it's not defined or passed here.
    // The component will now consistently use light theme styles.

    return (
        <View style={[styles.bottomNav, { backgroundColor: 'white' }]}> {/* Hardcoded to light background */}
            <TouchableOpacity onPress={() => navigation.navigate('About')} style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}> {/* Used navTextLight directly */}
                    <Feather name="home" size={25} color="black" /> {/* Hardcoded icon color */}
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}> {/* Used navTextLight directly */}
                    <Feather name="compass" size={25} color="black" /> {/* Hardcoded icon color */}
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}> {/* Used navTextLight directly */}
                    <Feather name="settings" size={25} color="black" /> {/* Hardcoded icon color */}
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Messages')} style={styles.navButton}>
                <Feather name="mail" size={25} color="black" /> {/* Hardcoded icon color */}
                <Text style={[styles.navLabel, styles.navTextLight]}>

                </Text>
            </TouchableOpacity>

        </View>
    );
}
const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingBottom: 2,
    },

    navButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    navIcon: {
        fontSize: 24,
    },

    navLabel: {
        fontSize: 12,
        marginTop: 2,
    },

    navTextLight: {
        color: '#000',
    },

    navTextDark: {
        color: '#fff',
    },

});
export default BottomNavigator;