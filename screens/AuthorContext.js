import React, { createContext, useState, useEffect } from 'react';



// Create the Context

export const AuthorContext = createContext(null); 



// Create the Provider component

export const AuthorProvider = ({ children }) => { 

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);



 // This is where you would do your initial session check

 useEffect(() => {

 fetch('http://172.20.10.4:3000/check-session', {

 method: 'GET',

  credentials: 'include',

    })

      .then(res => res.json())

      .then(data => {

        if (data.loggedIn) {

          setUser(data.user); // Set the user in the global state

        }

        setLoading(false);

      })

      .catch(err => {

        console.log('Session check failed:', err);

        setLoading(false);

      });

  }, []);



  return (

    <AuthorContext.Provider value={{ user, loading }}> 

      {children}

    </AuthorContext.Provider>

  );

};