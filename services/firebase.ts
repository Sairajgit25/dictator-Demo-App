import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Replace these values with your actual Firebase project configuration
// You can obtain these from the Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDOCAbC123dEf456GhI789jKl012-MnO", // Placeholder
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.FIREBASE_APP_ID || "1:123456789012:web:123456abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();