
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These values should be provided by your environment variables.
// The auth/configuration-not-found error typically means the project exists but 
// the Identity Toolkit API / Firebase Auth service is disabled in the Firebase Console.
const firebaseConfig = {
  apiKey: (process.env.FIREBASE_API_KEY || "AIzaSyBJDSfa7qw4WhDwN4EcaXVCaOJsAM69GM8").trim(),
  authDomain: (process.env.FIREBASE_AUTH_DOMAIN || "dictator-app-bfa8e.firebaseapp.com").trim(),
  projectId: (process.env.FIREBASE_PROJECT_ID || "dictator-app-bfa8e").trim(),
  storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || "dictator-app-bfa8e.firebasestorage.app").trim(),
  messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || "440048249004").trim(),
  appId: (process.env.FIREBASE_APP_ID || "1:440048249004:web:08ec08156e2cf0d70f9709").trim()
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
