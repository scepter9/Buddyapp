import React, { createContext, useState, useEffect } from 'react';

// Create the Context
export const AuthorContext = createContext(null);
const API_BASE_URL = "http://192.168.0.136:3000";
// Create the Provider component
export const AuthorProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // This is where you would do your initial session check
  const checkSession = () => {
    fetch(`${API_BASE_URL}/check-session`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUser(data.user); // Set the user in the global state
        } else {
          setUser(null); // Explicitly set to null if not logged in
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Session check failed:', err);
        setUser(null); // Ensure user is null on error
        setLoading(false);
      });
  };
  
  // This function can be used by any component to log a user out
  const signOut = () => {
    
     fetch(`${API_BASE_URL}/logout`).then(() => setUser(null));
    
  };
  
  useEffect(() => {
    checkSession();
  }, []);

  // Expose user, setUser, loading, and signOut for all children
  return (
    <AuthorContext.Provider value={{ user, setUser, loading, signOut }}>
      {children}
    </AuthorContext.Provider>
  );
};