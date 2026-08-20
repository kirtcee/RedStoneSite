// utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB83kVLzIQT6fJZwn2OjC4vs10c5iMl__Y",
  authDomain: "red-stone-pizza.firebaseapp.com",
  projectId: "red-stone-pizza",
  storageBucket: "red-stone-pizza.appspot.com",
  messagingSenderId: "667997934687",
  appId: "1:667997934687:web:641fa77e702b5d461df7ea",
  measurementId: "G-LQVGZB7S6L",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Do client-only stuff in the browser
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {});
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((e) => {
        // If anonymous isn’t enabled yet, we’ll fall back to localStorage
        console.warn("Anonymous sign-in failed (will use localStorage fallback):", e?.code || e);
      });
    }
  });
}

export { app, db, auth };
