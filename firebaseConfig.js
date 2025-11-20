import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDHMqyAT6u0NfySVCpq2IKOSz-bdBQZov8",
  authDomain: "realstate-f66b5.firebaseapp.com",
  projectId: "realstate-f66b5",
  storageBucket: "realstate-f66b5.firebasestorage.app",
  messagingSenderId: "1051151033332",
  appId: "1:1051151033332:web:42599fd59478c79e188fa1",
  measurementId: "G-329M288807"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);