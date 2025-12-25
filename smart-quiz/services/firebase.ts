
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCl3bpXS6rfxbbacSa8tkPGLpWrZhl03U8",
  authDomain: "smart-quiz-pro-8e2e7.firebaseapp.com",
  projectId: "smart-quiz-pro-8e2e7",
  storageBucket: "smart-quiz-pro-8e2e7.firebasestorage.app",
  messagingSenderId: "942324280346",
  appId: "1:942324280346:web:3b9b8869b85bc85e68b5a3",
  measurementId: "G-8NNSWK1YZG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Improved settings for better connectivity and offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
});

export default app;
