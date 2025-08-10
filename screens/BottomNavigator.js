import React, { useState, useRef, useEffect, useContext } from 'react'; // Import useContext
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
import { UnreadMessagesContext } from './UnreadMessagesContext'

function BottomNavigator({ navigation }) {
    const { unreadCount } = useContext(UnreadMessagesContext); // Access the unreadCount

    return (
        <View style={[styles.bottomNav, { backgroundColor: 'white' }]}>
            <TouchableOpacity onPress={() => navigation.navigate('About')} style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}>
                    <Feather name="home" size={25} color="black" />
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}>
                    <Feather name="compass" size={25} color="black" />
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton}>
                <Text style={[styles.navIcon, styles.navTextLight]}>
                    <Feather name="settings" size={25} color="black" />
                </Text>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Messages')} style={styles.navButton}>
                <View style={{ position: 'relative' }}>
                    <Feather name="mail" size={25} color="black" />
                    {/* Conditionally render the badge only if unreadCount > 0 */}
                    {unreadCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.navLabel, styles.navTextLight]}></Text>
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
    badgeContainer: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'red',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
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