// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'studio-8903744107-21905',
  appId: '1:135620499940:web:34fe26db446817fcfb4ff1',
  apiKey: 'AIzaSyAHmW1ulrRg7IEW7gbGU3StjpoAlgVbR-U',
  authDomain: 'studio-8903744107-21905.firebaseapp.com',
  messagingSenderId: '135620499940',
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
