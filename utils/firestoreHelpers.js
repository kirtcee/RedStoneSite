// utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Optional: offline cache so cart works even if user goes offline
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {
    // ignore (e.g. multiple tabs)
  });
}

export { db };
