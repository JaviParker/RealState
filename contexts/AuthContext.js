import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path if
                                          // firebaseConfig.js is elsewhere

// 1. Create the Context
const AuthContext = createContext();

// 2. Create a custom hook to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Create the Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener handles auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup the subscription on unmount
    return unsubscribe;
  }, []);

  // The value to pass to consuming components
  const value = {
    user,
    loading,
    // You can add auth functions here later if you want
    // e.g., login, logout
  };

  // Render children only when not loading
  // Or render a global loading spinner
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}