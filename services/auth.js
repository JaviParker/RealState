import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust path if needed
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * You MUST get this from your Firebase project.
 * 1. Go to Firebase Console > Project Settings > General.
 * 2. Scroll down to "Your apps".
 * 3. Select your WEB app (the one you got your config from).
 * 4. You will see "OAuth 2.0 Client IDs". Copy the "Web client ID".
 *
 * You also need to add your SHA-1 key to your Firebase Android app settings
 * for Google Sign-In to work in development.
 */
GoogleSignin.configure({
  webClientId: '1051151033332-q8e61a1o775nihl9m795fo0lgmarecuj.apps.googleusercontent.com',
});

// --- Sign in with Google ---
export const googleSignIn = async () => {
  try {
    // 1. Check if device has Google Play Services
    await GoogleSignin.hasPlayServices();
    
    // 2. Get the user's ID token
    const { idToken } = await GoogleSignin.signIn();
    
    // 3. Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // 4. Sign-in the user with the credential
    return await signInWithCredential(auth, googleCredential);
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// --- Sign in with Email and Password ---
export const emailSignIn = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Email Sign-In Error:", error);
    throw error; // Re-throw the error to handle it in the UI
  }
};

// --- Sign Out ---
export const logOut = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    // Also sign out from Google
    await GoogleSignin.signOut();
  } catch (error) {
    console.error("Sign-Out Error:", error);
  }
};