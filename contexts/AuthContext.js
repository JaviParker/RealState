import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 
import { checkUserValidation, registerInitialUser } from '../services/firestore';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    // This listener handles auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Evaluate admin with case insensitivity
        const adminStatus = firebaseUser.email?.toLowerCase() === 'adminetacarinae2026@gmail.com';
        setIsAdmin(adminStatus);

        if (adminStatus) {
            setIsValidated(true); // Admins don't need validation
        } else {
            // First time they log in, register them silently as non-validated.
            await registerInitialUser(firebaseUser);
            // Check validation for normal users
            const valid = await checkUserValidation(firebaseUser.uid);
            setIsValidated(valid);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsValidated(false);
      }
      setLoading(false);
    });

    // Cleanup the subscription on unmount
    return unsubscribe;
  }, []);

  // The value to pass to consuming components
  const value = {
    user,
    loading,
    isAdmin,
    isValidated,
    setIsValidated // Allow updating it without full reload from components
  };

  // Render children only when not loading
  // Or render a global loading spinner
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}