import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';

import Home from './screens/Home';
import About from './screens/About';
import Login from './screens/Login';
import Profile from './screens/Profile';
import Register from './screens/Register';
import SplashScreen from './screens/SplashScreen';
import Editprofile from './screens/Editprofile';
import ForgotPass from './screens/Forgotpassword';
import ResetPass from './screens/ResetPassword';
import UserSearch from './screens/UserSearch';
import BottomNavigator from './screens/BottomNavigator';
import NotificationsScreen from './screens/NotificationsScreen'
import Messages from './screens/Messages'
import MessageUser from './screens/MessageUser'
import NewMessage from './screens/NewMessage';
import FriendList from './screens/FriendList';
import CampusNexus from './screens/nexus/CampusNexus';
import CreateMeetup from './screens/nexus/CreateMeetup';
import JoinMeetup from './screens/nexus/JoinMeetup';
import CampusTrivia from './screens/nexus/CampusTrivia';
import Daily from './screens/nexus/Daily';
import Personalized from './screens/nexus/Personalized';
import InterestRoom from './screens/nexus/InterestRoom';
import MainRoom from './screens/nexus/MainRoom';
import Match from './screens/nexus/Match';
import GoalCard from './screens/nexus/GoalCard';
import Room from './screens/nexus/Room';
import AttendeesScreen from './screens/nexus/AttendeesScreen';
import ChatScreen from './screens/nexus/ChatScreen';
import CampusPulse from './screens/nexus/CampusPulsed';
import ViewImage from './screens/nexus/ViewImage';
import FullStory from './screens/nexus/FullStory';
import RequestToWrite from './screens/nexus/RequestToWrite';
import QuestionDetails from './screens/nexus/QuestionDetails';
import CreateRoomScreen from './screens/nexus/CreateRoomScreen'
import DesignersHubScreen   from './screens/nexus/DesignersHubScreen'  
import NewPostScreen from './screens/nexus/NewPostScreen'
import { UnreadMessagesProvider } from './screens/UnreadMessagesContext';
import { AuthorProvider } from './screens/AuthorContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ShowcaseMain from './screens/battlearena/ShowcaseMain';
import CampusShowcase from './screens/battlearena/CampusShowcase';
import QuickPlayScreen from './screens/battlearena/QuickPlayScreen';
import CompetitionHome from './screens/battlearena/CompetitionHome';
import DuelScreen from './screens/battlearena/DuelScreen';
import MembersScreen from './screens/nexus/MembersScreen' 
const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'inter-light': require('./fonts/Inter_18pt-Light.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) return null; // Wait until font is loaded

  return (
    <AuthorProvider>
 <UnreadMessagesProvider>
 <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer>
  <Stack.Navigator initialRouteName="Splash">
    <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    <Stack.Screen name="Editprofile" component={Editprofile} options={{ headerShown: true }} />
    <Stack.Screen name="ForgotPass" component={ForgotPass} options={{ headerShown: false }} />
    <Stack.Screen name="ResetPass" component={ResetPass} options={{ headerShown: false }} />
    <Stack.Screen name="UserSearch" component={UserSearch} options={{ headerShown: true }} />
    <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BottomNavigator" component={BottomNavigator} options={{ headerShown: true }} />
    <Stack.Screen name="Messages" component={Messages} options={{ headerShown: false}} />
    <Stack.Screen name="MessageUser" component={MessageUser} options={{ headerShown: false}} />
    <Stack.Screen name="FriendList" component={FriendList} options={{ headerShown: false}} />
    <Stack.Screen name="NewMessage" component={NewMessage} options={{ headerShown: false}} />
    <Stack.Screen name="CampusNexus" component={CampusNexus} options={{ headerShown: false}} />
    <Stack.Screen name="CreateMeetup" component={CreateMeetup} options={{ headerShown: false }} />
    <Stack.Screen name="JoinMeetup" component={JoinMeetup} options={{ headerShown: false }} />
    <Stack.Screen name="CampusTrivia" component={CampusTrivia} options={{ headerShown: false }} />
    <Stack.Screen name="CampusPulse" component={CampusPulse} options={{ headerShown: false }} />
    <Stack.Screen name="MainRoom" component={MainRoom} options={{ headerShown: false }} />
    <Stack.Screen name="Room" component={Room} options={{ headerShown: false }} />
    <Stack.Screen name="Personalized" component={Personalized} options={{ headerShown: false }} />
    <Stack.Screen name="Daily" component={Daily} options={{ headerShown: false }} />
    <Stack.Screen name="InterestRoom" component={InterestRoom} options={{ headerShown: false }} />
    <Stack.Screen name="Match" component={Match} options={{ headerShown: false }} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: true }} />
    <Stack.Screen name="AttendeesScreen" component={AttendeesScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ViewImage" component={ViewImage} options={{ headerShown: false }} />
    <Stack.Screen name="GoalCard" component={GoalCard} options={{ headerShown: false }} />
    <Stack.Screen name="FullStory" component={FullStory} options={{ headerShown: false }} />
    <Stack.Screen name="RequestToWrite" component={RequestToWrite} options={{ headerShown: false }} />
    <Stack.Screen name="QuestionDetails" component={QuestionDetails} options={{ headerShown: false }} />
    <Stack.Screen name="CreateRoomScreen" component={CreateRoomScreen} options={{ headerShown: false }} />
    <Stack.Screen name="DesignersHubScreen" component={DesignersHubScreen} options={{ headerShown: false }} />
    <Stack.Screen name="NewPostScreen" component={NewPostScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ShowcaseMain" component={ShowcaseMain} options={{ headerShown: false }} />
    <Stack.Screen name="CampusShowcase" component={CampusShowcase} options={{ headerShown: false }} />
    <Stack.Screen name="QuickPlayScreen" component={QuickPlayScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CompetitionHome" component={CompetitionHome} options={{ headerShown: false }} />
    <Stack.Screen name="DuelScreen" component={DuelScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MembersScreen" component={MembersScreen} options={{ headerShown: false }} />
  
  </Stack.Navigator> 
</NavigationContainer>
</GestureHandlerRootView >
</UnreadMessagesProvider>
</  AuthorProvider>
  );
}
