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
    // 1. Verificar servicios
    await GoogleSignin.hasPlayServices();
    
    // 2. Iniciar sesión
    const response = await GoogleSignin.signIn();
    
    // --- AQUÍ ESTÁ EL CAMBIO CRÍTICO ---
    // La versión nueva (v13) guarda el token dentro de 'data'.
    // La versión vieja lo tenía directo en 'response.idToken'.
    // Esta línea funciona para ambas versiones:
    const idToken = response.data?.idToken || response.idToken;

    if (!idToken) {
      throw new Error("No se encontró el ID Token de Google");
    }

    // 3. Crear credencial para Firebase
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // 4. Login en Firebase
    return await signInWithCredential(auth, googleCredential);

  } catch (error) {
    console.error("Google Sign-In Error Detallado:", error);
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