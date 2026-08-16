import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
  }
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (!admin.apps.length) {
    console.warn("Firebase Admin SDK could not be initialized due to missing credentials.");
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
