import React, { createContext, useState, useEffect } from 'react';
import socket from './Socket'; // ← add this

export const AuthorContext = createContext(null);
const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

export const AuthorProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = () => {
    fetch(`${API_BASE_URL}/check-session`, { 
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Session check failed:', err);
        setUser(null);
        setLoading(false);
      });
  };

  const signOut = () => {
    fetch(`${API_BASE_URL}/logout`).then(() => {
      setUser(null);
    
    });
  };

  useEffect(() => {
    checkSession();
  }, []);

  // ← ADD THIS — registers socket whenever user changes
  useEffect(() => {
    if (!user) return;

    // Register on login or session restore
    socket.emit('register', String(user.id));

    // Re-register if socket reconnects (phone lost internet etc)
    const handleReconnect = () => {
      socket.emit('register', String(user.id));
    };

    socket.on('connect', handleReconnect);

    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [user]);

  return (
    <AuthorContext.Provider value={{ user, setUser, loading, signOut }}>
      {children}
    </AuthorContext.Provider>
  );
};