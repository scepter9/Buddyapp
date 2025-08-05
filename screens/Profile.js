import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import BottomNavigator from './BottomNavigator';
const API_BASE_URL = 'http://172.20.10.4:3000';

function Profile({ navigation, route }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

  // Determine if the currently viewed profile belongs to the logged-in user
  const isViewingOwnProfile = !route.params?.userId || route.params.userId === loggedInUserId;

  const fetchProfileData = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const currentAuthRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!currentAuthRes.ok) {
        console.warn('Not authenticated. Redirecting to login.');
        navigation.replace('Login');
        return;
      }
      const currentAuthData = await currentAuthRes.json();
      setLoggedInUserId(currentAuthData.id);

      const profileToFetchId = route.params?.userId || currentAuthData.id;

      const userProfileRes = await fetch(`${API_BASE_URL}/users/${profileToFetchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!userProfileRes.ok) {
        throw new Error('Profile not found or server error.');
      }
      const userProfileData = await userProfileRes.json();
      setUserProfile(userProfileData);

      if (profileToFetchId !== currentAuthData.id) {
        const checkFollowRes = await fetch(`${API_BASE_URL}/check-follow/${profileToFetchId}`, {
          credentials: 'include',
        });
        if (checkFollowRes.ok) {
          const checkFollowData = await checkFollowRes.json();
          setIsFollowing(checkFollowData.isFollowing);
        } else {
          console.warn('Could not check follow status.');
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', error.message || 'Failed to load profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [route.params?.userId, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData();
    });
    fetchProfileData();
    return unsubscribe;
  }, [navigation, fetchProfileData]);

  const handleFollowToggle = async () => {
    if (isViewingOwnProfile || isFollowActionLoading) return;

    setIsFollowActionLoading(true);
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ receiver_id: userProfile?.id }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setUserProfile(prevProfile => {
          const newProfile = { ...prevProfile };
          newProfile.followers = isFollowing
            ? Math.max(0, (prevProfile.followers ?? 0) - 1)
            : ((prevProfile.followers ?? 0) + 1);
          if (isViewingOwnProfile) {
            newProfile.following = isFollowing
              ? Math.max(0, (prevProfile.following ?? 0) - 1)
              : ((prevProfile.following ?? 0) + 1);
          }
          return newProfile;
        });
      } else {
        const errorMessage = responseData.error || `Failed to ${endpoint} user.`;
        Alert.alert('Action Failed', errorMessage);
        console.error(`Error ${endpoint}:`, responseData);
      }
    } catch (error) {
      console.error(`Request error during ${endpoint}:`, error);
      Alert.alert('Network Error', `Could not reach server to ${endpoint}.`);
    } finally {
      setIsFollowActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        navigation.replace('Login');
      } else {
        const errorData = await response.json();
        Alert.alert('Logout Failed', errorData.error || 'Could not log out.');
        console.log('Logout failed:', errorData.error);
      }
    } catch (error) {
      console.error('Logout request error:', error);
      Alert.alert('Network Error', 'Could not log out due to network issues.');
    }
  };

  const handleFindFriends = () => {
    navigation.navigate('UserSearch');
  };

  if (isLoadingProfile || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A5252" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const imageSource = userProfile.image
    ? { uri: `${API_BASE_URL}/uploads/${userProfile.image}` }
    : null;

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.upperSection}>
          <View style={styles.profileHeader}>
            <View style={styles.imageWrapper}>
              {imageSource ? (
                <Image source={imageSource} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.noProfileImagePlaceholder]}>
                  <Text style={styles.noProfileImageText}>No Photo</Text>
                </View>
              )}
            </View>

            {isViewingOwnProfile && (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('Editprofile', {
                  userId: userProfile.id,
                  currentProfile: userProfile,
                })}
              >
                <Text style={styles.editProfileButtonText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameAndBadgeContainer}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              {userProfile.isPro && (
                <View style={styles.proUserBadge}>
                  <Text style={styles.proUserText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.joinDateText}>📅 Joined {userProfile.joinDate}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
            <Text style={styles.bioText}>
              {userProfile.about?.trim() || (isViewingOwnProfile
                ? 'You have not added a bio yet.'
                : 'This user has not added a bio.')}
            </Text>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{userProfile.following ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.separatorLine} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{userProfile.followers ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {isViewingOwnProfile ? (
            <View style={styles.ownProfileActions}>
              <TouchableOpacity
                onPress={handleFindFriends}
                style={styles.findFriendsButton}
              >
                <Text style={styles.findFriendsButtonText}>➕ Find Friends</Text>
              </TouchableOpacity>

              <View style={styles.buttonSpacing} />
            </View>
          ) : (
            // This is the updated section with both the Follow and Message buttons
            <View style={styles.otherUserActions}>
              <TouchableOpacity
                style={[
                  isFollowing ? styles.unfollowButton : styles.followButton,
                  styles.actionButton,
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowActionLoading}
              >
                <Text style={styles.buttonText}>
                  {isFollowActionLoading ? 'Processing...' : isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.messageButton, styles.actionButton]}
                onPress={() => {
                  // This assumes you have a ChatScreen set up in your navigator
                  navigation.navigate('MessageUser', {  recipientId: userProfile.id,      // This passes the ID
                  recipientName: userProfile.name, recipientImage:`${API_BASE_URL}/uploads/${userProfile.image}`});
                }}
              >
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigator navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  upperSection: {
    width: '100%',
    backgroundColor: '#fdfdfd',
    minHeight: 480,
    alignItems: 'center',
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    width: 320,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#1A5252',
    overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noProfileImagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProfileImageText: { color: '#aaa' },
  editProfileButton: {
    position: 'absolute',
    right: 0,
    top: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1A5252',
  },
  editProfileButtonText: { fontSize: 13, color: '#333', fontWeight: '500' },
  profileDetails: { alignItems: 'center', marginTop: 12 },
  nameAndBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 24, fontWeight: '700', color: '#222' },
  proUserBadge: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proUserText: { color: 'white', fontSize: 11, fontWeight: '700' },
  joinDateText: { fontSize: 13, color: '#888', marginTop: 4 },
  profileEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  bioText: {
    marginTop: 15,
    color: '#333',
    fontWeight: '400',
    fontStyle: 'italic',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    maxWidth: 320,
    textAlign: 'center',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: { alignItems: 'center', marginHorizontal: 15 },
  statCount: { fontSize: 18, fontWeight: '700', color: '#1A5252' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  separatorLine: { height: '80%', width: 1, backgroundColor: '#ddd', marginHorizontal: 10 },
  ownProfileActions: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  findFriendsButton: {
    backgroundColor: '#1A5252',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: 200,
    alignItems: 'center',
  },
  findFriendsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSpacing: {
    height: 10,
  },
  otherUserActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    
    width:120 // Let buttons take up available space
  },
  followButton: {
    backgroundColor: '#1A5252',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10, // Added spacing to the right of the button
  },
  unfollowButton: {
    backgroundColor: '#d63031',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10, // Added spacing to the right of the button
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  messageButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  messageButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff4d4d',
    borderRadius: 25,
    alignItems: 'center',
    width: 150,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default Profile;
