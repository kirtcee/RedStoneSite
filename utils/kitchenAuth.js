// utils/kitchenAuth.js
// Kitchen staff sign in with a single shared password against this fixed
// account (created in the Firebase Console under Authentication).
// Firestore rules key off this same email to gate the orders dashboard,
// so it must match the address of the staff account exactly.
export const STAFF_EMAIL = "kitchen@redstonepizza.local";
