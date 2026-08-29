// utils/firebaseAdmin.js
//
// SERVER-ONLY. Never import this from a component, a page, or anything else
// that ends up in the client bundle — it holds credentials that must not
// reach the browser. Only pages/api/*.js files should import it.
//
// This is what lets pages/api/placeOrder.js write to Firestore without
// going through Firestore Security Rules at all (the Admin SDK bypasses
// rules by design) — the actual security boundary for order writes moves
// from "rules" to "this route recomputed the price itself before writing."
// See firestore.rules, where client-side `create` on /orders is denied.
//
// Setup (one-time, per environment — local dev AND wherever this deploys):
//   1. Firebase Console -> Project Settings -> Service Accounts
//   2. "Generate new private key" -> downloads a JSON file. Keep it secret;
//      do not commit it.
//   3. From that JSON, set three env vars (in .env.local for local dev, and
//      in your host's env var settings for production):
//        FIREBASE_ADMIN_PROJECT_ID   = the JSON's "project_id"
//        FIREBASE_ADMIN_CLIENT_EMAIL = the JSON's "client_email"
//        FIREBASE_ADMIN_PRIVATE_KEY  = the JSON's "private_key", exactly as
//          written (including the literal \n sequences and the
//          -----BEGIN/END PRIVATE KEY----- lines) — most env var UIs are
//          fine with pasting it as one line since the \n stays literal text
//          until unescaped below.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (see the " +
        "setup notes at the top of utils/firebaseAdmin.js)."
    );
  }

  // Service-account JSON stores the key with literal "\n" escape sequences;
  // env vars can't hold real multi-line newlines cleanly, so it's kept
  // escaped in the environment and unescaped here.
  return cert({ projectId, clientEmail, privateKey: rawKey.replace(/\\n/g, "\n") });
}

// getApps() guards against re-initializing on every hot-reload / warm
// serverless invocation, which firebase-admin throws on.
const adminApp = getApps()[0] || initializeApp({ credential: loadCredential() });

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
