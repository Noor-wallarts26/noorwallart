import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE3Xg8m_rJOPmBPhml7se7JOu-vCqUZPw",
  authDomain: "amezeshop.firebaseapp.com",
  projectId: "amezeshop",
  storageBucket: "amezeshop.firebasestorage.app",
  messagingSenderId: "726965398711",
  appId: "1:726965398711:web:5c03826a8f01c94c75f132",
  measurementId: "G-64N7J151K4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for instant loading
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence.");
  }
});
