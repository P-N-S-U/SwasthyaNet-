
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';

// Your web app's Firebase configuration for the client
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: '1:135620499940:web:34fe26db446817fcfb4ff1',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'studio-8903744107-21905.firebaseapp.com',
  messagingSenderId: '135620499940',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase for the CLIENT
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable Firestore persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
