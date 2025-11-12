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
  SafeAreaView
} from 'react-native';

import BottomNavigator from './BottomNavigator';
const API_BASE_URL = "http://192.168.0.136:3000";

function Profile({ navigation, route }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

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

  const handleFindFriends = () => {
    navigation.navigate('UserSearch');
  };

  if (isLoadingProfile || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#607D8B" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const imageSource = userProfile.image
    ? { uri: `${API_BASE_URL}/uploads/${userProfile.image}` }
    : null;
 
  return (
    <SafeAreaView style={styles.wrapper}>
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainContentCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageWrapper}>
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
            <Text style={styles.profileHandle}>@{userProfile.email.split('@')[0]}</Text>
            <Text style={styles.joinDateText}>📅 Joined {userProfile.joinDate}</Text>
            
            <Text style={styles.bioText}>
              {userProfile.about?.trim() || (isViewingOwnProfile
                ? 'You have not added a bio yet.'
                : 'This user has put the department.')}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('FriendList', { userId: userProfile.id })}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statCount}>{userProfile.following ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.statItem}>
                <Text style={styles.statCount}>{userProfile.followers ?? 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {isViewingOwnProfile ? (
            <View style={styles.ownProfileActions}>
              <TouchableOpacity
                onPress={handleFindFriends}
                style={styles.findFriendsButton}
              >
                <Text style={styles.findFriendsButtonText}>➕ Find Friends</Text>
              </TouchableOpacity>
              {/* Commented out Logout button as requested */}
              {/*
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
              */}
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isFollowing ? styles.unfollowButton : styles.followButton,
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowActionLoading}
              >
                <Text style={styles.buttonText}>
                  {isFollowActionLoading ? 'Processing...' : isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={() => {
                  navigation.navigate('MessageUser', { 
                    recipientId: userProfile.id, 
                    recipientName: userProfile.name, 
                    recipientImage: `${API_BASE_URL}/uploads/${userProfile.image}` 
                  });
                }}
              >
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

    
    </View>
    <BottomNavigator navigation={navigation} />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8faff",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    color: '#607D8B',
    fontWeight: '500',
  },

  mainContentCard: {
    margin: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#34495e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  
  // Profile Header with new full-width profile picture
  profileHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  // New profile image shape: full-width, rounded top corners
  profileImageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75, // This is all you need for a circle
    backgroundColor: '#E0F2F1',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: -100, // Pull up the content below the image
},
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noProfileImagePlaceholder: {
    backgroundColor: '#B0BEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProfileImageText: {
    color: '#607D8B',
    fontWeight: '700',
    fontSize: 14,
  },
  editProfileButton: {
    position: 'absolute',
    right: 15,
    bottom: 15, // Align button to the bottom right of the image
    backgroundColor: '#AAB7B8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#495057',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  editProfileButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  profileDetails: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 100, // Push content down to avoid overlapping the full-width image
  },
  nameAndBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2C3E50',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  profileHandle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
    marginBottom: 10,
  },
  proUserBadge: {
    backgroundColor: '#F39C12',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  proUserText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  joinDateText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 6,
    fontWeight: '600',
  },
  bioText: {
    marginTop: 20,
    color: '#495057',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    backgroundColor: '#ECF0F1',
    borderRadius: 15,
    paddingVertical: 12,
    marginBottom: 25,
    shadowColor: '#BDC3C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 13,
    color: '#495057',
    marginTop: 3,
    fontWeight: '600',
  },
  statSeparator: {
    height: 25,
    width: 1,
    backgroundColor: '#BDC3C7',
  },
  ownProfileActions: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  findFriendsButton: {
    backgroundColor: '#1A5252',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#1A5252',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 9,
  },
  findFriendsButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
  },
  actionButton: {
    flex: 1,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  followButton: {
    backgroundColor: '#3498DB',
    shadowColor: '#3498DB',
  },
  unfollowButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  messageButton: {
    backgroundColor: '#ECF0F1',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    shadowColor: '#BDC3C7',
  },
  messageButtonText: {
    color: '#2C3E50',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#E74C3C',
    borderRadius: 30,
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.6,
  },
});

export default Profile;