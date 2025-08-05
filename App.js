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
import { AuthProvider } from './screens/Authcontext';
import { AuthorProvider } from './screens/AuthorContext';

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
    <  AuthorProvider>

    <NavigationContainer>
  <Stack.Navigator initialRouteName="Splash">
    <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={Profile} options={{ headerShown: true }} />
    <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    <Stack.Screen name="Editprofile" component={Editprofile} options={{ headerShown: true }} />
    <Stack.Screen name="ForgotPass" component={ForgotPass} options={{ headerShown: false }} />
    <Stack.Screen name="ResetPass" component={ResetPass} options={{ headerShown: false }} />
    <Stack.Screen name="UserSearch" component={UserSearch} options={{ headerShown: true }} />
    <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BottomNavigator" component={BottomNavigator} options={{ headerShown: true }} />
    <Stack.Screen name="Messages" component={Messages} options={{ headerShown: false}} />
    <Stack.Screen name="MessageUser" component={MessageUser} options={{ headerShown: false}} />
  </Stack.Navigator>
</NavigationContainer>
</  AuthorProvider>
  );
}
