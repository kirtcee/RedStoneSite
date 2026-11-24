// hooks/useWaitTimes.js
//
// The kitchen's current carryout / delivery wait times, live (they update
// on the customer's screen the moment the kitchen changes them). Starts at
// the minimums and stays there if the setting can't be read.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import { readWaitTimes, MIN_WAIT } from "../utils/waitTimes";

export default function useWaitTimes() {
  const [wait, setWait] = useState({ ...MIN_WAIT });
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        doc(db, "settings", "waitTimes"),
        (snap) => setWait(readWaitTimes(snap.exists() ? snap.data() : null)),
        () => setWait({ ...MIN_WAIT })
      );
    } catch {
      // Firestore not available: keep the minimums
    }
    return () => unsub();
  }, []);
  return wait;
}
