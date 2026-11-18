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
  // Forgiving about how they were pasted: surrounding spaces and quote
  // marks (copied from the JSON file or .env.local) are dropped.
  // Strips any number of layers (e.g. ""red-stone-pizza"" or \"...\").
  const clean = (v) => (v == null ? v : String(v).replace(/^[\s"'\\]+|[\s"',\\]+$/g, ""));
  const projectId = clean(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const rawKey = clean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

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
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return cert({ projectId, clientEmail, privateKey });
}

// getApps() guards against re-initializing on every hot-reload / warm
// serverless invocation, which firebase-admin throws on.
//
// A missing or badly pasted credential must not crash the whole route at
// import time (that only shows up as a bare "500"): the error is kept in
// adminInitError instead, and the API routes report it as
// "firebase_setup: <what's wrong>" — never the key itself.
let adminApp = null;
let initError = null;
try {
  adminApp = getApps()[0] || initializeApp({ credential: loadCredential() });
} catch (e) {
  initError = e;
  console.error("Firebase Admin failed to start:", e?.message);
}

export const adminInitError = initError;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
// Talk to Firestore over plain HTTPS instead of its default gRPC connection.
// On Vercel, a freshly started server's gRPC connection can hang for up to
// a minute before failing; HTTPS is quick from a cold start.
if (adminDb) {
  try {
    adminDb.settings({ preferRest: true });
  } catch {
    // Already configured (hot reload / warm server) — fine.
  }
}
export const adminAuth = adminApp ? getAuth(adminApp) : null;

// Short, safe description of a setup problem for API error responses.
export function adminSetupProblem() {
  if (!initError) return null;
  const msg = String(initError.message || initError).replace(/\s+/g, " ");
  return `firebase_setup: ${msg.slice(0, 140)}`;
}
