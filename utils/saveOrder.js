// utils/saveOrder.js
import { db } from "./firebaseConfig";
import { collection, addDoc, Timestamp, serverTimestamp } from "firebase/firestore";

export async function saveOrder(orderData) {
  try {
    const pickupTime = Timestamp.fromDate(new Date(Date.now() + 20 * 60000));
    const ref = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp(),
      pickupTime,
      completed: false,
    });
    return ref.id;
  } catch (e) {
    console.error("saveOrder error:", e);
    return null;
  }
}
