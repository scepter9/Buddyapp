// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect will run on app load to check for a stored user
  // and then immediately check with the backend for a valid session.
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, check if a user is stored in local storage
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData); // Set the user from AsyncStorage initially
        }

        // Now, attempt to validate the session with the backend
        const response = await fetch('http://172.20.10.4:3000/check-session', {
          method: 'GET',
          // The 'credentials: include' option is crucial here.
          // It ensures that cookies (including session cookies) are sent with the request.
          credentials: 'include',
        });

        const data = await response.json();

        // If the backend says the session is not logged in, we should clear local storage
        if (!data.loggedIn) {
          console.log('Backend session check failed. Logging out locally.');
          await logout(); // Ensure local state and storage are cleared
        } else {
          // If the backend confirms a logged-in session, update the user state
          // This is a good practice to ensure the local user data is up-to-date
          // with what the backend has.
          if (JSON.stringify(data.user) !== storedUser) {
            console.log('Backend user data is different. Updating local data.');
            await login(data.user);
          }
        }
      } catch (error) {
        console.error('Error during session check:', error);
        // On any error, assume the session is invalid and log out.
        // This is a safe fallback.
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);